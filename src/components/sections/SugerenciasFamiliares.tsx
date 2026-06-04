import { useEffect, useState } from 'react';
import { Heart, Plus, X, Save, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

interface Suggestion {
  id: string;
  author: string;
  activity_type: string;
  title: string;
  description: string;
  likes: number;
  created_at: string;
}

const AUTHORS = ['Mama', 'Papa', 'Loli', 'Alberto'] as const;
const ACTIVITY_TYPES = ['Restaurante', 'Visita', 'Hotel', 'Monumento', 'Ciudad'] as const;

const AUTHOR_COLORS: Record<string, string> = {
  Mama:    '#FEF08A',
  Papa:    '#BAE6FD',
  Loli:    '#FBCFE8',
  Alberto: '#BBF7D0',
};

const AUTHOR_BORDER: Record<string, string> = {
  Mama:    '#fde047',
  Papa:    '#7dd3fc',
  Loli:    '#f9a8d4',
  Alberto: '#86efac',
};

const ACTIVITY_ICONS: Record<string, string> = {
  Restaurante: '🍴',
  Visita:      '📸',
  Hotel:       '🏨',
  Monumento:   '⛩️',
  Ciudad:      '🏙️',
};

function getRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return ((hash % 400) - 200) / 100;
}

const EMPTY_FORM = { author: 'Mama', activity_type: 'Visita', title: '', description: '' };

type FormState = typeof EMPTY_FORM;

