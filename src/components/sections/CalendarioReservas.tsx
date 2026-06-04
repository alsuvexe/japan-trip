import { useEffect, useState } from 'react';
import { Plane, Hotel, UtensilsCrossed, Calendar, CheckSquare, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

type EventType = 'flight' | 'hotel-in' | 'hotel-out' | 'restaurant' | 'task' | 'manual';

interface CalendarEvent {
  id?: string;
  date: string;
  type: EventType;
  label: string;
  color: string;
  assignee?: string;
  source?: string;
}

const EVENT_CATEGORIES: { value: EventType; label: string; dotColor: string; textClass: string; bgClass: string; borderClass: string }[] = [
  { value: 'flight',     label: 'Vuelo',         dotColor: '#b45309', textClass: 'text-amber-700',   bgClass: 'bg-amber-50',   borderClass: 'border-amber-300' },
  { value: 'hotel-in',  label: 'Check-in',       dotColor: '#0e7490', textClass: 'text-cyan-700',    bgClass: 'bg-cyan-50',    borderClass: 'border-cyan-300' },
  { value: 'hotel-out', label: 'Check-out',      dotColor: '#be185d', textClass: 'text-pink-700',    bgClass: 'bg-pink-50',    borderClass: 'border-pink-300' },
  { value: 'restaurant',label: 'Restaurante',    dotColor: '#059669', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-300' },
  { value: 'task',      label: 'Tarea',          dotColor: '#d97706', textClass: 'text-amber-700',   bgClass: 'bg-amber-50',   borderClass: 'border-amber-300' },
  { value: 'manual',    label: 'Evento general', dotColor: '#0369a1', textClass: 'text-sky-700',     bgClass: 'bg-sky-50',     borderClass: 'border-sky-300' },
];

const DAYS_OF_WEEK = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

function getCatConfig(type: EventType) {
  return EVENT_CATEGORIES.find((c) => c.value === type) ?? EVENT_CATEGORIES[5];
}

function EventIcon({ type, size = 11 }: { type: EventType; size?: number }) {
  switch (type) {
    case 'flight':    return <Plane size={size} />;
    case 'hotel-in':
    case 'hotel-out': return <Hotel size={size} />;
    case 'restaurant':return <UtensilsCrossed size={size} />;
    case 'task':      return <CheckSquare size={size} />;
    case 'manual':    return <Calendar size={size} />;
  }
}

export default function CalendarioReservas() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(11);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('manual');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    const [hotelsRes, restaurantsRes, calendarRes] = await Promise.all([
      supabase.from('hotels').select('name, check_in, check_out'),
      supabase.from('restaurants').select('name, reservation_date').not('reservation_date', 'is', null),
      supabase.from('calendar_events').select('id, title, event_date, category, assignee, source'),
    ]);

    const list: CalendarEvent[] = [];
    const cfg = (t: EventType) => getCatConfig(t);

    list.push({ date: '2026-12-03', type: 'flight', label: 'Vuelo a Osaka', color: cfg('flight').dotColor });
    list.push({ date: '2026-12-14', type: 'flight', label: 'Vuelo de regreso', color: cfg('flight').dotColor });

    if (hotelsRes.data) {
      hotelsRes.data.forEach((hotel) => {
        list.push({ date: hotel.check_in, type: 'hotel-in', label: `Check-in: ${hotel.name}`, color: cfg('hotel-in').dotColor });
        list.push({ date: hotel.check_out, type: 'hotel-out', label: `Check-out: ${hotel.name}`, color: cfg('hotel-out').dotColor });
      });
    }

    if (restaurantsRes.data) {
      restaurantsRes.data.forEach((r) => {
        if (r.reservation_date) {
          list.push({ date: r.reservation_date.split('T')[0], type: 'restaurant', label: r.name, color: cfg('restaurant').dotColor });
        }
      });
    }

    if (calendarRes.data) {
      calendarRes.data.forEach((ev) => {
        const type = (ev.category as EventType) ?? 'manual';
        list.push({
          id: ev.id,
          date: ev.event_date,
          type,
          label: ev.title,
          color: cfg(type).dotColor,
          assignee: ev.assignee || undefined,
          source: ev.source,
        });
      });
    }

    setEvents(list);
  };

  const navigate = (dir: -1 | 1) => {
    setViewMonth((m) => {
      let nm = m + dir;
      if (nm < 0) { nm = 11; setViewYear((y) => y - 1); }
      else if (nm > 11) { nm = 0; setViewYear((y) => y + 1); }
      return nm;
    });
  };

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateString = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getEventsForDay = (day: number) => {
    const ds = getDateString(day);
    return events.filter((e) => e.date === ds);
  };

  const getMonthEvents = () =>
    events
      .filter((e) => {
        const [y, m] = e.date.split('-').map(Number);
        return y === viewYear && m === viewMonth + 1;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

  const isTripDay = (day: number) => {
    const ds = getDateString(day);
    return ds >= '2026-12-03' && ds <= '2026-12-14';
  };

  const isToday = (day: number) => {
    const ds = getDateString(day);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return ds === todayStr;
  };

  const formatDateLabel = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

  const openNewEvent = () => {
    const defaultDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
    setNewEventDate(defaultDate);
    setNewEventTitle('');
    setNewEventType('manual');
    setShowNewEvent(true);
  };

  const saveNewEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate) return;
    setSaving(true);
    const payload = {
      title: newEventTitle.trim(),
      event_date: newEventDate,
      category: newEventType,
      source: 'manual',
      assignee: '',
    };
    const { data } = await supabase.from('calendar_events').insert(payload).select().maybeSingle();
    if (data) {
      setEvents((prev) => [...prev, {
        id: data.id,
        date: data.event_date,
        type: newEventType,
        label: data.title,
        color: getCatConfig(newEventType).dotColor,
        source: 'manual',
      }]);
    }
    setSaving(false);
    setShowNewEvent(false);
  };

  const deleteEvent = async (ev: CalendarEvent) => {
    if (!ev.id || ev.source !== 'manual') return;
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    await supabase.from('calendar_events').delete().eq('id', ev.id);
  };

  const monthEvents = getMonthEvents();

  return (
    <div className="space-y-6">
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
          <p className="text-sm font-medium" style={{ color: '#334155' }}>Reservas y fechas clave del viaje</p>
        </div>
        <button onClick={openNewEvent} className="japan-btn-primary shrink-0 gap-2 text-sm">
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo Evento</span>
          <span className="sm:hidden">Evento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={GLASS_CARD}>
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

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-xs font-bold py-1" style={{ color: '#475569' }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const dayEvents = getEventsForDay(day);
              const trip = isTripDay(day);
              const tod = isToday(day);

              return (
                <div
                  key={idx}
                  className={`relative rounded-lg p-1 min-h-[52px] transition-all ${
                    tod
                      ? 'bg-cyan-100 border border-cyan-400/60'
                      : trip
                      ? 'bg-cyan-50/70 border border-cyan-300/50'
                      : 'border border-transparent hover:border-slate-300/80'
                  }`}
                  style={!tod && !trip ? { background: 'rgba(255,255,255,0.35)' } : undefined}
                >
                  <span className={`text-xs font-semibold block text-center mb-1 ${
                    tod ? 'text-cyan-700 font-black' : trip ? 'text-cyan-600' : ''
                  }`} style={!tod && !trip ? { color: '#334155' } : undefined}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev, i) => {
                      const cat = getCatConfig(ev.type);
                      return (
                        <div key={i} className={`flex items-center gap-0.5 rounded px-1 py-0.5 border ${cat.bgClass} ${cat.textClass} ${cat.borderClass} text-[9px] leading-tight`}>
                          <EventIcon type={ev.type} size={9} />
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-center" style={{ color: '#94a3b8' }}>+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200/70">
            {EVENT_CATEGORIES.map((cat) => (
              <div key={cat.value} className="flex items-center gap-1.5 text-xs" style={{ color: '#475569' }}>
                <span className={cat.textClass}><EventIcon type={cat.value} size={12} /></span>
                <span>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Event list */}
        <div className="rounded-2xl p-5" style={GLASS_CARD}>
          <h3 className="text-base font-semibold mb-1" style={{ color: '#0f172a' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <p className="text-[11px] mb-4" style={{ color: '#475569' }}>
            {monthEvents.length} evento{monthEvents.length !== 1 ? 's' : ''} este mes
          </p>
          <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
            {monthEvents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>Sin eventos este mes</p>
              </div>
            )}
            {monthEvents.map((ev, i) => {
              const cat = getCatConfig(ev.type);
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${cat.bgClass} ${cat.borderClass} ${cat.textClass} group`}
                >
                  <div className="mt-0.5 shrink-0"><EventIcon type={ev.type} size={13} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight" style={{ color: '#0f172a' }}>{ev.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#475569' }}>{formatDateLabel(ev.date)}</p>
                    {ev.assignee && (
                      <p className="text-[10px] mt-0.5 text-amber-700">{ev.assignee}</p>
                    )}
                  </div>
                  {ev.source === 'manual' && (
                    <button
                      onClick={() => deleteEvent(ev)}
                      className="shrink-0 p-1.5 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 rounded-lg hover:bg-red-50 min-w-[32px] min-h-[32px] flex items-center justify-center"
                      style={{ color: '#94a3b8' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showNewEvent}
        onClose={() => setShowNewEvent(false)}
        title="Nuevo evento"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setShowNewEvent(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-sm font-medium transition-all" style={{ color: '#475569' }}>
              Cancelar
            </button>
            <button onClick={saveNewEvent} disabled={saving || !newEventTitle.trim() || !newEventDate} className="flex-1 japan-btn-primary gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Guardando...' : 'Crear evento'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#475569' }}>Título</label>
            <input
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Nombre del evento..."
              className="japan-input w-full"
              onKeyDown={(e) => e.key === 'Enter' && saveNewEvent()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#475569' }}>
              <span className="flex items-center gap-1"><Calendar size={10} /> Fecha</span>
            </label>
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="japan-input w-full"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#475569' }}>Categoría</label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setNewEventType(cat.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    newEventType === cat.value
                      ? `${cat.bgClass} ${cat.borderClass} ${cat.textClass}`
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  style={newEventType === cat.value ? undefined : { color: '#475569' }}
                >
                  <EventIcon type={cat.value} size={12} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
