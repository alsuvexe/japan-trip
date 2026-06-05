import { useEffect, useState } from 'react';
import {
  Package, FileText, TrainFront, Clock, Ticket, CreditCard,
  Calendar, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Save, X,
} from 'lucide-react';
import Modal from '../Modal';

type NoteCategory = 'reserva' | 'documentacion' | 'transporte' | 'hito' | 'ocio' | 'finanzas';

interface CalendarNote {
  id: string;
  date: string;
  category: NoteCategory;
  title: string;
  description: string;
}

const CATEGORIES: {
  id: NoteCategory;
  label: string;
  emoji: string;
  dotColor: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: 'reserva',       label: 'Reserva',          emoji: '📦', dotColor: '#0e7490', bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-300',   icon: Package      },
  { id: 'documentacion', label: 'Documentación',     emoji: '📄', dotColor: '#7c3aed', bg: 'bg-violet-50', text: 'text-violet-700',  border: 'border-violet-300', icon: FileText     },
  { id: 'transporte',    label: 'Transporte',        emoji: '🚇', dotColor: '#1d4ed8', bg: 'bg-blue-50',   text: 'text-blue-700',    border: 'border-blue-300',   icon: TrainFront   },
  { id: 'hito',          label: 'Hito / Fecha Límite', emoji: '⏰', dotColor: '#b45309', bg: 'bg-amber-50',  text: 'text-amber-700',   border: 'border-amber-300',  icon: Clock        },
  { id: 'ocio',          label: 'Ocio / Entradas',   emoji: '🎟️', dotColor: '#be185d', bg: 'bg-rose-50',   text: 'text-rose-700',    border: 'border-rose-300',   icon: Ticket       },
  { id: 'finanzas',      label: 'Finanzas / Pagos',  emoji: '💳', dotColor: '#059669', bg: 'bg-emerald-50',text: 'text-emerald-700', border: 'border-emerald-300',icon: CreditCard   },
];

const DAYS_OF_WEEK = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const STORAGE_KEY = 'japan_trip_calendar_notes';

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

function getCat(id: NoteCategory) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const EMPTY_FORM = { title: '', category: 'reserva' as NoteCategory, description: '' };

