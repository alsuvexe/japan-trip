import { useCallback, useEffect, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from 'react-simple-maps';
import { Plus, Minus, Home } from 'lucide-react';

export interface CityConfig {
  id: string;
  name: string;
  dates: string;
  icon: string;
  glowColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  accentColor: string;
  lat: number;
  lon: number;
}

export const CITIES: CityConfig[] = [
  {
    id: 'Osaka',
    name: 'Osaka',
    dates: '3 – 5 dic',
    icon: '🏯',
    glowColor: 'rgba(14,116,144,0.3)',
    borderColor: 'border-cyan-500/40',
    bgColor: 'bg-cyan-500/15',
    textColor: 'text-cyan-700',
    dotColor: '#0e7490',
    accentColor: '#0e7490',
    lat: 34.6937,
    lon: 135.5023,
  },
  {
    id: 'Kioto',
    name: 'Kioto',
    dates: '6 – 9 dic',
    icon: '⛩️',
    glowColor: 'rgba(190,24,93,0.3)',
    borderColor: 'border-pink-500/40',
    bgColor: 'bg-pink-500/15',
    textColor: 'text-pink-700',
    dotColor: '#be185d',
    accentColor: '#be185d',
    lat: 35.0116,
    lon: 135.7681,
  },
  {
    id: 'Tokio',
    name: 'Tokio',
    dates: '10 – 14 dic',
    icon: '🗼',
    glowColor: 'rgba(14,116,144,0.25)',
    borderColor: 'border-sky-500/40',
    bgColor: 'bg-sky-500/15',
    textColor: 'text-sky-700',
    dotColor: '#0369a1',
    accentColor: '#0369a1',
    lat: 35.6762,
    lon: 139.6503,
  },
];

const ROUTES = [
  { from: CITIES[0], to: CITIES[1], color: '#6b7fa3' },
  { from: CITIES[1], to: CITIES[2], color: '#7a8fb5' },
];

const GEO_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson';

const DEFAULT_CENTER: [number, number] = [137.5, 35.4];
const DEFAULT_ZOOM = 4;
const MIN_ZOOM = 1.5;
const MAX_ZOOM = 12;
const ZOOM_STEP = 1.5;

interface JapanMapProps {
  onCityClick: (city: CityConfig) => void;
  selectedCityId?: string;
}

function PulseMarker({
  city, isSelected, onClick, zoom,
}: {
  city: CityConfig; isSelected: boolean; onClick: () => void; zoom: number;
}) {
  const [tick, setTick] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick((p) => p + 1), 50);
    return () => clearInterval(t);
  }, []);

  const phase = (tick % 60) / 60;
  const pulse = Math.sin(phase * Math.PI * 2);
  const outerOpacity = 0.10 + pulse * 0.08;

  const s = 1 / zoom;

  const dotR = (isSelected || hovered ? 7 : 5.5) * s;
  const innerR = 2.2 * s;
  const pulseR1 = (9 + pulse * 3) * s;
  const pulseR2 = (16 + pulse * 5) * s;

  const iconSize = 22 * s;
  const nameSize = 13 * s;
  const padH = 7 * s;
  const padL = 10 * s;
  const padR = 13 * s;
  const gap = 7 * s;
  const nameCharW = nameSize * 0.62;
  const nameW = city.name.length * nameCharW;
  const cardW = padL + iconSize + gap + nameW + padR;
  const cardH = iconSize + padH * 2;
  const cardRadius = cardH / 2;
  const cardPad = 9 * s;

  const isLeft = city.lon < 137.5;
  const cardX = isLeft ? -(cardW + cardPad) : cardPad;
  const cardY = -(cardH / 2);
  const iconCX = cardX + padL + iconSize / 2;
  const nameX = cardX + padL + iconSize + gap;
  const highlighted = isSelected || hovered;

  return (
    <Marker coordinates={[city.lon, city.lat]}>
      <g
        style={{ cursor: 'pointer' }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Pulse rings */}
        <circle r={pulseR2} fill={city.accentColor} opacity={outerOpacity * 0.45} />
        <circle r={pulseR1} fill={city.accentColor} opacity={outerOpacity * 1.1} />

        {/* Main dot */}
        <circle
          r={dotR}
          fill={city.accentColor}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={(highlighted ? 2.2 : 1.5) * s}
          opacity={0.97}
          filter="url(#dot-glow)"
        />
        <circle r={innerR} fill="rgba(255,255,255,0.92)" opacity={0.95} />

        {/* Card drop shadow */}
        <rect
          x={cardX + 0.8 * s}
          y={cardY + 2.5 * s}
          width={cardW}
          height={cardH}
          rx={cardRadius}
          ry={cardRadius}
          fill="rgba(0,0,0,0.13)"
        />

        {/* Glass card body */}
        <rect
          x={cardX}
          y={cardY}
          width={cardW}
          height={cardH}
          rx={cardRadius}
          ry={cardRadius}
          fill={highlighted ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.82)'}
          stroke={city.accentColor}
          strokeWidth={(highlighted ? 1.6 : 1.0) * s}
          strokeOpacity={highlighted ? 1 : 0.55}
        />

        {/* Top highlight shimmer */}
        <rect
          x={cardX + 2 * s}
          y={cardY + 1.5 * s}
          width={cardW - 4 * s}
          height={cardH * 0.4}
          rx={cardRadius}
          ry={cardRadius}
          fill="rgba(255,255,255,0.40)"
        />

        {/* Emoji icon */}
        <text
          x={iconCX}
          y={cardY + cardH / 2}
          fontSize={iconSize}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {city.icon}
        </text>

        {/* City name */}
        <text
          x={nameX}
          y={cardY + cardH / 2}
          fontSize={nameSize}
          fill={highlighted ? city.accentColor : '#1e293b'}
          fontWeight="700"
          textAnchor="start"
          dominantBaseline="central"
        >
          {city.name}
        </text>

        {/* Invisible expanded hit area */}
        <rect
          x={cardX - dotR * 2}
          y={cardY - dotR * 2}
          width={cardW + dotR * 4}
          height={cardH + dotR * 4}
          fill="transparent"
        />
      </g>
    </Marker>
  );
}

