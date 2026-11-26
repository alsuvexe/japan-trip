import { useEffect, useState } from 'react';
import { ChevronRight, ChevronUp, PlusCircle, Pencil, Trash2, Save, X, Clock, AlertCircle, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';
import MarkdownRenderer from '../MarkdownRenderer';
import { useReadOnly } from '../../lib/ReadOnlyContext';
import ActivityModal, { type DayActivity, type ActivityFormData, getCatStyle, DescriptionTextarea } from '../ActivityModal';
import { type FileAttachment, parseAttachments, deleteAttachmentFile } from '../../lib/attachments';
import { AttachmentsEditor, AttachmentViewer, useActivityAttachments } from '../Attachments';

function ActivityEditRow({ act, onSave, onCancel }: {
  act: DayActivity;
  onSave: (updated: Partial<DayActivity>) => Promise<void>;
  onCancel: () => void;
}) {
  const [editForm, setEditForm] = useState<Partial<DayActivity>>({ ...act });
  const attach = useActivityAttachments(parseAttachments(act));
  const cat = getCatStyle(act.category);
  const uploading = attach.uploading;

  const saveEdit = async () => {
    if (!editForm.title?.trim()) return;
    const attachments = await attach.uploadAll();
    await onSave({ ...editForm, attachments });
  };

  return (
    <div className={`p-3 rounded-xl border ${cat.border} ${cat.bg} space-y-2`}>
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
      <AttachmentsEditor state={attach} />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="japan-btn border border-slate-300 hover:bg-slate-100 text-xs px-3 py-1.5 min-h-0 gap-1.5"><X size={12} /> Cancelar</button>
        <button onClick={saveEdit} disabled={uploading} className="japan-btn-primary text-xs px-3 py-1.5 min-h-0 gap-1.5 disabled:opacity-50"><Save size={12} /> {uploading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div>
  );
}

export default function DayActivities({ dayId }: { dayId: string }) {
  const isReadOnly = useReadOnly();
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from('day_activities').select('*').eq('day_id', dayId)
      .order('time', { nullsFirst: false }).order('sort_order')
      .then(({ data }) => {
        if (data) setActivities([...data].sort((a, b) => (a.time || '').localeCompare(b.time || '')));
      });
  }, [dayId]);

  const handleAddActivity = async (formData: ActivityFormData, attachments: FileAttachment[]) => {
    setUploading(true);
    const { data } = await supabase.from('day_activities').insert({ ...formData, day_id: dayId, sort_order: activities.length, attachments }).select().maybeSingle();
    setUploading(false);
    if (data) {
      setActivities((prev) => [...prev, data].sort((a, b) => (a.time || '').localeCompare(b.time || '')));
      setIsAddOpen(false);
    }
  };

  const saveEdit = async (id: string, updated: Partial<DayActivity>) => {
    setUploading(true);
    const { data } = await supabase.from('day_activities').update(updated).eq('id', id).select().maybeSingle();
    setUploading(false);
    if (data) {
      setActivities((prev) => prev.map((a) => a.id === id ? data : a).sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    }
    setEditingId(null);
  };

  // Removes a single attachment from the row (DB + storage) without touching the others
  const removeAttachment = async (act: DayActivity, index: number) => {
    const att = parseAttachments(act)[index];
    if (!att) return;
    const next = parseAttachments(act).filter((_, i) => i !== index);
    setActivities((prev) => prev.map((a) => a.id === act.id ? { ...a, attachments: next } : a));
    await supabase.from('day_activities').update({ attachments: next }).eq('id', act.id);
    await deleteAttachmentFile(att.url);
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
      <div className="space-y-1.5">
        {activities.map((act) => {
          const cat = getCatStyle(act.category);
          const CatIcon = cat.icon;
          const isExpanded = expandedId === act.id;
          const isEditing = editingId === act.id;
          const attachments = parseAttachments(act);

          if (isEditing) return (
            <ActivityEditRow
              key={act.id}
              act={act}
              onSave={(updated) => saveEdit(act.id, updated)}
              onCancel={() => setEditingId(null)}
            />
          );

          return (
            <div key={act.id} className={`w-full rounded-2xl border border-slate-100/80 bg-white shadow-sm transition-all`}>
              <div className="p-3.5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : act.id)}>
                {/* Row 1: icon + time + badge + actions */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${cat.bg} ${cat.border} border shrink-0`}>
                      <CatIcon className={cat.color} size={11} />
                    </div>
                    {act.time && <span className="text-[11px] font-semibold font-mono shrink-0 flex items-center gap-0.5" style={{ color: '#334155' }}><Clock size={9} />{act.time}</span>}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cat.bg} ${cat.color} border ${cat.border} shrink-0`}>{cat.label}</span>
                    {act.has_pending_tasks && <AlertCircle size={12} className="text-orange-500 animate-pulse shrink-0" />}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!isReadOnly && (
                      <>
                        <button onClick={() => setEditingId(act.id)} className="w-8 h-8 flex items-center justify-center hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" style={{ color: '#64748b' }}><Pencil size={12} /></button>
                        <button onClick={() => setDeleteId(act.id)} className="w-8 h-8 flex items-center justify-center hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" style={{ color: '#64748b' }}><Trash2 size={12} /></button>
                      </>
                    )}
                    {isExpanded ? <ChevronUp size={13} style={{ color: '#64748b' }} /> : <ChevronRight size={13} style={{ color: '#64748b' }} />}
                  </div>
                </div>
                {/* Row 2: Title — full width */}
                <p className="w-full text-[15px] font-semibold leading-snug" style={{ color: '#0f172a' }}>{act.title}</p>
              </div>
              {isExpanded && (act.description || attachments.length > 0 || (act.category === 'restaurant' && (act.restaurant_notes || act.restaurant_service || act.restaurant_food_type || act.restaurant_avg_price))) && (
                <div className="px-3.5 pb-3.5 border-t border-black/[0.06]">
                  {act.category === 'restaurant' ? (
                    <div className="pt-2 space-y-2">
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
                    act.description && <div className="pt-2"><MarkdownRenderer content={act.description} /></div>
                  )}
                  {attachments.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      <AttachmentViewer attachments={attachments} onRemove={isReadOnly ? undefined : (i) => removeAttachment(act, i)} />
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

      <ActivityModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAddActivity}
        saving={uploading}
      />

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
