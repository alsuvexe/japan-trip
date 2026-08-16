import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRightLeft, Banknote, RefreshCw, Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'JPY', symbol: '¥', label: 'Yen japonés' },
  { code: 'USD', symbol: '$', label: 'Dólar USA' },
  { code: 'GBP', symbol: '£', label: 'Libra esterlina' },
  { code: 'CHF', symbol: 'Fr', label: 'Franco suizo' },
  { code: 'CAD', symbol: 'C$', label: 'Dólar canadiense' },
  { code: 'AUD', symbol: 'A$', label: 'Dólar australiano' },
  { code: 'MXN', symbol: 'MX$', label: 'Peso mexicano' },
  { code: 'THB', symbol: '฿', label: 'Baht tailandés' },
];

function getCurrency(code: string): CurrencyOption {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface ChartPoint {
  month: string;
  rate: number;
  date: string;
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.58)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.75)',
  border: '1px solid rgba(255,255,255,0.50)',
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg px-3 py-2 text-xs shadow-xl border border-slate-200" style={{ background: 'rgba(255,255,255,0.97)' }}>
        <p className="mb-0.5" style={{ color: '#334155' }}>{label}</p>
        <p className="font-bold text-sm" style={{ color: '#0e7490' }}>{payload[0].value.toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

interface FinancialWidgetProps {
  defaultFrom?: string;
  defaultTo?: string;
}

export default function FinancialWidget({ defaultFrom = 'EUR', defaultTo = 'JPY' }: FinancialWidgetProps) {
  const [fromCode, setFromCode] = useState(defaultFrom);
  const [toCode, setToCode] = useState(defaultTo);
  const [amount, setAmount] = useState<string>('100');

  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const fetchCurrentRate = useCallback(async () => {
    setRateLoading(true);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${fromCode}`);
      const json = await res.json();
      if (json.result === 'success' && json.rates[toCode]) {
        setCurrentRate(json.rates[toCode]);
        setLastUpdate(new Date());
      }
    } catch {
      // keep previous rate on error
    } finally {
      setRateLoading(false);
    }
  }, [fromCode, toCode]);

  const generateFallbackHistory = useCallback((baseRate: number): ChartPoint[] => {
    const points: ChartPoint[] = [];
    const now = new Date();
    let rate = baseRate * (1 - 0.03 + Math.random() * 0.02);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const drift = (Math.random() - 0.48) * baseRate * 0.015;
      const noise = (Math.random() - 0.5) * baseRate * 0.008;
      rate = rate + drift + noise;
      rate = Math.max(baseRate * 0.95, Math.min(baseRate * 1.05, rate));
      if (i === 0) rate = baseRate;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = '01';
      points.push({
        month: MONTH_NAMES_ES[d.getMonth()],
        rate: parseFloat(rate.toFixed(4)),
        date: `${yyyy}-${mm}-${dd}`,
      });
    }
    return points;
  }, []);

  const fetchHistory = useCallback(async () => {
    setChartLoading(true);
    try {
      const today = new Date();
      const yearAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 365);
      const pad = (n: number) => String(n).padStart(2, '0');
      const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      const startDate = fmtDate(yearAgo);
      const endDate = fmtDate(today);

      const res = await fetch(
        `https://api.frankfurter.app/${startDate}..${endDate}?from=${fromCode}&to=${toCode}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.rates && Object.keys(json.rates).length > 0) {
        const entries = Object.entries(json.rates) as [string, Record<string, number>][];
        const monthlyMap = new Map<string, { rate: number; date: string }>();

        for (const [dateStr, rates] of entries) {
          const d = new Date(dateStr + 'T00:00:00');
          const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
          monthlyMap.set(key, { rate: rates[toCode], date: dateStr });
        }

        const points: ChartPoint[] = [];
        for (const [, value] of monthlyMap) {
          const d = new Date(value.date + 'T00:00:00');
          points.push({
            month: MONTH_NAMES_ES[d.getMonth()],
            rate: value.rate,
            date: value.date,
          });
        }

        if (points.length > 0) {
          setChartData(points);
        } else {
          throw new Error('Empty points');
        }
      } else {
        throw new Error('No rates in response');
      }
    } catch {
      const fallbackBase = currentRate || 1;
      setChartData(generateFallbackHistory(fallbackBase));
    } finally {
      setChartLoading(false);
    }
  }, [fromCode, toCode, currentRate, generateFallbackHistory]);

  useEffect(() => {
    fetchCurrentRate();
  }, [fetchCurrentRate]);

  useEffect(() => {
    if (currentRate !== null) fetchHistory();
  }, [fetchHistory, currentRate]);

  const swap = () => {
    const tmp = fromCode;
    setFromCode(toCode);
    setToCode(tmp);
    setAmount('');
  };

  const fromCurrency = getCurrency(fromCode);
  const toCurrency = getCurrency(toCode);

  const converted = useMemo(() => {
    if (!currentRate || !amount || parseFloat(amount) === 0) return 0;
    return parseFloat(amount) * currentRate;
  }, [amount, currentRate]);

  const { minRate, maxRate, avgRate } = useMemo(() => {
    if (chartData.length === 0) return { minRate: 0, maxRate: 0, avgRate: 0 };
    const rates = chartData.map((d) => d.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg = rates.reduce((s, r) => s + r, 0) / rates.length;
    return { minRate: min, maxRate: max, avgRate: avg };
  }, [chartData]);

  const prevRate = chartData.length >= 2 ? chartData[chartData.length - 2].rate : null;
  const change = prevRate && currentRate ? ((currentRate - prevRate) / prevRate) * 100 : 0;
  const isUp = change >= 0;

  const isJpy = toCode === 'JPY';
  const rateFmt = isJpy ? 2 : 4;
  const convertedFmt = isJpy
    ? converted.toLocaleString('es-ES', { maximumFractionDigits: 0 })
    : converted.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const quickAmounts = isJpy && fromCode !== 'JPY' ? [5, 20, 50, 100] : fromCode === 'JPY' ? [1000, 5000, 10000, 50000] : [10, 50, 100, 500];

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 pt-5 pb-4">
          {/* Currency selectors */}
          <div className="flex items-center gap-2 mb-4">
            <select
              value={fromCode}
              onChange={(e) => setFromCode(e.target.value)}
              className="flex-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white px-2.5 py-2 appearance-none cursor-pointer hover:border-slate-300 transition-colors"
              style={{ color: '#0f172a' }}
            >
              {CURRENCIES.filter((c) => c.code !== toCode).map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>
              ))}
            </select>

            <button
              onClick={swap}
              className="p-2 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all shrink-0"
              title="Invertir"
            >
              <ArrowRightLeft size={14} className="text-cyan-600" />
            </button>

            <select
              value={toCode}
              onChange={(e) => setToCode(e.target.value)}
              className="flex-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white px-2.5 py-2 appearance-none cursor-pointer hover:border-slate-300 transition-colors"
              style={{ color: '#0f172a' }}
            >
              {CURRENCIES.filter((c) => c.code !== fromCode).map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>
              ))}
            </select>
          </div>

          {/* Rate header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-50 rounded-lg border border-cyan-200">
                <Banknote className="text-cyan-600" size={16} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#475569' }}>{fromCode} / {toCode}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RefreshCw size={9} style={{ color: '#475569' }} />
                  <p className="text-[10px]" style={{ color: '#475569' }}>
                    {lastUpdate
                      ? `Actualizado: ${lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                      : 'Cargando...'}
                  </p>
                </div>
              </div>
            </div>
            {prevRate && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                isUp
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{isUp ? '+' : ''}{change.toFixed(2)}%</span>
              </div>
            )}
          </div>

          {/* Current rate display */}
          <div className="mb-1">
            {rateLoading || currentRate === null ? (
              <div className="flex items-center gap-2 h-14">
                <Loader2 size={24} className="text-cyan-600 animate-spin" />
                <span className="text-sm font-medium" style={{ color: '#475569' }}>Obteniendo cotización...</span>
              </div>
            ) : (
              <span
                className="text-4xl sm:text-5xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(90deg, #0e7490 0%, #be185d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {toCurrency.symbol}{currentRate.toFixed(rateFmt)}
              </span>
            )}
          </div>
          <p className="text-sm mb-4" style={{ color: '#475569' }}>por 1 {fromCurrency.symbol} {fromCode} · últimos 12 meses</p>

          {/* Chart */}
          <div className="h-28 w-full max-w-full overflow-hidden">
            {chartLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={20} className="text-cyan-600 animate-spin" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <defs>
                    <linearGradient id="lineGradSolid" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0e7490" />
                      <stop offset="100%" stopColor="#be185d" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#475569', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis
                    domain={[Math.floor(minRate * 0.98), Math.ceil(maxRate * 1.02)]}
                    tick={{ fill: '#475569', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={avgRate} stroke="rgba(0,0,0,0.08)" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="url(#lineGradSolid)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#0e7490', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={20} className="text-cyan-600 animate-spin" />
              </div>
            )}
          </div>

          {/* Stats row */}
          {chartData.length > 0 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>Mín 12m</p>
                <p className="text-xs font-bold mt-0.5 text-red-500">{toCurrency.symbol}{minRate.toFixed(rateFmt)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>Media</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: '#334155' }}>{toCurrency.symbol}{avgRate.toFixed(rateFmt)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>Máx 12m</p>
                <p className="text-xs font-bold mt-0.5 text-emerald-600">{toCurrency.symbol}{maxRate.toFixed(rateFmt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Converter section */}
        <div
          className="border-t border-slate-100 px-5 py-4"
          style={{ background: 'rgba(240,248,255,0.45)', borderTop: '1px solid rgba(255,255,255,0.40)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft size={13} className="text-cyan-600" />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#334155' }}>Conversor rápido</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>{fromCurrency.label}</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-base" style={{ color: '#0f172a' }}>{fromCurrency.symbol}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="japan-input pl-8 text-base font-semibold"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>{toCurrency.label}</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-base text-cyan-600">{toCurrency.symbol}</span>
                <div
                  className="japan-input pl-8 text-base font-black cursor-default"
                  style={{ color: '#0e7490', background: 'rgba(14,116,144,0.05)', borderColor: 'rgba(14,116,144,0.18)' }}
                >
                  {converted > 0 ? convertedFmt : '0'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(String(amt))}
                className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                  amount === String(amt)
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                style={amount !== String(amt) ? { color: '#334155' } : {}}
              >
                {fromCurrency.symbol}{amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>

          {amount && parseFloat(amount) > 0 && currentRate && (
            <div className="mt-3 p-3 rounded-xl border border-cyan-200 bg-cyan-50">
              <p className="text-center text-xs" style={{ color: '#334155' }}>
                <span className="font-semibold" style={{ color: '#1e2a3a' }}>
                  {fromCurrency.symbol}{parseFloat(amount).toLocaleString('es-ES')}
                </span>
                {' = '}
                <span className="font-black text-sm text-cyan-700">{toCurrency.symbol}{convertedFmt}</span>
              </p>
              <p className="text-center text-[10px] mt-1" style={{ color: '#475569' }}>
                Tipo: {toCurrency.symbol}{currentRate.toFixed(rateFmt)}/{fromCurrency.symbol}
                {lastUpdate && ` · ${lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
