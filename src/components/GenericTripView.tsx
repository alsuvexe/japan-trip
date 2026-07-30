import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Plus, Compass, Hotel, UtensilsCrossed, Clock, X, Trash2 } from 'lucide-react';
import { useTrips, type TripActivity, type TripReservation } from '../lib/TripContext';

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${s.getDate()} ${months[s.getMonth()]} ${s.getFullYear()} — ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
}

function getDays(start: string, end: string): string[] {
  const days: string[] = [];
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const current = new Date(s);
  while (current <= e) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function fmtDayLabel(iso: string, idx: number) {
  const d = new Date(iso + 'T00:00:00');
  const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return { dayNum: idx + 1, weekday: weekdays[d.getDay()], dateLabel: `${d.getDate()} ${months[d.getMonth()]}` };
}

interface AddActivityModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  date: string;
}

function AddActivityModal({ open, onClose, tripId, date }: AddActivityModalProps) {
  const { addActivity } = useTrips();
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!time && !location && !note) return;
    addActivity({ tripId, date, time, location: location.trim(), note: note.trim() });
    setTime(''); setLocation(''); setNote('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.97)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>Nueva Actividad</h3>
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100" style={{ color: '#64748b' }}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#475569' }}>Hora</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="japan-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#475569' }}>Ubicación</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Museo, Restaurante..." className="japan-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#475569' }}>Nota</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalles opcionales..." className="japan-input min-h-[80px] resize-none" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose} className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#f1f5f9', color: '#475569' }}>Cancelar</button>
                  <button type="submit" className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#0f172a' }}>Añadir</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface AddReservationModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
}

