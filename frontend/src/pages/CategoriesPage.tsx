import { useState, useEffect, useCallback } from 'react';
import { categoriesAPI } from '../api/api';
import type { Category } from '../types';
import Modal from '../components/shared/Modal';
import { useToast } from '../context/ToastContext';
import { CardsSkeleton } from '../components/shared/Skeleton';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#ec4899', '#6b7280',
];

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openAdd = () => {
    setEditTarget(null);
    setName('');
    setColor('#6366f1');
    setError('');
    setFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setName(cat.name);
    setColor(cat.color);
    setError('');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true);
    setError('');
    try {
      if (editTarget) {
        await categoriesAPI.update(editTarget.id, { name: name.trim(), color });
      } else {
        await categoriesAPI.create({ name: name.trim(), color });
      }
      setFormOpen(false);
      toast(editTarget ? 'Categoria atualizada' : 'Categoria criada');
      fetchCategories();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await categoriesAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      toast('Categoria excluída');
      fetchCategories();
    } catch {
      toast('Erro ao excluir categoria', 'error');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Categorias</h2>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} categoria{categories.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Categoria
        </button>
      </div>

      {loading ? (
        <CardsSkeleton count={6} />
      ) : categories.length === 0 ? (
        <div className="card text-center py-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-brand-600/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-white font-semibold">Nenhuma categoria</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Organize suas transações criando categorias personalizadas com cores</p>
          <button onClick={openAdd} className="btn-primary mt-5 inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="card flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + '33' }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                </div>
                <span className="font-medium text-white truncate">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-600/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteTarget(cat)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? 'Editar Categoria' : 'Nova Categoria'}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: Alimentação"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="label">Cor</label>
            <div className="grid grid-cols-6 gap-2 mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '33' }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <span className="text-sm text-white">{name || 'Prévia da categoria'}</span>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <button onClick={() => setFormOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Salvando...' : editTarget ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Excluir Categoria" maxWidth="max-w-sm">
        <div className="space-y-4">
          {deleteTarget && (
            <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: deleteTarget.color + '33' }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deleteTarget.color }} />
              </div>
              <span className="text-sm text-white">{deleteTarget.name}</span>
            </div>
          )}
          <p className="text-sm text-gray-300">As transações vinculadas ficarão sem categoria. Deseja continuar?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleDelete} className="btn-danger flex-1">Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
