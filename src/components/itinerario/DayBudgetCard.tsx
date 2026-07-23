import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import Modal from '../Modal';

const EUR_RATE = 165;

interface CategoryBudget {
  estimated: number;
  real: number;
}

type BudgetMap = Record<string, CategoryBudget>;

const CATEGORIES = [
  { id: 'food', label: 'Comida', icon: '🍜' },
  { id: 'transport', label: 'Transporte Local', icon: '🚆' },
  { id: 'tickets', label: 'Entradas y Experiencias', icon: '🎟️' },
  { id: 'shopping', label: 'Compras y Varios', icon: '🛍️' },
] as const;

const EMPTY_BUDGET: BudgetMap = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, { estimated: 0, real: 0 }]),
);

function storageKey(dayId: string) {
  return `day-budget-${dayId}`;
}

function loadBudget(dayId: string): BudgetMap {
  try {
    const raw = localStorage.getItem(storageKey(dayId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BudgetMap>;
      return { ...EMPTY_BUDGET, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return { ...EMPTY_BUDGET };
}

function fmtJPY(n: number) {
  return `¥${n.toLocaleString('es-ES')}`;
}

function fmtEUR(n: number) {
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default function DayBudgetCard({ dayId }: { dayId: string }) {
  const [budget, setBudget] = useState<BudgetMap>(() => loadBudget(dayId));
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setBudget(loadBudget(dayId));
  }, [dayId]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(dayId), JSON.stringify(budget));
    } catch {
      /* ignore */
    }
  }, [dayId, budget]);

  const updateField = (catId: string, field: keyof CategoryBudget, value: number) => {
    setBudget((prev) => ({ ...prev, [catId]: { ...prev[catId], [field]: value } }));
  };

  const reset = () => {
    setBudget({ ...EMPTY_BUDGET });
    setShowResetConfirm(false);
  };

  const fieldDisplayValue = (catId: string, field: keyof CategoryBudget, value: number) => {
    const key = `${catId}-${field}`;
    if (focusedField === key) return value ? String(value) : '';
    return value ? value.toLocaleString('es-ES') : '';
  };

  const totalEstimated = Object.values(budget).reduce((s, c) => s + (c.estimated || 0), 0);
  const totalReal = Object.values(budget).reduce((s, c) => s + (c.real || 0), 0);
  const totalDiff = totalReal - totalEstimated;
  const overBudget = totalReal > totalEstimated && totalEstimated > 0;
  const withinBudget = totalEstimated > 0 && totalReal <= totalEstimated;

  return (
    <div className="bg-white/95 shadow-sm rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: '#0f172a' }}>
          <span>💰</span>
          <span>Presupuesto y Gastos del Día</span>
        </h3>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
          style={{ color: '#64748b' }}
        >
          <RotateCcw size={12} /> Reiniciar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => {
          const b = budget[cat.id] || { estimated: 0, real: 0 };
          const diff = (b.real || 0) - (b.estimated || 0);
          return (
            <div key={cat.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg leading-none">{cat.icon}</span>
                <span className="text-sm font-semibold" style={{ color: '#334155' }}>{cat.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: '#94a3b8' }}>Estimado</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: '#94a3b8' }}>¥</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fieldDisplayValue(cat.id, 'estimated', b.estimated || 0)}
                      onChange={(e) => updateField(cat.id, 'estimated', parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
                      onFocus={() => setFocusedField(`${cat.id}-estimated`)}
                      onBlur={() => setFocusedField(null)}
                      placeholder="0"
                      className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all"
                      style={{ color: '#0f172a' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: '#94a3b8' }}>Real</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: '#94a3b8' }}>¥</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fieldDisplayValue(cat.id, 'real', b.real || 0)}
                      onChange={(e) => updateField(cat.id, 'real', parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)}
                      onFocus={() => setFocusedField(`${cat.id}-real`)}
                      onBlur={() => setFocusedField(null)}
                      placeholder="0"
                      className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all"
                      style={{ color: '#0f172a' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: '#94a3b8' }}>Diferencia</label>
                  <div
                    className="w-full px-2 py-2 rounded-lg text-sm font-bold text-center"
                    style={{
                      color: diff > 0 ? '#dc2626' : diff < 0 ? '#059669' : '#64748b',
                      background: diff > 0 ? 'rgba(239,68,68,0.08)' : diff < 0 ? 'rgba(5,150,105,0.08)' : 'rgba(241,245,249,0.6)',
                    }}
                  >
                    {diff > 0 ? '+' : ''}{diff.toLocaleString('es-ES')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Total Estimado</p>
            <p className="text-lg font-black" style={{ color: '#0f172a' }}>{fmtJPY(totalEstimated)}</p>
            <p className="text-xs font-medium" style={{ color: '#64748b' }}>{fmtEUR(totalEstimated / EUR_RATE)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Total Real</p>
            <p className="text-lg font-black" style={{ color: '#0f172a' }}>{fmtJPY(totalReal)}</p>
            <p className="text-xs font-medium" style={{ color: '#64748b' }}>{fmtEUR(totalReal / EUR_RATE)}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: '#475569' }}>Diferencia total:</span>
            <span
              className="text-sm font-bold"
              style={{ color: totalDiff > 0 ? '#dc2626' : totalDiff < 0 ? '#059669' : '#64748b' }}
            >
              {totalDiff > 0 ? '+' : ''}{fmtJPY(totalDiff)}
            </span>
          </div>
          {withinBudget ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={14} /> Dentro del presupuesto
            </span>
          ) : overBudget ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
              <AlertTriangle size={14} /> Excedido {fmtJPY(totalDiff)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
              Sin estimación
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-center" style={{ color: '#94a3b8' }}>
        Tipo de cambio: 1 € = {EUR_RATE} ¥ · Los datos se guardan automáticamente
      </p>

      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reiniciar presupuesto"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-sm" style={{ color: '#334155' }}>
            ¿Estás seguro de que quieres borrar los gastos registrados de este día?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-all"
              style={{ color: '#475569' }}
            >
              Cancelar
            </button>
            <button
              onClick={reset}
              className="japan-btn-danger gap-2 text-sm"
            >
              <RotateCcw size={14} /> Sí, reiniciar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