function AddReservationModal({ open, onClose, tripId }: AddReservationModalProps) {
  const { addReservation } = useTrips();
  const [hotelName, setHotelName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!hotelName.trim()) return;
    addReservation({ tripId, hotelName: hotelName.trim(), checkIn, checkOut, notes: notes.trim() });
    setHotelName(''); setCheckIn(''); setCheckOut(''); setNotes('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.97)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>Nueva Reserva</h3>
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100" style={{ color: '#64748b' }}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#475569' }}>Nombre del alojamiento</label>
                  <input type="text" value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="Ej: Hotel Sacher" className="japan-input" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#475569' }}>Check-in</label>
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="japan-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#475569' }}>Check-out</label>
                    <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="japan-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#475569' }}>Notas</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dirección, confirmación..." className="japan-input min-h-[60px] resize-none" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose} className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#f1f5f9', color: '#475569' }}>Cancelar</button>
                  <button type="submit" className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#0f172a' }}>Añadir</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface GenericTripViewProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function GenericTripView({ activeSection, onSectionChange }: GenericTripViewProps) {
  const { activeTrip, activities, deleteActivity, reservations, deleteReservation } = useTrips();
  const [activityModal, setActivityModal] = useState<{ open: boolean; date: string }>({ open: false, date: '' });
  const [reservationModal, setReservationModal] = useState(false);

  if (!activeTrip) return null;

  const days = getDays(activeTrip.startDate, activeTrip.endDate);
  const tripActivities = activities.filter((a) => a.tripId === activeTrip.id);
  const tripReservations = reservations.filter((r) => r.tripId === activeTrip.id);

  const renderResumen = () => (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h2
          className="text-3xl font-extrabold mb-1"
          style={{ background: activeTrip.theme.accentGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
        >
          {activeTrip.title}
        </h2>
        <p className="text-sm font-medium" style={{ color: '#475569' }}>{activeTrip.destination}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-center gap-4 flex-wrap mb-4">
          <span className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
            <Calendar size={15} style={{ color: '#94a3b8' }} />
            {formatDateRange(activeTrip.startDate, activeTrip.endDate)}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(14,116,144,0.08)', color: '#0e7490' }}>
            {days.length} días
          </span>
        </div>
        {activeTrip.cities.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin size={15} style={{ color: '#94a3b8' }} />
            {activeTrip.cities.map((city) => (
              <span key={city} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(14,116,144,0.08)', color: '#0e7490' }}>
                {city}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Compass, label: 'Itinerario', desc: 'Ver tu ruta día a día', section: 'itinerario' },
          { icon: Hotel, label: 'Alojamiento', desc: 'Gestiona tus reservas', section: 'hoteles' },
          { icon: UtensilsCrossed, label: 'Restaurantes', desc: 'Recomendaciones gastronómicas', section: 'restaurantes' },
        ].map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
            onClick={() => onSectionChange(item.section)}
            className="rounded-2xl p-5 text-center transition-all hover:shadow-md"
            style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(14,116,144,0.08)' }}>
              <item.icon size={22} style={{ color: '#0e7490' }} />
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: '#1e293b' }}>{item.label}</h3>
            <p className="text-xs" style={{ color: '#64748b' }}>{item.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderItinerario = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#0f172a' }}>Itinerario</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>{activeTrip.title} — {days.length} días</p>
      </div>

      <div className="space-y-4">
        {days.map((date, idx) => {
          const { dayNum, weekday, dateLabel } = fmtDayLabel(date, idx);
          const dayActivities = tripActivities.filter((a) => a.date === date);

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04, duration: 0.3 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: 'rgba(14,116,144,0.1)', color: '#0e7490' }}>
                    {dayNum}
                  </span>
                  <div>
                    <span className="text-sm font-bold" style={{ color: '#1e293b' }}>Día {dayNum}</span>
                    <span className="text-xs ml-2" style={{ color: '#64748b' }}>{weekday}, {dateLabel}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActivityModal({ open: true, date })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-cyan-50"
                  style={{ color: '#0e7490', border: '1px solid rgba(14,116,144,0.2)' }}
                >
                  <Plus size={13} /> Actividad
                </button>
              </div>

              <div className="px-5 py-3">
                {dayActivities.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: '#94a3b8' }}>Sin actividades aún. Pulsa el botón para añadir una.</p>
                ) : (
                  <div className="space-y-2">
                    {dayActivities.map((act) => (
                      <div key={act.id} className="flex items-start gap-3 group py-1.5">
                        {act.time && (
                          <span className="flex items-center gap-1 text-xs font-mono font-semibold shrink-0 pt-0.5" style={{ color: '#0e7490' }}>
                            <Clock size={12} /> {act.time}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          {act.location && <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{act.location}</p>}
                          {act.note && <p className="text-xs" style={{ color: '#64748b' }}>{act.note}</p>}
                        </div>
                        <button
                          onClick={() => deleteActivity(act.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-6 h-6 rounded flex items-center justify-center hover:bg-red-50"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AddActivityModal
        open={activityModal.open}
        onClose={() => setActivityModal({ open: false, date: '' })}
        tripId={activeTrip.id}
        date={activityModal.date}
      />
    </div>
  );

  const renderHoteles = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#0f172a' }}>Alojamiento</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>Reservas para {activeTrip.title}</p>
        </div>
        <button
          onClick={() => setReservationModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: '#0f172a', color: '#fff' }}
        >
          <Plus size={15} /> Añadir Reserva
        </button>
      </div>

      {tripReservations.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.5)' }}>
          <Hotel size={40} className="mx-auto mb-3" style={{ color: '#cbd5e1' }} />
          <p className="text-sm font-medium" style={{ color: '#64748b' }}>No hay reservas todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tripReservations.map((res) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 group"
              style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#1e293b' }}>{res.hotelName}</p>
                  {(res.checkIn || res.checkOut) && (
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                      {res.checkIn && `Check-in: ${res.checkIn}`}{res.checkIn && res.checkOut && ' · '}{res.checkOut && `Check-out: ${res.checkOut}`}
                    </p>
                  )}
                  {res.notes && <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{res.notes}</p>}
                </div>
                <button
                  onClick={() => deleteReservation(res.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddReservationModal open={reservationModal} onClose={() => setReservationModal(false)} tripId={activeTrip.id} />
    </div>
  );

  const renderRestaurantes = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#0f172a' }}>Restaurantes</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>Recomendaciones para {activeTrip.title}</p>
      </div>
      <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.5)' }}>
        <UtensilsCrossed size={40} className="mx-auto mb-3" style={{ color: '#cbd5e1' }} />
        <p className="text-sm font-medium" style={{ color: '#64748b' }}>Pronto podrás guardar restaurantes aquí</p>
      </div>
    </div>
  );

  const renderTodos = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#0f172a' }}>Tareas</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>Lista de pendientes para {activeTrip.title}</p>
      </div>
      <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.5)' }}>
        <p className="text-sm font-medium" style={{ color: '#64748b' }}>Sección en desarrollo</p>
      </div>
    </div>
  );

  const renderCalendario = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#0f172a' }}>Calendario</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>Vista general de {activeTrip.title}</p>
      </div>
      <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.5)' }}>
        <p className="text-sm font-medium" style={{ color: '#64748b' }}>Sección en desarrollo</p>
      </div>
    </div>
  );

  switch (activeSection) {
    case 'itinerario':
      return renderItinerario();
    case 'hoteles':
      return renderHoteles();
    case 'restaurantes':
      return renderRestaurantes();
    case 'todos':
      return renderTodos();
    case 'calendario':
      return renderCalendario();
    default:
      return renderResumen();
  }
}
