import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, MapPin } from 'lucide-react';
import { useTrips, type Trip } from '../lib/TripContext';

interface NewTripModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewTripModal({ open, onClose }: NewTripModalProps) {
  const { addTrip } = useTrips();

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [status, setStatus] = useState<Trip['status']>('upcoming');

  const reset = () => {
    setTitle('');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setCities([]);
    setCityInput('');
    setStatus('upcoming');
  };

  const addCity = () => {
    const trimmed = cityInput.trim();
    if (trimmed && !cities.includes(trimmed)) {
      setCities([...cities, trimmed]);
    }
    setCityInput('');
  };

  const removeCity = (city: string) => {
    setCities(cities.filter((c) => c !== city));
  };

  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCity();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim() || !startDate || !endDate) return;

    addTrip({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      cities,
      status,
    });

    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.1)',
              }}
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Nuevo Viaje</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                  style={{ color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                    Nombre del viaje
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Ruta por Italia"
                    className="japan-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                    País / Destino principal
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ej: Italia"
                    className="japan-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="japan-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="japan-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>
                    Ciudades
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={handleCityKeyDown}
                      placeholder="Escribe y pulsa Enter"
                      className="japan-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={addCity}
                      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                      style={{ background: '#f1f5f9', color: '#475569' }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {cities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {cities.map((city) => (
                        <span
                          key={city}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: 'rgba(14,116,144,0.08)', color: '#0e7490' }}
                        >
                          <MapPin size={12} />
                          {city}
                          <button
                            type="button"
                            onClick={() => removeCity(city)}
                            className="ml-0.5 hover:text-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#475569' }}>
                    Estado
                  </label>
                  <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => setStatus('upcoming')}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold transition-all"
                      style={{
                        background: status === 'upcoming' ? '#0f172a' : 'transparent',
                        color: status === 'upcoming' ? '#ffffff' : '#64748b',
                      }}
                    >
                      Próximo
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('completed')}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold transition-all"
                      style={{
                        background: status === 'completed' ? '#0f172a' : 'transparent',
                        color: status === 'completed' ? '#ffffff' : '#64748b',
                      }}
                    >
                      Completado
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: '#f1f5f9', color: '#475569' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow-md"
                    style={{ background: '#0f172a', color: '#ffffff' }}
                  >
                    Crear Viaje
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
