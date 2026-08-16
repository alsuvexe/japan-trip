import { useEffect, useRef, useState } from 'react';
import { Camera, Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../Modal';

interface AlbumPhoto {
  id: string;
  city: string;
  image_url: string;
  created_at: string;
}

const MAX_PHOTOS_PER_CITY = 20;

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  border: '1px solid rgba(255,255,255,0.52)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
};

export default function TripAlbum() {
  const [cities, setCities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<AlbumPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCity, setUploadCity] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel('album-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_album_photos' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadData() {
    const { data: days } = await supabase
      .from('itinerary_days')
      .select('city')
      .order('date', { ascending: true });

    if (days) {
      const unique = [...new Set(days.map((d) => d.city).filter(Boolean))];
      setCities(unique);
    }

    const { data: albumPhotos } = await supabase
      .from('trip_album_photos')
      .select('*')
      .order('created_at', { ascending: true });

    if (albumPhotos) setPhotos(albumPhotos);
    setLoading(false);
  }

  function getPhotosForCity(city: string) {
    return photos.filter((p) => p.city === city);
  }

  function handleUploadClick(city: string) {
    setUploadCity(city);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !uploadCity) return;

    const cityPhotos = getPhotosForCity(uploadCity);
    const remaining = MAX_PHOTOS_PER_CITY - cityPhotos.length;
    const toUpload = Array.from(files).slice(0, remaining);

    if (toUpload.length === 0) return;

    setUploading(uploadCity);

    for (const file of toUpload) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `album/${uploadCity}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(path, file, { contentType: file.type });

      if (uploadError) continue;

      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(path);

      if (urlData?.publicUrl) {
        await supabase.from('trip_album_photos').insert({
          city: uploadCity,
          image_url: urlData.publicUrl,
        });
      }
    }

    setUploading(null);
    setUploadCity(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadData();
  }

  async function handleDelete(photo: AlbumPhoto) {
    const pathMatch = photo.image_url.match(/attachments\/(.+)$/);
    if (pathMatch) {
      await supabase.storage.from('attachments').remove([pathMatch[1]]);
    }
    await supabase.from('trip_album_photos').delete().eq('id', photo.id);
    setPreviewPhoto(null);
    loadData();
  }

  const totalPhotos = photos.length;

  return (
    <div className="space-y-6">
      {/* Header */}
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
          Album del Viaje
        </h2>
        <p className="text-sm font-medium" style={{ color: '#334155' }}>
          Fotos organizadas por ciudad · {totalPhotos} foto{totalPhotos !== 1 ? 's' : ''} en total
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(14,116,144,0.20)', borderTopColor: '#0e7490' }} />
        </div>
      ) : cities.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.50)' }}>
          <Camera size={36} style={{ color: '#94a3b8' }} className="mx-auto mb-3" />
          <p className="font-semibold mb-1" style={{ color: '#475569' }}>Sin ciudades en el itinerario</p>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Añade días al itinerario para organizar tu álbum por ciudades.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {cities.map((city) => {
            const cityPhotos = getPhotosForCity(city);
            const count = cityPhotos.length;
            const isFull = count >= MAX_PHOTOS_PER_CITY;
            const isUploading = uploading === city;

            return (
              <div key={city} className="rounded-2xl overflow-hidden" style={GLASS_CARD}>
                {/* City Header */}
                <div className="px-5 py-4 border-b border-slate-100/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0e7490, #0891b2)' }}>
                      <Camera size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: '#0f172a' }}>{city}</h3>
                      <p className="text-xs font-medium" style={{ color: '#64748b' }}>
                        {count}/{MAX_PHOTOS_PER_CITY} fotos
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUploadClick(city)}
                    disabled={isFull || isUploading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isFull
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin border-cyan-500" />
                        Subiendo...
                      </>
                    ) : isFull ? (
                      <>Limite alcanzado (20/20)</>
                    ) : (
                      <>
                        <Plus size={14} />
                        Añadir fotos
                      </>
                    )}
                  </button>
                </div>

                {/* Photo Grid */}
                <div className="p-4">
                  {count === 0 ? (
                    <div className="text-center py-10 rounded-xl border-2 border-dashed border-slate-200">
                      <ImageIcon size={28} style={{ color: '#cbd5e1' }} className="mx-auto mb-2" />
                      <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                        Aún no hay fotos de {city}
                      </p>
                      <button
                        onClick={() => handleUploadClick(city)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 transition-all"
                      >
                        <Plus size={12} />
                        Subir primera foto
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {cityPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer border border-slate-100 hover:border-cyan-200 hover:shadow-lg transition-all"
                          onClick={() => setPreviewPhoto(photo)}
                        >
                          <img
                            src={photo.image_url}
                            alt={`Foto de ${city}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(photo);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="px-5 pb-4">
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(count / MAX_PHOTOS_PER_CITY) * 100}%`,
                        background: isFull ? '#f59e0b' : 'linear-gradient(90deg, #0e7490, #0891b2)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      <Modal isOpen={!!previewPhoto} onClose={() => setPreviewPhoto(null)} title="" size="xl">
        {previewPhoto && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black">
              <img
                src={previewPhoto.image_url}
                alt={`Foto de ${previewPhoto.city}`}
                className="w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{previewPhoto.city}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  {new Date(previewPhoto.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(previewPhoto)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
              >
                <Trash2 size={13} />
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
