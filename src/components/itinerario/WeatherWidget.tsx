import { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets } from 'lucide-react';

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
      <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${borderColor} ${bgColor} animate-pulse`}>
        <div className="w-8 h-8 bg-white/[0.04] rounded-lg" />
        <div className="space-y-1">
          <div className="w-16 h-3 bg-white/[0.04] rounded" />
          <div className="w-10 h-2 bg-white/[0.04] rounded" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${borderColor}`}
      style={{ background: 'rgba(6,8,18,0.6)' }}
    >
      <div className={`w-9 h-9 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center text-xl shrink-0`}>
        {weather.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-white leading-none">{weather.temp}°</span>
          <span className="text-xs text-gray-500">sens. {weather.feelsLike}°</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{weather.description} · {cityName}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <Droplets size={9} className="text-blue-400" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <Wind size={9} style={{ color: dotColor }} />
          <span>{weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}

export { IconComponent as WeatherIcon, fetchWeather };
export default WeatherWidgetCompact;
