import { useEffect, useState } from 'react';
import { Hotel, Calendar, MapPin, FileText, Plus, Pencil, Trash2, Save, X, Moon, Star, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';
import { useAdmin } from '../../lib/AdminContext';

interface HotelData {
  id: string;
  name: string;
  city: string;
  stars: number;
  image_url: string;
  check_in: string;
  check_out: string;
  address: string;
  confirmation_code: string;
  notes: string;
}

const CITIES = ['Osaka', 'Kioto', 'Tokio'];

const CITY_STYLES: Record<string, { border: string; bg: string; text: string; color: string; glow: string }> = {
  Osaka: { border: 'border-cyan-500/35', bg: 'bg-cyan-500/10', text: 'text-cyan-700', color: '#0e7490', glow: 'rgba(14,116,144,0.25)' },
  Kioto: { border: 'border-rose-500/35', bg: 'bg-rose-500/10', text: 'text-rose-700', color: '#be185d', glow: 'rgba(190,24,93,0.25)' },
  Tokio: { border: 'border-amber-500/35', bg: 'bg-amber-500/10', text: 'text-amber-700', color: '#d97706', glow: 'rgba(217,119,6,0.25)' },
};

const EMPTY_HOTEL: Omit<HotelData, 'id'> = {
  name: '', city: 'Osaka', stars: 4, image_url: '', check_in: '', check_out: '', address: '', confirmation_code: '', notes: '',
};

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          strokeWidth={1.5}
          style={{ color: i < stars ? '#f59e0b' : '#d1d5db', fill: i < stars ? '#f59e0b' : 'transparent' }}
        />
      ))}
    </div>
  );
}

