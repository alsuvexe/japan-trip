import { useState } from 'react';
import { Plus, Trash2, ClipboardList, Calendar, ChevronDown, AlignLeft, Pencil } from 'lucide-react';
import Modal from '../Modal';
import { useTodos, PEOPLE, calcPersonPct, calcOverallProgress, isFullyDone, type Todo, type Person } from '../../lib/TodoContext';
import { useAdmin } from '../../lib/AdminContext';

const CATEGORIES = ['General', 'Documentos', 'Transporte', 'Tecnología', 'Finanzas', 'Equipaje', 'Alojamiento', 'Restaurantes'];

const PERSON_COLORS: Record<Person, {
  bg: string; border: string; text: string; bar: string;
  dot: string; avatarBg: string;
  activeBg: string; activeBorder: string;
}> = {
  Papa:    { bg: 'bg-sky-500/15',     border: 'border-sky-500/35',     text: 'text-sky-700',     bar: 'from-sky-500 to-sky-400',      dot: 'bg-sky-500',     avatarBg: 'bg-sky-500',     activeBg: 'bg-sky-500',     activeBorder: 'border-sky-600'     },
  Mama:    { bg: 'bg-rose-500/15',    border: 'border-rose-500/35',    text: 'text-rose-700',    bar: 'from-rose-500 to-pink-400',    dot: 'bg-rose-500',    avatarBg: 'bg-rose-500',    activeBg: 'bg-rose-500',    activeBorder: 'border-rose-600'    },
  Loli:    { bg: 'bg-amber-500/15',   border: 'border-amber-500/35',   text: 'text-amber-700',   bar: 'from-amber-500 to-yellow-400', dot: 'bg-amber-500',   avatarBg: 'bg-amber-500',   activeBg: 'bg-amber-500',   activeBorder: 'border-amber-600'   },
  Alberto: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/35', text: 'text-emerald-700', bar: 'from-emerald-500 to-teal-400', dot: 'bg-emerald-500', avatarBg: 'bg-emerald-500', activeBg: 'bg-emerald-500', activeBorder: 'border-emerald-600' },
};

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

function DueDateBadge({ date }: { date: string }) {
  const d = new Date(date + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isPast = d < today;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isPast ? 'bg-red-100 text-red-700 border-red-300' : 'bg-cyan-100 text-cyan-700 border-cyan-300'}`}>
      <Calendar size={9} />
      {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
    </span>
  );
}

function MultiAssigneePicker({ selected, onChange }: { selected: string[]; onChange: (val: string[]) => void }) {
  const toggle = (person: Person) => {
    onChange(selected.includes(person) ? selected.filter((p) => p !== person) : [...selected, person]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {PEOPLE.map((person) => {
        const c = PERSON_COLORS[person];
        const active = selected.includes(person);
        return (
          <button key={person} type="button" onClick={() => toggle(person)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? `${c.bg} ${c.border} ${c.text}` : 'bg-white/85 border-slate-300 hover:border-slate-400 text-slate-600'}`}
          >
            <span className={`w-2 h-2 rounded-full transition-all ${active ? c.dot : 'bg-slate-300'}`} />
            {person}
          </button>
        );
      })}
    </div>
  );
}

