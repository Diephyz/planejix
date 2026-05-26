import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { transactionsAPI, categoriesAPI } from '../api/api';
import type { Category } from '../types';

interface Row {
  tipo: string;
  descricao: string;
  valor: string;
  data: string;
  categoria?: string;
  subtipo?: string;
}

interface PreviewRow extends Row {
  _valid: boolean;
  _error?: string;
}

function parseDate(raw: string): string {
  if (!raw) return '';
  // Excel serial number
  if (/^\d+$/.test(String(raw))) {
    const date = XLSX.SSF.parse_date_code(Number(raw));
    if (date) {
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${date.y}-${m}-${d}`;
    }
  }
  // DD/MM/YYYY
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return '';
}

function parseType(raw: string): 'income' | 'expense' | null {
  const v = raw?.toLowerCase().trim();
  if (['entrada', 'income', 'receita', 'ganho'].includes(v)) return 'income';
  if (['saída', 'saida', 'expense', 'despesa', 'gasto'].includes(v)) return 'expense';
  return null;
}

function parseKind(raw: string): 'fixed' | 'variable' | 'custom' {
  const v = raw?.toLowerCase().trim();
  if (['fixo', 'fixed'].includes(v)) return 'fixed';
  if (['variável', 'variavel', 'variable'].includes(v)) return 'variable';
  return 'custom';
}

function downloadTemplate() {
  const headers = ['Tipo', 'Descrição', 'Valor', 'Data', 'Categoria', 'Subtipo'];
  const examples = [
    ['Saída', 'Supermercado', 250.00, '15/05/2026', 'Alimentação', 'Variável'],
    ['Entrada', 'Salário', 3500.00, '01/05/2026', 'Salário', 'Fixo'],
    ['Saída', 'Conta de luz', 180.00, '10/05/2026', 'Moradia', 'Fixo'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
  ws['!cols'] = [{ wch: 10 }, { wch: 24 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transações');
  XLSX.writeFile(wb, 'modelo_planejix.xlsx');
}

export default function ImportPage() {
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setResult(null);
    setFileName(file.name);
    const cats = await categoriesAPI.getAll().then(r => r.data);
    setCategories(cats);

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const rows: PreviewRow[] = raw.map((r) => {
      const normalize = (key: string) =>
        r[key] ?? r[key.toLowerCase()] ?? r[key.toUpperCase()] ?? '';

      const tipo = normalize('Tipo') || normalize('tipo') || normalize('TYPE');
      const descricao = normalize('Descrição') || normalize('Descricao') || normalize('Descrição') || normalize('description');
      const valor = normalize('Valor') || normalize('valor') || normalize('Value');
      const data = normalize('Data') || normalize('data') || normalize('Date');
      const categoria = normalize('Categoria') || normalize('categoria');
      const subtipo = normalize('Subtipo') || normalize('subtipo') || normalize('Kind');

      const parsedType = parseType(tipo);
      const parsedDate = parseDate(String(data));
      const parsedValue = parseFloat(String(valor).replace(',', '.'));

      let _error = '';
      if (!parsedType) _error = 'Tipo inválido (use Entrada ou Saída)';
      else if (!parsedDate) _error = 'Data inválida (use DD/MM/AAAA)';
      else if (isNaN(parsedValue) || parsedValue <= 0) _error = 'Valor inválido';
      else if (!descricao) _error = 'Descrição obrigatória';

      return {
        tipo, descricao, valor: String(valor), data: String(data),
        categoria, subtipo,
        _valid: !_error, _error,
      };
    });

    setPreview(rows);
  };

  const handleImport = async () => {
    setImporting(true);
    let ok = 0;
    let fail = 0;

    for (const row of preview) {
      if (!row._valid) { fail++; continue; }

      const type = parseType(row.tipo)!;
      const date = parseDate(row.data);
      const amount = parseFloat(String(row.valor).replace(',', '.'));
      const kind = row.subtipo ? parseKind(row.subtipo) : 'variable';

      const cat = categories.find(
        (c) => c.name.toLowerCase() === row.categoria?.toLowerCase()
      );

      try {
        await transactionsAPI.create({
          type, description: row.descricao, amount, date, kind,
          category_id: cat?.id ?? undefined,
        });
        ok++;
      } catch {
        fail++;
      }
    }

    setResult({ ok, fail });
    setImporting(false);
  };

  const validCount = preview.filter((r) => r._valid).length;
  const invalidCount = preview.filter((r) => !r._valid).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Importar do Excel</h2>
        <p className="text-sm text-gray-400 mt-0.5">Importe transações a partir de um arquivo .xlsx ou .csv</p>
      </div>

      {/* Template info */}
      <div className="card">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-white">Formato esperado das colunas</h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar modelo .xlsx
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-gray-400">
            <thead>
              <tr className="border-b border-dark-600">
                {['Tipo', 'Descrição', 'Valor', 'Data', 'Categoria', 'Subtipo'].map(col => (
                  <th key={col} className="text-left py-2 pr-4 font-semibold text-gray-300">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-dark-600/50">
                <td className="py-2 pr-4">Entrada / Saída</td>
                <td className="py-2 pr-4">Texto livre</td>
                <td className="py-2 pr-4">Número (ex: 150.00)</td>
                <td className="py-2 pr-4">DD/MM/AAAA</td>
                <td className="py-2 pr-4">Nome da categoria</td>
                <td className="py-2 pr-4">Fixo / Variável / Personalizado</td>
              </tr>
              <tr className="text-gray-500 italic">
                <td className="py-2 pr-4">Saída</td>
                <td className="py-2 pr-4">Supermercado</td>
                <td className="py-2 pr-4">250.00</td>
                <td className="py-2 pr-4">15/05/2026</td>
                <td className="py-2 pr-4">Alimentação</td>
                <td className="py-2 pr-4">Variável</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload */}
      <div
        className="card border-2 border-dashed border-dark-600 hover:border-brand-500 transition-colors cursor-pointer text-center py-10"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <svg className="w-10 h-10 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {fileName ? (
          <p className="text-brand-400 font-medium">{fileName}</p>
        ) : (
          <>
            <p className="text-gray-300 font-medium">Clique para selecionar ou arraste o arquivo</p>
            <p className="text-gray-500 text-sm mt-1">.xlsx, .xls ou .csv</p>
          </>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Pré-visualização</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {validCount} válida(s)
                {invalidCount > 0 && <span className="text-red-400 ml-2">{invalidCount} com erro</span>}
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
            >
              {importing ? 'Importando...' : `Importar ${validCount} linha(s)`}
            </button>
          </div>

          {result && (
            <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${result.fail === 0 ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-yellow-900/30 border border-yellow-700 text-yellow-400'}`}>
              {result.ok} importada(s) com sucesso{result.fail > 0 && `, ${result.fail} falhou`}.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dark-600 text-gray-400">
                  <th className="text-left py-2 pr-3">Status</th>
                  <th className="text-left py-2 pr-3">Tipo</th>
                  <th className="text-left py-2 pr-3">Descrição</th>
                  <th className="text-left py-2 pr-3">Valor</th>
                  <th className="text-left py-2 pr-3">Data</th>
                  <th className="text-left py-2 pr-3">Categoria</th>
                  <th className="text-left py-2">Subtipo</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className={`border-b border-dark-600/40 ${!row._valid ? 'opacity-60' : ''}`}>
                    <td className="py-2 pr-3">
                      {row._valid
                        ? <span className="text-green-400">✓</span>
                        : <span className="text-red-400" title={row._error}>✗</span>
                      }
                    </td>
                    <td className="py-2 pr-3 text-gray-300">{row.tipo}</td>
                    <td className="py-2 pr-3 text-gray-300 max-w-[160px] truncate">{row.descricao}</td>
                    <td className="py-2 pr-3 text-gray-300">{row.valor}</td>
                    <td className="py-2 pr-3 text-gray-300">{row.data}</td>
                    <td className="py-2 pr-3 text-gray-300">{row.categoria || '—'}</td>
                    <td className="py-2 text-gray-300">{row.subtipo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
