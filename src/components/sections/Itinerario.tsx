import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronRight } from 'lucide-react';
import JapanMap, { CITIES, type CityConfig } from '../itinerario/JapanMap';
import CityDetailPanel from '../itinerario/CityDetailPanel';
import type { WeatherData } from '../itinerario/WeatherWidget';
import { WeatherWidgetCompact } from '../itinerario/WeatherWidget';
import { supabase } from '../../lib/supabase';
import { exportFullItineraryToPdf } from '../../lib/exportDayPdf';
import { useAdmin } from '../../lib/AdminContext';

interface ItinerarioProps {
  initialCityId?: string;
  initialDayDate?: string;
}

// Per-city vivid glassmorphism gradient configs
const CITY_GLASS: Record<string, {
  gradient: string;
  glow: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  chipBg: string;
  chipText: string;
  shimmer: string;
}> = {
  Osaka: {
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.22) 0%, rgba(190,24,93,0.14) 40%, rgba(14,116,144,0.10) 100%)',
    glow: 'rgba(236,72,153,0.18)',
    border: 'rgba(236,72,153,0.30)',
    badgeBg: 'rgba(236,72,153,0.15)',
    badgeText: '#be185d',
    chipBg: 'rgba(14,116,144,0.12)',
    chipText: '#0e7490',
    shimmer: 'rgba(255,255,255,0.55)',
  },
  Kioto: {
    gradient: 'linear-gradient(135deg, rgba(251,146,60,0.22) 0%, rgba(220,38,38,0.14) 40%, rgba(190,24,93,0.10) 100%)',
    glow: 'rgba(251,146,60,0.20)',
    border: 'rgba(220,38,38,0.28)',
    badgeBg: 'rgba(220,38,38,0.13)',
    badgeText: '#b91c1c',
    chipBg: 'rgba(251,146,60,0.12)',
    chipText: '#b45309',
    shimmer: 'rgba(255,255,255,0.55)',
  },
  Tokio: {
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.22) 0%, rgba(14,116,144,0.16) 40%, rgba(30,64,175,0.10) 100%)',
    glow: 'rgba(56,189,248,0.18)',
    border: 'rgba(56,189,248,0.30)',
    badgeBg: 'rgba(14,116,144,0.13)',
    badgeText: '#0e7490',
    chipBg: 'rgba(56,189,248,0.12)',
    chipText: '#0369a1',
    shimmer: 'rgba(255,255,255,0.55)',
  },
};

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
  const { isAdmin } = useAdmin();

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
            // Date range label
            let range = city.dates;
            if (days && days.length > 0) {
              const first = fmtDate(days[0].date);
              const last = fmtDate(days[days.length - 1].date);
              range = first === last ? first : `${first} – ${last}`;
            }

            // Activity count
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
          <p className="text-sm font-medium" style={{ color: '#334155' }}>Mapa de ruta interactivo · Japón, Diciembre 2025</p>
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

      {/* Map — floating glass frame */}
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
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: '#475569' }}>日本 · Diciembre 2025</span>
          </div>
        </div>
        <div className="px-4 pt-10 pb-0 sm:px-6 sm:pt-12">
          <JapanMap onCityClick={setSelectedCity} selectedCityId={selectedCity?.id} />
        </div>
      </div>

      {/* City cards — vivid glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CITIES.map((city, i) => {
          const glass = CITY_GLASS[city.id] ?? CITY_GLASS['Osaka'];
          const stats = cityStats[city.id];
          const weather = weatherData[city.id];

          return (
            <motion.button
              key={city.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.12, duration: 0.4, ease: 'easeOut' }}
              onClick={() => setSelectedCity(city)}
              className="relative text-left rounded-2xl overflow-hidden group"
              style={{
                background: glass.gradient,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${glass.border}`,
                boxShadow: `0 4px 24px ${glass.glow}, 0 1px 0 rgba(255,255,255,0.55) inset`,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Top shimmer line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${glass.shimmer}, transparent)` }}
              />

              {/* Weather badge — top right */}
              {weather && (
                <div
                  className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  <span className="text-[11px] leading-none">{weather.icon}</span>
                  <span className="text-[11px] font-bold text-white">{weather.temp}°C</span>
                </div>
              )}

              {/* Invisible weather fetcher — no rendered output */}
              <div className="hidden">
                <WeatherWidgetCompact
                  lat={city.lat}
                  lon={city.lon}
                  cityId={city.id}
                  textColor={city.textColor}
                  onData={handleWeatherData(city.id)}
                />
              </div>

              {/* Card body */}
              <div className="p-5">
                {/* Icon + name */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl leading-none">{city.icon}</span>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-lg font-extrabold leading-none mb-1 text-white" style={{ letterSpacing: '-0.02em' }}>
                      {city.name}
                    </p>
                    <p className="text-[11px] font-mono text-white/75">
                      {cityDateRanges[city.id] ?? city.dates}
                    </p>
                  </div>
                </div>

                {/* Stats chip row */}
                <div className="flex items-center gap-2 mb-4">
                  {stats ? (
                    <>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold text-white border border-white/20" style={{ background: 'rgba(255,255,255,0.12)' }}>
                        {stats.days} {stats.days === 1 ? 'día' : 'días'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold text-white border border-white/20" style={{ background: 'rgba(255,255,255,0.12)' }}>
                        {stats.activities} actividades
                      </span>
                    </>
                  ) : null}
                </div>

                {/* Weather description + chevron */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/70">
                    {weather?.description ?? ''}
                  </span>

                  {/* Chevron CTA */}
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 group-hover:translate-x-0.5 text-white shrink-0"
                    style={{ background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.25)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.30)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.20)'; }}
                  >
                    <ChevronRight size={15} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <CityDetailPanel city={selectedCity} onClose={() => setSelectedCity(null)} initialDayDate={initialDayDate} />
    </div>
  );
}