export default function CalendarioReservas() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(11);
  const [notes, setNotes] = useState<CalendarNote[]>([]);

  // Modal state — shared for add + edit
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const navigate = (dir: -1 | 1) => {
    setViewMonth((m) => {
      let nm = m + dir;
      if (nm < 0) { nm = 11; setViewYear((y) => y - 1); }
      else if (nm > 11) { nm = 0; setViewYear((y) => y + 1); }
      return nm;
    });
  };

  const getDateString = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const notesForDay = (day: number) =>
    notes.filter((n) => n.date === getDateString(day));

  const monthNotes = notes
    .filter((n) => {
      const [y, m] = n.date.split('-').map(Number);
      return y === viewYear && m === viewMonth + 1;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const isToday = (day: number) => {
    const ds = getDateString(day);
    const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return ds === t;
  };

  const openAdd = (dateStr: string) => {
    setEditingId(null);
    setModalDate(dateStr);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (note: CalendarNote, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(note.id);
    setModalDate(note.date);
    setForm({ title: note.title, category: note.category, description: note.description });
    setModalOpen(true);
  };

  const saveNote = () => {
    if (!form.title.trim()) return;
    if (editingId) {
      setNotes((prev) =>
        prev.map((n) => n.id === editingId ? { ...n, ...form, title: form.title.trim() } : n)
      );
    } else {
      const newNote: CalendarNote = {
        id: genId(),
        date: modalDate,
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
      };
      setNotes((prev) => [...prev, newNote]);
    }
    setModalOpen(false);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const deleteNote = () => {
    setNotes((prev) => prev.filter((n) => n.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  const formatDateLabel = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const formatDayShort = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
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
            Calendario
          </h2>
          <p className="text-sm font-medium" style={{ color: '#334155' }}>Notas logísticas del viaje</p>
        </div>
        <button
          onClick={() => openAdd(getDateString(1))}
          className="japan-btn-primary shrink-0 gap-2 text-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva nota</span>
          <span className="sm:hidden">Nota</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={GLASS_CARD}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate(-1)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-300 hover:text-cyan-700 hover:border-cyan-300 transition-all active:scale-95"
              style={{ color: '#475569' }}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="text-cyan-600" size={18} />
              <h3 className="text-base font-semibold" style={{ color: '#0f172a' }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h3>
            </div>
            <button
              onClick={() => navigate(1)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-300 hover:text-cyan-700 hover:border-cyan-300 transition-all active:scale-95"
              style={{ color: '#475569' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold py-1 uppercase tracking-wider" style={{ color: '#94a3b8' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const dayNotes = notesForDay(day);
              const tod = isToday(day);
              const dateStr = getDateString(day);

              return (
                <div
                  key={idx}
                  onClick={() => openAdd(dateStr)}
                  className={`relative rounded-xl p-1.5 min-h-[60px] transition-all cursor-pointer group ${
                    tod
                      ? 'ring-2 ring-cyan-400 ring-offset-1'
                      : 'hover:ring-1 hover:ring-slate-300'
                  }`}
                  style={{
                    background: tod
                      ? 'rgba(14,116,144,0.08)'
                      : 'rgba(255,255,255,0.55)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Day number */}
                  <span
                    className={`text-[11px] font-bold block text-center mb-1 ${tod ? 'text-cyan-700' : ''}`}
                    style={!tod ? { color: '#475569' } : undefined}
                  >
                    {day}
                  </span>

                  {/* Notes chips */}
                  <div className="space-y-0.5">
                    {dayNotes.slice(0, 3).map((note) => {
                      const cat = getCat(note.category);
                      const Icon = cat.icon;
                      return (
                        <div
                          key={note.id}
                          onClick={(e) => openEdit(note, e)}
                          className={`flex items-center gap-0.5 rounded-md px-1 py-0.5 border cursor-pointer hover:brightness-95 transition-all ${cat.bg} ${cat.border}`}
                          title={note.title}
                        >
                          <Icon size={8} strokeWidth={2} />
                          <span className={`text-[8px] font-semibold leading-none truncate ${cat.text}`}>{note.title}</span>
                        </div>
                      );
                    })}
                    {dayNotes.length > 3 && (
                      <div className="text-[8px] text-center font-semibold" style={{ color: '#94a3b8' }}>
                        +{dayNotes.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Add hint on hover */}
                  {dayNotes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl">
                      <Plus size={14} style={{ color: '#94a3b8' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-slate-200/70">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-md border ${cat.bg} ${cat.border}`}
                  >
                    <Icon size={10} strokeWidth={2} />
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: '#475569' }}>{cat.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar — agenda feed */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ ...GLASS_CARD, maxHeight: 560 }}>
          <div className="mb-4 shrink-0">
            <h3 className="text-base font-bold" style={{ color: '#0f172a' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>
              {monthNotes.length} {monthNotes.length === 1 ? 'nota' : 'notas'} este mes
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin min-h-0">
            {monthNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.04)' }}
                >
                  <Calendar size={22} style={{ color: '#cbd5e1' }} strokeWidth={1.5} />
                </div>
                <p className="text-xs font-medium text-center" style={{ color: '#94a3b8' }}>
                  Sin notas este mes.<br />Haz clic en un día para añadir.
                </p>
              </div>
            )}

            {monthNotes.map((note) => {
              const cat = getCat(note.category);
              const Icon = cat.icon;
              return (
                <div
                  key={note.id}
                  className={`group rounded-xl border p-3 transition-all hover:shadow-sm ${cat.bg} ${cat.border}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border ${cat.bg} ${cat.border}`}>
                      <Icon size={12} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold leading-snug truncate" style={{ color: '#0f172a' }}>{note.title}</p>
                      <p className="text-[10px] mt-0.5 font-medium capitalize" style={{ color: '#64748b' }}>
                        {formatDayShort(note.date)}
                      </p>
                      {note.description && (
                        <p className="text-[10px] mt-1 leading-relaxed line-clamp-2" style={{ color: '#475569' }}>
                          {note.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEdit(note, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/80 transition-colors"
                        style={{ color: '#64748b' }}
                        title="Editar"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={(e) => confirmDelete(note.id, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: '#94a3b8' }}
                        title="Eliminar"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add / Edit note modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar nota' : 'Nueva nota'}
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-sm font-medium transition-all"
              style={{ color: '#475569' }}
            >
              Cancelar
            </button>
            <button
              onClick={saveNote}
              disabled={!form.title.trim()}
              className="flex-1 japan-btn-primary gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={14} />
              {editingId ? 'Guardar cambios' : 'Añadir nota'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Date (read-only display when adding from cell) */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#475569' }}>
              Fecha
            </label>
            <input
              type="date"
              value={modalDate}
              onChange={(e) => setModalDate(e.target.value)}
              className="japan-input w-full"
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#475569' }}>
              Título corto
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Pagar reserva Gion Hatanaka"
              className="japan-input w-full"
              onKeyDown={(e) => e.key === 'Enter' && saveNote()}
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#475569' }}>
              Categoría
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = form.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      active ? `${cat.bg} ${cat.border} ${cat.text}` : 'border-slate-300 hover:border-slate-400'
                    }`}
                    style={active ? undefined : { color: '#475569' }}
                  >
                    <Icon size={12} strokeWidth={2} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#475569' }}>
              Descripción / Código de enlace
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Notas rápidas, código de reserva, URL..."
              className="japan-input resize-none text-sm w-full"
            />
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Eliminar nota"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium" style={{ color: '#1e3a5f' }}>
            ¿Eliminar esta nota? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="japan-btn border border-slate-300 hover:bg-slate-100"
              style={{ color: '#475569' }}
            >
              Cancelar
            </button>
            <button
              onClick={deleteNote}
              className="japan-btn-danger gap-2"
            >
              <Trash2 size={14} />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
