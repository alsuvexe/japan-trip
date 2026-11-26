import { useCallback, useRef, useState } from 'react';
import {
  TrainFront,
  Footprints,
  Utensils,
  Camera,
  Landmark,
  Sparkles,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react';
import Modal from './Modal';
import MarkdownRenderer from './MarkdownRenderer';
import { useImagePaste } from '../hooks/useImagePaste';
import { type FileAttachment } from '../lib/attachments';
import { AttachmentsEditor, useActivityAttachments } from './Attachments';

export interface DayActivity {
  id: string;
  day_id: string;
  category: string;
  time: string;
  title: string;
  description: string;
  sort_order: number;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments?: FileAttachment[] | null;
  has_pending_tasks?: boolean;
  restaurant_service?: string;
  restaurant_name?: string;
  restaurant_food_type?: string;
  restaurant_avg_price?: string;
  restaurant_notes?: string;
}

export interface ActivityFormData {
  category: string;
  time: string;
  title: string;
  description: string;
  has_pending_tasks: boolean;
  restaurant_service: string;
  restaurant_name: string;
  restaurant_food_type: string;
  restaurant_avg_price: string;
  restaurant_notes: string;
}

export const EMPTY_FORM: ActivityFormData = {
  category: 'activity',
  time: '',
  title: '',
  description: '',
  has_pending_tasks: false,
  restaurant_service: '',
  restaurant_name: '',
  restaurant_food_type: '',
  restaurant_avg_price: '',
  restaurant_notes: '',
};

export const ACTIVITY_CATEGORIES = [
  { id: 'flight', label: 'Transporte', icon: TrainFront, color: 'text-white', bg: 'bg-sky-600', border: 'border-sky-700' },
  { id: 'transport', label: 'Desplazamiento', icon: Footprints, color: 'text-white', bg: 'bg-blue-600', border: 'border-blue-700' },
  { id: 'restaurant', label: 'Comida', icon: Utensils, color: 'text-white', bg: 'bg-orange-500', border: 'border-orange-600' },
  { id: 'activity', label: 'Actividad', icon: Sparkles, color: 'text-white', bg: 'bg-emerald-600', border: 'border-emerald-700' },
  { id: 'visit', label: 'Visita', icon: Camera, color: 'text-white', bg: 'bg-pink-600', border: 'border-pink-700' },
  { id: 'landmark', label: 'Monumento', icon: Landmark, color: 'text-white', bg: 'bg-amber-500', border: 'border-amber-600' },
];

export function getCatStyle(catId: string) {
  return ACTIVITY_CATEGORIES.find((c) => c.id === catId) || ACTIVITY_CATEGORIES[3];
}

export function DescriptionTextarea({ value, onChange, rows = 6, placeholder = 'Descripción...' }: {
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
          <span className="text-[10px] font-medium uppercase tracking-wider flex items-center gap-1" style={{ color: '#64748b' }}>
            <ImageIcon size={10} /> Pega imagenes con Ctrl+V
          </span>
          {status === 'uploading' && <span className="text-[10px] text-cyan-500 animate-pulse">Subiendo...</span>}
          {status === 'done' && <span className="text-[10px] text-green-500">Insertada</span>}
          {status === 'error' && <span className="text-[10px] text-red-500">Error</span>}
        </div>
        <button type="button" onClick={() => setPreview(!preview)} className="flex items-center gap-1 text-[10px] hover:text-cyan-600 transition-colors py-0.5 px-1.5 rounded hover:bg-cyan-500/10" style={{ color: '#64748b' }}>
          {preview ? <EyeOff size={10} /> : <Eye size={10} />}
          {preview ? 'Editor' : 'Vista previa'}
        </button>
      </div>
      {preview ? (
        <div className="japan-input text-xs cursor-text overflow-auto" style={{ minHeight: `${rows * 24}px` }} onClick={() => setPreview(false)}>
          {value ? <MarkdownRenderer content={value} /> : <span className="italic" style={{ color: '#94a3b8' }}>Sin contenido — pulsa para editar</span>}
        </div>
      ) : (
        <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} onPaste={handlePaste} rows={rows} className={`japan-input text-xs resize-y ${status === 'uploading' ? 'paste-uploading' : ''}`} style={{ minHeight: `${rows * 24}px` }} placeholder={placeholder} />
      )}
    </div>
  );
}

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: ActivityFormData, attachments: FileAttachment[]) => void;
  title?: string;
  saveLabel?: string;
  initialData?: Partial<ActivityFormData>;
  saving?: boolean;
}

