import type { AnnualSummary } from '../types';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export async function generateMonthlyReport(summary: AnnualSummary, year: number, month: number) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241); // brand-500
  doc.text('Planejix', 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Relatório Financeiro — ${monthNames[month - 1]} ${year}`, 14, 28);

  // Divider
  doc.setDrawColor(200);
  doc.line(14, 32, pageWidth - 14, 32);

  // KPIs
  let y = 40;
  doc.setFontSize(10);
  doc.setTextColor(60);

  const kpis = [
    ['Entradas', fmt(summary.annual.totalIncome)],
    ['Saídas', fmt(summary.annual.totalExpenses)],
    ['Saldo', fmt(summary.annual.balance)],
    ['Maior Gasto', fmt(summary.largestExpense)],
  ];

  kpis.forEach(([label, value], i) => {
    const x = 14 + (i % 2) * 90;
    const row = Math.floor(i / 2);
    const ky = y + row * 14;
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, ky);
    doc.setFont('helvetica', 'normal');
    doc.text(value, x + 30, ky);
  });

  y += 35;

  // Gastos por Tipo
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60);
  doc.text('Gastos por Tipo', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [['Tipo', 'Valor']],
    body: [
      ['Fixos', fmt(summary.byKind.fixed)],
      ['Variáveis', fmt(summary.byKind.variable)],
      ['Outros', fmt(summary.byKind.custom)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Gastos por Categoria
  if (summary.byCategoryMonth.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Gastos por Categoria', 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['Categoria', 'Valor']],
      body: summary.byCategoryMonth.map((c) => [c.name, fmt(c.value)]),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Evolução Mensal
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Evolução Mensal', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [['Mês', 'Entradas', 'Saídas', 'Saldo']],
    body: summary.monthly
      .filter((m) => m.income > 0 || m.expenses > 0)
      .map((m) => [
        monthNames[m.month - 1],
        fmt(m.income),
        fmt(m.expenses),
        fmt(m.balance),
      ]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} — Planejix`, 14, finalY);

  doc.save(`Planejix_Relatorio_${year}_${String(month).padStart(2, '0')}.pdf`);
}
