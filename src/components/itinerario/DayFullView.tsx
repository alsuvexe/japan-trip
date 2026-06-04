import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, PlusCircle, Pencil, Trash2, Save, X,
  Clock, AlertCircle, Paperclip, FileText, ExternalLink,
  Eye, EyeOff, Image as ImageIcon, Link, MapPin, Calendar,
  FileDown, Navigation,
} from 'lucide-react';
import { TrainFront, Footprints, Utensils, Camera, Landmark, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';
import MarkdownRenderer from '../MarkdownRenderer';
import { useImagePaste } from '../../hooks/useImagePaste';
import { exportDayToPdf } from '../../lib/exportDayPdf';
import type { CityConfig } from './JapanMap';

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

interface ItineraryDay {
  id: string;
  day_number: number;
  date: string;
  city: string;
  title: string;
  description: string;
  map_url?: string;
}

const ACTIVITY_CATEGORIES = [
  { id: 'flight',    label: 'Transporte',    icon: TrainFront, color: 'text-white', bg: 'bg-sky-600',     border: 'border-sky-700' },
  { id: 'transport', label: 'Desplazamiento', icon: Footprints, color: 'text-white', bg: 'bg-blue-600',    border: 'border-blue-700' },
  { id: 'restaurant',label: 'Comida',        icon: Utensils,  color: 'text-white', bg: 'bg-orange-500',  border: 'border-orange-600' },
  { id: 'activity',  label: 'Actividad',     icon: Sparkles,  color: 'text-white', bg: 'bg-emerald-600', border: 'border-emerald-700' },
  { id: 'visit',     label: 'Visita',        icon: Camera,    color: 'text-white', bg: 'bg-pink-600',    border: 'border-pink-700' },
  { id: 'landmark',  label: 'Monumento',     icon: Landmark,  color: 'text-white', bg: 'bg-amber-500',   border: 'border-amber-600' },
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
          <span className="text-[10px] font-medium uppercase tracking-wider flex items-center gap-1" style={{ color: '#475569' }}>
            <ImageIcon size={10} /> Pega imágenes con Ctrl+V
          </span>
          {status === 'uploading' && <span className="text-[10px] text-cyan-600 animate-pulse">Subiendo...</span>}
          {status === 'done' && <span className="text-[10px] text-emerald-600">Insertada</span>}
          {status === 'error' && <span className="text-[10px] text-red-500">Error</span>}
        </div>
        <button type="button" onClick={() => setPreview(!preview)} className="flex items-center gap-1 text-[10px] hover:text-cyan-700 transition-colors py-0.5 px-1.5 rounded hover:bg-cyan-50" style={{ color: '#475569' }}>
          {preview ? <EyeOff size={10} /> : <Eye size={10} />}
          {preview ? 'Editor' : 'Vista previa'}
        </button>
      </div>
      {preview ? (
        <div className="japan-input text-sm cursor-text overflow-auto" style={{ minHeight: `${rows * 24}px` }} onClick={() => setPreview(false)}>
          {value ? <MarkdownRenderer content={value} /> : <span className="italic" style={{ color: '#94a3b8' }}>Sin contenido — pulsa para editar</span>}
        </div>
      ) : (
        <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} onPaste={handlePaste} rows={rows} className={`japan-input text-sm resize-y ${status === 'uploading' ? 'paste-uploading' : ''}`} style={{ minHeight: `${rows * 24}px` }} placeholder={placeholder} />
      )}
    </div>
  );
}

