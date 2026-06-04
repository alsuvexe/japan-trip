import { Briefcase, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface LogisticItem {
  id: string;
  category: string;
  title: string;
  description: string;
  date: string | null;
  status: string;
}

const CATEGORY_CONFIG: Record<string, { color: string; textClass: string; bgClass: string; borderClass: string; dotColor: string }> = {
  Transporte:   { color: '#0e7490', textClass: 'text-cyan-700',   bgClass: 'bg-cyan-500/15',   borderClass: 'border-cyan-500/35',   dotColor: '#0e7490' },
  Documentos:   { color: '#be185d', textClass: 'text-pink-700',   bgClass: 'bg-pink-500/15',   borderClass: 'border-pink-500/35',   dotColor: '#be185d' },
  Equipaje:     { color: '#6366f1', textClass: 'text-indigo-700', bgClass: 'bg-indigo-500/15', borderClass: 'border-indigo-500/35', dotColor: '#6366f1' },
  Tecnología:   { color: '#059669', textClass: 'text-emerald-700',bgClass: 'bg-emerald-500/15',borderClass: 'border-emerald-500/35',dotColor: '#059669' },
  Finanzas:     { color: '#b45309', textClass: 'text-amber-700',  bgClass: 'bg-amber-500/15',  borderClass: 'border-amber-500/35',  dotColor: '#b45309' },
  Otros:        { color: '#475569', textClass: 'text-slate-600',  bgClass: 'bg-slate-500/10',  borderClass: 'border-slate-400/30',  dotColor: '#475569' },
};

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

export default function Logistica() {
  const [items, setItems] = useState<LogisticItem[]>([]);

  useEffect(() => { loadLogistics(); }, []);

  const loadLogistics = async () => {
    const { data } = await supabase.from('logistics').select('*').order('date', { ascending: true });
    if (data) setItems(data);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

  const groupByCategory = () => {
    const grouped: Record<string, LogisticItem[]> = {};
    items.forEach((item) => {
      grouped[item.category] = grouped[item.category] || [];
      grouped[item.category].push(item);
    });
    return grouped;
  };

  const groupedItems = groupByCategory();

  return (
    <div className="space-y-6">
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
          Logística
        </h2>
        <p className="text-sm font-medium" style={{ color: '#334155' }}>Organiza todos los detalles de tu viaje</p>
      </div>

      {Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([category, categoryItems]) => {
          const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Otros'];

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${cfg.bgClass} rounded-xl border ${cfg.borderClass}`}>
                  <Briefcase style={{ color: cfg.color }} size={16} />
                </div>
                <h3 className={`text-lg font-bold ${cfg.textClass}`}>{category}</h3>
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${cfg.color}30, transparent)` }} />
              </div>

              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl p-5 border ${cfg.borderClass} transition-all hover:shadow-md`}
                    style={GLASS_CARD}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 shrink-0">
                        {item.status === 'completed' ? (
                          <CheckCircle2 className="text-emerald-600" size={20} />
                        ) : (
                          <Circle style={{ color: '#94a3b8' }} size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1.5">
                          <h4
                            className={`text-base font-bold ${item.status === 'completed' ? 'line-through' : ''}`}
                            style={{ color: item.status === 'completed' ? '#94a3b8' : '#0f172a' }}
                          >
                            {item.title}
                          </h4>
                          {item.date && (
                            <div className="flex items-center gap-1.5 text-xs font-medium ml-4 shrink-0" style={{ color: '#475569' }}>
                              <Calendar size={13} />
                              <span>{formatDate(item.date)}</span>
                            </div>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{item.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.50)' }}>
          <p className="font-medium" style={{ color: '#475569' }}>No hay tareas logísticas registradas todavía</p>
        </div>
      )}

      <div className="rounded-2xl p-6" style={GLASS_CARD}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#0f172a' }}>Recordatorios Importantes</h3>
        <div className="space-y-3">
          {[
            { color: '#0e7490', text: 'Llevar el JR Pass y activarlo en la estación' },
            { color: '#be185d', text: 'Descargar mapas offline de Google Maps' },
            { color: '#6366f1', text: 'Configurar tarjeta SIM o eSIM para datos móviles' },
            { color: '#059669', text: 'Llevar copias impresas de reservas de hoteles' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: item.color }} />
              <p className="text-sm font-medium" style={{ color: '#1e3a5f' }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
