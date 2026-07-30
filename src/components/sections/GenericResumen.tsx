import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Clock, Timer, CheckCircle2, ChevronRight, Compass, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTrips } from '../../lib/TripContext';

interface GenericResumenProps {
  onSectionChange?: (section: string) => void;
}

const COUNTRY_COORDS: Record<string, [number, number]> = {
  austria: [48.2082, 16.3738],
  alemania: [52.52, 13.405],
  italia: [41.9028, 12.4964],
  francia: [48.8566, 2.3522],
  españa: [40.4168, -3.7038],
  portugal: [38.7223, -9.1393],
  grecia: [37.9838, 23.7275],
  japon: [35.6762, 139.6503],
  mexico: [19.4326, -99.1332],
  eeuu: [40.7128, -74.006],
  usa: [40.7128, -74.006],
  peru: [12.0464, -77.0428],
  argentina: [34.6037, -58.3816],
  colombia: [4.711, -74.0721],
  chile: [-33.4489, -70.6693],
  brasil: [-23.5505, -46.6333],
  marruecos: [33.9716, -6.8498],
  tailandia: [13.7563, 100.5018],
  vietnam: [21.0278, 105.8342],
  corea: [37.5665, 126.978],
  turquia: [41.0082, 28.9784],
  uk: [51.5074, -0.1278],
  'reino unido': [51.5074, -0.1278],
  suiza: [46.9481, 7.4474],
  holanda: [52.3676, 4.9041],
  belgica: [50.8503, 4.3517],
  noruega: [59.9139, 10.7522],
  suecia: [59.3293, 18.0686],
  dinamarca: [55.6761, 12.5683],
  islandia: [64.1466, -21.9426],
  croacia: [45.815, 15.9819],
  hungria: [47.4979, 19.0402],
  'republica checa': [50.0755, 14.4378],
  polonia: [52.2297, 21.0122],
  irlanda: [53.3498, -6.2603],
  escocia: [55.9533, -3.1883],
  india: [28.6139, 77.209],
  china: [39.9042, 116.4074],
  australia: [-33.8688, 151.2093],
  'nueva zelanda': [-41.2865, 174.7762],
  canada: [45.4215, -75.6972],
  cuba: [23.1136, -82.3666],
  egypt: [30.0444, 31.2357],
  egipto: [30.0444, 31.2357],
};

function getCountryCoords(destination: string): [number, number] {
  const key = destination.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [name, coords] of Object.entries(COUNTRY_COORDS)) {
    if (key.includes(name)) return coords;
  }
  return [48.2082, 16.3738];
}

