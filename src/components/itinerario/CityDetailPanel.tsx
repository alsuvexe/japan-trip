import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Pencil, Trash2, Save,
  PlusCircle, Calendar, ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';
import DayFullView from './DayFullView';
import { WeatherWidgetFull } from './WeatherWidget';
import { useAdmin } from '../../lib/AdminContext';
import type { CityConfig } from './JapanMap';

interface ItineraryDay {
  id: string;
  day_number: number;
  date: string;
  city: string;
  title: string;
  description: string;
  map_url?: string;
}

const CITIES_LIST = ['Osaka', 'Kioto', 'Tokio'];

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

function DayCard({ day, cityStyle, onClick, onEdit, onDelete, isAdmin }: {
  day: ItineraryDay;
  cityStyle: CityConfig;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const d = new Date(day.date + 'T00:00:00');
  const weekdayShort = d.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3).toUpperCase();
  const dayOfMonth = d.getDate();

  return (
    <motion.div
      layout
      className={`relative border ${cityStyle.borderColor} rounded-2xl overflow-hidden cursor-pointer transition-all`}
      style={{
        background: hovered ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        boxShadow: hovered ? '0 8px 28px rgba(0,0,0,0.14)' : '0 4px 16px rgba(0,0,0,0.09)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
    >
      <div className="flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-4 relative z-10">
        <div className={`flex flex-col items-center justify-center w-14 h-14 ${cityStyle.bgColor} border ${cityStyle.borderColor} rounded-xl shrink-0`}>
          <span className={`text-[10px] font-bold ${cityStyle.textColor} opacity-60 leading-none uppercase`}>
            {weekdayShort}
          </span>
          <span className={`text-2xl font-black ${cityStyle.textColor} leading-tight`}>{dayOfMonth}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-bold leading-snug" style={{ color: '#0f172a' }}>{day.title || 'Sin título'}</p>
          {day.description && (
            <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: '#334155' }}>{day.description}</p>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isAdmin && (
            <>
              <button
                onClick={onEdit}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center hover:${cityStyle.bgColor} rounded-xl transition-all`}
                style={{ color: '#64748b' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = cityStyle.dotColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onDelete}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                style={{ color: '#64748b' }}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
          <div className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all ${hovered ? `${cityStyle.bgColor} ${cityStyle.textColor}` : ''}`} style={{ color: hovered ? undefined : '#94a3b8' }}>
            <ChevronRight size={15} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface CityDetailPanelProps {
  city: CityConfig | null;
  onClose: () => void;
  initialDayDate?: string;
}

export default function CityDetailPanel({ city, onClose, initialDayDate }: CityDetailPanelProps) {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<ItineraryDay | null>(null);
  const { isAdmin } = useAdmin();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newDay, setNewDay] = useState({ day_number: 1, date: '', city: city?.id || 'Osaka', title: '', description: '' });

  useEffect(() => {
    if (!city) return;
    setSelectedDay(null);
    setNewDay((prev) => ({ ...prev, city: city.id }));
    supabase.from('itinerary_days').select('*').eq('city', city.id).order('day_number').then(({ data }) => {
      if (data) {
        setDays(data);
        if (initialDayDate) {
          const match = data.find((d) => d.date === initialDayDate);
          if (match) setSelectedDay(match);
        }
      }
    });
  }, [city, initialDayDate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDay) { setSelectedDay(null); return; }
        onClose();
      }
    };
    if (city) { document.addEventListener('keydown', handleKey); return () => document.removeEventListener('keydown', handleKey); }
  }, [city, onClose, selectedDay]);

  if (!city) return null;

  const dateRangePill = (() => {
    if (days.length === 0) return city.dates;
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
    const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const first = fmt(sorted[0].date);
    const last = fmt(sorted[sorted.length - 1].date);
    return first === last ? first : `${first} – ${last}`;
  })();

  const addDay = async () => {
    if (!newDay.date || !newDay.title) return;
    const { data } = await supabase.from('itinerary_days').insert({ ...newDay, city: city.id }).select().maybeSingle();
    if (data) {
      setDays((prev) => [...prev, data].sort((a, b) => a.day_number - b.day_number));
      setIsAddOpen(false);
      setNewDay({ day_number: days.length + 2, date: '', city: city.id, title: '', description: '' });
    }
  };

  const saveEdit = async () => {
    if (!editingDay) return;
    await supabase.from('itinerary_days').update({
      title: editingDay.title, description: editingDay.description,
      date: editingDay.date, day_number: editingDay.day_number,
    }).eq('id', editingDay.id);
    setDays((prev) => prev.map((d) => d.id === editingDay.id ? { ...d, ...editingDay } : d).sort((a, b) => a.day_number - b.day_number));
    if (selectedDay?.id === editingDay.id) setSelectedDay({ ...selectedDay, ...editingDay });
    setIsEditOpen(false);
    setEditingDay(null);
  };

  const deleteDay = async (id: string) => {
    setDays((prev) => prev.filter((d) => d.id !== id));
    if (selectedDay?.id === id) setSelectedDay(null);
    await supabase.from('itinerary_days').delete().eq('id', id);
    setDeleteConfirm(null);
  };

  return (
    <AnimatePresence>
      {city && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col overflow-x-hidden max-w-full"
          style={{
            backgroundImage: "url('/image.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Tinted overlay so text stays legible */}
          <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} />

          {/* Header */}
          <div
            className={`shrink-0 border-b ${city.borderColor} relative z-10`}
            style={{
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 16px rgba(0,0,0,0.08)',
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
              {/* Header row: city info + actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                {/* Top mobile row: icon+name LEFT, close button RIGHT */}
                <div className="flex items-center justify-between gap-3 sm:contents">
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className={`w-11 h-11 sm:w-14 sm:h-14 ${city.bgColor} border ${city.borderColor} rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0`}>
                      {city.icon}
                    </div>
                    <div>
                      <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${city.textColor}`}>{city.name}</h2>
                      <p className="text-sm font-medium mt-0.5 flex items-center gap-2" style={{ color: '#475569' }}>
                        <Calendar size={13} />
                        <span>{days.length} {days.length === 1 ? 'día planificado' : 'días planificados'}</span>
                      </p>
                    </div>
                  </div>
                  {/* Close button — always visible on mobile (top right) */}
                  <button
                    onClick={onClose}
                    className="sm:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 transition-all text-sm font-medium shrink-0 min-w-[44px] min-h-[44px] justify-center"
                    style={{ color: '#475569' }}
                  >
                    <X size={16} /><span>Cerrar</span>
                  </button>
                </div>

                {/* Bottom mobile row: date badge + new day button */}
                <div className="flex items-center gap-2 sm:shrink-0">
                  <span
                    className="text-xs font-mono px-2.5 py-1.5 rounded-lg border shrink-0"
                    style={{
                      background: 'rgba(186,230,253,0.45)',
                      borderColor: 'rgba(14,116,144,0.25)',
                      color: '#0F172A',
                    }}
                  >
                    {dateRangePill}
                  </span>
                  {isAdmin && (
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border ${city.borderColor} ${city.bgColor} ${city.textColor} hover:opacity-80 transition-opacity font-semibold min-h-[44px]`}
                  >
                    <PlusCircle size={15} /><span>Nuevo día</span>
                  </button>
                  )}
                  {/* Close button — desktop only */}
                  <button
                    onClick={onClose}
                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 transition-all text-sm font-medium min-h-[44px]"
                    style={{ color: '#475569' }}
                  >
                    <X size={16} /><span>Cerrar</span>
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <WeatherWidgetFull
                  lat={city.lat}
                  lon={city.lon}
                  cityName={city.name}
                  textColor={city.textColor}
                  borderColor={city.borderColor}
                  bgColor={city.bgColor}
                  dotColor={city.dotColor}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 max-w-full">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
              {days.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
                  <div className={`w-20 h-20 ${city.bgColor} border ${city.borderColor} rounded-3xl flex items-center justify-center text-4xl`}>
                    {city.icon}
                  </div>
                  <div>
                    <p className="text-xl font-bold" style={{ color: '#0f172a' }}>Sin días en {city.name}</p>
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: '#475569' }}>Añade el primer día para comenzar a planificar tu estancia</p>
                  </div>
                  {isAdmin && (
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border ${city.borderColor} ${city.bgColor} ${city.textColor} font-semibold text-sm`}
                  >
                    <Plus size={16} /> Añadir primer día
                  </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {days.map((day) => (
                    <DayCard
                      key={day.id}
                      day={day}
                      cityStyle={city}
                      onClick={() => setSelectedDay(day)}
                      onEdit={() => { setEditingDay({ ...day }); setIsEditOpen(true); }}
                      onDelete={() => setDeleteConfirm(day.id)}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {selectedDay && (
              <DayFullView
                key={selectedDay.id}
                day={selectedDay}
                cityStyle={city}
                onBack={() => setSelectedDay(null)}
              />
            )}
          </AnimatePresence>

          <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={`Nuevo día en ${city.name}`}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Día #</label>
                  <input type="number" value={newDay.day_number} onChange={(e) => setNewDay({ ...newDay, day_number: Number(e.target.value) })} className="japan-input" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Ciudad</label>
                  <select value={newDay.city} onChange={(e) => setNewDay({ ...newDay, city: e.target.value })} className="japan-input">
                    {CITIES_LIST.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Fecha</label>
                <input type="date" value={newDay.date} onChange={(e) => setNewDay({ ...newDay, date: e.target.value })} className="japan-input" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Título</label>
                <input value={newDay.title} onChange={(e) => setNewDay({ ...newDay, title: e.target.value })} placeholder="Ej: Templos y ramen" className="japan-input" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Descripción</label>
                <textarea value={newDay.description} onChange={(e) => setNewDay({ ...newDay, description: e.target.value })} rows={3} className="japan-input resize-none leading-relaxed" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsAddOpen(false)} className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2" style={{ color: '#475569' }}><X size={15} /><span>Cancelar</span></button>
                <button onClick={addDay} disabled={!newDay.date || !newDay.title} className="japan-btn-primary gap-2 disabled:opacity-40"><Plus size={15} /><span>Crear</span></button>
              </div>
            </div>
          </Modal>

          <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingDay(null); }} title="Editar día">
            {editingDay && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Día #</label>
                    <input type="number" value={editingDay.day_number} onChange={(e) => setEditingDay({ ...editingDay, day_number: Number(e.target.value) })} className="japan-input" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Fecha</label>
                    <input type="date" value={editingDay.date} onChange={(e) => setEditingDay({ ...editingDay, date: e.target.value })} className="japan-input" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Título</label>
                  <input value={editingDay.title} onChange={(e) => setEditingDay({ ...editingDay, title: e.target.value })} className="japan-input" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Descripción</label>
                  <textarea value={editingDay.description} onChange={(e) => setEditingDay({ ...editingDay, description: e.target.value })} rows={4} className="japan-input resize-none leading-relaxed" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setIsEditOpen(false); setEditingDay(null); }} className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2" style={{ color: '#475569' }}><X size={15} /><span>Cancelar</span></button>
                  <button onClick={saveEdit} className="japan-btn-primary gap-2"><Save size={15} /><span>Guardar</span></button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar día" size="sm">
            <div className="space-y-4">
              <p className="text-sm font-medium leading-relaxed" style={{ color: '#1e3a5f' }}>¿Eliminar este día y todas sus actividades?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="japan-btn border border-slate-300 hover:bg-slate-100" style={{ color: '#475569' }}>Cancelar</button>
                <button onClick={() => deleteConfirm && deleteDay(deleteConfirm)} className="japan-btn-danger gap-2"><Trash2 size={15} /><span>Eliminar</span></button>
              </div>
            </div>
          </Modal>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
