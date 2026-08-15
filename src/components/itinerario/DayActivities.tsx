import { useCallback, useEffect, useRef, useState } from 'react';
import { Plane, TrainFront, Footprints, Utensils, Camera, Landmark, Sparkles, ChevronRight, ChevronUp, PlusCircle, Pencil, Trash2, Save, X, Clock, AlertCircle, Paperclip, FileText, ExternalLink, Eye, EyeOff, Image as ImageIcon, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';
import MarkdownRenderer from '../MarkdownRenderer';
import { useImagePaste } from '../../hooks/useImagePaste';
import { useReadOnly } from '../../lib/ReadOnlyContext';

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
  restaurant_service?: string;
  restaurant_name?: string;
  restaurant_food_type?: string;
  restaurant_avg_price?: string;
  restaurant_notes?: string;
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
  const isReadOnly = useReadOnly();
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DayActivity>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: 'activity', time: '', title: '', description: '', has_pending_tasks: false, restaurant_service: '', restaurant_name: '', restaurant_food_type: '', restaurant_avg_price: '', restaurant_notes: '' });
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
      setForm({ category: 'activity', time: '', title: '', description: '', has_pending_tasks: false, restaurant_service: '', restaurant_name: '', restaurant_food_type: '', restaurant_avg_price: '', restaurant_notes: '' });
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
        {!isReadOnly && (
          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors py-1 px-2 rounded-lg hover:bg-cyan-500/10">
            <PlusCircle size={12} /><span>Añadir</span>
          </button>
        )}
      </div>
      <div className="space-y-2.5 px-3 py-4 w-full">
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
              {editForm.category === 'restaurant' && (
                <div className="space-y-2 p-3 rounded-xl border border-orange-300/40 bg-orange-50/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300">Datos del restaurante</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={editForm.restaurant_service || ''} onChange={(e) => setEditForm({ ...editForm, restaurant_service: e.target.value })} className="japan-input text-xs py-2">
                      <option value="">— Servicio —</option>
                      <option value="Desayuno">Desayuno</option>
                      <option value="Almuerzo">Almuerzo</option>
                      <option value="Cena">Cena</option>
                      <option value="Cena opcional">Cena opcional</option>
                      <option value="Snack/Street Food">Snack/Street Food</option>
                    </select>
                    <input value={editForm.restaurant_name || ''} onChange={(e) => setEditForm({ ...editForm, restaurant_name: e.target.value })} placeholder="Restaurante" className="japan-input text-xs py-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.restaurant_food_type || ''} onChange={(e) => setEditForm({ ...editForm, restaurant_food_type: e.target.value })} placeholder="Tipo comida" className="japan-input text-xs py-2" />
                    <input value={editForm.restaurant_avg_price || ''} onChange={(e) => setEditForm({ ...editForm, restaurant_avg_price: e.target.value })} placeholder="Precio medio" className="japan-input text-xs py-2" />
                  </div>
                  <DescriptionTextarea value={editForm.restaurant_notes || ''} onChange={(val) => setEditForm({ ...editForm, restaurant_notes: val })} rows={6} placeholder="Platos recomendados, detalles de reserva, notas..." />
                </div>
              )}
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
            <div key={act.id} className={`flex flex-col w-full p-3.5 rounded-2xl border transition-all bg-white shadow-sm ${isExpanded ? 'border-slate-200' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'}`}>
              <div className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : act.id)}>
                {/* Row 1: Header — icon, time, category pill | actions */}
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-lg ${cat.bg} ${cat.border} border shrink-0`}>
                      <CatIcon className={cat.color} size={12} />
                    </div>
                    {act.time && <span className="text-xs font-semibold font-mono shrink-0 flex items-center gap-0.5" style={{ color: '#334155' }}><Clock size={10} />{act.time}</span>}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${cat.bg} ${cat.color}`}>{cat.label}</span>
                    {act.has_pending_tasks && <AlertCircle size={13} className="text-orange-500 animate-pulse shrink-0" />}
                  </div>
                  <div className="flex items-center gap-0 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!isReadOnly && (
                      <>
                        <button onClick={() => { setEditingId(act.id); setEditForm({ ...act }); }} className="w-7 h-7 flex items-center justify-center hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" style={{ color: '#94a3b8' }}><Pencil size={12} /></button>
                        <button onClick={() => setDeleteId(act.id)} className="w-7 h-7 flex items-center justify-center hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" style={{ color: '#94a3b8' }}><Trash2 size={12} /></button>
                      </>
                    )}
                    {isExpanded ? <ChevronUp size={14} style={{ color: '#64748b' }} /> : <ChevronRight size={14} style={{ color: '#64748b' }} />}
                  </div>
                </div>
                {/* Row 2: Title — full width */}
                <p className="w-full text-base font-bold mb-1" style={{ color: '#0f172a' }}>
                  {act.title}
                </p>
                {/* Row 3: Description preview — full width, up to 3 lines */}
                {!isExpanded && act.description && (
                  <p className="w-full text-xs line-clamp-3" style={{ color: '#475569' }}>
                    {act.description.replace(/[#*_\[\]()>`~!|-]/g, '').slice(0, 200)}
                  </p>
                )}
              </div>
              {isExpanded && (act.description || act.attachment_url || (act.category === 'restaurant' && (act.restaurant_notes || act.restaurant_service || act.restaurant_food_type || act.restaurant_avg_price))) && (
                <div className="pt-3 mt-3 border-t border-black/[0.06]">
                  {act.category === 'restaurant' ? (
                    <div className="space-y-2">
                      {act.restaurant_notes && <div><MarkdownRenderer content={act.restaurant_notes} /></div>}
                      {act.description && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((act.restaurant_name ? act.restaurant_name + ' ' : '') + act.description)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs hover:underline cursor-pointer transition-colors"
                          style={{ color: '#64748b' }}
                        >
                          <MapPin size={11} className="shrink-0 text-rose-400" />
                          <span>{act.description}</span>
                        </a>
                      )}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {act.restaurant_service && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200">{act.restaurant_service}</span>
                        )}
                        {act.restaurant_food_type && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">{act.restaurant_food_type}</span>
                        )}
                        {act.restaurant_avg_price && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">{act.restaurant_avg_price.includes('¥') ? act.restaurant_avg_price : `${act.restaurant_avg_price} ¥`}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    act.description && <div><MarkdownRenderer content={act.description} /></div>
                  )}
                  {act.attachment_url && (
                    <div className="pt-2">
                      {/\.(jpg|jpeg|png|gif|webp)$/i.test(act.attachment_url) ? (
                        <img src={act.attachment_url} alt={act.attachment_name || 'Adjunto'} className="rounded-xl max-h-48 object-cover border border-slate-200 shadow-sm" />
                      ) : (
                        <a href={act.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-cyan-700 hover:text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-lg px-2.5 py-1.5">
                          <FileText size={11} /><span className="max-w-[180px] truncate">{act.attachment_name || 'Adjunto'}</span><ExternalLink size={9} className="shrink-0" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {activities.length === 0 && !isReadOnly && (
          <button onClick={() => setIsAddOpen(true)} className="w-full py-3 border border-dashed rounded-xl text-xs font-medium transition-all" style={{ borderColor: 'rgba(14,116,144,0.30)', color: '#334155', background: 'rgba(255,255,255,0.45)' }}>
            Sin actividades — pulsa para añadir
          </button>
        )}
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Nueva actividad" size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { setIsAddOpen(false); setAttachFile(null); }} className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2"><X size={15} /><span>Cancelar</span></button>
            <button onClick={addActivity} disabled={(form.category === 'restaurant' ? !form.restaurant_name.trim() : !form.title.trim()) || uploading} className="japan-btn-primary gap-2 disabled:opacity-40">{uploading ? 'Subiendo...' : 'Añadir'}</button>
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
          {form.category === 'restaurant' ? (
            <div className="space-y-3 p-4 rounded-xl border border-orange-200 bg-orange-50/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Datos del restaurante
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs text-slate-600 font-semibold mb-1 block">Hora</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="japan-input" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-600 font-semibold mb-1 block">Servicio</label>
                  <select value={form.restaurant_service} onChange={(e) => setForm({ ...form, restaurant_service: e.target.value })} className="japan-input">
                    <option value="">— Selecciona —</option>
                    <option value="Desayuno">Desayuno</option>
                    <option value="Almuerzo">Almuerzo</option>
                    <option value="Cena">Cena</option>
                    <option value="Cena opcional">Cena opcional</option>
                    <option value="Snack/Street Food">Snack/Street Food</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold mb-1 block">Nombre del Restaurante</label>
                <input value={form.restaurant_name} onChange={(e) => setForm({ ...form, restaurant_name: e.target.value, title: e.target.value })} placeholder="Ej: Ichiran, Acchichi Honpo" className="japan-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-semibold mb-1 block">Tipo de Comida</label>
                  <input value={form.restaurant_food_type} onChange={(e) => setForm({ ...form, restaurant_food_type: e.target.value })} placeholder="Ej: Ramen Tonkotsu, Yakiniku" className="japan-input" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-semibold mb-1 block">Precio Medio</label>
                  <input value={form.restaurant_avg_price} onChange={(e) => setForm({ ...form, restaurant_avg_price: e.target.value })} placeholder="Ej: 2.000 - 3.500 ¥" className="japan-input" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold mb-1 block">Dirección / Ubicación</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Dotonbori, Osaka" className="japan-input" />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold mb-1 block">Descripción / Notas</label>
                <DescriptionTextarea value={form.restaurant_notes} onChange={(val) => setForm({ ...form, restaurant_notes: val })} rows={6} placeholder="Platos recomendados, detalles de reserva, notas..." />
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
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
