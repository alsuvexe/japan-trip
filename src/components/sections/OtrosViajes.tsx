import { useEffect, useRef, useState } from 'react';
import { Camera, Plus, Trash2, Download, Globe, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

interface Trip {
  id: string;
  title: string;
  destination: string;
  year: number;
  image_data: string;
  image_name: string;
  notes: string;
}

const EMPTY_TRIP: Omit<Trip, 'id'> = {
  title: '', destination: '', year: new Date().getFullYear(), image_data: '', image_name: '', notes: '',
};

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const downloadImage = () => {
    if (!trip.image_data) return;
    const a = document.createElement('a');
    a.href = trip.image_data;
    a.download = trip.image_name || `${trip.title}.jpg`;
    a.click();
  };

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden group hover:shadow-lg transition-all" style={GLASS_CARD}>
      <div className="relative aspect-video overflow-hidden" style={{ background: 'rgba(241,245,249,0.8)' }}>
        {trip.image_data ? (
          <img
            src={trip.image_data}
            alt={trip.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Globe style={{ color: '#cbd5e1' }} className="mx-auto mb-2" size={32} />
              <p className="text-xs" style={{ color: '#94a3b8' }}>Sin imagen</p>
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {trip.image_data && (
            <button
              onClick={downloadImage}
              className="p-2 rounded-lg hover:text-cyan-700 hover:bg-cyan-50 transition-all"
              style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(255,255,255,0.60)', color: '#64748b' }}
              title="Descargar imagen"
            >
              <Download size={14} />
            </button>
          )}
          <button
            onClick={() => onDelete(trip.id)}
            className="p-2 rounded-lg hover:text-red-500 hover:bg-red-50 transition-all"
            style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(255,255,255,0.60)', color: '#64748b' }}
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div className="absolute bottom-2 left-2">
          <span
            className="text-xs font-bold rounded-full px-2 py-0.5"
            style={{ background: 'rgba(255,255,255,0.88)', color: '#334155', border: '1px solid rgba(255,255,255,0.60)' }}
          >
            {trip.year}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold mb-0.5" style={{ color: '#0f172a' }}>{trip.title}</h3>
        <p className="text-xs font-semibold text-cyan-700">{trip.destination}</p>
        {trip.notes && <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: '#475569' }}>{trip.notes}</p>}
      </div>
    </div>
  );
}

export default function OtrosViajes() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTrip, setNewTrip] = useState<Omit<Trip, 'id'>>(EMPTY_TRIP);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    const { data } = await supabase.from('other_trips').select('*').order('year', { ascending: false });
    if (data) setTrips(data);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewTrip((prev) => ({
        ...prev,
        image_data: e.target?.result as string,
        image_name: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const addTrip = async () => {
    if (!newTrip.title) return;
    const { data } = await supabase.from('other_trips').insert(newTrip).select().maybeSingle();
    if (data) {
      setTrips((prev) => [data, ...prev]);
      setIsAddOpen(false);
      setNewTrip(EMPTY_TRIP);
    }
  };

  const deleteTrip = async (id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('other_trips').delete().eq('id', id);
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
            Otros Viajes
          </h2>
          <p className="text-sm font-medium" style={{ color: '#334155' }}>Galería de aventuras pasadas</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="japan-btn-primary gap-2 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:block">Añadir viaje</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onDelete={setDeleteConfirm} />
        ))}

        <button
          onClick={() => setIsAddOpen(true)}
          className="aspect-video rounded-2xl border-2 border-dashed border-slate-300 hover:border-cyan-400 hover:bg-white/40 transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <Plus className="transition-colors group-hover:text-cyan-600" size={24} style={{ color: '#94a3b8' }} />
          <p className="text-xs transition-colors group-hover:text-cyan-700" style={{ color: '#94a3b8' }}>Añadir viaje</p>
        </button>
      </div>

      {trips.length === 0 && (
        <div className="text-center py-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.50)' }}>
          <p className="text-sm font-medium" style={{ color: '#475569' }}>Comienza añadiendo recuerdos de tus viajes anteriores</p>
        </div>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Añadir viaje" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Título</label>
              <input value={newTrip.title} onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })} placeholder="Ej: Marruecos" className="japan-input" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Destino</label>
              <input value={newTrip.destination} onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })} placeholder="Ej: Marrakech, Fez" className="japan-input" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Año</label>
            <input type="number" value={newTrip.year} onChange={(e) => setNewTrip({ ...newTrip, year: Number(e.target.value) })} className="japan-input" />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#475569' }}>Imagen</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {newTrip.image_data ? (
              <div className="relative rounded-xl overflow-hidden aspect-video">
                <img src={newTrip.image_data} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setNewTrip({ ...newTrip, image_data: '', image_name: '' })}
                  className="absolute top-2 right-2 p-1.5 rounded-lg hover:text-red-500 transition-all"
                  style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(255,255,255,0.60)', color: '#64748b' }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  isDragging ? 'border-cyan-400 bg-cyan-50' : 'border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/50'
                }`}
              >
                <Camera style={{ color: '#94a3b8' }} size={28} />
                <p className="text-xs" style={{ color: '#475569' }}>Arrastra una imagen o haz clic para seleccionar</p>
                <p className="text-[10px]" style={{ color: '#94a3b8' }}>JPG, PNG, WebP</p>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#475569' }}>Notas</label>
            <textarea value={newTrip.notes} onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })} rows={3} placeholder="Recuerdos, highlights..." className="japan-input resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsAddOpen(false)} className="japan-btn border border-slate-300 hover:bg-slate-100 gap-2" style={{ color: '#475569' }}><X size={15} /><span>Cancelar</span></button>
            <button onClick={addTrip} disabled={!newTrip.title} className="japan-btn-primary gap-2 disabled:opacity-40">
              <Save size={15} /><span>Guardar viaje</span>
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar viaje" size="sm">
        <div className="space-y-4">
          <p className="text-sm font-medium" style={{ color: '#1e3a5f' }}>¿Eliminar este viaje de la galería?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteConfirm(null)} className="japan-btn border border-slate-300 hover:bg-slate-100" style={{ color: '#475569' }}>Cancelar</button>
            <button onClick={() => deleteConfirm && deleteTrip(deleteConfirm)} className="japan-btn-danger gap-2"><Trash2 size={15} /><span>Eliminar</span></button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
