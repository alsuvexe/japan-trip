import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import JapanMap, { CITIES, type CityConfig } from '../itinerario/JapanMap';
import CityDetailPanel from '../itinerario/CityDetailPanel';
import type { WeatherData } from '../itinerario/WeatherWidget';
import { WeatherWidgetCompact } from '../itinerario/WeatherWidget';
import { supabase } from '../../lib/supabase';
import { exportFullItineraryToPdf } from '../../lib/exportDayPdf';

interface ItinerarioProps {
  initialCityId?: string;
  initialDayDate?: string;
}

interface CityStats {
  days: number;
  activities: number;
}

export default function Itinerario({ initialCityId, initialDayDate }: ItinerarioProps) {
  const [selectedCity, setSelectedCity] = useState<CityConfig | null>(
    () => (initialCityId ? CITIES.find((c) => c.id === initialCityId) ?? null : null),
  );
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  const [cityDateRanges, setCityDateRanges] = useState<Record<string, string>>({});
  const [cityStats, setCityStats] = useState<Record<string, CityStats>>({});
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
    const fmtDate = (d: string) =>
      new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    Promise.all(
      CITIES.map((city) =>
        supabase
          .from('itinerary_days')
          .select('id, date')
          .eq('city', city.id)
          .order('date', { ascending: true })
          .then(async ({ data: days }) => {
            let range = city.dates;
            if (days && days.length > 0) {
              const first = fmtDate(days[0].date);
              const last = fmtDate(days[days.length - 1].date);
              range = first === last ? first : `${first} – ${last}`;
            }

            const dayIds = (days ?? []).map((d) => d.id);
            let activityCount = 0;
            if (dayIds.length > 0) {
              const { count } = await supabase
                .from('day_activities')
                .select('id', { count: 'exact', head: true })
                .in('day_id', dayIds);
              activityCount = count ?? 0;
            }

            return [city.id, { range, days: days?.length ?? 0, activities: activityCount }] as const;
          })
      )
    ).then((entries) => {
      const ranges: Record<string, string> = {};
      const stats: Record<string, CityStats> = {};
      for (const [id, { range, days, activities }] of entries) {
        ranges[id] = range;
        stats[id] = { days, activities };
      }
      setCityDateRanges(ranges);
      setCityStats(stats);
    });
  }, []);

  const handleWeatherData = useCallback((cityId: string) => (data: WeatherData) => {
    setWeatherData((prev) => ({ ...prev, [cityId]: data }));
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
          const stats = cityStats[city.id];
          const weather = weatherData[city.id];
          const nights = stats ? Math.max(1, stats.days - 1) : null;
          const nightsLabel = nights === 1 ? '1 Noche' : `${nights} Noches`;

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

              {/* Invisible weather fetcher */}
              <div className="hidden">
                <WeatherWidgetCompact
                  lat={city.lat}
                  lon={city.lon}
                  cityId={city.id}
                  textColor={city.textColor}
                  onData={handleWeatherData(city.id)}
                />
              </div>

              {/* Card content */}
              <div className="p-4 pl-5">
                {/* Top row: icon + name | weather */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{city.icon}</span>
                    <span className="text-lg font-bold leading-none" style={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
                      {city.name}
                    </span>
                  </div>
                  {weather && (
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
                      style={{ background: 'rgba(241,245,249,0.80)' }}
                    >
                      <span className="text-sm leading-none">{weather.icon}</span>
                      <span className="text-sm font-semibold leading-none" style={{ color: '#475569' }}>
                        {weather.temp}°C
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom row: dates + nights */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium" style={{ color: '#64748b' }}>
                    {cityDateRanges[city.id] ?? city.dates} 2026
                  </span>
                  {nights !== null && (
                    <>
                      <span className="text-xs" style={{ color: '#cbd5e1' }}>·</span>
                      <span className="text-xs font-bold" style={{ color: city.accentColor }}>
                        {nightsLabel}
                      </span>
                    </>
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