function DayMapSection({ dayId, initialUrl, city }: { dayId: string; initialUrl: string; city: string }) {
  const [url, setUrl] = useState(initialUrl || '');
  const [input, setInput] = useState(initialUrl || '');
  const [editMode, setEditMode] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hasUrl = !!url.trim();

  const saveUrl = async () => {
    const trimmed = input.trim();
    await supabase.from('itinerary_days').update({ map_url: trimmed }).eq('id', dayId);
    setUrl(trimmed);
    setEditMode(false);
  };

  const clearUrl = async () => {
    await supabase.from('itinerary_days').update({ map_url: '' }).eq('id', dayId);
    setUrl(''); setInput(''); setEditMode(false);
  };

  return (
    <div className="space-y-2">
      {/* Premium glassmorphism card */}
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: hovered ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.40)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: hovered
            ? '0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.18), 0 4px 40px rgba(14,116,144,0.12)'
            : '0 4px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(255,255,255,0.12)',
          transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Subtle inner glow strip at top */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.60), transparent)' }}
        />

        {hasUrl ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-5 px-6 py-5 active:scale-[0.99] transition-transform duration-150"
          >
            {/* Icon with gradient circle */}
            <div
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                boxShadow: hovered
                  ? '0 4px 20px rgba(6,182,212,0.45)'
                  : '0 2px 12px rgba(6,182,212,0.28)',
                transition: 'box-shadow 0.3s ease',
              }}
            >
              <Navigation
                size={22}
                style={{
                  color: '#ffffff',
                  transform: hovered ? 'rotate(12deg)' : 'rotate(0deg)',
                  transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))',
                }}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold leading-tight tracking-tight" style={{ color: '#0f172a' }}>
                Mapa de ubicaciones
              </p>
              <p className="mt-1 text-xs font-medium" style={{ color: '#0369a1' }}>
                Ver puntos clave del día en Google Maps
              </p>
            </div>

            {/* Arrow */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
              style={{
                background: hovered ? 'rgba(2,132,199,0.12)' : 'rgba(148,163,184,0.10)',
                border: '1px solid ' + (hovered ? 'rgba(2,132,199,0.22)' : 'rgba(148,163,184,0.18)'),
                transform: hovered ? 'translateX(2px)' : 'translateX(0)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hovered ? '#0284c7' : '#64748b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s' }}>
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </a>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="flex w-full items-center gap-5 px-6 py-5 transition-opacity duration-200 hover:opacity-90"
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(148,163,184,0.14)',
                border: '1.5px dashed rgba(148,163,184,0.40)',
              }}
            >
              <MapPin size={22} style={{ color: '#94a3b8' }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-bold leading-tight tracking-tight" style={{ color: '#64748b' }}>
                Mapa de ubicaciones
              </p>
              <p className="mt-1 text-xs font-medium" style={{ color: '#94a3b8' }}>
                Sin ruta configurada — pulsa para añadir
              </p>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(148,163,184,0.10)', border: '1px solid rgba(148,163,184,0.18)' }}
            >
              <Link size={13} style={{ color: '#94a3b8' }} />
            </div>
          </button>
        )}
      </div>

      {/* URL edit row */}
      {editMode ? (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link className="absolute left-3.5 top-1/2 -translate-y-1/2" size={13} style={{ color: '#94a3b8' }} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveUrl(); if (e.key === 'Escape') setEditMode(false); }}
              placeholder="https://maps.google.com/..."
              className="japan-input pl-10 text-sm"
              autoFocus
            />
          </div>
          <button onClick={saveUrl} disabled={!input.trim()} className="japan-btn-primary px-4 py-2 text-sm disabled:opacity-40"><Save size={14} /></button>
          <button onClick={() => setEditMode(false)} className="japan-btn border border-slate-300 hover:bg-slate-100 px-3 py-2" style={{ color: '#475569' }}><X size={14} /></button>
        </div>
      ) : hasUrl && (
        <div className="flex items-center justify-end gap-2 px-1">
          <button
            onClick={() => { setEditMode(true); setInput(url); }}
            className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:bg-sky-50 hover:text-sky-700"
            style={{ color: '#475569', background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(203,213,225,0.70)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            <Link size={11} /> Cambiar URL
          </button>
          <button
            onClick={clearUrl}
            className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            style={{ color: '#475569', background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(203,213,225,0.70)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            <Trash2 size={11} /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ act, cityStyle, onEdit, onDelete }: {
  act: DayActivity;
  cityStyle: CityConfig;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = getCatStyle(act.category);
  const CatIcon = cat.icon;
  const hasDetail = !!(act.description || act.attachment_url);

  return (
    <motion.div
      layout
      className="rounded-2xl border border-slate-200 transition-all overflow-hidden"
      style={{
        background: expanded ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: expanded ? '0 8px 28px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.07)',
      }}
    >
      <div
        className={`flex items-start gap-4 px-5 py-4 ${hasDetail ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetail && setExpanded(!expanded)}
      >
        <div className={`p-2.5 rounded-xl ${cat.bg} border ${cat.border} shrink-0 mt-0.5`}>
          <CatIcon className={cat.color} size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            {act.time && (
              <span className="flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-lg shrink-0" style={{ color: '#475569', background: 'rgba(0,0,0,0.05)' }}>
                <Clock size={11} />{act.time}
              </span>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${cat.bg} ${cat.color} border ${cat.border} shrink-0`}>
              {getCatStyle(act.category).label}
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <p className="text-lg font-bold leading-snug" style={{ color: '#0f172a' }}>{act.title}</p>
            {act.has_pending_tasks && (
              <div className="group relative shrink-0">
                <AlertCircle size={18} className="text-orange-500 animate-pulse cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-white border border-orange-300 text-orange-700 text-xs font-medium px-3 py-2 rounded-xl whitespace-nowrap shadow-xl">
                    Faltan gestiones por completar (ej: reserva, entradas, etc.)
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
                </div>
              </div>
            )}
          </div>
          {!expanded && act.description && (
            <p className="text-sm mt-1 line-clamp-2 leading-relaxed" style={{ color: '#334155' }}>{act.description.replace(/!\[.*?\]\(.*?\)/g, '').replace(/[#*`[\]]/g, '').trim()}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="w-9 h-9 flex items-center justify-center hover:text-cyan-700 hover:bg-cyan-50 border border-transparent hover:border-cyan-200 rounded-xl transition-all"
            style={{ color: '#64748b' }}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="w-9 h-9 flex items-center justify-center hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition-all"
            style={{ color: '#64748b' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-4">
              {act.description && (
                <div className="prose-sm max-w-none">
                  <MarkdownRenderer content={act.description} />
                </div>
              )}
              {act.attachment_url && (
                <a
                  href={act.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-2.5"
                >
                  <FileText size={14} />
                  <span className="max-w-xs truncate">{act.attachment_name || 'Adjunto'}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EditActivityForm({ act, onSave, onCancel }: {
  act: DayActivity;
  onSave: (updated: Partial<DayActivity>, file?: File | null) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<DayActivity>>({ ...act });
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cat = getCatStyle(form.category || 'activity');

  const handleSave = async () => {
    setUploading(true);
    await onSave(form, attachFile);
    setUploading(false);
  };

  return (
    <div
      className={`p-5 rounded-2xl border ${cat.border} space-y-4`}
      style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="grid grid-cols-4 gap-3">
        <input type="time" value={form.time || ''} onChange={(e) => setForm({ ...form, time: e.target.value })} className="japan-input col-span-1" />
        <input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="japan-input col-span-3" placeholder="Título" onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
      </div>
      <div>
        <label className="text-xs font-semibold mb-2 block" style={{ color: '#475569' }}>Categoría</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ACTIVITY_CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.id} onClick={() => setForm({ ...form, category: c.id })} className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all text-xs ${form.category === c.id ? `${c.bg} ${c.border} ${c.color}` : 'border-slate-300 text-slate-500 hover:border-slate-400'}`}>
                <Icon size={12} /><span className="hidden sm:inline">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <DescriptionTextarea value={form.description || ''} onChange={(val) => setForm({ ...form, description: val })} rows={8} />
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="flex-1 japan-input flex items-center gap-2 cursor-pointer hover:border-cyan-400 py-3">
          <Paperclip size={14} style={{ color: '#94a3b8' }} className="shrink-0" />
          <span className={`text-sm ${attachFile ? 'text-cyan-700' : ''}`} style={attachFile ? undefined : { color: '#94a3b8' }}>{attachFile ? attachFile.name : (form.attachment_name || 'Adjuntar archivo...')}</span>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={(e) => setAttachFile(e.target.files?.[0] || null)} />
      </div>
      <button
        type="button"
        onClick={() => setForm({ ...form, has_pending_tasks: !form.has_pending_tasks })}
        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${form.has_pending_tasks ? 'bg-orange-50 border-orange-300 text-orange-700' : 'border-slate-300 hover:border-slate-400'}`}
        style={form.has_pending_tasks ? undefined : { color: '#475569' }}
      >
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${form.has_pending_tasks ? 'bg-orange-500 border-orange-500' : 'border-slate-400'}`}>
          {form.has_pending_tasks && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium">¿Tiene tareas o reservas pendientes?</span>
          {form.has_pending_tasks && (
            <p className="text-xs text-orange-600 mt-0.5">Se mostrará un indicador de alerta en esta actividad</p>
          )}
        </div>
        {form.has_pending_tasks && <AlertCircle size={16} className="text-orange-500 shrink-0" />}
      </button>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2" style={{ color: '#475569' }}><X size={14} /> Cancelar</button>
        <button onClick={handleSave} disabled={uploading || !form.title?.trim()} className="japan-btn-primary gap-2 disabled:opacity-50"><Save size={14} /> {uploading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div>
  );
}

interface DayFullViewProps {
  day: ItineraryDay;
  cityStyle: CityConfig;
  onBack: () => void;
}

export default function DayFullView({ day, cityStyle, onBack }: DayFullViewProps) {
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ category: 'activity', time: '', title: '', description: '', has_pending_tasks: false });
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    supabase.from('day_activities').select('*').eq('day_id', day.id)
      .order('time', { nullsFirst: false }).order('sort_order')
      .then(({ data }) => {
        if (data) setActivities([...data].sort((a, b) => (a.time || '').localeCompare(b.time || '')));
      });
  }, [day.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onBack]);

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
    const { data } = await supabase.from('day_activities').insert({ ...form, day_id: day.id, sort_order: activities.length, attachment_url, attachment_name }).select().maybeSingle();
    setUploading(false);
    if (data) {
      setActivities((prev) => [...prev, data].sort((a, b) => (a.time || '').localeCompare(b.time || '')));
      setForm({ category: 'activity', time: '', title: '', description: '', has_pending_tasks: false });
      setAttachFile(null);
      setIsAddOpen(false);
    }
  };

  const saveEdit = async (id: string, updated: Partial<DayActivity>, file?: File | null) => {
    let updatedForm = { ...updated };
    if (file) {
      const res = await uploadFile(file);
      if (res) updatedForm = { ...updatedForm, attachment_url: res.url, attachment_name: res.name };
    }
    await supabase.from('day_activities').update(updatedForm).eq('id', id);
    setActivities((prev) => prev.map((a) => a.id === id ? { ...a, ...updatedForm } : a).sort((a, b) => (a.time || '').localeCompare(b.time || '')));
    setEditingId(null);
  };

  const deleteActivity = async (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    await supabase.from('day_activities').delete().eq('id', id);
    setDeleteId(null);
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      exportDayToPdf(day, activities, cityStyle);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
      style={{
        backgroundImage: "url('/image.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Light tinted overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,255,255,0.12)' }} />

      {/* Header */}
      <div
        className={`shrink-0 border-b ${cityStyle.borderColor} relative z-10`}
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 16px rgba(0,0,0,0.09)',
        }}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={`flex items-center gap-2.5 text-sm font-semibold px-4 py-2.5 rounded-xl border ${cityStyle.borderColor} ${cityStyle.bgColor} ${cityStyle.textColor} hover:opacity-80 transition-all shrink-0`}
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Volver a {cityStyle.name}</span>
              <span className="sm:hidden">Volver</span>
            </button>

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-11 h-11 ${cityStyle.bgColor} border ${cityStyle.borderColor} rounded-xl flex items-center justify-center text-2xl shrink-0`}>
                {cityStyle.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`text-xl font-black tracking-tight ${cityStyle.textColor}`}>{cityStyle.name}</span>
                  <span className="font-light text-lg hidden sm:inline" style={{ color: '#94a3b8' }}>/</span>
                  <span className="text-lg font-bold truncate" style={{ color: '#0f172a' }}>{day.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Calendar size={11} style={{ color: '#94a3b8' }} />
                  <span className="text-xs capitalize" style={{ color: '#475569' }}>{formatDate(day.date)}</span>
                  <span style={{ color: '#cbd5e1' }}>·</span>
                  <span className={`text-xs font-semibold ${cityStyle.textColor} opacity-80`}>Día {day.day_number}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 transition-all font-medium shrink-0"
              style={{ color: '#334155' }}
            >
              <PlusCircle size={15} />
              <span className="hidden sm:inline">Nueva actividad</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 space-y-6">
          {day.description && (
            <div
              className="p-5 rounded-2xl border border-slate-200"
              style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            >
              <p className="text-base leading-[1.85] whitespace-pre-line" style={{ color: '#1e3a5f' }}>{day.description}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Actividades</span>
              {activities.length > 0 && (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${cityStyle.bgColor} ${cityStyle.textColor} border ${cityStyle.borderColor}`}>
                  {activities.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 text-sm text-cyan-700 hover:text-cyan-600 transition-colors py-1.5 px-3 rounded-xl hover:bg-cyan-50"
            >
              <PlusCircle size={14} /> Añadir
            </button>
          </div>

          {activities.length === 0 ? (
            <button
              onClick={() => setIsAddOpen(true)}
              className="w-full py-16 border-2 border-dashed border-slate-300 rounded-2xl hover:border-cyan-400 hover:bg-white/30 transition-all flex flex-col items-center gap-3"
              style={{ color: '#94a3b8' }}
            >
              <PlusCircle size={28} className="opacity-40" />
              <span className="text-sm">Sin actividades — pulsa para añadir la primera</span>
            </button>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => {
                if (editingId === act.id) {
                  return (
                    <EditActivityForm
                      key={act.id}
                      act={act}
                      onSave={(updated, file) => saveEdit(act.id, updated, file)}
                      onCancel={() => setEditingId(null)}
                    />
                  );
                }
                return (
                  <ActivityCard
                    key={act.id}
                    act={act}
                    cityStyle={cityStyle}
                    onEdit={() => setEditingId(act.id)}
                    onDelete={() => setDeleteId(act.id)}
                  />
                );
              })}
            </div>
          )}

          <DayMapSection dayId={day.id} initialUrl={day.map_url || ''} city={day.city} />

          <div className="pt-2 pb-4">
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#0f172a', color: '#ffffff', boxShadow: '0 4px 18px rgba(15,23,42,0.28)' }}
            >
              <FileDown size={18} className={exporting ? 'animate-bounce' : ''} />
              <span>{exporting ? 'Generando PDF...' : 'Exportar Plan del Día (PDF)'}</span>
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Nueva actividad"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { setIsAddOpen(false); setAttachFile(null); }} className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2" style={{ color: '#475569' }}><X size={15} /><span>Cancelar</span></button>
            <button onClick={addActivity} disabled={!form.title.trim() || uploading} className="japan-btn-primary gap-2 disabled:opacity-40">{uploading ? 'Subiendo...' : 'Añadir'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: '#475569' }}>Categoría</label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button key={cat.id} onClick={() => setForm({ ...form, category: cat.id })} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${form.category === cat.id ? `${cat.bg} ${cat.border} ${cat.color}` : 'border-slate-300 hover:border-slate-400'}`} style={form.category === cat.id ? undefined : { color: '#475569' }}>
                    <Icon size={13} /><span className="text-xs font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Hora</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="japan-input" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Título</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Fushimi Inari" className="japan-input" onKeyDown={(e) => e.key === 'Enter' && addActivity()} />
            </div>
          </div>
          <DescriptionTextarea value={form.description} onChange={(val) => setForm({ ...form, description: val })} rows={6} placeholder="Detalles, notas, reservas..." />
          <button
            type="button"
            onClick={() => setForm({ ...form, has_pending_tasks: !form.has_pending_tasks })}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${form.has_pending_tasks ? 'bg-orange-50 border-orange-300' : 'border-slate-300 hover:border-slate-400'}`}
            style={form.has_pending_tasks ? { color: '#92400e' } : { color: '#475569' }}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${form.has_pending_tasks ? 'bg-orange-500 border-orange-500' : 'border-slate-400'}`}>
              {form.has_pending_tasks && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium">¿Tiene tareas o reservas pendientes?</span>
              {form.has_pending_tasks && (
                <p className="text-xs text-orange-600 mt-0.5">Se mostrará un indicador de alerta en esta actividad</p>
              )}
            </div>
            {form.has_pending_tasks && <AlertCircle size={16} className="text-orange-500 shrink-0" />}
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="flex-1 japan-input flex items-center gap-2 cursor-pointer hover:border-cyan-400">
              <Paperclip size={13} style={{ color: '#94a3b8' }} className="shrink-0" />
              <span className={`text-sm ${attachFile ? 'text-cyan-700' : ''}`} style={attachFile ? undefined : { color: '#94a3b8' }}>{attachFile ? attachFile.name : 'Adjuntar archivo...'}</span>
            </div>
            {attachFile && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setAttachFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="w-9 h-9 flex items-center justify-center hover:text-red-500 border border-slate-300 rounded-lg" style={{ color: '#64748b' }}>
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
            <button onClick={() => setDeleteId(null)} className="japan-btn border border-slate-300 hover:bg-slate-100" style={{ color: '#475569' }}>Cancelar</button>
            <button onClick={() => deleteId && deleteActivity(deleteId)} className="japan-btn-danger gap-2"><Trash2 size={15} /><span>Eliminar</span></button>
          </div>
        }
      >
        <p className="text-sm font-medium" style={{ color: '#1e3a5f' }}>¿Eliminar esta actividad?</p>
      </Modal>
    </motion.div>
  );
}