function HotelRow({ hotel, onEdit, onDelete, isAdmin }: { hotel: HotelData; onEdit: (h: HotelData) => void; onDelete: (id: string) => void; isAdmin: boolean }) {
  const style = CITY_STYLES[hotel.city] || CITY_STYLES['Osaka'];
  const [hovered, setHovered] = useState(false);

  const getNights = () => {
    if (!hotel.check_in || !hotel.check_out) return 0;
    return Math.ceil((new Date(hotel.check_out).getTime() - new Date(hotel.check_in).getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const nights = getNights();

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        border: `1px solid ${hovered ? `${style.glow.replace('0.25', '0.55')}` : 'rgba(255,255,255,0.52)'}`,
        boxShadow: hovered
          ? `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px ${style.glow}`
          : '0 4px 20px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col md:flex-row">
        {/* Left side - Management card (35%) */}
        <div
          className="md:w-[35%] p-5 md:p-6 flex flex-col justify-between relative border-b md:border-b-0 md:border-r"
          style={{
            background: hovered ? 'rgba(248,250,252,0.60)' : 'rgba(248,250,252,0.40)',
            borderColor: 'rgba(0,0,0,0.05)',
          }}
        >
          {/* Actions - top right */}
          {isAdmin && (
          <div className="absolute top-3 right-3 flex gap-1 transition-opacity"
            style={{ opacity: hovered ? 1 : 0 }}
          >
            <button onClick={() => onEdit(hotel)} className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all" style={{ color: '#94a3b8' }}>
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(hotel.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" style={{ color: '#94a3b8' }}>
              <Trash2 size={14} />
            </button>
          </div>
          )}

          {/* City badge */}
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
              <MapPin size={10} />
              {hotel.city}
            </span>
          </div>

          {/* Hotel name + stars */}
          <div className="mb-3">
            <h3 className="text-xl font-extrabold leading-tight mb-1.5" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              {hotel.name}
            </h3>
            <StarRating stars={hotel.stars ?? 4} />
          </div>

          {/* Hotel photo */}
          {hotel.image_url ? (
            <div className="mb-4 rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
              <img
                src={hotel.image_url}
                alt={hotel.name}
                className="w-full h-36 object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
              />
            </div>
          ) : (
            <div
              className="mb-4 w-full h-36 rounded-xl flex flex-col items-center justify-center gap-2"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1.5px dashed rgba(0,0,0,0.10)' }}
            >
              <Hotel size={28} style={{ color: 'rgba(0,0,0,0.18)' }} strokeWidth={1.25} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.25)' }}>Añade una foto</span>
            </div>
          )}

          {/* Dates & nights */}
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={13} style={{ color: '#64748b' }} className="shrink-0" />
              <span className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                {formatDate(hotel.check_in)} — {formatDate(hotel.check_out)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Moon size={13} style={{ color: '#64748b' }} className="shrink-0" />
              <span className="text-sm font-medium" style={{ color: '#475569' }}>
                {nights} {nights === 1 ? 'noche' : 'noches'}
              </span>
            </div>
            {hotel.address && (
              <div className="flex items-start gap-2">
                <MapPin size={13} style={{ color: '#64748b' }} className="shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed" style={{ color: '#475569' }}>{hotel.address}</span>
              </div>
            )}
          </div>

          {/* Confirmation code */}
          {hotel.confirmation_code && (
            <div className={`${style.bg} border ${style.border} rounded-xl px-4 py-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <FileText size={11} style={{ color: style.color }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Confirmación</span>
              </div>
              <p className={`text-sm font-mono font-bold ${style.text}`}>{hotel.confirmation_code}</p>
            </div>
          )}
        </div>

        {/* Right side - Notes & Strategy (65%) */}
        <div className="md:w-[65%] p-5 md:p-6">
          {hotel.notes ? (
            <div className="h-full">
              <div className="flex items-center gap-1.5 mb-3">
                <FileText size={12} style={{ color: '#64748b' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Notas y estrategia</span>
              </div>
              <div
                className="text-sm leading-relaxed space-y-3"
                style={{ color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {hotel.notes.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center min-h-[80px]">
              <p className="text-sm font-medium italic" style={{ color: '#94a3b8' }}>Sin notas todavía</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HotelForm({ form, setForm, onSave, onCancel, title }: {
  form: Partial<HotelData>;
  setForm: React.Dispatch<React.SetStateAction<Partial<HotelData>>>;
  onSave: () => void;
  onCancel: () => void;
  title: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Nombre del hotel</label>
        <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Kyoto Granbell Hotel" className="japan-input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Ciudad</label>
          <select value={form.city || 'Osaka'} onChange={(e) => setForm({ ...form, city: e.target.value })} className="japan-input">
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Categoría</label>
          <select
            value={form.stars ?? 4}
            onChange={(e) => setForm({ ...form, stars: Number(e.target.value) })}
            className="japan-input"
          >
            <option value={1}>1 Estrella</option>
            <option value={2}>2 Estrellas</option>
            <option value={3}>3 Estrellas</option>
            <option value={4}>4 Estrellas</option>
            <option value={5}>5 Estrellas</option>
          </select>
        </div>
      </div>
      {/* Star preview */}
      <div className="flex items-center gap-2 -mt-1 px-1">
        <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>Vista previa:</span>
        <StarRating stars={form.stars ?? 4} />
        <span className="text-xs" style={{ color: '#94a3b8' }}>{form.stars ?? 4} {(form.stars ?? 4) === 1 ? 'estrella' : 'estrellas'}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Check-in</label>
          <input type="date" value={form.check_in || ''} onChange={(e) => setForm({ ...form, check_in: e.target.value })} className="japan-input" />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Check-out</label>
          <input type="date" value={form.check_out || ''} onChange={(e) => setForm({ ...form, check_out: e.target.value })} className="japan-input" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Dirección</label>
        <input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección del hotel" className="japan-input" />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Código de confirmación</label>
        <input value={form.confirmation_code || ''} onChange={(e) => setForm({ ...form, confirmation_code: e.target.value })} placeholder="Ej: OSA-2026-1234" className="japan-input font-mono" />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>URL de la imagen del hotel</label>
        <div className="relative">
          <input
            value={form.image_url || ''}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://... (enlace directo a la imagen)"
            className="japan-input pr-10"
          />
          <ImageIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
        </div>
        {form.image_url && (
          <div className="mt-2 rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <img
              src={form.image_url}
              alt="Vista previa"
              className="w-full h-28 object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Notas</label>
        <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={6} placeholder="Notas, estrategia, detalles del alojamiento..." className="japan-input resize-none text-sm" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2" style={{ color: '#475569' }}><X size={15} /><span>Cancelar</span></button>
        <button onClick={onSave} disabled={!form.name || !form.check_in || !form.check_out} className="japan-btn-primary gap-2 disabled:opacity-40">
          <Save size={15} /><span>{title}</span>
        </button>
      </div>
    </div>
  );
}

export default function Hoteles() {
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [editForm, setEditForm] = useState<Partial<HotelData>>({});
  const [newForm, setNewForm] = useState<Partial<HotelData>>(EMPTY_HOTEL);
  const { isAdmin } = useAdmin();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { loadHotels(); }, []);

  const loadHotels = async () => {
    const { data } = await supabase.from('hotels').select('*').order('check_in', { ascending: true });
    if (data) setHotels(data);
  };

  const openEdit = (hotel: HotelData) => { setEditForm({ ...hotel }); setIsEditOpen(true); };

  const saveEdit = async () => {
    if (!editForm.id) return;
    const { id, ...updates } = editForm as HotelData;
    await supabase.from('hotels').update(updates).eq('id', id);
    setHotels((prev) => prev.map((h) => h.id === id ? { ...h, ...updates } : h));
    setIsEditOpen(false);
  };

  const addHotel = async () => {
    const { data } = await supabase.from('hotels').insert(newForm as HotelData).select().maybeSingle();
    if (data) {
      setHotels((prev) => [...prev, data].sort((a, b) => a.check_in.localeCompare(b.check_in)));
      setIsAddOpen(false);
      setNewForm(EMPTY_HOTEL);
    }
  };

  const deleteHotel = async (id: string) => {
    setHotels((prev) => prev.filter((h) => h.id !== id));
    await supabase.from('hotels').delete().eq('id', id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
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
            Hoteles
          </h2>
          <p className="text-sm font-medium" style={{ color: '#334155' }}>Tus alojamientos en Japón</p>
        </div>
        {isAdmin && (
        <button onClick={() => setIsAddOpen(true)} className="japan-btn-primary gap-2 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:block">Añadir hotel</span>
        </button>
        )}
      </div>

      <div className="space-y-5">
        {hotels.map((hotel) => (
          <HotelRow key={hotel.id} hotel={hotel} onEdit={openEdit} onDelete={setDeleteConfirm} isAdmin={isAdmin} />
        ))}
        {hotels.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.50)' }}>
            <p className="font-medium" style={{ color: '#475569' }}>Sin hoteles. Añade el primero.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar hotel">
        <HotelForm form={editForm} setForm={setEditForm} onSave={saveEdit} onCancel={() => setIsEditOpen(false)} title="Guardar cambios" />
      </Modal>
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir hotel">
        <HotelForm form={newForm} setForm={setNewForm} onSave={addHotel} onCancel={() => setIsAddOpen(false)} title="Añadir hotel" />
      </Modal>
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar hotel" size="sm">
        <div className="space-y-4">
          <p className="text-sm font-medium" style={{ color: '#1e3a5f' }}>¿Eliminar este hotel? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteConfirm(null)} className="japan-btn border border-slate-300 hover:bg-slate-100" style={{ color: '#475569' }}>Cancelar</button>
            <button onClick={() => deleteConfirm && deleteHotel(deleteConfirm)} className="japan-btn-danger gap-2"><Trash2 size={15} /><span>Eliminar</span></button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

