import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowRight, Plane, Archive, Plus, Globe } from 'lucide-react';
import { useTrips, type Trip } from '../lib/TripContext';
import NewTripModal from './NewTripModal';

const DESTINATION_GRADIENTS: Record<string, string> = {
  default: 'linear-gradient(135deg, #1e3a5f 0%, #0e7490 50%, #14b8a6 100%)',
  japan: 'linear-gradient(135deg, #be185d 0%, #7c2d12 50%, #dc2626 100%)',
  italy: 'linear-gradient(135deg, #16a34a 0%, #f5f5f4 50%, #dc2626 100%)',
  france: 'linear-gradient(135deg, #1e40af 0%, #f8fafc 50%, #dc2626 100%)',
  spain: 'linear-gradient(135deg, #dc2626 0%, #ca8a04 50%, #dc2626 100%)',
  germany: 'linear-gradient(135deg, #111827 0%, #dc2626 50%, #ca8a04 100%)',
  austria: 'linear-gradient(135deg, #dc2626 0%, #f8fafc 50%, #dc2626 100%)',
  portugal: 'linear-gradient(135deg, #15803d 0%, #dc2626 100%)',
  greece: 'linear-gradient(135deg, #1d4ed8 0%, #60a5fa 50%, #f8fafc 100%)',
  mexico: 'linear-gradient(135deg, #15803d 0%, #f8fafc 50%, #dc2626 100%)',
};

function getGradientForDestination(destination: string): string {
  const key = destination.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [name, grad] of Object.entries(DESTINATION_GRADIENTS)) {
    if (key.includes(name)) return grad;
  }
  return DESTINATION_GRADIENTS.default;
}

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

function statusBadge(status: Trip['status']) {
  switch (status) {
    case 'upcoming':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Calendar size={12} /> Próximo
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Plane size={12} /> En curso
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
          <Archive size={12} /> Completado
        </span>
      );
  }
}

const JAPAN_COVER = 'https://images.pexels.com/photos/20817306/pexels-photo-20817306.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

function TripCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  const days = dayCount(trip.startDate, trip.endDate);
  const [imgError, setImgError] = useState(false);

  const coverSrc = trip.id === 'japan-2026' ? JAPAN_COVER : trip.coverImage;
  const hasCover = coverSrc && !imgError;
  const fallbackGradient = getGradientForDestination(trip.destination);

  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden group relative"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.85) inset',
      }}
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(14,116,144,0.08)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="relative h-44 sm:h-52 overflow-hidden">
        {hasCover ? (
          <img
            src={coverSrc}
            alt={trip.destination}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: fallbackGradient }}
          >
            <Globe size={48} className="text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-3 right-3">
          {statusBadge(trip.status)}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-black text-xl drop-shadow-lg">{trip.title}</h3>
          <p className="text-white/80 text-sm font-medium mt-0.5">{trip.destination}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4 text-sm mb-3" style={{ color: '#475569' }}>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} style={{ color: '#94a3b8' }} />
            {formatDateRange(trip.startDate, trip.endDate)}
          </span>
          <span className="font-bold" style={{ color: '#0e7490' }}>{days} días</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <MapPin size={14} style={{ color: '#94a3b8' }} />
          {trip.cities.map((city) => (
            <span
              key={city}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
              style={{ background: 'rgba(14,116,144,0.08)', color: '#0e7490' }}
            >
              {city}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-end">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold transition-all group-hover:gap-2.5"
            style={{ color: trip.theme.accentColor }}
          >
            Abrir itinerario <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function Dashboard() {
  const { trips, setActiveTrip } = useTrips();
  const [modalOpen, setModalOpen] = useState(false);

  const upcoming = trips.filter((t) => t.status === 'upcoming' || t.status === 'in_progress');
  const completed = trips.filter((t) => t.status === 'completed');

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(145deg, #f0f4f8 0%, #e2e8f0 50%, #dbeafe 100%)' }}>
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30a30 30 0 0160 0' fill='none' stroke='%230e7490' stroke-width='0.4' opacity='0.15'/%3E%3Cpath d='M-30 30a30 30 0 0160 0' fill='none' stroke='%230e7490' stroke-width='0.4' opacity='0.15'/%3E%3Cpath d='M30 30a30 30 0 0160 0' fill='none' stroke='%230e7490' stroke-width='0.4' opacity='0.15'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 py-10 sm:px-8 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0e7490, #0284c7)' }}
              >
                <Plane size={20} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black" style={{ color: '#0f172a' }}>
                Mis Viajes
              </h1>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-sm text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              <Plus size={16} /> Nuevo Viaje
            </button>
          </div>
          <p className="text-sm font-medium mt-2" style={{ color: '#64748b' }}>
            Gestiona tus destinos, itinerarios y reservas en un solo lugar.
          </p>
        </motion.div>

        {upcoming.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: '#475569' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#0e7490' }} />
              Próximos / En curso
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcoming.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <TripCard trip={trip} onClick={() => setActiveTrip(trip)} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: '#475569' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#94a3b8' }} />
              Completados (Archivados)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completed.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <TripCard trip={trip} onClick={() => setActiveTrip(trip)} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {trips.length === 0 && (
          <div className="text-center py-20">
            <Plane size={48} style={{ color: '#cbd5e1' }} className="mx-auto mb-4" />
            <p className="text-lg font-semibold" style={{ color: '#64748b' }}>No hay viajes todavía</p>
          </div>
        )}
      </div>

      <NewTripModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
