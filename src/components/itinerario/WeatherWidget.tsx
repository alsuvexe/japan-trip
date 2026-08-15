import { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer } from 'lucide-react';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  code: number;
}

function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 57) return '🌧️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

function getWeatherDesc(code: number): string {
  if (code === 0) return 'Despejado';
  if (code === 1) return 'Mayormente despejado';
  if (code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code <= 49) return 'Niebla';
  if (code <= 57) return 'Llovizna';
  if (code <= 67) return 'Lluvia';
  if (code <= 77) return 'Nieve';
  if (code <= 82) return 'Chubascos';
  if (code <= 86) return 'Nieve intensa';
  if (code <= 99) return 'Tormenta';
  return 'Variable';
}

function IconComponent({ code, size = 16 }: { code: number; size?: number }) {
  if (code === 0) return <Sun size={size} className="text-amber-400" />;
  if (code <= 2) return <Cloud size={size} className="text-gray-400" />;
  if (code === 3) return <Cloud size={size} className="text-gray-500" />;
  if (code <= 49) return <Wind size={size} className="text-gray-400" />;
  if (code <= 77) return <CloudRain size={size} className="text-blue-400" />;
  if (code <= 82) return <CloudSnow size={size} className="text-sky-300" />;
  return <CloudLightning size={size} className="text-amber-300" />;
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    const code = c.weather_code;
    return {
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      windSpeed: Math.round(c.wind_speed_10m),
      description: getWeatherDesc(code),
      icon: getWeatherIcon(code),
      code,
    };
  } catch {
    return null;
  }
}

interface WeatherWidgetCompactProps {
  lat: number;
  lon: number;
  cityId: string;
  textColor: string;
  onData?: (data: WeatherData) => void;
}

export function WeatherWidgetCompact({ lat, lon, onData }: Omit<WeatherWidgetCompactProps, 'cityId' | 'textColor'> & Pick<WeatherWidgetCompactProps, 'cityId' | 'textColor'>) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetchWeather(lat, lon).then((data) => {
      if (data) {
        setWeather(data);
        onData?.(data);
      }
    });
  }, [lat, lon, onData]);

  if (!weather) return <div className="w-16 h-4 bg-white/[0.04] rounded animate-pulse" />;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base leading-none">{weather.icon}</span>
      <span className="text-sm font-bold text-white">{weather.temp}°C</span>
      <span className="text-xs text-gray-500">{weather.description}</span>
    </div>
  );
}

interface WeatherWidgetFullProps {
  lat: number;
  lon: number;
  cityName: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  dotColor: string;
}

export function WeatherWidgetFull({ lat, lon, cityName, borderColor, bgColor, dotColor }: WeatherWidgetFullProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchWeather(lat, lon).then((data) => {
      setWeather(data);
      setLoading(false);
    });
  }, [lat, lon]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur-md animate-pulse">
        <div className="w-10 h-10 bg-slate-100 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <div className="w-20 h-4 bg-slate-100 rounded" />
          <div className="w-14 h-3 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl border border-sky-100 bg-sky-50/80 backdrop-blur-md"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <div className={`w-11 h-11 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center text-2xl shrink-0`}>
        {weather.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black leading-none" style={{ color: '#0f172a' }}>{weather.temp}°</span>
          <span className="text-sm font-medium" style={{ color: '#334155' }}>{weather.description}</span>
        </div>
        <p className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>Clima actual en {cityName}</p>
      </div>
      <div className="shrink-0 flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5">
          <Thermometer size={14} style={{ color: dotColor }} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight" style={{ color: '#1e293b' }}>{weather.feelsLike}°</span>
            <span className="text-[10px] font-medium leading-tight" style={{ color: '#64748b' }}>Sensación</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets size={14} className="text-sky-500" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight" style={{ color: '#1e293b' }}>{weather.humidity}%</span>
            <span className="text-[10px] font-medium leading-tight" style={{ color: '#64748b' }}>Humedad</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind size={14} style={{ color: dotColor }} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight" style={{ color: '#1e293b' }}>{weather.windSpeed} km/h</span>
            <span className="text-[10px] font-medium leading-tight" style={{ color: '#64748b' }}>Viento</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { IconComponent as WeatherIcon, fetchWeather };
export default WeatherWidgetCompact;
