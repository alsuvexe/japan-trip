import { useCallback, useEffect, useRef, useState } from 'react';
import { Plane, TrainFront, Footprints, Utensils, Camera, Landmark, Sparkles, ChevronRight, ChevronUp, PlusCircle, Pencil, Trash2, Save, X, Clock, AlertCircle, Paperclip, FileText, ExternalLink, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';
import MarkdownRenderer from '../MarkdownRenderer';
import { useImagePaste } from '../../hooks/useImagePaste';

interface DayActivity {
  id: string;
  day_id: string;
  category: string;
  time: string;
  title: string;
  description: string;
  sort_order: number;
  attachment_url?: string | null;
  attachment_name?: string | null;
  has_pending_tasks?: boolean;
}

const ACTIVITY_CATEGORIES = [
  { id: 'flight', label: 'Transporte', icon: TrainFront, color: 'text-white', bg: 'bg-sky-600', border: 'border-sky-700' },
  { id: 'transport', label: 'Desplazamiento', icon: Footprints, color: 'text-white', bg: 'bg-blue-600', border: 'border-blue-700' },
  { id: 'restaurant', label: 'Comida', icon: Utensils, color: 'text-white', bg: 'bg-orange-500', border: 'border-orange-600' },
  { id: 'activity', label: 'Actividad', icon: Sparkles, color: 'text-white', bg: 'bg-emerald-600', border: 'border-emerald-700' },
  { id: 'visit', label: 'Visita', icon: Camera, color: 'text-white', bg: 'bg-pink-600', border: 'border-pink-700' },
  { id: 'landmark', label: 'Monumento', icon: Landmark, color: 'text-white', bg: 'bg-amber-500', border: 'border-amber-600' },
];

function getCatStyle(catId: string) {
  return ACTIVITY_CATEGORIES.find((c) => c.id === catId) || ACTIVITY_CATEGORIES[3];
}

function DescriptionTextarea({ value, onChange, rows = 8, placeholder = 'Descripción...' }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = useCallback((text: string) => {
    const el = textareaRef.current;
    if (!el) { onChange(value + text); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + (start > 0 && value[start - 1] !== '\n' ? '\n' : '') + text + '\n' + value.slice(end);
    onChange(next);
    setTimeout(() => {
      const pos = start + (start > 0 && value[start - 1] !== '\n' ? 1 : 0) + text.length + 1;
      el.setSelectionRange(pos, pos);
      el.focus();
    }, 0);
  }, [value, onChange]);

  const { handlePaste, status } = useImagePaste({ onInsert: insertAtCursor });

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider flex items-center gap-1">
            <ImageIcon size={10} /> Pega imágenes con Ctrl+V
          </span>
          {status === 'uploading' && <span className="text-[10px] text-cyan-400 animate-pulse">Subiendo...</span>}
          {status === 'done' && <span className="text-[10px] text-green-400">Insertada</span>}
          {status === 'error' && <span className="text-[10px] text-red-400">Error</span>}
        </div>
        <button type="button" onClick={() => setPreview(!preview)} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-cyan-400 transition-colors py-0.5 px-1.5 rounded hover:bg-cyan-500/10">
          {preview ? <EyeOff size={10} /> : <Eye size={10} />}
          {preview ? 'Editor' : 'Vista previa'}
        </button>
      </div>
      {preview ? (
        <div className="japan-input text-xs cursor-text overflow-auto" style={{ minHeight: `${rows * 24}px` }} onClick={() => setPreview(false)}>
          {value ? <MarkdownRenderer content={value} /> : <span className="text-gray-600 italic">Sin contenido — pulsa para editar</span>}
        </div>
      ) : (
        <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} onPaste={handlePaste} rows={rows} className={`japan-input text-xs resize-y ${status === 'uploading' ? 'paste-uploading' : ''}`} style={{ minHeight: `${rows * 24}px` }} placeholder={placeholder} />
      )}
    </div>
  );
}

