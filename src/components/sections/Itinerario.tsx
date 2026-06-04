import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
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

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

export default function Itinerario({ initialCityId, initialDayDate }: ItinerarioProps) {
  const [selectedCity, setSelectedCity] = useState<CityConfig | null>(
    () => (initialCityId ? CITIES.find((c) => c.id === initialCityId) ?? null : null),
  );
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  const [cityDateRanges, setCityDateRanges] = useState<Record<string, string>>({});
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
          .select('date')
          .eq('city', city.id)
          .order('date', { ascending: true })
          .then(({ data }) => {
            if (!data || data.length === 0) return [city.id, city.dates] as const;
            const first = fmtDate(data[0].date);
            const last = fmtDate(data[data.length - 1].date);
            const range = first === last ? first : `${first} – ${last}`;
            return [city.id, range] as const;
          })
      )
    ).then((entries) => {
      setCityDateRanges(Object.fromEntries(entries));
    });
  }, []);

  const handleWeatherData = useCallback((cityId: string) => (data: WeatherData) => {
    setWeatherData((prev) => ({ ...prev, [cityId]: data }));
  }, []);

  return (
    <div className="space-y-6">
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

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          ...GLASS_CARD,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
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
          <JapanMap
            onCityClick={setSelectedCity}
            selectedCityId={selectedCity?.id}
          />
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CITIES.map((city, i) => (
          <motion.button
            key={city.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 + i * 0.1 }}
            onClick={() => setSelectedCity(city)}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${city.borderColor} hover:opacity-90`}
            style={GLASS_CARD}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 opacity-[0.06]" style={{ background: `radial-gradient(circle at 20% 50%, ${city.dotColor}, transparent 65%)` }} />
            <div className="text-2xl mb-2.5">{city.icon}</div>
            <p className={`text-sm font-bold ${city.textColor}`}>{city.name}</p>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: '#475569' }}>
              {cityDateRanges[city.id] ?? city.dates}
            </p>
            <div className="mt-3">
              <WeatherWidgetCompact
                lat={city.lat}
                lon={city.lon}
                cityId={city.id}
                textColor={city.textColor}
                onData={handleWeatherData(city.id)}
              />
            </div>
          </motion.button>
        ))}
      </div>

      <CityDetailPanel city={selectedCity} onClose={() => setSelectedCity(null)} initialDayDate={initialDayDate} />
    </div>
  );
}
