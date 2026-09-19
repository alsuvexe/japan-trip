import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Settings,
  Sparkles,
  Bot,
  User,
  Loader2,
  Key,
  Check,
  AlertCircle,
  Utensils,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';

/* ─── Types ─── */
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

type Provider = 'openai' | 'gemini';

interface QuickAction {
  label: string;
  prompt: string;
  icon: typeof Utensils;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: '¿Qué comemos hoy?',
    prompt: '¿Qué comemos hoy? Sugiere un restaurante de nuestra lista según el itinerario de hoy.',
    icon: Utensils,
    color: '#e11d48',
  },
  {
    label: '¿Cuándo visitamos Fushimi Inari?',
    prompt: '¿Cuándo visitamos Fushimi Inari? Dime el día, hora y detalles de la actividad.',
    icon: MapPin,
    color: '#0e7490',
  },
  {
    label: '¿Qué tareas faltan?',
    prompt: '¿Qué tareas pendientes tenemos? Haz un resumen por persona de lo que falta por completar.',
    icon: ClipboardList,
    color: '#059669',
  },
];

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 12px 48px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.9) inset',
};

/* ─── Trip context builder ─── */
async function buildTripContext(): Promise<string> {
  const sections: string[] = [];

  const [tripRes, daysRes, activitiesRes, hotelsRes, restaurantsRes, todosRes, logisticsRes] =
    await Promise.all([
      supabase.from('trip_info').select('*').maybeSingle(),
      supabase.from('itinerary_days').select('*').order('date', { ascending: true }),
      supabase.from('day_activities').select('*').order('time', { ascending: true }).order('sort_order', { ascending: true }),
      supabase.from('hotels').select('*').order('check_in', { ascending: true }),
      supabase.from('restaurants').select('*').order('name', { ascending: true }),
      supabase.from('todos').select('*').order('created_at', { ascending: true }),
      supabase.from('logistics').select('*').order('date', { ascending: true }),
    ]);

  if (tripRes.data) {
    const t = tripRes.data;
    sections.push(`INFORMACIÓN DEL VIAJE:\n- Título: ${t.title || 'Viaje a Japón'}\n- Fechas: ${t.start_date} a ${t.end_date}`);
  }

  if (daysRes.data && daysRes.data.length > 0) {
    const actByDay = new Map<string, typeof activitiesRes.data>();
    activitiesRes.data?.forEach((a: any) => {
      const list = actByDay.get(a.day_id) || [];
      list.push(a);
      actByDay.set(a.day_id, list);
    });

    const itinLines = daysRes.data.map((d: any) => {
      const acts = actByDay.get(d.id) || [];
      const actStr = acts.length > 0
        ? acts.map((a: any) => `  · ${a.time || 'Sin hora'} - ${a.title}${a.description ? ` (${a.description})` : ''} [${a.category}]`).join('\n')
        : '  · Sin actividades planificadas';
      return `Día ${d.day_number} (${d.date}) - ${d.city}${d.title ? ': ' + d.title : ''}\n${actStr}`;
    });
    sections.push(`ITINERARIO DÍA A DÍA:\n${itinLines.join('\n\n')}`);
  }

  if (hotelsRes.data && hotelsRes.data.length > 0) {
    const lines = hotelsRes.data.map((h: any) =>
      `- ${h.name} (${h.city}): Check-in ${h.check_in}, Check-out ${h.check_out}${h.address ? ', Dirección: ' + h.address : ''}${h.confirmation_code ? ', Código: ' + h.confirmation_code : ''}${h.notes ? ', Notas: ' + h.notes : ''}`
    );
    sections.push(`HOTELES:\n${lines.join('\n')}`);
  }

  if (restaurantsRes.data && restaurantsRes.data.length > 0) {
    const lines = restaurantsRes.data.map((r: any) =>
      `- ${r.name} (${r.city}${r.cuisine_type ? ', ' + r.cuisine_type : ''}): ${r.address || 'Sin dirección'}${r.reservation_date ? ', Reserva: ' + r.reservation_date + (r.reservation_time ? ' a las ' + r.reservation_time : '') : ''}${r.priority === 'high' ? ' ⭐ Alta prioridad' : ''}${r.avg_price_per_person ? ', ~¥' + r.avg_price_per_person + '/persona' : ''}${r.notes ? ', Notas: ' + r.notes : ''}`
    );
    sections.push(`RESTAURANTES:\n${lines.join('\n')}`);
  }

  if (todosRes.data && todosRes.data.length > 0) {
    const pending = todosRes.data.filter((t: any) => {
      const completedBy = t.completed_by || [];
      const assignees = t.assignees || [];
      return assignees.length === 0 || assignees.some((a: string) => !completedBy.includes(a));
    });
    const done = todosRes.data.filter((t: any) => {
      const completedBy = t.completed_by || [];
      const assignees = t.assignees || [];
      return assignees.length > 0 && assignees.every((a: string) => completedBy.includes(a));
    });

    const pendingLines = pending.map((t: any) =>
      `- [PENDIENTE] ${t.title} (${t.category})${t.assignees?.length ? ' → Asignado a: ' + t.assignees.join(', ') : ''}${t.completed_by?.length ? ' (Completado por: ' + t.completed_by.join(', ') + ')' : ''}${t.due_date ? ' · Vence: ' + t.due_date : ''}`
    );
    const doneLines = done.map((t: any) => `- [COMPLETADA] ${t.title} (${t.category})`);
    sections.push(`TAREAS (${pending.length} pendientes, ${done.length} completadas):\n${pendingLines.join('\n')}${doneLines.length > 0 ? '\n' + doneLines.join('\n') : ''}`);
  }

  if (logisticsRes.data && logisticsRes.data.length > 0) {
    const lines = logisticsRes.data.map((l: any) =>
      `- [${l.status}] ${l.title} (${l.category})${l.date ? ', Fecha: ' + l.date : ''}${l.description ? ': ' + l.description : ''}`
    );
    sections.push(`LOGÍSTICA:\n${lines.join('\n')}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  return `Fecha actual: ${today}\n\n${sections.join('\n\n---\n\n')}`;
}

const SYSTEM_PROMPT = `Eres el asistente personal de este viaje a Japón. Responde a las dudas del usuario basándote en los datos de su planificación actual proporcionados a continuación. Si la información solicitada no está en el plan, indícalo amablemente. Responde siempre en español, de forma concisa y útil. Cuando menciones fechas, usa formato legible (ej: "lunes 7 de diciembre"). Si el usuario pregunta qué hacer hoy, mira la fecha actual y busca las actividades correspondientes.`;

/* ─── API call helpers ─── */
async function callOpenAI(messages: { role: string; content: string }[], apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 1024, temperature: 0.7 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'Sin respuesta.';
}

async function callGemini(messages: { role: string; content: string }[], apiKey: string): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system');
  const userParts = messages
    .filter((m) => m.role !== 'system')
    .map((m) => m.content)
    .join('\n\n');

  const fullPrompt = systemMsg
    ? `${systemMsg.content}\n\n---\n\nPregunta del usuario:\n${userParts}`
    : userParts;

  const genAI = new GoogleGenerativeAI(apiKey);
  const candidateModels = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-002',
    'gemini-1.5-pro-latest',
  ];

  let lastError: any = null;
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text() || 'Sin respuesta.';
    } catch (err) {
      lastError = err;
      console.warn(`[TravelAssistant] Fallo con ${modelName}, probando el siguiente modelo...`, err);
    }
  }
  throw lastError ?? new Error('Todos los modelos de Gemini fallaron.');
}

/* ─── Component ─── */
export default function TravelAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provider, setProvider] = useState<Provider>(() => {
    const saved = localStorage.getItem('ta_provider');
    if (saved === 'openai' || saved === 'gemini') return saved;
    if (import.meta.env.VITE_OPENAI_API_KEY) return 'openai';
    if (import.meta.env.VITE_GEMINI_API_KEY) return 'gemini';
    return 'openai';
  });

  const [apiKey, setApiKey] = useState(() => {
    const saved = localStorage.getItem('ta_api_key');
    if (saved) return saved;
    if (provider === 'openai') return import.meta.env.VITE_OPENAI_API_KEY || '';
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  });

  const [keyDraft, setKeyDraft] = useState(apiKey);
  const [providerDraft, setProviderDraft] = useState(provider);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const saveSettings = useCallback(() => {
    setProvider(providerDraft);
    setApiKey(keyDraft);
    localStorage.setItem('ta_provider', providerDraft);
    localStorage.setItem('ta_api_key', keyDraft);
    setShowSettings(false);
    setError(null);
  }, [providerDraft, keyDraft]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      if (!apiKey) {
        setError('Configura tu clave API en los ajustes para comenzar.');
        setShowSettings(true);
        return;
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);
      setError(null);

      try {
        const tripContext = await buildTripContext();

        const apiMessages = [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nDATOS DEL VIAJE:\n${tripContext}` },
          ...messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: text.trim() },
        ];

        const reply =
          provider === 'openai'
            ? await callOpenAI(apiMessages, apiKey)
            : await callGemini(apiMessages, apiKey);

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        setError(err.message || 'Error al contactar con la IA.');
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, provider, messages, isLoading],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const hasKey = apiKey.length > 0;

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9990] w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow group"
            style={{
              background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)',
              boxShadow: '0 6px 24px rgba(14,116,144,0.35)',
            }}
          >
            <Sparkles
              size={22}
              className="text-white group-hover:rotate-12 transition-transform duration-300"
            />
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{ background: '#10b981' }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed bottom-4 right-4 z-[9990] flex flex-col rounded-3xl overflow-hidden"
            style={{
              ...GLASS,
              width: 'min(400px, calc(100vw - 32px))',
              height: 'min(600px, calc(100vh - 100px))',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(14,116,144,0.08) 0%, rgba(8,145,178,0.04) 100%)',
                borderBottom: '1px solid rgba(14,116,144,0.10)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #0e7490, #0891b2)',
                    boxShadow: '0 2px 8px rgba(14,116,144,0.25)',
                  }}
                >
                  <Sparkles size={15} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>
                    Asistente de viaje
                  </h3>
                  <p className="text-[10px] font-medium" style={{ color: '#64748b' }}>
                    {provider === 'openai' ? 'GPT-4o mini' : 'Gemini 1.5 Flash'}
                    {!hasKey && ' · Sin clave configurada'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setProviderDraft(provider);
                    setKeyDraft(apiKey);
                    setShowSettings(!showSettings);
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: showSettings ? 'rgba(14,116,144,0.12)' : 'transparent',
                    color: showSettings ? '#0e7490' : '#94a3b8',
                  }}
                >
                  <Settings size={15} strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100"
                  style={{ color: '#94a3b8' }}
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Settings panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden shrink-0"
                >
                  <div
                    className="px-5 py-4 space-y-3"
                    style={{
                      background: 'rgba(248,250,252,0.90)',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Key size={13} style={{ color: '#0e7490' }} />
                      <span className="text-xs font-bold" style={{ color: '#334155' }}>
                        Configuración de la IA
                      </span>
                    </div>

                    {/* Provider toggle */}
                    <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                      {(['openai', 'gemini'] as Provider[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setProviderDraft(p);
                            const envKey =
                              p === 'openai'
                                ? import.meta.env.VITE_OPENAI_API_KEY || ''
                                : import.meta.env.VITE_GEMINI_API_KEY || '';
                            const savedKey = localStorage.getItem('ta_api_key') || '';
                            setKeyDraft(savedKey || envKey);
                          }}
                          className="flex-1 py-2 text-xs font-semibold transition-all"
                          style={{
                            background: providerDraft === p ? '#0e7490' : 'rgba(255,255,255,0.80)',
                            color: providerDraft === p ? '#fff' : '#64748b',
                          }}
                        >
                          {p === 'openai' ? 'OpenAI' : 'Gemini'}
                        </button>
                      ))}
                    </div>

                    {/* API Key input */}
                    <div className="relative">
                      <input
                        type="password"
                        value={keyDraft}
                        onChange={(e) => setKeyDraft(e.target.value)}
                        placeholder={providerDraft === 'openai' ? 'sk-...' : 'AIza...'}
                        className="w-full text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.90)',
                          border: '1px solid rgba(14,116,144,0.20)',
                          color: '#0f172a',
                        }}
                        onFocus={(e) => {
                          (e.target as HTMLInputElement).style.borderColor = 'rgba(14,116,144,0.50)';
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLInputElement).style.borderColor = 'rgba(14,116,144,0.20)';
                        }}
                      />
                    </div>

                    <button
                      onClick={saveSettings}
                      className="w-full py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #0e7490, #0891b2)' }}
                    >
                      <Check size={13} />
                      Guardar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(14,116,144,0.10), rgba(8,145,178,0.06))',
                      border: '1px solid rgba(14,116,144,0.12)',
                    }}
                  >
                    <Bot size={24} style={{ color: '#0e7490' }} />
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ color: '#0f172a' }}>
                    ¡Hola! Soy tu asistente de viaje
                  </p>
                  <p className="text-xs mb-6" style={{ color: '#64748b', lineHeight: 1.5 }}>
                    Pregúntame lo que quieras sobre vuestro viaje a Japón. Tengo acceso a todo el itinerario, hoteles, restaurantes y tareas.
                  </p>

                  {/* Quick actions */}
                  <div className="w-full space-y-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => sendMessage(action.prompt)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all group"
                        style={{
                          background: 'rgba(255,255,255,0.70)',
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.95)';
                          (e.currentTarget as HTMLElement).style.borderColor = `${action.color}30`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.70)';
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.06)';
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${action.color}12` }}
                        >
                          <action.icon size={14} style={{ color: action.color }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: '#334155' }}>
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1"
                      style={{
                        background: 'linear-gradient(135deg, #0e7490, #0891b2)',
                      }}
                    >
                      <Sparkles size={11} className="text-white" />
                    </div>
                  )}
                  <div
                    className="max-w-[80%] rounded-2xl px-3.5 py-2.5"
                    style={
                      msg.role === 'user'
                        ? {
                            background: 'linear-gradient(135deg, #0e7490, #0891b2)',
                            color: '#fff',
                            borderBottomRightRadius: '6px',
                          }
                        : {
                            background: 'rgba(248,250,252,0.95)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            color: '#1e293b',
                            borderBottomLeftRadius: '6px',
                          }
                    }
                  >
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className="text-[9px] mt-1.5 opacity-60"
                      style={{ color: msg.role === 'user' ? '#fff' : '#94a3b8' }}
                    >
                      {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1"
                      style={{ background: 'rgba(14,116,144,0.10)' }}
                    >
                      <User size={11} style={{ color: '#0e7490' }} />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 items-start"
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0e7490, #0891b2)' }}
                  >
                    <Sparkles size={11} className="text-white" />
                  </div>
                  <div
                    className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                    style={{
                      background: 'rgba(248,250,252,0.95)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderBottomLeftRadius: '6px',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden shrink-0"
                >
                  <div
                    className="mx-4 mb-2 px-3 py-2 rounded-xl flex items-start gap-2 text-xs"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      color: '#b91c1c',
                    }}
                  >
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{error}</p>
                    <button onClick={() => setError(null)} className="shrink-0 ml-auto">
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input area */}
            <div
              className="px-4 py-3 shrink-0"
              style={{
                background: 'rgba(248,250,252,0.70)',
                borderTop: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              {messages.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none">
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => sendMessage(a.prompt)}
                      disabled={isLoading}
                      className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.80)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        color: '#64748b',
                      }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
              <div
                className="flex items-end gap-2 rounded-2xl px-3 py-2"
                style={{
                  background: 'rgba(255,255,255,0.90)',
                  border: '1px solid rgba(14,116,144,0.15)',
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregunta sobre tu viaje..."
                  rows={1}
                  className="flex-1 text-[13px] resize-none outline-none bg-transparent py-1"
                  style={{
                    color: '#0f172a',
                    maxHeight: '80px',
                  }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = 'auto';
                    t.style.height = Math.min(t.scrollHeight, 80) + 'px';
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: input.trim() && !isLoading ? 'linear-gradient(135deg, #0e7490, #0891b2)' : 'rgba(0,0,0,0.05)',
                    color: input.trim() && !isLoading ? '#fff' : '#94a3b8',
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