function ZoomControls({
  onZoomIn, onZoomOut, onReset,
}: {
  onZoomIn: () => void; onZoomOut: () => void; onReset: () => void;
}) {
  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: '#475569',
    transition: 'color 0.15s, background 0.15s',
  };

  return (
    <div
      className="absolute top-3 right-3 z-10 flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.88)',
        border: '1px solid rgba(255,255,255,0.65)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      }}
    >
      {[
        { icon: <Plus size={14} strokeWidth={2.5} />, handler: onZoomIn, title: 'Acercar' },
        { icon: <Minus size={14} strokeWidth={2.5} />, handler: onZoomOut, title: 'Alejar' },
        { icon: <Home size={13} strokeWidth={2} />, handler: onReset, title: 'Restablecer vista' },
      ].map(({ icon, handler, title }, i) => (
        <button
          key={i}
          title={title}
          onClick={handler}
          style={btnBase}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(14,116,144,0.10)';
            (e.currentTarget as HTMLButtonElement).style.color = '#0e7490';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#475569';
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

export default function JapanMap({ onCityClick, selectedCityId }: JapanMapProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);

  const handleMoveEnd = useCallback(({ zoom: z, coordinates }: { zoom: number; coordinates: [number, number] }) => {
    setZoom(z);
    setCenter(coordinates);
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z * ZOOM_STEP, MAX_ZOOM)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z / ZOOM_STEP, MIN_ZOOM)), []);
  const reset = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setCenter(DEFAULT_CENTER);
  }, []);

  return (
    <div className="relative w-full select-none">
      {/* SVG filter defs (outside the map so filters are always available) */}
      <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <filter id="dot-glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />

      {/* Map container — washi-paper ocean background */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #a8cfe0 0%, #8bb8d4 30%, #7aaec8 60%, #8bbfd6 100%)',
          boxShadow: 'inset 0 0 60px rgba(255,255,255,0.15)',
        }}
      >
        {/* Subtle water-shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background:
              'radial-gradient(ellipse at 30% 60%, rgba(255,255,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 75% 30%, rgba(255,255,255,0.06) 0%, transparent 50%)',
          }}
        />

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: DEFAULT_CENTER, scale: 900 }}
          width={900}
          height={560}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            <pattern id="sea-dots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="9" cy="9" r="0.5" fill="rgba(255,255,255,0.18)" />
            </pattern>
          </defs>

          <rect x={0} y={0} width={900} height={560} fill="url(#sea-dots)" />

          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={handleMoveEnd}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            style={{ cursor: 'grab' }}
          >
            {/* Japan landmass — washi cream */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies
                  .filter(
                    (geo) =>
                      geo.properties.ADMIN === 'Japan' ||
                      geo.properties.NAME === 'Japan' ||
                      geo.properties.name === 'Japan' ||
                      geo.properties.ISO_A3 === 'JPN',
                  )
                  .map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: '#f0e8d8',
                          stroke: 'rgba(180,150,100,0.50)',
                          strokeWidth: 0.5,
                          outline: 'none',
                          filter: 'drop-shadow(0px 2px 6px rgba(80,60,30,0.18))',
                        },
                        hover: {
                          fill: '#e8dcc8',
                          stroke: 'rgba(180,150,100,0.70)',
                          strokeWidth: 0.7,
                          outline: 'none',
                        },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
              }
            </Geographies>

            {/* Route lines — zen dashed style with glow underlay */}
            {ROUTES.map((route, i) => (
              <g key={`route-${i}`} style={{ pointerEvents: 'none' }}>
                {/* Glow underlay: wide + blurred */}
                <Line
                  from={[route.from.lon, route.from.lat]}
                  to={[route.to.lon, route.to.lat]}
                  stroke={route.color}
                  strokeWidth={5 / zoom}
                  strokeLinecap="round"
                  style={{ opacity: 0.18, filter: 'blur(3px)' }}
                />
                {/* Main dashed zen line */}
                <Line
                  from={[route.from.lon, route.from.lat]}
                  to={[route.to.lon, route.to.lat]}
                  stroke={route.color}
                  strokeWidth={1.5 / zoom}
                  strokeLinecap="round"
                  strokeDasharray={`${5 / zoom},${3.5 / zoom}`}
                  style={{ opacity: 0.75 }}
                />
              </g>
            ))}

            {/* City markers */}
            {CITIES.map((city) => (
              <PulseMarker
                key={city.id}
                city={city}
                isSelected={selectedCityId === city.id}
                onClick={() => onCityClick(city)}
                zoom={zoom}
              />
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Bottom-right badge */}
      <div className="absolute bottom-3 right-3 pointer-events-none">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.82)',
            border: '1px solid rgba(255,255,255,0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: '#475569' }}>日本 · Japan</span>
        </div>
      </div>

      {/* Bottom-left zoom indicator */}
      <div className="absolute bottom-3 left-3 pointer-events-none">
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{
            background: 'rgba(255,255,255,0.78)',
            border: '1px solid rgba(255,255,255,0.60)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <span className="text-[8px] font-mono" style={{ color: '#475569' }}>
            {zoom.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  );
}