export default function ActivityModal({
  isOpen,
  onClose,
  onSave,
  title = 'Nueva actividad',
  saveLabel = 'Añadir',
  initialData,
  saving = false,
}: ActivityModalProps) {
  const [form, setForm] = useState<ActivityFormData>({ ...EMPTY_FORM, ...initialData });
  const attach = useActivityAttachments([]);

  const prevInitRef = useRef(initialData);
  if (initialData !== prevInitRef.current) {
    prevInitRef.current = initialData;
    setForm({ ...EMPTY_FORM, ...initialData });
    attach.reset([]);
  }

  const isValid = form.category === 'restaurant' ? form.restaurant_name.trim().length > 0 : form.title.trim().length > 0;

  const handleClose = () => {
    onClose();
    attach.reset([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={handleClose} className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2" style={{ color: '#475569' }}>
            <X size={15} /><span>Cancelar</span>
          </button>
          <button
            onClick={async () => { const files = await attach.uploadAll(); onSave(form, files); }}
            disabled={!isValid || saving}
            className="japan-btn-primary gap-2 disabled:opacity-40"
          >
            {saving ? 'Guardando...' : saveLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Category selector - full width */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#475569' }}>Categoria</label>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setForm({ ...form, category: cat.id })}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                    form.category === cat.id
                      ? `${cat.bg} ${cat.border} ${cat.color}`
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  style={form.category === cat.id ? undefined : { color: '#475569' }}
                >
                  <Icon size={13} /><span className="text-xs font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Restaurant-specific form */}
        {form.category === 'restaurant' ? (
          <div className="space-y-4 p-5 rounded-xl border border-orange-200 bg-orange-50/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              Datos del restaurante
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Nombre del Restaurante</label>
                <input
                  value={form.restaurant_name}
                  onChange={(e) => setForm({ ...form, restaurant_name: e.target.value, title: e.target.value })}
                  placeholder="Ej: Ichiran, Acchichi Honpo"
                  className="japan-input"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Servicio</label>
                <select value={form.restaurant_service} onChange={(e) => setForm({ ...form, restaurant_service: e.target.value })} className="japan-input">
                  <option value="">-- Selecciona --</option>
                  <option value="Desayuno">Desayuno</option>
                  <option value="Almuerzo">Almuerzo</option>
                  <option value="Cena">Cena</option>
                  <option value="Snack/Street Food">Snack/Street Food</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Hora</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="japan-input" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Tipo de Comida</label>
                <input value={form.restaurant_food_type} onChange={(e) => setForm({ ...form, restaurant_food_type: e.target.value })} placeholder="Ej: Ramen Tonkotsu, Yakiniku" className="japan-input" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Precio Medio</label>
                <input value={form.restaurant_avg_price} onChange={(e) => setForm({ ...form, restaurant_avg_price: e.target.value })} placeholder="Ej: 2.000 - 3.500 yen" className="japan-input" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Direccion / Ubicacion</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Dotonbori, Osaka" className="japan-input" />
              </div>
            </div>

            <div className="col-span-full">
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Descripcion / Notas</label>
              <DescriptionTextarea
                value={form.restaurant_notes}
                onChange={(val) => setForm({ ...form, restaurant_notes: val })}
                rows={6}
                placeholder="Platos recomendados, detalles de reserva, notas..."
              />
            </div>
          </div>
        ) : (
          /* General activity form - 2-column grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Hora</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="japan-input" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Titulo</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: Fushimi Inari"
                className="japan-input"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') attach.uploadAll().then((files) => onSave(form, files)); }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Descripcion / Notas</label>
              <DescriptionTextarea
                value={form.description}
                onChange={(val) => setForm({ ...form, description: val })}
                rows={6}
                placeholder="Detalles, notas, reservas..."
              />
            </div>
          </div>
        )}

        {/* Pending tasks toggle */}
        <button
          type="button"
          onClick={() => setForm({ ...form, has_pending_tasks: !form.has_pending_tasks })}
          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
            form.has_pending_tasks
              ? 'bg-orange-50 border-orange-300'
              : 'border-slate-300 hover:border-slate-400'
          }`}
          style={form.has_pending_tasks ? { color: '#92400e' } : { color: '#475569' }}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
            form.has_pending_tasks ? 'bg-orange-500 border-orange-500' : 'border-slate-400'
          }`}>
            {form.has_pending_tasks && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium">Tiene tareas o reservas pendientes?</span>
            {form.has_pending_tasks && (
              <p className="text-xs text-orange-600 mt-0.5">Se mostrara un indicador de alerta en esta actividad</p>
            )}
          </div>
          {form.has_pending_tasks && <AlertCircle size={16} className="text-orange-500 shrink-0" />}
        </button>

        {/* Attachments (multiple) */}
        <AttachmentsEditor state={attach} />
      </div>
    </Modal>
  );
}
