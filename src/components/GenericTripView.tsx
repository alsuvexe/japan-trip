import { motion } from 'framer-motion';
import { MapPin, Calendar, Plus, Compass, Hotel, UtensilsCrossed } from 'lucide-react';
import { useTrips } from '../lib/TripContext';

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${s.getDate()} ${months[s.getMonth()]} ${s.getFullYear()} — ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
}

function dayCount(start: string, end: string) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

const PLACEHOLDER_SECTIONS = [
  { icon: Compass, label: 'Itinerario', desc: 'Planifica tu ruta día a día' },
  { icon: Hotel, label: 'Alojamiento', desc: 'Añade tus reservas de hotel' },
  { icon: UtensilsCrossed, label: 'Restaurantes', desc: 'Guarda recomendaciones gastronómicas' },
];

export default function GenericTripView() {
  const { activeTrip } = useTrips();
  if (!activeTrip) return null;

  const days = dayCount(activeTrip.startDate, activeTrip.endDate);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2
          className="text-3xl font-extrabold mb-1"
          style={{
            background: activeTrip.theme.accentGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {activeTrip.title}
        </h2>
        <p className="text-sm font-medium" style={{ color: '#475569' }}>
          {activeTrip.destination}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-center gap-4 flex-wrap mb-5">
          <span className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
            <Calendar size={15} style={{ color: '#94a3b8' }} />
            {formatDateRange(activeTrip.startDate, activeTrip.endDate)}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(14,116,144,0.08)', color: '#0e7490' }}>
            {days} días
          </span>
        </div>

        {activeTrip.cities.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <MapPin size={15} style={{ color: '#94a3b8' }} />
            {activeTrip.cities.map((city) => (
              <span
                key={city}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(14,116,144,0.08)', color: '#0e7490' }}
              >
                {city}
              </span>
            ))}
          </div>
        )}

        <div
          className="rounded-xl p-4 border"
          style={{ background: 'rgba(14,116,144,0.03)', borderColor: 'rgba(14,116,144,0.1)' }}
        >
          <p className="text-sm" style={{ color: '#475569' }}>
            Este viaje todavía no tiene itinerario ni reservas configuradas. Usa las secciones de abajo como punto de partida para planificar tu aventura.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLACEHOLDER_SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
              className="rounded-2xl p-5 text-center"
              style={{
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(14,116,144,0.08)' }}
              >
                <Icon size={22} style={{ color: '#0e7490' }} />
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#1e293b' }}>{section.label}</h3>
              <p className="text-xs" style={{ color: '#64748b' }}>{section.desc}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center pt-4"
      >
        <div className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: '#94a3b8' }}>
          <Plus size={14} />
          Pronto podrás añadir días y actividades aquí
        </div>
      </motion.div>
    </div>
  );
}
