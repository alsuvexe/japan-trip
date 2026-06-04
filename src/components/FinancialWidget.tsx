import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRightLeft, Banknote, RefreshCw } from 'lucide-react';
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

const BASE_RATE = 161.5;
const QUICK_EUR = [5, 20, 50, 100];
const QUICK_JPY = [1000, 5000, 10000, 50000];

const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function generateRollingData() {
  const now = new Date();
  const data: { month: string; rate: number; fullDate: Date }[] = [];

  let rate = BASE_RATE;

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const seed = d.getFullYear() * 100 + d.getMonth();

    const trend = i === 0 ? 0 : (seededRandom(seed * 3) - 0.48) * 0.4;
    const noise = (seededRandom(seed) - 0.5) * 4.2;
    const volatility = (seededRandom(seed * 7) - 0.5) * 2.8;

    rate = Math.max(145, Math.min(175, rate + trend + noise + volatility));

    if (i === 0) {
      const todaySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
      const dailyNoise = (seededRandom(todaySeed) - 0.5) * 1.2;
      rate = Math.max(145, Math.min(175, rate + dailyNoise));
    }

    data.push({
      month: MONTH_NAMES_ES[d.getMonth()],
      rate: parseFloat(rate.toFixed(2)),
      fullDate: d,
    });
  }

  return data;
}

function formatLastUpdate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg px-3 py-2 text-xs shadow-xl border border-slate-200" style={{ background: 'rgba(255,255,255,0.97)' }}>
        <p className="mb-0.5" style={{ color: '#334155' }}>{label}</p>
        <p className="font-bold text-sm" style={{ color: '#0e7490' }}>¥{payload[0].value.toFixed(2)}/€</p>
      </div>
    );
  }
  return null;
};

const cardStyle = {
  background: 'rgba(255,255,255,0.58)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.75)',
  border: '1px solid rgba(255,255,255,0.50)',
};

export default function FinancialWidget() {
  const [direction, setDirection] = useState<'eur-jpy' | 'jpy-eur'>('eur-jpy');
  const [amount, setAmount] = useState<string>('100');

  const chartData = useMemo(() => generateRollingData(), []);
  const currentRate = chartData[chartData.length - 1].rate;
  const prevRate = chartData[chartData.length - 2].rate;
  const change = ((currentRate - prevRate) / prevRate) * 100;
  const isUp = change >= 0;
  const today = new Date();

  const converted = amount
    ? direction === 'eur-jpy'
      ? parseFloat(amount) * currentRate
      : parseFloat(amount) / currentRate
    : 0;

  const quickAmounts = direction === 'eur-jpy' ? QUICK_EUR : QUICK_JPY;

  const toggleDirection = () => {
    setDirection((d) => (d === 'eur-jpy' ? 'jpy-eur' : 'eur-jpy'));
    setAmount('');
  };

  const fromLabel = direction === 'eur-jpy' ? 'Euros' : 'Yenes';
  const toLabel = direction === 'eur-jpy' ? 'Yenes' : 'Euros';
  const fromSymbol = direction === 'eur-jpy' ? '€' : '¥';
  const toSymbol = direction === 'eur-jpy' ? '¥' : '€';
  const fromFmt = direction === 'eur-jpy'
    ? parseFloat(amount || '0').toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : parseFloat(amount || '0').toLocaleString('es-ES', { maximumFractionDigits: 0 });
  const toFmt = direction === 'eur-jpy'
    ? converted.toLocaleString('es-ES', { maximumFractionDigits: 0 })
    : converted.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const minRate = Math.min(...chartData.map((d) => d.rate));
  const maxRate = Math.max(...chartData.map((d) => d.rate));
  const avgRate = chartData.reduce((s, d) => s + d.rate, 0) / chartData.length;

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-50 rounded-lg border border-cyan-200">
                <Banknote className="text-cyan-600" size={16} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#475569' }}>EUR / JPY</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RefreshCw size={9} style={{ color: '#475569' }} />
                  <p className="text-[10px]" style={{ color: '#475569' }}>
                    Simulación · {formatLastUpdate(today)}
                  </p>
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              isUp
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{isUp ? '+' : ''}{change.toFixed(2)}%</span>
            </div>
          </div>

          <div className="mb-1">
            <span
              className="text-5xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #0e7490 0%, #be185d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ¥{currentRate.toFixed(2)}
            </span>
          </div>
          <p className="text-sm mb-4" style={{ color: '#475569' }}>por euro · últimos 12 meses</p>

          <div className="h-28">
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
                  domain={[Math.floor(minRate - 2), Math.ceil(maxRate + 2)]}
                  tick={{ fill: '#475569', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={avgRate}
                  stroke="rgba(0,0,0,0.08)"
                  strokeDasharray="4 4"
                />
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
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>Mín 12m</p>
              <p className="text-xs font-bold mt-0.5 text-red-500">¥{minRate.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>Media</p>
              <p className="text-xs font-bold mt-0.5" style={{ color: '#334155' }}>¥{avgRate.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>Máx 12m</p>
              <p className="text-xs font-bold mt-0.5 text-emerald-600">¥{maxRate.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div
          className="border-t border-slate-100 px-5 py-4"
          style={{ background: 'rgba(240,248,255,0.45)', borderTop: '1px solid rgba(255,255,255,0.40)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={13} className="text-cyan-600" />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#334155' }}>Conversor rápido</p>
            </div>
            <button
              onClick={toggleDirection}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              style={{ color: '#334155' }}
            >
              <ArrowRightLeft size={11} />
              <span>{direction === 'eur-jpy' ? '€ → ¥' : '¥ → €'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>{fromLabel}</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-base" style={{ color: '#0f172a' }}>{fromSymbol}</span>
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
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>{toLabel}</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-base text-cyan-600">{toSymbol}</span>
                <div
                  className="japan-input pl-8 text-base font-black cursor-default"
                  style={{ color: '#0e7490', background: 'rgba(14,116,144,0.05)', borderColor: 'rgba(14,116,144,0.18)' }}
                >
                  {converted > 0 ? toFmt : direction === 'eur-jpy' ? '0' : '0,00'}
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
                {fromSymbol}{direction === 'jpy-eur' && amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="mt-3 p-3 rounded-xl border border-cyan-200 bg-cyan-50">
              <p className="text-center text-xs" style={{ color: '#334155' }}>
                <span className="font-semibold" style={{ color: '#1e2a3a' }}>{fromSymbol}{fromFmt}</span>
                {' = '}
                <span className="font-black text-sm text-cyan-700">{toSymbol}{toFmt}</span>
              </p>
              <p className="text-center text-[10px] mt-1" style={{ color: '#475569' }}>
                Tipo aplicado: ¥{currentRate.toFixed(2)}/€ · {formatLastUpdate(today)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
