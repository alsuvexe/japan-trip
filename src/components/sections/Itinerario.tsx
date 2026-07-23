import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import JapanMap, { CITIES, type CityConfig } from '../itinerario/JapanMap';
import CityDetailPanel from '../itinerario/CityDetailPanel';
import { exportFullItineraryToPdf } from '../../lib/exportDayPdf';

interface ItinerarioProps {
  initialCityId?: string;
  initialDayDate?: string;
}

interface CityWeather {
  temp: number;
  icon: string;
  label: string;
}

type WeatherState = 'loading' | 'loaded' | 'error';

function mapWeatherCode(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: '☀️', label: 'Despejado' };
  if (code <= 2) return { icon: '🌤️', label: 'Mayormente despejado' };
  if (code === 3) return { icon: '⛅', label: 'Parcialmente nublado' };
  if (code <= 48) return { icon: '🌫️', label: 'Niebla' };
  if (code <= 57) return { icon: '🌧️', label: 'Llovizna' };
  if (code <= 67) return { icon: '🌧️', label: 'Lluvia' };
  if (code <= 77) return { icon: '❄️', label: 'Nieve' };
  if (code <= 82) return { icon: '🌦️', label: 'Chubascos' };
  if (code <= 86) return { icon: '🌨️', label: 'Nieve intensa' };
  if (code <= 99) return { icon: '⛈️', label: 'Tormenta' };
  return { icon: '🌡️', label: 'Variable' };
}

export default function Itinerario({ initialCityId, initialDayDate }: ItinerarioProps) {
  const [selectedCity, setSelectedCity] = useState<CityConfig | null>(
    () => (initialCityId ? CITIES.find((c) => c.id === initialCityId) ?? null : null),
  );
  const [weather, setWeather] = useState<Record<string, CityWeather>>({});
  const [weatherState, setWeatherState] = useState<Record<string, WeatherState>>({});
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportFullItineraryToPdf();
    } finally {
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    CITIES.forEach(async (city) => {
      setWeatherState((prev) => ({ ...prev, [city.id]: 'loading' }));
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        const cw = data.current_weather;
        if (!cw) throw new Error('No current weather');
        const { icon, label } = mapWeatherCode(cw.weathercode);
        setWeather((prev) => ({
          ...prev,
          [city.id]: { temp: Math.round(cw.temperature), icon, label },
        }));
        setWeatherState((prev) => ({ ...prev, [city.id]: 'loaded' }));
      } catch {
        setWeatherState((prev) => ({ ...prev, [city.id]: 'error' }));
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
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
            Itinerario
          </h2>
          <p className="text-sm font-medium" style={{ color: '#334155' }}>Mapa de ruta interactivo · Japón, Diciembre 2026</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: exportingPdf ? 'rgba(14,116,144,0.08)' : 'rgba(14,116,144,0.10)',
              border: '1px solid rgba(14,116,144,0.28)',
              color: '#0e7490',
            }}
            onMouseEnter={(e) => { if (!exportingPdf) (e.currentTarget as HTMLElement).style.background = 'rgba(14,116,144,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(14,116,144,0.10)'; }}
          >
            <FileText size={15} />
            <span className="hidden sm:inline">{exportingPdf ? 'Generando...' : 'Exportar Itinerario Completo (PDF)'}</span>
            <span className="sm:hidden">{exportingPdf ? '...' : 'PDF'}</span>
          </button>
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.52)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
            <span className="text-xs font-medium font-mono" style={{ color: '#334155' }}>3 ciudades · pulsa para ver detalle</span>
          </div>
        </div>
      </div>

      {/* City cards — interactive tabs (above the map) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {CITIES.map((city, i) => {
          const isActive = selectedCity?.id === city.id;
          const w = weather[city.id];
          const ws = weatherState[city.id];

          return (
            <motion.button
              key={city.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
              onClick={() => setSelectedCity(city)}
              className={`relative text-left rounded-2xl overflow-hidden transition-all duration-300 bg-white/90 backdrop-blur-md ${
                isActive
                  ? 'border-2 border-red-500 shadow-md'
                  : 'border border-slate-200/70 shadow-sm hover:shadow-md hover:border-slate-300'
              }`}
              style={
                isActive
                  ? { boxShadow: '0 4px 6px -1px rgba(239,68,68,0.12), 0 2px 4px -2px rgba(239,68,68,0.08)' }
                  : undefined
              }
              whileHover={{ scale: isActive ? 1.01 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Left accent bar in city color */}
              <div
                className="absolute top-0 left-0 bottom-0 w-1"
                style={{ background: city.accentColor, opacity: isActive ? 1 : 0.35 }}
              />

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="active-dot"
                  className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500"
                  style={{ boxShadow: '0 0 0 3px rgba(239,68,68,0.18)' }}
                />
              )}

              {/* Card content — three rows */}
              <div className="p-4 pl-5">
                {/* Row 1: city icon + name */}
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-2xl leading-none">{city.icon}</span>
                  <span className="text-lg font-bold leading-none" style={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
                    {city.name}
                  </span>
                </div>

                {/* Row 2: dates + nights badge */}
                <div className="flex items-center gap-2 flex-wrap mb-2.5">
                  <span className="text-xs font-medium" style={{ color: '#64748b' }}>
                    {city.dates}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{ background: `${city.accentColor}18`, color: city.accentColor }}
                  >
                    {city.nights}
                  </span>
                </div>

                {/* Row 3: live weather badge */}
                <div>
                  {ws === 'loading' && (
                    <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2 py-1 rounded-md text-xs text-slate-600 animate-pulse">
                      Cargando clima...
                    </span>
                  )}
                  {ws === 'loaded' && w && (
                    <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2 py-1 rounded-md text-xs text-slate-600">
                      <span className="leading-none">{w.icon}</span>
                      <span className="font-semibold">{w.temp}°C</span>
                      <span className="text-slate-400">·</span>
                      <span>{w.label}</span>
                    </span>
                  )}
                  {ws === 'error' && (
                    <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2 py-1 rounded-md text-xs text-slate-400">
                      Clima no disponible
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Map — floating glass frame (below the city cards) */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.70)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.45)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.90)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(14,116,144,0.15) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(190,24,93,0.10) 0%, transparent 70%)' }} />
        </div>
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.60)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: '#475569' }}>日本 · Diciembre 2026</span>
          </div>
        </div>
        <div className="px-4 pt-10 pb-0 sm:px-6 sm:pt-12">
          <JapanMap
            onCityClick={setSelectedCity}
            selectedCityId={selectedCity?.id}
            focusCityId={selectedCity?.id ?? null}
          />
        </div>
      </div>

      <CityDetailPanel city={selectedCity} onClose={() => setSelectedCity(null)} initialDayDate={initialDayDate} />
    </div>
  );
}