function PersonCompletionIndicator({ todo }: { todo: Todo }) {
  if (todo.assignees.length === 0) return null;
  return (
    <div className="flex items-center gap-1 mt-2">
      {todo.assignees.map((a) => {
        const person = a as Person;
        const c = PERSON_COLORS[person];
        const done = todo.completed_by.includes(person);
        return (
          <div key={person} title={done ? `${person}: completado` : `${person}: pendiente`}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all border ${done ? `${c.avatarBg} text-white border-transparent` : 'bg-white border-slate-300 text-slate-400'}`}
          >
            {person[0].toUpperCase()}
          </div>
        );
      })}
    </div>
  );
}

interface EditForm {
  title: string; description: string; category: string; due_date: string; assignees: string[];
}

export default function TodoList() {
  const { todos, addTodo, updateTodo, deleteTodo, togglePersonCompletion, toggleAllAssignees } = useTodos();
  const { isAdmin } = useAdmin();

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignees, setNewAssignees] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: '', description: '', category: 'General', due_date: '', assignees: [] });
  const [saving, setSaving] = useState(false);

  const overallProgress = calcOverallProgress(todos);

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditForm({ title: todo.title, description: todo.description ?? '', category: todo.category, due_date: todo.due_date ?? '', assignees: [...todo.assignees] });
  };

  const saveEdit = async () => {
    if (!editingTodo || !editForm.title.trim()) return;
    setSaving(true);
    await updateTodo(editingTodo.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      category: editForm.category,
      due_date: editForm.due_date || null,
      assignees: editForm.assignees,
    });
    setSaving(false);
    setEditingTodo(null);
  };

  const handleAddTodo = async () => {
    if (!newTitle.trim()) return;
    await addTodo({
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      completed_by: [],
      assignees: newAssignees,
      category: newCategory,
      due_date: newDueDate || null,
    });
    setNewTitle(''); setNewDescription(''); setNewDueDate(''); setNewAssignees([]); setNewCategory('General'); setShowForm(false);
  };

  const filteredTodos = filter === 'all' ? todos : todos.filter((t) => t.assignees.includes(filter));
  const groupedByCategory = filteredTodos.reduce<Record<string, Todo[]>>((acc, t) => {
    acc[t.category] = acc[t.category] || [];
    acc[t.category].push(t);
    return acc;
  }, {});

  const getCheckState = (todo: Todo) => {
    if (filter !== 'all') return { done: todo.completed_by.includes(filter), partial: false };
    const done = isFullyDone(todo);
    return { done, partial: !done && todo.completed_by.length > 0 };
  };

  const labelStyle = { color: '#475569' };

  return (
    <div className="space-y-6">
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
          Lista de Tareas
        </h2>
        <p className="text-sm font-medium" style={{ color: '#334155' }}>Preparativos y responsables del viaje</p>
      </div>

      {/* Progress panel */}
      <div className="rounded-2xl p-5 space-y-5" style={GLASS}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="text-cyan-600" size={18} />
              <span className="text-sm font-bold" style={{ color: '#0f172a' }}>Progreso general</span>
            </div>
            <span className="text-lg font-black text-cyan-600">{overallProgress}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full transition-all duration-700" style={{ width: `${overallProgress}%` }} />
          </div>
          <p className="text-[11px] font-medium mt-2" style={{ color: '#64748b' }}>Media ponderada del progreso individual</p>
        </div>
        <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
          {PEOPLE.map((person) => {
            const pct = calcPersonPct(todos, person);
            const assigned = todos.filter((t) => t.assignees.includes(person));
            const done = assigned.filter((t) => t.completed_by.includes(person)).length;
            const colors = PERSON_COLORS[person];
            const isActive = filter === person;
            return (
              <button key={person} onClick={() => setFilter(isActive ? 'all' : person)}
                className={`text-left rounded-xl p-3.5 border transition-all ${isActive ? `${colors.bg} ${colors.border}` : 'border-white/60 hover:border-white/80'}`}
                style={!isActive ? { background: 'rgba(255,255,255,0.55)' } : {}}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    <span className={`text-sm font-bold ${colors.text}`}>{person}</span>
                  </div>
                  <span className={`text-xs font-bold ${colors.text}`}>{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <div className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[11px] font-medium mt-1.5" style={{ color: '#64748b' }}>{done} de {assigned.length} completadas</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* New task form — admin only */}
      {isAdmin && (
      <div className="rounded-2xl overflow-hidden" style={GLASS}>
        <button onClick={() => setShowForm((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/30 transition-colors">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-cyan-600" />
            <span className="text-sm font-bold" style={{ color: '#0f172a' }}>Nueva tarea</span>
          </div>
          <ChevronDown size={16} className={`transition-transform duration-200 ${showForm ? 'rotate-180' : ''}`} style={{ color: '#64748b' }} />
        </button>
        {showForm && (
          <div className="px-5 pb-5 space-y-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}>Título</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nombre de la tarea..." className="japan-input w-full" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddTodo()} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}><span className="flex items-center gap-1"><AlignLeft size={10} /> Descripción</span></label>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Detalles adicionales..." rows={3} className="japan-input w-full resize-none text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={labelStyle}>Responsables</label>
              <MultiAssigneePicker selected={newAssignees} onChange={setNewAssignees} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}>Categoría</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="japan-input w-full">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}><span className="flex items-center gap-1"><Calendar size={10} /> Fecha límite</span></label>
                <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="japan-input w-full" />
              </div>
            </div>
            <button onClick={handleAddTodo} disabled={!newTitle.trim()} className="japan-btn-primary w-full gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              <Plus size={16} /><span>Añadir tarea</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${filter === 'all' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white/85 border-slate-300 hover:border-slate-400 text-slate-700'}`}
        >
          Todas
        </button>
        {PEOPLE.map((person) => {
          const colors = PERSON_COLORS[person];
          const isActive = filter === person;
          return (
            <button
              key={person}
              onClick={() => setFilter(isActive ? 'all' : person)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                isActive
                  ? `${colors.activeBg} text-white ${colors.activeBorder}`
                  : 'bg-white/85 border-slate-300 hover:border-slate-400 text-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : colors.dot}`} />
              {person}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="space-y-5">
        {Object.entries(groupedByCategory).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>{category}</h3>
            <div className="space-y-2">
              {items.map((todo) => {
                const { done, partial } = getCheckState(todo);
                const hasDesc = !!todo.description?.trim();
                const isExpanded = expandedId === todo.id;
                const primaryAssignee = todo.assignees.length > 0 ? (todo.assignees[0] as Person) : null;
                const primaryColors = primaryAssignee ? PERSON_COLORS[primaryAssignee] : null;

                return (
                  <div
                    key={todo.id}
                    className={`rounded-xl border transition-all group ${!done && primaryColors ? primaryColors.border : ''}`}
                    style={
                      done
                        ? {
                            background: 'rgba(220,252,231,0.70)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(134,239,172,0.55)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.75)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                          }
                    }
                  >
                    <div className="flex items-start gap-3 p-3.5">
                      <button
                        onClick={() => {
                          if (!isAdmin) return;
                          if (filter !== 'all') {
                            togglePersonCompletion(todo, filter);
                          } else if (todo.assignees.length > 0) {
                            toggleAllAssignees(todo);
                          }
                        }}
                        className={`shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center ${!isAdmin ? 'cursor-default' : ''}`}
                        disabled={!isAdmin}
                      >
                        <span className={`flex items-center justify-center w-[22px] h-[22px] rounded-full border-2 transition-all ${
                          done
                            ? 'bg-emerald-500 border-emerald-500'
                            : partial
                              ? 'border-cyan-400 bg-cyan-50'
                              : primaryColors
                                ? `${primaryColors.border} ${primaryColors.bg}`
                                : 'border-slate-300 hover:border-cyan-500'
                        }`}>
                          {done && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {partial && <span className="w-2.5 h-0.5 rounded-full bg-cyan-500" />}
                        </span>
                      </button>

                      <div className="flex-1 min-w-0 py-1">
                        <p
                          className={`text-sm font-bold ${done ? 'line-through' : ''}`}
                          style={{ color: done ? '#374151' : '#0f172a', textDecorationColor: done ? '#6ee7b7' : undefined }}
                        >
                          {todo.title}
                        </p>
                        {filter === 'all' && todo.assignees.length > 0 && <PersonCompletionIndicator todo={todo} />}
                        {!done && todo.due_date && <div className="mt-1"><DueDateBadge date={todo.due_date} /></div>}
                        {hasDesc && (
                          <button onClick={() => setExpandedId(isExpanded ? null : todo.id)} className="flex items-center gap-1 mt-2 text-[11px] font-semibold transition-colors hover:text-cyan-600" style={{ color: '#64748b' }}>
                            <AlignLeft size={10} /><span>{isExpanded ? 'Ocultar' : 'Ver descripción'}</span>
                          </button>
                        )}
                        {isExpanded && hasDesc && (
                          <p className="mt-2 text-xs whitespace-pre-wrap leading-relaxed pl-3 font-medium" style={{ color: '#334155', borderLeft: '2px solid rgba(14,116,144,0.30)' }}>{todo.description}</p>
                        )}
                      </div>

                      {isAdmin && (
                      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(todo)} className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-cyan-600 hover:bg-cyan-50 transition-colors rounded-lg" style={{ color: '#64748b' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteTodo(todo.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg" style={{ color: '#64748b' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filteredTodos.length === 0 && (
          <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.50)' }}>
            <p className="font-medium" style={{ color: '#475569' }}>{filter === 'all' ? 'No hay tareas todavía' : `No hay tareas asignadas a ${filter}`}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editingTodo} onClose={() => setEditingTodo(null)} title="Editar tarea" size="md"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setEditingTodo(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-semibold transition-all" style={{ color: '#475569' }}>Cancelar</button>
            <button onClick={saveEdit} disabled={saving || !editForm.title.trim()} className="flex-1 japan-btn-primary gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}>Título</label>
            <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="japan-input w-full" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}><span className="flex items-center gap-1"><AlignLeft size={10} /> Descripción</span></label>
            <textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="japan-input w-full resize-none text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider mb-2 block" style={labelStyle}>Responsables</label>
            <MultiAssigneePicker selected={editForm.assignees} onChange={(v) => setEditForm((f) => ({ ...f, assignees: v }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}>Categoría</label>
              <select value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} className="japan-input w-full">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}><span className="flex items-center gap-1"><Calendar size={10} /> Fecha límite</span></label>
              <input type="date" value={editForm.due_date} onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))} className="japan-input w-full" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
