import { useEffect, useState } from 'react';
import { UtensilsCrossed, MapPin, Calendar, Star, Plus, Pencil, Trash2, Save, X, Clock, Banknote, CalendarCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

interface Restaurant {
  id: string;
  name: string;
  city: string;
  cuisine_type: string;
  address: string;
  reservation_date: string | null;
  reservation_time: string;
  notes: string;
  priority: string;
  avg_price_per_person: number;
  in_itinerary: boolean;
}

const CITIES = ['Osaka', 'Kioto', 'Tokio'];
const PRIORITIES = ['high', 'normal', 'low'];
const PRIORITY_LABELS: Record<string, string> = { high: 'Imprescindible', normal: 'Recomendado', low: 'Opcional' };

const CITY_STYLES: Record<string, { border: string; bg: string; text: string; dot: string; color: string }> = {
  Osaka: { border: 'border-cyan-500/35',   bg: 'bg-cyan-500/15',   text: 'text-cyan-700',   dot: 'bg-cyan-500',   color: '#0e7490' },
  Kioto: { border: 'border-pink-500/35',   bg: 'bg-pink-500/15',   text: 'text-pink-700',   dot: 'bg-pink-500',   color: '#be185d' },
  Tokio: { border: 'border-indigo-500/35', bg: 'bg-indigo-500/15', text: 'text-indigo-700', dot: 'bg-indigo-500', color: '#6366f1' },
};

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

const EMPTY_R: Omit<Restaurant, 'id'> = {
  name: '', city: 'Osaka', cuisine_type: '', address: '',
  reservation_date: null, reservation_time: '',
  notes: '', priority: 'normal', avg_price_per_person: 0, in_itinerary: false,
};

async function syncRestaurantToCalendar(restaurant: Restaurant) {
  await supabase.from('calendar_events').delete().eq('source', 'restaurant').eq('source_id', restaurant.id);
  if (restaurant.reservation_date && restaurant.reservation_time && restaurant.in_itinerary) {
    const timeLabel = restaurant.reservation_time ? ` ${restaurant.reservation_time}` : '';
    await supabase.from('calendar_events').insert({
      title: `${restaurant.name}${timeLabel}`,
      event_date: restaurant.reservation_date,
      category: 'restaurant',
      source: 'restaurant',
      source_id: restaurant.id,
      assignee: '',
    });
  }
}

function ExpandableNotes({ notes }: { notes: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = notes.length > 120;
  if (!notes) return null;
  return (
    <div className="mt-2">
      <p className={`text-xs leading-relaxed transition-all duration-300 ${!expanded && isLong ? 'line-clamp-3' : ''}`} style={{ color: '#334155' }}>
        {notes}
      </p>
      {isLong && (
        <button onClick={() => setExpanded((v) => !v)} className="text-[11px] font-semibold mt-1 transition-colors" style={{ color: '#0e7490' }}>
          {expanded ? 'Mostrar menos' : 'Leer más...'}
        </button>
      )}
    </div>
  );
}

function RestaurantForm({ form, setForm, onSave, onCancel, title }: {
  form: Partial<Restaurant>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Restaurant>>>;
  onSave: () => void;
  onCancel: () => void;
  title: string;
}) {
  const hasCalendarSync = !!(form.reservation_date && form.reservation_time && form.in_itinerary);
  const labelStyle = { color: '#475569' };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}>Nombre</label>
        <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Ichiran Ramen" className="japan-input w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}>Ciudad</label>
          <select value={form.city || 'Osaka'} onChange={(e) => setForm({ ...form, city: e.target.value })} className="japan-input w-full">
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}>Prioridad</label>
          <select value={form.priority || 'normal'} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="japan-input w-full">
            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}>Tipo de cocina</label>
          <input value={form.cuisine_type || ''} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} placeholder="Ej: Ramen, Sushi..." className="japan-input w-full" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}><span className="flex items-center gap-1"><Banknote size={10} /> Precio/persona (¥)</span></label>
          <input type="number" min="0" step="100" value={form.avg_price_per_person || ''} onChange={(e) => setForm({ ...form, avg_price_per_person: Number(e.target.value) || 0 })} placeholder="Ej: 2000" className="japan-input w-full" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}>Dirección</label>
        <input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección del restaurante" className="japan-input w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}><span className="flex items-center gap-1"><Calendar size={10} /> Fecha reserva</span></label>
          <input type="date" value={form.reservation_date || ''} onChange={(e) => setForm({ ...form, reservation_date: e.target.value || null })} className="japan-input w-full" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}><span className="flex items-center gap-1"><Clock size={10} /> Hora reserva</span></label>
          <input type="time" value={form.reservation_time || ''} onChange={(e) => setForm({ ...form, reservation_time: e.target.value })} className="japan-input w-full" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={labelStyle}>Notas</label>
        <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Notas, horarios, precios, cómo reservar..." className="japan-input w-full resize-none" />
      </div>
      <button
        type="button"
        onClick={() => setForm({ ...form, in_itinerary: !form.in_itinerary })}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${form.in_itinerary ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 hover:border-slate-300'}`}
        style={!form.in_itinerary ? { color: '#475569' } : {}}
      >
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${form.in_itinerary ? 'bg-emerald-500 border-emerald-500' : 'border-slate-400'}`}>
          {form.in_itinerary && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold">Añadir al Itinerario</p>
          {hasCalendarSync
            ? <p className="text-[11px] text-emerald-600 mt-0.5">Se creará un evento en el Calendario</p>
            : <p className="text-[11px] mt-0.5" style={{ color: '#94a3b8' }}>Requiere fecha y hora de reserva para sincronizar</p>}
        </div>
        <CalendarCheck size={16} className="ml-auto shrink-0" />
      </button>
      {hasCalendarSync && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CalendarCheck size={13} className="text-emerald-600 shrink-0" />
          <p className="text-[11px] text-emerald-700">Este restaurante aparecerá en el Calendario</p>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2" style={{ color: '#475569' }}><X size={15} /><span>Cancelar</span></button>
        <button onClick={onSave} disabled={!form.name} className="japan-btn-primary gap-2 disabled:opacity-40"><Save size={15} /><span>{title}</span></button>
      </div>
    </div>
  );
}

function RestaurantCard({ r, onEdit, onDelete }: { r: Restaurant; onEdit: (r: Restaurant) => void; onDelete: (id: string) => void }) {
  const style = CITY_STYLES[r.city] || CITY_STYLES['Osaka'];
  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const formatPrice = (p: number) => p > 0 ? `¥${p.toLocaleString('es-ES')}` : null;
  const hasReservation = r.reservation_date && r.reservation_time;

  return (
    <div className={`rounded-2xl p-4 border ${style.border} transition-all group hover:shadow-md`} style={GLASS_CARD}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 ${style.bg} rounded-xl shrink-0`}>
          <UtensilsCrossed style={{ color: style.color }} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold" style={{ color: '#0f172a' }}>{r.name}</h4>
                {r.in_itinerary && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 border border-emerald-300 text-emerald-700">
                    <CalendarCheck size={9} />En itinerario
                  </span>
                )}
              </div>
              {r.cuisine_type && <p className="text-xs font-medium mt-0.5" style={{ color: '#475569' }}>{r.cuisine_type}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {r.priority === 'high' && (
                <div className="flex items-center gap-1 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5">
                  <Star className="text-amber-600" size={10} />
                  <span className="text-[10px] font-bold text-amber-700 hidden sm:inline">{PRIORITY_LABELS[r.priority]}</span>
                </div>
              )}
            </div>
          </div>

          {r.address && (
            <div className="flex items-start gap-1.5 text-xs mb-1.5" style={{ color: '#475569' }}>
              <MapPin size={11} className="mt-0.5 shrink-0" />
              <span className="leading-relaxed">{r.address}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {hasReservation && (
              <div className="flex items-center gap-1.5 text-xs">
                <Calendar size={11} style={{ color: style.color }} className="shrink-0" />
                <span className={`${style.text} font-semibold`}>{formatDate(r.reservation_date!)}</span>
                <Clock size={10} style={{ color: '#94a3b8' }} />
                <span className="font-semibold" style={{ color: '#334155' }}>{r.reservation_time}</span>
              </div>
            )}
            {!hasReservation && r.reservation_date && (
              <div className="flex items-center gap-1.5 text-xs">
                <Calendar size={11} style={{ color: style.color }} className="shrink-0" />
                <span className={`${style.text} font-semibold`}>{formatDate(r.reservation_date)}</span>
              </div>
            )}
            {formatPrice(r.avg_price_per_person) && (
              <div className="flex items-center gap-1 text-xs">
                <Banknote size={11} className="text-amber-600 shrink-0" />
                <span className="text-amber-700 font-bold">{formatPrice(r.avg_price_per_person)}</span>
                <span style={{ color: '#94a3b8' }}>/persona</span>
              </div>
            )}
          </div>

          <ExpandableNotes notes={r.notes} />
        </div>
      </div>

      <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(r)} className="min-w-[34px] min-h-[34px] flex items-center justify-center hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" style={{ color: '#64748b' }}>
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(r.id)} className="min-w-[34px] min-h-[34px] flex items-center justify-center hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" style={{ color: '#64748b' }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function Restaurantes() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [editForm, setEditForm] = useState<Partial<Restaurant>>({});
  const [newForm, setNewForm] = useState<Partial<Restaurant>>(EMPTY_R);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<string>('all');

  useEffect(() => { loadRestaurants(); }, []);

  const loadRestaurants = async () => {
    const { data } = await supabase.from('restaurants').select('*').order('city');
    if (data) setRestaurants(data.map((r) => ({
      ...r,
      reservation_time: r.reservation_time ?? '',
      avg_price_per_person: r.avg_price_per_person ?? 0,
      in_itinerary: r.in_itinerary ?? false,
    })));
  };

  const openEdit = (r: Restaurant) => { setEditForm({ ...r }); setIsEditOpen(true); };

  const saveEdit = async () => {
    if (!editForm.id) return;
    const { id, ...updates } = editForm as Restaurant;
    await supabase.from('restaurants').update(updates).eq('id', id);
    const updated = { ...editForm, id } as Restaurant;
    setRestaurants((prev) => prev.map((r) => r.id === id ? updated : r));
    await syncRestaurantToCalendar(updated);
    setIsEditOpen(false);
  };

  const addRestaurant = async () => {
    const { data } = await supabase.from('restaurants').insert(newForm).select().maybeSingle();
    if (data) {
      const r: Restaurant = { ...data, reservation_time: data.reservation_time ?? '', avg_price_per_person: data.avg_price_per_person ?? 0, in_itinerary: data.in_itinerary ?? false };
      setRestaurants((prev) => [...prev, r].sort((a, b) => a.city.localeCompare(b.city)));
      await syncRestaurantToCalendar(r);
      setIsAddOpen(false);
      setNewForm(EMPTY_R);
    }
  };

  const deleteRestaurant = async (id: string) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    await supabase.from('restaurants').delete().eq('id', id);
    await supabase.from('calendar_events').delete().eq('source', 'restaurant').eq('source_id', id);
    setDeleteConfirm(null);
  };

  const filtered = filterCity === 'all' ? restaurants : restaurants.filter((r) => r.city === filterCity);
  const groupedByCity = filtered.reduce<Record<string, Restaurant[]>>((acc, r) => {
    acc[r.city] = acc[r.city] || [];
    acc[r.city].push(r);
    return acc;
  }, {});

  const totalWithReservation = restaurants.filter((r) => r.reservation_date && r.reservation_time).length;
  const totalInItinerary = restaurants.filter((r) => r.in_itinerary).length;

  return (
    <div className="space-y-6">
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
            Restaurantes
          </h2>
          <p className="text-sm font-medium" style={{ color: '#334155' }}>Experiencias gastronómicas en Japón</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="japan-btn-primary gap-2 shrink-0">
          <Plus size={16} /><span className="hidden sm:block">Añadir</span>
        </button>
      </div>

      {restaurants.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: restaurants.length, label: 'Restaurantes', color: '#0e7490' },
            { value: totalWithReservation, label: 'Con reserva', color: '#b45309' },
            { value: totalInItinerary, label: 'En itinerario', color: '#059669' },
          ].map(({ value, label, color }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={GLASS_CARD}>
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#475569' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(['all', ...CITIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilterCity(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              filterCity === c ? 'bg-cyan-600 text-white border-cyan-600' : 'border-slate-300 hover:border-slate-400'
            }`}
            style={filterCity !== c ? { color: '#475569' } : {}}
          >
            {c === 'all' ? 'Todos' : c}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByCity).map(([city, items]) => {
          const style = CITY_STYLES[city] || CITY_STYLES['Osaka'];
          return (
            <div key={city}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                <h3 className={`text-sm font-bold ${style.text}`}>{city}</h3>
                <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>({items.length})</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {items.map((r) => (
                  <RestaurantCard key={r.id} r={r} onEdit={openEdit} onDelete={setDeleteConfirm} />
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.50)' }}>
            <p className="font-medium" style={{ color: '#475569' }}>Sin restaurantes. Añade el primero.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar restaurante">
        <RestaurantForm form={editForm} setForm={setEditForm as React.Dispatch<React.SetStateAction<Partial<Restaurant>>>} onSave={saveEdit} onCancel={() => setIsEditOpen(false)} title="Guardar" />
      </Modal>
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir restaurante">
        <RestaurantForm form={newForm} setForm={setNewForm as React.Dispatch<React.SetStateAction<Partial<Restaurant>>>} onSave={addRestaurant} onCancel={() => setIsAddOpen(false)} title="Añadir" />
      </Modal>
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar restaurante" size="sm">
        <div className="space-y-4">
          <p className="text-sm font-medium" style={{ color: '#1e3a5f' }}>¿Eliminar este restaurante? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteConfirm(null)} className="japan-btn border border-slate-300 hover:bg-slate-100" style={{ color: '#475569' }}>Cancelar</button>
            <button onClick={() => deleteConfirm && deleteRestaurant(deleteConfirm)} className="japan-btn-danger gap-2"><Trash2 size={15} /><span>Eliminar</span></button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
