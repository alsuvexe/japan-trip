import { MapPin, Hotel, UtensilsCrossed, Brain as Train } from 'lucide-react';

const CITY_CONFIG = [
  {
    name: 'Osaka',
    color: '#0e7490',
    textClass: 'text-cyan-700',
    bgClass: 'bg-cyan-500/15',
    borderClass: 'border-cyan-500/35',
    dotClass: 'bg-cyan-500',
    position: { top: '58%', left: '45%' },
    attractions: ['Castillo de Osaka', 'Dotonbori', 'Templo Shitennō-ji', 'Umeda Sky Building'],
  },
  {
    name: 'Kioto',
    color: '#be185d',
    textClass: 'text-pink-700',
    bgClass: 'bg-pink-500/15',
    borderClass: 'border-pink-500/35',
    dotClass: 'bg-pink-500',
    position: { top: '52%', left: '42%' },
    attractions: ['Fushimi Inari', 'Kinkaku-ji (Pabellón Dorado)', 'Arashiyama', 'Gion'],
  },
  {
    name: 'Tokio',
    color: '#6366f1',
    textClass: 'text-indigo-700',
    bgClass: 'bg-indigo-500/15',
    borderClass: 'border-indigo-500/35',
    dotClass: 'bg-indigo-500',
    position: { top: '42%', left: '68%' },
    attractions: ['Shibuya Crossing', 'Senso-ji', 'Tokyo Skytree', 'Akihabara'],
  },
];

const connections = [
  { from: { top: '58%', left: '45%' }, to: { top: '52%', left: '42%' } },
  { from: { top: '52%', left: '42%' }, to: { top: '42%', left: '68%' } },
];

export default function Mapa() {
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
          Mapa
        </h2>
        <p className="text-sm font-medium" style={{ color: '#334155' }}>Visualiza tu ruta por Japón</p>
      </div>

      <div
        className="rounded-2xl p-6 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255,255,255,0.52)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        }}
      >
        <div
          className="relative w-full rounded-xl overflow-hidden"
          style={{
            height: 500,
            background: 'linear-gradient(135deg, rgba(186,230,253,0.45) 0%, rgba(224,242,254,0.55) 50%, rgba(219,234,254,0.45) 100%)',
            border: '1px solid rgba(255,255,255,0.60)',
          }}
        >
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(14,116,144,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14,116,144,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <svg className="absolute inset-0 w-full h-full">
            {connections.map((conn, idx) => (
              <line
                key={idx}
                x1={conn.from.left}
                y1={conn.from.top}
                x2={conn.to.left}
                y2={conn.to.top}
                stroke="url(#route-gradient)"
                strokeWidth="2.5"
                strokeDasharray="8,5"
                opacity="0.7"
              />
            ))}
            <defs>
              <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0e7490" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#be185d" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>

          {CITY_CONFIG.map((city) => (
            <div
              key={city.name}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={city.position}
            >
              <div
                className={`relative flex items-center justify-center w-16 h-16 ${city.bgClass} border-2 ${city.borderClass} rounded-full cursor-pointer transition-all hover:scale-110`}
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: `0 4px 16px ${city.color}30`,
                }}
              >
                <MapPin style={{ color: city.color }} size={26} strokeWidth={2} />
                <div
                  className={`absolute w-20 h-20 rounded-full animate-ping`}
                  style={{ background: `${city.color}18` }}
                />
              </div>

              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div
                  className={`rounded-xl p-4 min-w-[200px] border ${city.borderClass}`}
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                >
                  <h3 className={`text-base font-bold ${city.textClass} mb-2`}>{city.name}</h3>
                  <ul className="space-y-1">
                    {city.attractions.map((a, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2" style={{ color: '#1e3a5f' }}>
                        <span className={city.textClass} style={{ marginTop: 2 }}>•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Train className="text-cyan-600" size={16} />
            <span className="font-medium" style={{ color: '#334155' }}>Ruta en tren</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="text-pink-600" size={16} />
            <span className="font-medium" style={{ color: '#334155' }}>Destinos principales</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CITY_CONFIG.map((city) => (
          <div
            key={city.name}
            className={`rounded-2xl p-5 border ${city.borderClass} transition-all`}
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 ${city.bgClass} rounded-xl`}>
                <MapPin style={{ color: city.color }} size={20} />
              </div>
              <h3 className={`text-base font-bold ${city.textClass}`}>{city.name}</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Hotel size={14} style={{ color: '#64748b' }} />
                <span className="font-medium" style={{ color: '#334155' }}>Alojamiento reservado</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <UtensilsCrossed size={14} style={{ color: '#64748b' }} />
                <span className="font-medium" style={{ color: '#334155' }}>Restaurantes seleccionados</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
