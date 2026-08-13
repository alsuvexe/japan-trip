import { useEffect, useState } from 'react';
import { UtensilsCrossed, MapPin, X, ExternalLink, ChevronRight, Clock, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

interface RestaurantActivity {
  id: string;
  day_id: string;
  title: string;
  time: string;
  category: string;
  restaurant_service: string;
  restaurant_name: string;
  restaurant_food_type: string;
  restaurant_avg_price: string;
  restaurant_notes: string;
  description: string;
  day_date: string;
  day_city: string;
  day_number: number;
}

interface ItineraryDay {
  id: string;
  date: string;
  city: string;
}

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

const SERVICE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Desayuno: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  Almuerzo: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  Cena: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
  'Cena opcional': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
  'Snack/Street Food': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
};

const CITY_COLORS: Record<string, string> = {
  Osaka: '#0e7490',
  Kioto: '#be185d',
  Tokio: '#0369a1',
};

function ServiceBadge({ service }: { service: string }) {
  const style = SERVICE_STYLES[service] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
      {service || 'Comida'}
    </span>
  );
}

interface RestaurantesSectionProps {
  onSectionChange?: (section: string, city?: string, dayDate?: string) => void;
}

export default function Restaurantes({ onSectionChange }: RestaurantesSectionProps) {
  const [items, setItems] = useState<RestaurantActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RestaurantActivity | null>(null);

  useEffect(() => {
    loadRestaurantActivities();

    const channel = supabase
      .channel('restaurantes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'day_activities' }, () => {
        loadRestaurantActivities();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itinerary_days' }, () => {
        loadRestaurantActivities();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadRestaurantActivities() {
    const { data: days } = await supabase
      .from('itinerary_days')
      .select('id, date, city')
      .order('date', { ascending: true });

    if (!days || days.length === 0) { setItems([]); setLoading(false); return; }

    const { data: activities } = await supabase
      .from('day_activities')
      .select('*')
      .eq('category', 'restaurant')
      .order('time', { ascending: true });

    if (!activities) { setItems([]); setLoading(false); return; }

    const dayMap = new Map<string, ItineraryDay>(days.map((d) => [d.id, d]));
    const startDate = days[0].date;

    const result: RestaurantActivity[] = activities
      .map((act) => {
        const day = dayMap.get(act.day_id);
        if (!day) return null;
        const dayNumber = Math.round(
          (new Date(day.date + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;
        return {
          id: act.id,
          day_id: act.day_id,
          title: act.title,
          time: act.time || '',
          category: act.category,
          restaurant_service: act.restaurant_service || '',
          restaurant_name: act.restaurant_name || '',
          restaurant_food_type: act.restaurant_food_type || '',
          restaurant_avg_price: act.restaurant_avg_price || '',
          restaurant_notes: act.restaurant_notes || '',
          description: act.description || '',
          day_date: day.date,
          day_city: day.city,
          day_number: dayNumber,
        };
      })
      .filter(Boolean) as RestaurantActivity[];

    setItems(result.sort((a, b) => a.day_number - b.day_number || a.time.localeCompare(b.time)));
    setLoading(false);
  }

  const uniqueCities = [...new Set(items.map((i) => i.day_city))];
  const totalMeals = items.length;
  const serviceCount = items.reduce<Record<string, number>>((acc, i) => {
    const s = i.restaurant_service || 'Sin servicio';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-3xl font-extrabold mb-2"
          style={{
            background: 'linear-gradient(90deg, #ea580c 0%, #be185d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Plan Gastronómico
        </h2>
        <p className="text-sm font-medium" style={{ color: '#334155' }}>
          Todas las comidas planificadas en el itinerario
        </p>
      </div>

      {/* Stats Row */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl p-3 text-center" style={GLASS_CARD}>
            <p className="text-xl font-black" style={{ color: '#ea580c' }}>{totalMeals}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#475569' }}>Comidas</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={GLASS_CARD}>
            <p className="text-xl font-black" style={{ color: '#0e7490' }}>{uniqueCities.length}</p>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#475569' }}>Ciudades</p>
          </div>
          {Object.entries(serviceCount).slice(0, 2).map(([service, count]) => (
            <div key={service} className="rounded-xl p-3 text-center" style={GLASS_CARD}>
              <p className="text-xl font-black" style={{ color: '#be185d' }}>{count}</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#475569' }}>{service}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(234,88,12,0.20)', borderTopColor: '#ea580c' }} />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.50)' }}>
          <UtensilsCrossed size={36} style={{ color: '#94a3b8' }} className="mx-auto mb-3" />
          <p className="font-semibold mb-1" style={{ color: '#475569' }}>Sin comidas planificadas</p>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Añade actividades de tipo "Comida" en el itinerario y aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={GLASS_CARD}>
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-200/60">
            <div className="col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Ciudad</span>
            </div>
            <div className="col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Día</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Servicio</span>
            </div>
            <div className="col-span-3">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Restaurante</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Tipo de comida</span>
            </div>
            <div className="col-span-2 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Precio medio</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100/70">
            {items.map((item) => {
              const cityColor = CITY_COLORS[item.day_city] || '#475569';
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="w-full grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-4 py-3 text-left transition-all hover:bg-white/80 group"
                >
                  {/* Mobile layout */}
                  <div className="sm:hidden space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cityColor }} />
                        <span className="text-xs font-bold" style={{ color: cityColor }}>{item.day_city}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100" style={{ color: '#64748b' }}>Día {item.day_number}</span>
                        <ServiceBadge service={item.restaurant_service} />
                      </div>
                      <ChevronRight size={14} style={{ color: '#94a3b8' }} className="group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: '#0f172a' }}>{item.restaurant_name || item.title}</span>
                      {item.restaurant_avg_price && (
                        <span className="text-xs font-bold" style={{ color: '#ea580c' }}>{item.restaurant_avg_price}</span>
                      )}
                    </div>
                    {item.restaurant_food_type && (
                      <span className="text-xs" style={{ color: '#64748b' }}>{item.restaurant_food_type}</span>
                    )}
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:flex col-span-2 items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cityColor }} />
                    <span className="text-xs font-bold truncate" style={{ color: cityColor }}>{item.day_city}</span>
                  </div>
                  <div className="hidden sm:flex col-span-1 items-center">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100" style={{ color: '#334155' }}>{item.day_number}</span>
                  </div>
                  <div className="hidden sm:flex col-span-2 items-center">
                    <ServiceBadge service={item.restaurant_service} />
                  </div>
                  <div className="hidden sm:flex col-span-3 items-center gap-1.5">
                    <span className="text-sm font-bold truncate" style={{ color: '#0f172a' }}>{item.restaurant_name || item.title}</span>
                    <ChevronRight size={12} style={{ color: '#94a3b8' }} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="hidden sm:flex col-span-2 items-center">
                    <span className="text-xs truncate" style={{ color: '#64748b' }}>{item.restaurant_food_type}</span>
                  </div>
                  <div className="hidden sm:flex col-span-2 items-center justify-end">
                    <span className="text-xs font-bold" style={{ color: '#ea580c' }}>{item.restaurant_avg_price || '—'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="" size="xl">
        {selectedItem && (
          <div className="space-y-5">
            {/* Header - large restaurant name with high contrast */}
            <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-orange-500/20 border border-orange-400/30 shrink-0">
                  <UtensilsCrossed size={26} className="text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">
                    {selectedItem.restaurant_name || selectedItem.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs font-semibold text-orange-300">
                      <MapPin size={11} />
                      {selectedItem.day_city}
                    </span>
                    <span className="text-[10px] text-slate-500">·</span>
                    <span className="text-xs font-medium text-slate-400">Día {selectedItem.day_number}</span>
                    {selectedItem.time && (
                      <>
                        <span className="text-[10px] text-slate-500">·</span>
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><Clock size={10} />{selectedItem.time}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left column - metadata cards */}
              <div className="space-y-4">
                {/* Info cards */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedItem.restaurant_service && (
                    <div className="rounded-xl p-3 bg-orange-50 border border-orange-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Servicio</p>
                      <ServiceBadge service={selectedItem.restaurant_service} />
                    </div>
                  )}
                  {selectedItem.restaurant_food_type && (
                    <div className="rounded-xl p-3 bg-amber-50 border border-amber-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Tipo de cocina</p>
                      <p className="text-sm font-semibold" style={{ color: '#92400e' }}>{selectedItem.restaurant_food_type}</p>
                    </div>
                  )}
                  {selectedItem.restaurant_avg_price && (
                    <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Precio medio</p>
                      <p className="text-sm font-bold flex items-center gap-1" style={{ color: '#065f46' }}>
                        <DollarSign size={12} />
                        {selectedItem.restaurant_avg_price.includes('¥') ? selectedItem.restaurant_avg_price : `${selectedItem.restaurant_avg_price} ¥`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Address with Google Maps link */}
                {selectedItem.description && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((selectedItem.restaurant_name ? selectedItem.restaurant_name + ' ' : '') + selectedItem.description)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all group cursor-pointer"
                  >
                    <MapPin size={16} className="shrink-0 text-rose-400 group-hover:text-rose-500 transition-colors" />
                    <span className="text-sm font-medium group-hover:underline" style={{ color: '#334155' }}>{selectedItem.description}</span>
                    <ExternalLink size={11} className="shrink-0 text-slate-400 ml-auto" />
                  </a>
                )}

                {/* Image gallery from notes URLs */}
                {(() => {
                  const notesText = selectedItem.restaurant_notes || '';
                  const imgRegex = /(https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>)]*)?)/gi;
                  const imageUrls = notesText.match(imgRegex) || [];
                  if (imageUrls.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Galería</p>
                      <div className={`grid gap-2 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {imageUrls.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 hover:border-slate-300 transition-all hover:shadow-md">
                            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-36 object-cover" loading="lazy" />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Attachment image */}
                {selectedItem.attachment_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(selectedItem.attachment_url) && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Adjunto</p>
                    <a href={selectedItem.attachment_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 hover:shadow-md transition-all">
                      <img src={selectedItem.attachment_url} alt={selectedItem.attachment_name || 'Adjunto'} className="w-full max-h-48 object-cover" loading="lazy" />
                    </a>
                  </div>
                )}
              </div>

              {/* Right column - Notes */}
              <div className="space-y-4">
                {(selectedItem.restaurant_notes || selectedItem.description) && (
                  <div className="rounded-xl p-4 bg-slate-50 border border-slate-100 h-full">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>Notas y detalles</p>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap space-y-3" style={{ color: '#334155' }}>
                      {(() => {
                        const text = selectedItem.restaurant_notes || selectedItem.description || '';
                        const imgRegex = /(https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>)]*)?)/gi;
                        const cleanText = text.replace(imgRegex, '').trim();
                        return cleanText || null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setSelectedItem(null);
                onSectionChange?.('itinerario', selectedItem.day_city, selectedItem.day_date);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-md"
              style={{ background: 'linear-gradient(135deg, #ea580c, #be185d)', color: 'white' }}
            >
              <ExternalLink size={15} />
              Editar en Itinerario
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