export default function DayActivities({ dayId }: { dayId: string }) {
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DayActivity>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: 'activity', time: '', title: '', description: '', has_pending_tasks: false });
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [editAttachFile, setEditAttachFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('day_activities').select('*').eq('day_id', dayId)
      .order('time', { nullsFirst: false }).order('sort_order')
      .then(({ data }) => {
        if (data) setActivities([...data].sort((a, b) => (a.time || '').localeCompare(b.time || '')));
      });
  }, [dayId]);

  const uploadFile = async (file: File): Promise<{ url: string; name: string } | null> => {
    const ext = file.name.split('.').pop();
    const path = `activities/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('attachments').upload(path, file, { upsert: false });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
    return { url: urlData.publicUrl, name: file.name };
  };

  const addActivity = async () => {
    if (!form.title.trim()) return;
    setUploading(true);
    let attachment_url: string | null = null;
    let attachment_name: string | null = null;
    if (attachFile) {
      const res = await uploadFile(attachFile);
      if (res) { attachment_url = res.url; attachment_name = res.name; }
    }
    const { data } = await supabase.from('day_activities').insert({ ...form, day_id: dayId, sort_order: activities.length, attachment_url, attachment_name }).select().maybeSingle();
    setUploading(false);
    if (data) {
      setActivities((prev) => [...prev, data].sort((a, b) => (a.time || '').localeCompare(b.time || '')));
      setForm({ category: 'activity', time: '', title: '', description: '', has_pending_tasks: false });
      setAttachFile(null);
      setIsAddOpen(false);
    }
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.title?.trim()) return;
    setUploading(true);
    let updatedForm = { ...editForm };
    if (editAttachFile) {
      const res = await uploadFile(editAttachFile);
      if (res) updatedForm = { ...updatedForm, attachment_url: res.url, attachment_name: res.name };
    }
    await supabase.from('day_activities').update(updatedForm).eq('id', editingId);
    setActivities((prev) => prev.map((a) => a.id === editingId ? { ...a, ...updatedForm } : a).sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    setUploading(false);
    setEditingId(null);
    setEditForm({});
    setEditAttachFile(null);
  };

  const deleteActivity = async (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    await supabase.from('day_activities').delete().eq('id', id);
    setDeleteId(null);
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider">Actividades</span>
        <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors py-1 px-2 rounded-lg hover:bg-cyan-500/10">
          <PlusCircle size={12} /><span>Añadir</span>
        </button>
      </div>
      <div className="space-y-1.5">
        {activities.map((act) => {
          const cat = getCatStyle(act.category);
          const CatIcon = cat.icon;
          const isExpanded = expandedId === act.id;
          const isEditing = editingId === act.id;

          if (isEditing) return (
            <div key={act.id} className={`p-3 rounded-xl border ${cat.border} ${cat.bg} space-y-2`}>
              <div className="grid grid-cols-3 gap-2">
                <input type="time" value={editForm.time || ''} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} className="japan-input text-xs py-2" />
                <div className="col-span-2">
                  <input value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="japan-input text-xs py-2" onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                </div>
              </div>
              <DescriptionTextarea value={editForm.description || ''} onChange={(val) => setEditForm({ ...editForm, description: val })} rows={6} />
              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, has_pending_tasks: !editForm.has_pending_tasks })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${editForm.has_pending_tasks ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:text-gray-400'}`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${editForm.has_pending_tasks ? 'bg-orange-500 border-orange-500' : 'border-gray-600'}`}>
                  {editForm.has_pending_tasks && <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-xs font-medium">¿Tiene tareas o reservas pendientes?</span>
                {editForm.has_pending_tasks && <AlertCircle size={13} className="text-orange-400 shrink-0 ml-auto" />}
              </button>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => editFileInputRef.current?.click()}>
                <div className="flex-1 japan-input text-xs flex items-center gap-2 py-2 cursor-pointer hover:border-cyan-500/40">
                  <Paperclip size={12} className="text-gray-500 shrink-0" />
                  <span className={editAttachFile ? 'text-cyan-400' : 'text-gray-600'}>{editAttachFile ? editAttachFile.name : (editForm.attachment_name || 'Adjunto...')}</span>
                </div>
                <input ref={editFileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={(e) => setEditAttachFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setEditingId(null); setEditForm({}); setEditAttachFile(null); }} className="japan-btn border border-slate-300 hover:bg-slate-100 text-xs px-3 py-1.5 min-h-0 gap-1.5"><X size={12} /> Cancelar</button>
                <button onClick={saveEdit} disabled={uploading} className="japan-btn-primary text-xs px-3 py-1.5 min-h-0 gap-1.5 disabled:opacity-50"><Save size={12} /> {uploading ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          );

          return (
            <div key={act.id} className={`rounded-xl border transition-all ${isExpanded ? 'border-white/60 bg-white/70' : 'border-white/40 bg-white/55 hover:bg-white/70'}`} style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-3 px-3 py-3 cursor-pointer min-h-[48px]" onClick={() => setExpandedId(isExpanded ? null : act.id)}>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${cat.bg} ${cat.border} border shrink-0`}>
                  <CatIcon className={cat.color} size={11} />
                  <span className={`text-[10px] font-bold ${cat.color} hidden sm:block`}>{cat.label}</span>
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {act.time && <span className="text-[11px] font-semibold font-mono shrink-0 flex items-center gap-0.5" style={{ color: '#334155' }}><Clock size={9} />{act.time}</span>}
                  <span className="text-sm font-bold truncate" style={{ color: '#0f172a' }}>{act.title}</span>
                  {act.has_pending_tasks && (
                    <div className="group relative shrink-0">
                      <AlertCircle size={13} className="text-orange-500 animate-pulse cursor-help" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white border border-orange-300 text-orange-700 text-xs font-medium px-3 py-2 rounded-xl whitespace-nowrap shadow-xl">
                          Faltan gestiones por completar (ej: reserva, entradas, etc.)
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setEditingId(act.id); setEditForm({ ...act }); }} className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" style={{ color: '#64748b' }}><Pencil size={12} /></button>
                  <button onClick={() => setDeleteId(act.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" style={{ color: '#64748b' }}><Trash2 size={12} /></button>
                  {isExpanded ? <ChevronUp size={13} style={{ color: '#64748b' }} /> : <ChevronRight size={13} style={{ color: '#64748b' }} />}
                </div>
              </div>
              {isExpanded && (act.description || act.attachment_url) && (
                <div className="px-3 pb-3 border-t border-black/[0.06]">
                  {act.description && <div className="pl-9 pt-2"><MarkdownRenderer content={act.description} /></div>}
                  {act.attachment_url && (
                    <div className="pl-9 pt-2">
                      <a href={act.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-cyan-700 hover:text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-lg px-2.5 py-1.5">
                        <FileText size={11} /><span className="max-w-[180px] truncate">{act.attachment_name || 'Adjunto'}</span><ExternalLink size={9} className="shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {activities.length === 0 && (
          <button onClick={() => setIsAddOpen(true)} className="w-full py-3 border border-dashed rounded-xl text-xs font-medium transition-all" style={{ borderColor: 'rgba(14,116,144,0.30)', color: '#334155', background: 'rgba(255,255,255,0.45)' }}>
            Sin actividades — pulsa para añadir
          </button>
        )}
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Nueva actividad" size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { setIsAddOpen(false); setAttachFile(null); }} className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2"><X size={15} /><span>Cancelar</span></button>
            <button onClick={addActivity} disabled={!form.title.trim() || uploading} className="japan-btn-primary gap-2 disabled:opacity-40">{uploading ? 'Subiendo...' : 'Añadir'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-600 font-semibold mb-2 block">Categoría</label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button key={cat.id} onClick={() => setForm({ ...form, category: cat.id })} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${form.category === cat.id ? `${cat.bg} ${cat.border} ${cat.color}` : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                    <Icon size={13} /><span className="text-xs font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-xs text-slate-600 font-semibold mb-1 block">Hora</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="japan-input" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-600 font-semibold mb-1 block">Título</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Fushimi Inari" className="japan-input" onKeyDown={(e) => e.key === 'Enter' && addActivity()} />
            </div>
          </div>
          <DescriptionTextarea value={form.description} onChange={(val) => setForm({ ...form, description: val })} rows={6} placeholder="Detalles, notas, reservas..." />
          <button
            type="button"
            onClick={() => setForm({ ...form, has_pending_tasks: !form.has_pending_tasks })}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${form.has_pending_tasks ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:text-gray-400'}`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${form.has_pending_tasks ? 'bg-orange-500 border-orange-500' : 'border-gray-600'}`}>
              {form.has_pending_tasks && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium">¿Tiene tareas o reservas pendientes?</span>
              {form.has_pending_tasks && (
                <p className="text-xs text-orange-400/70 mt-0.5">Se mostrará un indicador de alerta en esta actividad</p>
              )}
            </div>
            {form.has_pending_tasks && <AlertCircle size={16} className="text-orange-400 shrink-0" />}
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="flex-1 japan-input flex items-center gap-2 cursor-pointer hover:border-cyan-500/40">
              <Paperclip size={13} className="text-gray-500 shrink-0" />
              <span className={`text-sm ${attachFile ? 'text-cyan-400' : 'text-gray-600'}`}>{attachFile ? attachFile.name : 'Adjuntar archivo...'}</span>
            </div>
            {attachFile && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setAttachFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-red-400 border border-gray-700 rounded-lg">
                <X size={13} />
              </button>
            )}
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={(e) => setAttachFile(e.target.files?.[0] || null)} />
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar actividad" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteId(null)} className="japan-btn border border-slate-300 hover:bg-slate-100">Cancelar</button>
            <button onClick={() => deleteId && deleteActivity(deleteId)} className="japan-btn-danger gap-2"><Trash2 size={15} /><span>Eliminar</span></button>
          </div>
        }
      >
        <p className="text-sm font-medium text-slate-700">¿Eliminar esta actividad?</p>
      </Modal>
    </div>
  );
}
