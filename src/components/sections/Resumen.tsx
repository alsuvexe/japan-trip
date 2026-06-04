import { CalendarCheck, Plane, Clock, ChevronRight, CheckCircle2, Timer, Pencil, Check, X, Compass } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import FinancialWidget from '../FinancialWidget';
import { useAdmin } from '../../lib/AdminContext';
import JapanMap, { CITIES, type CityConfig } from '../itinerario/JapanMap';
import CityDetailPanel from '../itinerario/CityDetailPanel';
import { WeatherWidgetCompact, type WeatherData } from '../itinerario/WeatherWidget';
import { useTodos, PEOPLE, calcPersonPct, calcOverallProgress, isFullyDone, type Person } from '../../lib/TodoContext';

interface TripInfo {
  start_date: string;
  end_date: string;
  title: string;
}

const PERSON_META: Record<Person, { initial: string; bar: string; solid: string }> = {
  Papa:    { initial: 'P', bar: 'linear-gradient(90deg, #0ea5e9, #38bdf8)', solid: '#0284c7' },
  Mama:    { initial: 'M', bar: 'linear-gradient(90deg, #f43f5e, #fb7185)', solid: '#e11d48' },
  Loli:    { initial: 'L', bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)', solid: '#d97706' },
  Alberto: { initial: 'A', bar: 'linear-gradient(90deg, #10b981, #34d399)', solid: '#059669' },
};

interface ResumenProps {
  onSectionChange?: (section: string, city?: string, dayDate?: string) => void;
}