function useCountdown(targetDate: string | null) {
  const calc = useCallback(() => {
    if (!targetDate) return null;
    const now = new Date();
    const target = new Date(targetDate + 'T00:00:00');
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [targetDate]);

  const [days, setDays] = useState<number | null>(calc);

  useEffect(() => {
    setDays(calc());
    const id = setInterval(() => setDays(calc()), 60_000);
    return () => clearInterval(id);
  }, [calc]);

  return days;
}

function fmtMonthYear(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtDateShort(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function dayCount(start: string, end: string) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

function MapAutoCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

function createCityIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#0e7490;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function GenericResumen({ onSectionChange }: GenericResumenProps) {
  const { activeTrip, activities } = useTrips();

  if (!activeTrip) return null;

  const daysLeft = useCountdown(activeTrip.startDate);
  const totalDays = dayCount(activeTrip.startDate, activeTrip.endDate);
  const tripActivities = activities.filter((a) => a.tripId === activeTrip.id);
  const dateRange = `${fmtDateShort(activeTrip.startDate)} – ${fmtDateShort(activeTrip.endDate)}`;
  const monthYear = fmtMonthYear(activeTrip.startDate);

  const mapCenter = getCountryCoords(activeTrip.destination);
  const hasMultipleCities = activeTrip.cities.length > 1;

  const nextActivity = tripActivities.length > 0
    ? tripActivities.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0]
    : null;

  return (
    <div className="space-y-6 pb-8">
      {/* HERO BANNER */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255,255,255,0.58)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.85) inset',
        }}
      >
        <div className="absolute inset-0 seigaiha-pattern opacity-40 pointer-events-none" aria-hidden />
        <div
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(14,116,144,0.07) 0%, transparent 70%)' }}
          aria-hidden
        />
        <div
          className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(14,116,144,0.07) 0%, transparent 70%)' }}
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="flex items-center gap-2 mb-4">
            <Plane size={13} style={{ color: '#0e7490' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0e7490' }}>
              Viaje a {activeTrip.destination} · {monthYear}
            </span>
          </div>

          <h1
            className="text-3xl font-extrabold mb-2"
            style={{
              background: activeTrip.theme.accentGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Bienvenidos a {activeTrip.title}
          </h1>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-1.5">
              <Clock size={12} style={{ color: '#334155' }} />
              <span className="text-xs font-medium" style={{ color: '#334155' }}>
                {totalDays} días de viaje
              </span>
            </div>
            <span style={{ color: '#64748b' }}>·</span>
            <span className="text-xs font-medium" style={{ color: '#334155' }}>
              {activeTrip.cities.length} {activeTrip.cities.length === 1 ? 'ciudad' : 'ciudades'}
            </span>
            <span style={{ color: '#64748b' }}>·</span>
            <span className="text-xs font-medium" style={{ color: '#334155' }}>{dateRange}</span>
          </div>
        </div>
      </div>

      {/* 3-COL STATUS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Countdown */}
        <div className="rounded-2xl p-4 flex flex-col justify-between" style={{ ...GLASS_CARD, minHeight: 110 }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Timer size={13} style={{ color: '#0e7490' }} strokeWidth={1.75} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
              Días para el viaje
            </span>
          </div>
          {daysLeft !== null ? (
            <>
              <p
                className="font-black leading-none"
                style={{
                  fontSize: 'clamp(2rem, 8vw, 2.75rem)',
                  background: activeTrip.theme.accentGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.04em',
                }}
              >
                {daysLeft === 0 ? '¡Ya!' : daysLeft}
              </p>
              <p className="text-[10px] font-medium mt-1" style={{ color: '#94a3b8' }}>
                {daysLeft === 0 ? '¡Hoy comienza!' : daysLeft === 1 ? 'mañana despega' : 'días restantes'}
              </p>
            </>
          ) : (
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mt-2"
              style={{ borderColor: 'rgba(14,116,144,0.20)', borderTopColor: '#0e7490' }}
            />
          )}
        </div>

        {/* Tasks */}
        <button
          onClick={() => onSectionChange?.('todos')}
          className="group rounded-2xl p-4 flex flex-col text-left transition-all duration-200"
          style={{ ...GLASS_CARD, minHeight: 110 }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,116,144,0.40)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.90)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.52)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.75)';
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} style={{ color: '#0e7490' }} strokeWidth={1.75} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                Tareas pendientes
              </span>
            </div>
            <ChevronRight size={11} style={{ color: '#a0aec0' }} className="group-hover:text-cyan-600 transition-colors" />
          </div>
          <p
            className="font-black leading-none"
            style={{
              fontSize: 'clamp(1.6rem, 6vw, 2.2rem)',
              color: '#0e7490',
              letterSpacing: '-0.04em',
            }}
          >
            {tripActivities.length}
          </p>
          <p className="text-[10px] font-medium mt-1" style={{ color: '#94a3b8' }}>
            actividades planificadas
          </p>
        </button>

        {/* Next Step */}
        <button
          onClick={() => onSectionChange?.('itinerario')}
          className="col-span-2 sm:col-span-1 group rounded-2xl p-4 flex flex-col justify-between text-left transition-all duration-200"
          style={{ ...GLASS_CARD, minHeight: 110 }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,116,144,0.40)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.90)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.52)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.75)';
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Compass size={13} style={{ color: '#0e7490' }} strokeWidth={1.75} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                Próximo paso
              </span>
            </div>
            <ChevronRight size={11} style={{ color: '#a0aec0' }} className="group-hover:text-cyan-600 transition-colors" />
          </div>
          <p
            className="font-black leading-snug"
            style={{ fontSize: 'clamp(1rem, 4vw, 1.4rem)', color: '#0e7490', letterSpacing: '-0.03em' }}
          >
            {nextActivity ? nextActivity.location || nextActivity.note || 'Actividad' : 'Sin actividades'}
          </p>
          <p className="text-[10px] font-medium mt-1" style={{ color: '#94a3b8' }}>
            {nextActivity
              ? `${fmtDateShort(nextActivity.date)}${nextActivity.time ? ` a las ${nextActivity.time}` : ''}`
              : 'Añade actividades al itinerario'}
          </p>
        </button>
      </div>

      {/* INTERACTIVE MAP */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a0aec0' }}>
            Ruta · {activeTrip.destination} {monthYear}
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.07)' }} />
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.52)', backdropFilter: 'blur(12px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
            <span className="text-[10px] font-medium" style={{ color: '#334155' }}>
              {activeTrip.cities.length} {activeTrip.cities.length === 1 ? 'ciudad' : 'ciudades'}
            </span>
          </div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ ...GLASS_CARD, boxShadow: '0 8px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)' }}
        >
          <div className="h-64 sm:h-80">
            <MapContainer
              center={mapCenter}
              zoom={hasMultipleCities ? 6 : 10}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <MapAutoCenter center={mapCenter} zoom={hasMultipleCities ? 6 : 10} />
              <Marker position={mapCenter} icon={createCityIcon()} />
              {hasMultipleCities && (
                <Polyline
                  positions={[mapCenter, mapCenter]}
                  pathOptions={{ color: '#0e7490', weight: 2, dashArray: '6 4', opacity: 0.6 }}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* CITY CARDS */}
      {activeTrip.cities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {activeTrip.cities.map((city, i) => (
            <motion.button
              key={city}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.10, type: 'spring', stiffness: 260, damping: 22 }}
              onClick={() => onSectionChange?.('itinerario')}
              whileHover={{ y: -5, scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              className="group relative rounded-3xl text-left overflow-hidden cursor-pointer"
              style={{
                background: 'linear-gradient(145deg, rgba(186,230,253,0.55) 0%, rgba(255,255,255,0.72) 100%)',
                border: '1.5px solid rgba(14,116,144,0.25)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                boxShadow: '0 4px 24px rgba(14,116,144,0.10), 0 1px 0 rgba(255,255,255,0.70) inset',
              }}
            >
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(14,116,144,0.15) 0%, transparent 70%)' }}
              />
              <div className="relative z-10 p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <MapPin size={18} style={{ color: '#0e7490' }} />
                  <p className="text-lg font-extrabold tracking-tight" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                    {city}
                  </p>
                </div>
                <div className="w-full h-px mb-2" style={{ background: 'rgba(14,116,144,0.12)' }} />
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(14,116,144,0.08)', color: '#0e7490' }}>
                  {activeTrip.destination}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
