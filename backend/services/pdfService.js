const PDFDocument = require('pdfkit');
const db = require('../database/db');

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function generateMonthlyPdfBuffer(userId, year, month) {
  const monthPad = String(month).padStart(2, '0');

  const annualRow = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS totalIncome,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpenses
    FROM transactions
    WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `).get(userId, String(year), monthPad);

  const kindRow = db.prepare(`
    SELECT
      SUM(CASE WHEN kind = 'fixed' THEN amount ELSE 0 END) AS fixed,
      SUM(CASE WHEN kind = 'variable' THEN amount ELSE 0 END) AS variable,
      SUM(CASE WHEN kind = 'custom' THEN amount ELSE 0 END) AS custom
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `).get(userId, String(year), monthPad);

  const largest = db.prepare(`
    SELECT MAX(amount) AS value FROM transactions
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `).get(userId, String(year), monthPad);

  const byCategory = db.prepare(`
    SELECT COALESCE(c.name, 'Sem categoria') AS name, SUM(t.amount) AS value
    FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense' AND strftime('%Y', t.date) = ? AND strftime('%m', t.date) = ?
    GROUP BY t.category_id ORDER BY value DESC
  `).all(userId, String(year), monthPad);

  const monthlyRows = db.prepare(`
    SELECT CAST(strftime('%m', date) AS INTEGER) AS month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
    FROM transactions WHERE user_id = ? AND strftime('%Y', date) = ?
    GROUP BY month ORDER BY month
  `).all(userId, String(year));

  const totalIncome = annualRow?.totalIncome ?? 0;
  const totalExpenses = annualRow?.totalExpenses ?? 0;

  // Contas pendentes do mês (a pagar + vencidas)
  const n = new Date();
  const todayStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  const pendingRow = db.prepare(`
    SELECT
      COALESCE(SUM(amount), 0) AS toPay,
      COALESCE(SUM(CASE WHEN date < ? THEN 1 ELSE 0 END), 0) AS overdueCount
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND paid_at IS NULL
      AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `).get(todayStr, userId, String(year), monthPad);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(22).fillColor('#6366f1').text('Planejix', { align: 'left' });
    doc.fontSize(12).fillColor('#666').text(`Relatório Financeiro — ${monthNames[month - 1]} ${year}`);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ddd');
    doc.moveDown(1);

    // KPIs
    doc.fontSize(10).fillColor('#333');
    doc.font('Helvetica-Bold').text('Entradas: ', { continued: true }).font('Helvetica').text(fmt(totalIncome));
    doc.font('Helvetica-Bold').text('Saídas: ', { continued: true }).font('Helvetica').text(fmt(totalExpenses));
    doc.font('Helvetica-Bold').text('Saldo: ', { continued: true }).font('Helvetica').text(fmt(totalIncome - totalExpenses));
    doc.font('Helvetica-Bold').text('Maior Gasto: ', { continued: true }).font('Helvetica').text(fmt(largest?.value ?? 0));
    if (pendingRow && pendingRow.toPay > 0) {
      const vencidas = pendingRow.overdueCount > 0 ? ` (${pendingRow.overdueCount} vencida${pendingRow.overdueCount > 1 ? 's' : ''})` : '';
      doc.font('Helvetica-Bold').fillColor('#b45309').text('A Pagar: ', { continued: true }).font('Helvetica').text(`${fmt(pendingRow.toPay)}${vencidas}`);
      doc.fillColor('#333');
    }
    doc.moveDown(1);

    // Gastos por Tipo
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('Gastos por Tipo');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#555');
    doc.text(`Fixos: ${fmt(kindRow?.fixed ?? 0)}`);
    doc.text(`Variáveis: ${fmt(kindRow?.variable ?? 0)}`);
    doc.text(`Outros: ${fmt(kindRow?.custom ?? 0)}`);
    doc.moveDown(1);

    // Gastos por Categoria
    if (byCategory.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('Gastos por Categoria');
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').fillColor('#555');
      for (const c of byCategory) {
        doc.text(`${c.name}: ${fmt(c.value)}`);
      }
      doc.moveDown(1);
    }

    // Evolução Mensal
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('Evolução Mensal');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#555');
    for (const m of monthlyRows) {
      const bal = m.income - m.expenses;
      doc.text(`${monthNames[m.month - 1]}: Entradas ${fmt(m.income)} | Saídas ${fmt(m.expenses)} | Saldo ${fmt(bal)}`);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(7).fillColor('#aaa').text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} — Planejix`, { align: 'left' });

    doc.end();
  });
}

module.exports = { generateMonthlyPdfBuffer };