function useCountdown(targetDate: string | null) {
  const calc = useCallback(() => {
    if (!targetDate) return null;
    const now = new Date();
    const target = new Date(targetDate + 'T00:00:00');
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [targetDate]);

  const [days, setDays] = useState<number | null>(calc);

  useEffect(() => {
    setDays(calc());
    const id = setInterval(() => setDays(calc()), 60_000);
    return () => clearInterval(id);
  }, [calc]);

  return days;
}

function fmtDateShort(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

const CITY_THEMES: Record<string, {
  gradientIdle: string;
  gradientHover: string;
  borderColor: string;
  shadowColor: string;
  shadowHover: string;
  orbColor: string;
  accentSolid: string;
}> = {
  Osaka: {
    gradientIdle:  'linear-gradient(145deg, rgba(251,207,232,0.55) 0%, rgba(255,255,255,0.72) 100%)',
    gradientHover: 'linear-gradient(145deg, rgba(249,168,212,0.70) 0%, rgba(255,255,255,0.88) 100%)',
    borderColor:   'rgba(236,72,153,0.30)',
    shadowColor:   'rgba(236,72,153,0.14)',
    shadowHover:   'rgba(236,72,153,0.28)',
    orbColor:      'rgba(249,168,212,0.50)',
    accentSolid:   '#be185d',
  },
  Kioto: {
    gradientIdle:  'linear-gradient(145deg, rgba(254,202,202,0.50) 0%, rgba(255,255,255,0.72) 100%)',
    gradientHover: 'linear-gradient(145deg, rgba(252,165,165,0.68) 0%, rgba(255,255,255,0.88) 100%)',
    borderColor:   'rgba(220,38,38,0.28)',
    shadowColor:   'rgba(220,38,38,0.12)',
    shadowHover:   'rgba(220,38,38,0.26)',
    orbColor:      'rgba(252,165,165,0.48)',
    accentSolid:   '#b91c1c',
  },
  Tokio: {
    gradientIdle:  'linear-gradient(145deg, rgba(186,230,253,0.55) 0%, rgba(255,255,255,0.72) 100%)',
    gradientHover: 'linear-gradient(145deg, rgba(125,211,252,0.68) 0%, rgba(255,255,255,0.88) 100%)',
    borderColor:   'rgba(14,116,144,0.30)',
    shadowColor:   'rgba(14,116,144,0.12)',
    shadowHover:   'rgba(14,116,144,0.26)',
    orbColor:      'rgba(125,211,252,0.48)',
    accentSolid:   '#0369a1',
  },
};

export default function Resumen({ onSectionChange }: ResumenProps) {
  const { todos } = useTodos();
  const { isAdmin } = useAdmin();
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityConfig | null>(null);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  const [cityDateRanges, setCityDateRanges] = useState<Record<string, string>>({});

  // Derived todo stats from shared context (always in sync)
  const overallProgress = calcOverallProgress(todos);
  const pending = todos.filter((t) => !isFullyDone(t)).length;

  // Next step logic
  interface NextStep {
    title: string;
    time: string | null;
    date: string;
    city: string;
    label: string;
  }
  const [nextStep, setNextStep] = useState<NextStep | null>(null);

  // Derived trip dates from itinerary_days (single source of truth)
  const [tripFirstDay, setTripFirstDay] = useState<string | null>(null);
  const [tripLastDay, setTripLastDay] = useState<string | null>(null);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [bannerHovered, setBannerHovered] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from('trip_info')
      .select('start_date, end_date, title')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTripInfo(data);
      });

    supabase
      .from('itinerary_days')
      .select('date')
      .order('date', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTripFirstDay(data[0].date);
          setTripLastDay(data[data.length - 1].date);
        }
      });

    const fmt = (d: string) => fmtDateShort(d);
    Promise.all(
      CITIES.map((city) =>
        supabase
          .from('itinerary_days')
          .select('date')
          .eq('city', city.id)
          .order('date', { ascending: true })
          .then(({ data }) => {
            if (!data || data.length === 0) return [city.id, city.dates] as const;
            const first = fmt(data[0].date);
            const last = fmt(data[data.length - 1].date);
            return [city.id, first === last ? first : `${first} – ${last}`] as const;
          }),
      ),
    ).then((entries) => setCityDateRanges(Object.fromEntries(entries)));
  }, []);

  // Realtime: re-fetch itinerary_days dates on any change
  useEffect(() => {
    const channel = supabase
      .channel('resumen-itinerary-dates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'itinerary_days' },
        () => {
          supabase
            .from('itinerary_days')
            .select('date')
            .order('date', { ascending: true })
            .then(({ data }) => {
              if (data && data.length > 0) {
                setTripFirstDay(data[0].date);
                setTripLastDay(data[data.length - 1].date);
              }
            });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Compute next step from itinerary activities
  useEffect(() => {
    async function computeNextStep() {
      const { data: days } = await supabase
        .from('itinerary_days')
        .select('id, date, city')
        .order('date', { ascending: true });
      if (!days || days.length === 0) return;

      const { data: activities } = await supabase
        .from('day_activities')
        .select('title, time, sort_order, day_id')
        .order('time', { ascending: true })
        .order('sort_order', { ascending: true });
      if (!activities || activities.length === 0) return;

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const dayMap = new Map(days.map((d) => [d.id, d]));

      // Find next upcoming activity
      for (const day of days) {
        const dayActivities = activities.filter((a) => a.day_id === day.id);
        if (dayActivities.length === 0) continue;

        if (day.date === todayStr) {
          // Find first activity later than now
          const upcoming = dayActivities.find((a) => {
            if (!a.time) return true;
            const [h, m] = a.time.split(':').map(Number);
            return h * 60 + m > nowMinutes;
          });
          if (upcoming) {
            let label = 'Hoy';
            if (upcoming.time) {
              const [h, m] = upcoming.time.split(':').map(Number);
              const diff = h * 60 + m - nowMinutes;
              label = diff <= 60
                ? `Hoy a las ${upcoming.time} · En ${diff} min`
                : `Hoy a las ${upcoming.time}`;
            }
            setNextStep({ title: upcoming.title, time: upcoming.time, date: day.date, city: day.city, label });
            return;
          }
        } else if (day.date > todayStr) {
          const first = dayActivities[0];
          const dateObj = new Date(day.date + 'T00:00:00');
          const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
          const isTomorrow = dateObj.toDateString() === tomorrow.toDateString();
          const dateLabel = isTomorrow
            ? 'Mañana'
            : dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          const label = first.time ? `${dateLabel} a las ${first.time}` : dateLabel;
          setNextStep({ title: first.title, time: first.time, date: day.date, city: day.city, label });
          return;
        }
      }

      // All activities in the past OR we are before the trip — show first activity ever
      const firstDay = days[0];
      const firstAct = activities.find((a) => a.day_id === firstDay.id);
      if (firstAct) {
        const dateObj = new Date(firstDay.date + 'T00:00:00');
        const label = `${dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
        setNextStep({ title: firstAct.title, time: firstAct.time, date: firstDay.date, city: firstDay.city, label });
      }
    }

    computeNextStep();
    const interval = setInterval(computeNextStep, 60_000);
    return () => clearInterval(interval);
  }, []);

  const daysLeft = useCountdown(tripFirstDay ?? tripInfo?.start_date ?? null);

  const effectiveStart = tripFirstDay ?? tripInfo?.start_date ?? null;
  const effectiveEnd = tripLastDay ?? tripInfo?.end_date ?? null;
  const tripDuration =
    effectiveStart && effectiveEnd
      ? Math.ceil(
          (new Date(effectiveEnd).getTime() - new Date(effectiveStart).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : null;

  const tripRangeLabel =
    effectiveStart && effectiveEnd
      ? `${fmtDateShort(effectiveStart)} – ${fmtDateShort(effectiveEnd)}`
      : null;

  const handleWeatherData = useCallback(
    (cityId: string) => (data: WeatherData) =>
      setWeatherData((prev) => ({ ...prev, [cityId]: data })),
    [],
  );

  function startEditTitle() {
    setTitleDraft(tripInfo?.title ?? 'Bienvenidos a Japón');
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 50);
  }

  async function commitTitle() {
    const trimmed = titleDraft.trim();
    if (!trimmed) { cancelEditTitle(); return; }
    setTripInfo((prev) => prev ? { ...prev, title: trimmed } : prev);
    setIsEditingTitle(false);
    await supabase.from('trip_info').update({ title: trimmed }).not('id', 'is', null);
  }

  function cancelEditTitle() {
    setIsEditingTitle(false);
    setTitleDraft('');
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitTitle();
    if (e.key === 'Escape') cancelEditTitle();
  }

  const displayTitle = tripInfo?.title ?? 'Bienvenidos a Japón';

  // suppress unused warning — weatherData used via onData callback
  void weatherData;

  return (
    <div className="space-y-6 pb-8">
      {/* ── HERO BANNER ── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255,255,255,0.58)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.85) inset',
        }}
        onMouseEnter={() => setBannerHovered(true)}
        onMouseLeave={() => setBannerHovered(false)}
      >
        <div className="absolute inset-0 seigaiha-pattern opacity-40 pointer-events-none" aria-hidden />
        <div
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(14,116,144,0.07) 0%, transparent 70%)' }}
          aria-hidden
        />
        <div
          className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(190,24,93,0.07) 0%, transparent 70%)' }}
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="flex items-center gap-2 mb-4">
            <Plane size={13} style={{ color: '#0e7490' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0e7490' }}>
              Viaje a Japón · Dic 2026
            </span>
          </div>

          {/* Editable title */}
          <div className="relative flex items-center justify-center gap-2 mb-1">
            <AnimatePresence mode="wait">
              {isEditingTitle ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={titleInputRef}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    autoFocus
                    className="text-2xl font-extrabold text-center rounded-xl px-3 py-1 outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      border: '1.5px solid rgba(14,116,144,0.40)',
                      color: '#0f172a',
                      minWidth: '200px',
                      maxWidth: '340px',
                      boxShadow: '0 2px 12px rgba(14,116,144,0.12)',
                    }}
                  />
                  <button
                    onClick={commitTitle}
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ background: 'rgba(5,150,105,0.12)', color: '#059669' }}
                    title="Guardar"
                  >
                    <Check size={14} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={cancelEditTitle}
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ background: 'rgba(100,116,139,0.10)', color: '#64748b' }}
                    title="Cancelar"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="display"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2"
                >
                  <h1
                    className="text-3xl font-extrabold"
                    style={{
                      background: 'linear-gradient(90deg, #0e7490 0%, #be185d 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {displayTitle}
                  </h1>
                  {isAdmin && (
                  <motion.button
                    onClick={startEditTitle}
                    title="Editar título"
                    animate={{ opacity: bannerHovered ? 1 : 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.80)',
                      border: '1px solid rgba(14,116,144,0.22)',
                      color: '#64748b',
                      pointerEvents: bannerHovered ? 'auto' : 'none',
                    }}
                  >
                    <Pencil size={12} strokeWidth={2} />
                  </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic date row */}
          {(tripDuration || tripRangeLabel) && (
            <div className="flex items-center gap-4 mt-2">
              {tripDuration && (
                <>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} style={{ color: '#334155' }} />
                    <span className="text-xs font-medium" style={{ color: '#334155' }}>
                      {tripDuration} días de viaje
                    </span>
                  </div>
                  <span style={{ color: '#64748b' }}>·</span>
                  <span className="text-xs font-medium" style={{ color: '#334155' }}>3 ciudades</span>
                </>
              )}
              {tripRangeLabel && (
                <>
                  <span style={{ color: '#64748b' }}>·</span>
                  <span className="text-xs font-medium" style={{ color: '#334155' }}>{tripRangeLabel}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 3-COL STATUS GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Countdown */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between"
          style={{ ...GLASS_CARD, minHeight: 110 }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Timer size={13} style={{ color: '#0e7490' }} strokeWidth={1.75} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
              Días para el viaje
            </span>
          </div>
          {daysLeft !== null ? (
            <>
              <p
                className="font-black leading-none"
                style={{
                  fontSize: 'clamp(2rem, 8vw, 2.75rem)',
                  background: 'linear-gradient(135deg, #0e7490 0%, #be185d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.04em',
                }}
              >
                {daysLeft === 0 ? '¡Ya!' : daysLeft}
              </p>
              <p className="text-[10px] font-medium mt-1" style={{ color: '#94a3b8' }}>
                {daysLeft === 0 ? '¡Hoy comienza!' : daysLeft === 1 ? 'mañana despega' : 'días restantes'}
              </p>
            </>
          ) : (
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mt-2"
              style={{ borderColor: 'rgba(14,116,144,0.20)', borderTopColor: '#0e7490' }}
            />
          )}
        </div>

        {/* Tasks */}
        <button
          onClick={() => onSectionChange?.('todos')}
          className="group rounded-2xl p-4 flex flex-col text-left transition-all duration-200"
          style={{ ...GLASS_CARD, minHeight: 110 }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,116,144,0.40)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.90)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.52)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.75)';
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} style={{ color: '#0e7490' }} strokeWidth={1.75} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                Tareas pendientes
              </span>
            </div>
            <ChevronRight size={11} style={{ color: '#a0aec0' }} className="group-hover:text-cyan-600 transition-colors" />
          </div>

          {/* Number + global bar */}
          <div className="flex items-end gap-2 mb-1">
            <p
              className="font-black leading-none"
              style={{
                fontSize: 'clamp(1.6rem, 6vw, 2.2rem)',
                color: overallProgress === 100 ? '#059669' : '#0e7490',
                letterSpacing: '-0.04em',
              }}
            >
              {pending}
            </p>
            <span className="text-[10px] font-semibold pb-1" style={{ color: '#94a3b8' }}>
              sin terminar
            </span>
          </div>
          <div className="relative w-full h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(0,0,0,0.07)' }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${overallProgress}%`,
                background: overallProgress === 100
                  ? 'linear-gradient(90deg,#059669,#0e7490)'
                  : 'linear-gradient(90deg,#0e7490 0%,#be185d 100%)',
              }}
            />
          </div>
          <p className="text-[9px] font-medium mb-2.5" style={{ color: '#94a3b8' }}>
            {overallProgress}% completado · media grupo
          </p>

          {/* Divider */}
          <div className="w-full h-px mb-2.5" style={{ background: 'rgba(0,0,0,0.06)' }} />

          {/* Per-person breakdown */}
          <div className="space-y-1.5">
            {PEOPLE.map((person) => {
              const meta = PERSON_META[person];
              const pct = calcPersonPct(todos, person);
              return (
                <div key={person} className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                    style={{ background: meta.solid }}
                  >
                    {meta.initial}
                  </span>
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: meta.bar }}
                    />
                  </div>
                  <span className="text-[9px] font-bold w-6 text-right shrink-0" style={{ color: meta.solid }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </button>

        {/* Next Step / Reservations fallback */}
        <button
          onClick={() => {
            if (nextStep) {
              onSectionChange?.('itinerario', nextStep.city, nextStep.date);
            } else {
              onSectionChange?.('calendario');
            }
          }}
          className="col-span-2 sm:col-span-1 group rounded-2xl p-4 flex flex-col justify-between text-left transition-all duration-200"
          style={{ ...GLASS_CARD, minHeight: 110 }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = nextStep ? 'rgba(14,116,144,0.40)' : 'rgba(190,24,93,0.40)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.90)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.52)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.75)';
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {nextStep ? (
                <Compass size={13} style={{ color: '#0e7490' }} strokeWidth={1.75} />
              ) : (
                <CalendarCheck size={13} style={{ color: '#be185d' }} strokeWidth={1.75} />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                {nextStep ? 'Próximo paso' : 'Mis Reservas'}
              </span>
            </div>
            <ChevronRight size={11} style={{ color: '#a0aec0' }} className={`transition-colors ${nextStep ? 'group-hover:text-cyan-600' : 'group-hover:text-pink-600'}`} />
          </div>
          <p
            className="font-black leading-snug"
            style={{
              fontSize: 'clamp(1rem, 4vw, 1.4rem)',
              color: nextStep ? '#0e7490' : '#be185d',
              letterSpacing: '-0.03em',
            }}
          >
            {nextStep ? nextStep.title : 'Vuelos'}
          </p>
          <p className="text-[10px] font-medium mt-1" style={{ color: '#94a3b8' }}>
            {nextStep ? nextStep.label : 'hoteles · traslados'}
          </p>
        </button>
      </div>

      {/* ── INTERACTIVE MAP ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a0aec0' }}>
            Ruta · Japón Diciembre 2026
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.07)' }} />
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(255,255,255,0.52)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
            <span className="text-[10px] font-medium" style={{ color: '#334155' }}>
              3 ciudades · pulsa para ver detalle
            </span>
          </div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            ...GLASS_CARD,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          <div className="px-4 pt-4 pb-0 sm:px-6 sm:pt-5">
            <JapanMap onCityClick={setSelectedCity} selectedCityId={selectedCity?.id} />
          </div>
        </div>
      </div>

      {/* ── CITY CARDS (redesigned) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CITIES.map((city, i) => {
          const theme = CITY_THEMES[city.id] ?? CITY_THEMES['Osaka'];
          return (
            <motion.button
              key={city.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.10, type: 'spring', stiffness: 260, damping: 22 }}
              onClick={() => onSectionChange?.('itinerario', city.id)}
              whileHover={{ y: -5, scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              className="group relative rounded-3xl text-left overflow-hidden cursor-pointer"
              style={{
                background: theme.gradientIdle,
                border: `1.5px solid ${theme.borderColor}`,
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                boxShadow: `0 4px 24px ${theme.shadowColor}, 0 1px 0 rgba(255,255,255,0.70) inset`,
                transition: 'background 0.30s ease, box-shadow 0.30s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = theme.gradientHover;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 36px ${theme.shadowHover}, 0 1px 0 rgba(255,255,255,0.80) inset`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = theme.gradientIdle;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${theme.shadowColor}, 0 1px 0 rgba(255,255,255,0.70) inset`;
              }}
            >
              {/* Decorative glow orb */}
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${theme.orbColor} 0%, transparent 70%)` }}
              />

              <div className="relative z-10 p-5">
                {/* Top row: floating icon + arrow */}
                <div className="flex items-start justify-between mb-3">
                  <motion.span
                    className="text-4xl leading-none select-none"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
                  >
                    {city.icon}
                  </motion.span>
                  <motion.div
                    className="flex items-center justify-center w-7 h-7 rounded-full"
                    style={{ background: `${theme.accentSolid}18` }}
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <ChevronRight size={14} style={{ color: theme.accentSolid }} strokeWidth={2.5} />
                  </motion.div>
                </div>

                {/* City name */}
                <p className="text-lg font-extrabold tracking-tight mb-0.5" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {city.name}
                </p>

                {/* Date chip */}
                <div className="inline-flex items-center gap-1 mb-3">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${theme.accentSolid}14`, color: theme.accentSolid }}
                  >
                    {cityDateRanges[city.id] ?? city.dates}
                  </span>
                </div>

                {/* Divider */}
                <div className="w-full h-px mb-3" style={{ background: `${theme.accentSolid}18` }} />

                {/* Weather */}
                <WeatherWidgetCompact
                  lat={city.lat}
                  lon={city.lon}
                  cityId={city.id}
                  textColor={city.textColor}
                  onData={handleWeatherData(city.id)}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <CityDetailPanel city={selectedCity} onClose={() => setSelectedCity(null)} />

      {/* ── FINANCIAL MODULE ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a0aec0' }}>
            Yen · EUR/JPY
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.07)' }} />
        </div>
        <FinancialWidget />
      </div>
    </div>
  );
}