export default function SugerenciasFamiliares() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Suggestion | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase
      .from('family_suggestions')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSuggestions(data);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (s: Suggestion) => {
    setEditTarget(s);
    setForm({ author: s.author, activity_type: s.activity_type, title: s.title, description: s.description });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    if (editTarget) {
      const { data } = await supabase
        .from('family_suggestions')
        .update(form)
        .eq('id', editTarget.id)
        .select()
        .maybeSingle();
      if (data) {
        setSuggestions((prev) => prev.map((s) => s.id === data.id ? data : s));
      }
    } else {
      const { data } = await supabase
        .from('family_suggestions')
        .insert({ ...form, likes: 0 })
        .select()
        .maybeSingle();
      if (data) {
        setSuggestions((prev) => [data, ...prev]);
      }
    }
    setSaving(false);
    closeModal();
  };

  const deleteSuggestion = async (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    await supabase.from('family_suggestions').delete().eq('id', id);
  };

  const toggleLike = async (suggestion: Suggestion) => {
    const isLiked = likedIds.has(suggestion.id);
    const newLikes = isLiked ? suggestion.likes - 1 : suggestion.likes + 1;
    setLikedIds((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(suggestion.id) : next.add(suggestion.id);
      return next;
    });
    setSuggestions((prev) =>
      prev.map((s) => s.id === suggestion.id ? { ...s, likes: newLikes } : s)
    );
    await supabase.from('family_suggestions').update({ likes: newLikes }).eq('id', suggestion.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-3xl font-extrabold mb-2"
            style={{
              background: 'linear-gradient(90deg, #0e7490 0%, #be185d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Sugerencias Familiares
          </h2>
          <p className="text-sm font-medium" style={{ color: '#334155' }}>
            {suggestions.length > 0
              ? `${suggestions.length} idea${suggestions.length !== 1 ? 's' : ''} en el tablón`
              : 'Tablón de ideas — vota las que más te gusten'}
          </p>
        </div>
        <button onClick={openCreate} className="japan-btn-primary gap-2 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:block">Proponer Idea</span>
        </button>
      </div>

      {/* Board */}
      {suggestions.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.50)' }}
        >
          <p className="text-4xl mb-3">📌</p>
          <p className="font-semibold" style={{ color: '#475569' }}>El tablón está vacío</p>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>¡Sé el primero en proponer una idea!</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3" style={{ columnGap: '1rem' }}>
          {suggestions.map((s) => (
            <PostIt
              key={s.id}
              suggestion={s}
              liked={likedIds.has(s.id)}
              onLike={() => toggleLike(s)}
              onEdit={() => openEdit(s)}
              onDelete={() => deleteSuggestion(s.id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Editar sugerencia' : 'Proponer una idea'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2"
              style={{ color: '#475569' }}
            >
              <X size={15} /><span>Cancelar</span>
            </button>
            <button
              onClick={save}
              disabled={saving || !form.title.trim()}
              className="japan-btn-primary gap-2 disabled:opacity-40"
            >
              <Save size={15} />
              <span>{saving ? 'Guardando...' : editTarget ? 'Guardar cambios' : 'Añadir al tablón'}</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Nota de</label>
              <select value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="japan-input">
                {AUTHORS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Tipo de actividad</label>
              <select value={form.activity_type} onChange={(e) => setForm({ ...form, activity_type: e.target.value })} className="japan-input">
                {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Título</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Ramen en Ichiran Shinjuku"
              className="japan-input"
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Por qué lo recomiendas, detalles importantes..."
              className="japan-input resize-none"
            />
          </div>
          {/* Color preview */}
          <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
            <div
              className="w-4 h-4 rounded-sm shrink-0"
              style={{ background: AUTHOR_COLORS[form.author] ?? '#FEF9C3', border: `1.5px solid ${AUTHOR_BORDER[form.author] ?? '#fde047'}` }}
            />
            <span>Color de nota: <strong style={{ color: '#475569' }}>{form.author}</strong></span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PostIt({
  suggestion,
  liked,
  onLike,
  onEdit,
  onDelete,
}: {
  suggestion: Suggestion;
  liked: boolean;
  onLike: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rotation = getRotation(suggestion.id);
  const bg = AUTHOR_COLORS[suggestion.author] ?? '#FEF9C3';
  const border = AUTHOR_BORDER[suggestion.author] ?? '#fde047';
  const icon = ACTIVITY_ICONS[suggestion.activity_type] ?? '📌';
  const isTop = suggestion.likes > 3;
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="break-inside-avoid mb-4 relative"
      style={{
        transform: hovered ? 'rotate(0deg) scale(1.03)' : `rotate(${rotation}deg)`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        zIndex: hovered ? 10 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
    >
      <div
        className="relative p-4"
        style={{
          background: bg,
          border: `1.5px solid ${border}`,
          borderRadius: '3px',
          boxShadow: hovered
            ? '3px 8px 24px rgba(0,0,0,0.20), 0 2px 4px rgba(0,0,0,0.10)'
            : '2px 4px 12px rgba(0,0,0,0.13), 0 1px 2px rgba(0,0,0,0.07)',
        }}
      >
        {/* Tape strip */}
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-5 rounded-sm"
          style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.30)' }}
        />

        {/* TOP PLAN badge */}
        {isTop && (
          <div
            className="absolute -top-2 -right-2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md"
            style={{ background: '#fbbf24', color: '#78350f', border: '1.5px solid #f59e0b', zIndex: 2 }}
          >
            ⭐ TOP PLAN
          </div>
        )}

        {/* Top row: activity icon + author + action icons */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-lg leading-none shrink-0">{icon}</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: 'rgba(0,0,0,0.10)', color: 'rgba(0,0,0,0.60)' }}
          >
            {suggestion.author}
          </span>
          {/* Spacer */}
          <div className="flex-1" />
          {/* Edit */}
          <button
            onClick={onEdit}
            className="w-6 h-6 flex items-center justify-center rounded-full transition-all hover:scale-110"
            style={{ background: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.50)' }}
            title="Editar"
          >
            <Pencil size={11} />
          </button>
          {/* Delete */}
          {confirmDelete ? (
            <button
              onClick={onDelete}
              className="h-6 px-2 flex items-center gap-1 rounded-full text-[10px] font-bold transition-all"
              style={{ background: '#ef4444', color: '#fff' }}
              title="Confirmar eliminación"
            >
              <Trash2 size={10} />
              <span>Borrar</span>
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-6 h-6 flex items-center justify-center rounded-full transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.40)' }}
              title="Eliminar"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        {/* Title */}
        <p
          className="text-sm font-bold leading-snug mb-1.5"
          style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}
        >
          {suggestion.title}
        </p>

        {/* Description */}
        {suggestion.description && (
          <p
            className="text-xs leading-relaxed"
            style={{ color: '#1e293b', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
          >
            {suggestion.description}
          </p>
        )}

        {/* Footer: date + like toggle */}
        <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.10)' }}>
          <span className="text-[10px] font-medium" style={{ color: 'rgba(0,0,0,0.45)' }}>
            {new Date(suggestion.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </span>
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all active:scale-90"
            style={{
              background: liked ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.08)',
              border: liked ? '1.5px solid rgba(239,68,68,0.35)' : '1.5px solid rgba(0,0,0,0.14)',
            }}
            title={liked ? 'Quitar voto' : 'Me gusta'}
          >
            <Heart
              size={13}
              style={{
                fill: liked ? '#ef4444' : 'none',
                stroke: liked ? '#ef4444' : '#334155',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            />
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: liked ? '#dc2626' : '#1e293b', minWidth: '0.75rem', textAlign: 'center' }}
            >
              {suggestion.likes}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
