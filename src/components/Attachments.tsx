import { useCallback, useRef, useState } from 'react';
import { FileText, X, Paperclip, Trash2, Download } from 'lucide-react';
import { type FileAttachment, uploadActivityFiles, isImageAttachment } from '../lib/attachments';

export const ATTACH_ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.webp';

export function useActivityAttachments(initial: FileAttachment[]) {
  const [existing, setExisting] = useState<FileAttachment[]>(initial);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((list: FileList | null) => {
    if (list && list.length > 0) setNewFiles((prev) => [...prev, ...Array.from(list)]);
  }, []);

  const removeExisting = useCallback((i: number) => {
    setExisting((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const removeNew = useCallback((i: number) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const reset = useCallback((init: FileAttachment[]) => {
    setExisting(init);
    setNewFiles([]);
  }, []);

  const uploadAll = useCallback(async (): Promise<FileAttachment[]> => {
    if (newFiles.length === 0) return existing;
    setUploading(true);
    const uploaded = await uploadActivityFiles(newFiles);
    setUploading(false);
    return [...existing, ...uploaded];
  }, [existing, newFiles]);

  return { existing, newFiles, uploading, addFiles, removeExisting, removeNew, reset, uploadAll };
}

export type ActivityAttachmentsState = ReturnType<typeof useActivityAttachments>;

// Edit-mode attachment picker: lists files already saved plus newly selected ones,
// supports incremental multi-selection and per-file removal
export function AttachmentsEditor({ state }: { state: ActivityAttachmentsState }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFiles = state.existing.length > 0 || state.newFiles.length > 0;

  return (
    <div className="space-y-2">
      {hasFiles && (
        <div className="flex flex-wrap gap-1.5">
          {state.existing.map((att, i) => (
            <span
              key={`saved-${i}`}
              className="inline-flex items-center gap-1.5 text-xs bg-cyan-50 border border-cyan-200 rounded-lg px-2.5 py-1.5"
              style={{ color: '#0e7490' }}
            >
              <FileText size={11} className="shrink-0" />
              <a href={att.url} target="_blank" rel="noopener noreferrer" className="max-w-[160px] truncate hover:underline">
                {att.name}
              </a>
              <button type="button" onClick={() => state.removeExisting(i)} className="hover:text-red-500 shrink-0" title="Quitar adjunto">
                <X size={11} />
              </button>
            </span>
          ))}
          {state.newFiles.map((f, i) => (
            <span
              key={`new-${i}`}
              className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5"
              style={{ color: '#047857' }}
            >
              <FileText size={11} className="shrink-0" />
              <span className="max-w-[160px] truncate">{f.name}</span>
              <button type="button" onClick={() => state.removeNew(i)} className="hover:text-red-500 shrink-0" title="Quitar archivo">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex-1 w-full japan-input flex items-center gap-2 cursor-pointer hover:border-cyan-400 py-2.5 text-left"
      >
        <Paperclip size={13} style={{ color: '#94a3b8' }} className="shrink-0" />
        <span className="text-sm" style={{ color: '#94a3b8' }}>Añadir archivos (PDF, imagenes)...</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ATTACH_ACCEPT}
        className="hidden"
        onChange={(e) => {
          state.addFiles(e.target.files);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </div>
  );
}

// Read-mode attachment list: inline preview for images, open/download for documents,
// optional per-file delete button
export function AttachmentViewer({ attachments, onRemove }: {
  attachments: FileAttachment[];
  onRemove?: (index: number) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      {attachments.map((att, i) =>
        isImageAttachment(att) ? (
          <div key={i} className="relative group/max-w-full">
            <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={att.url}
                alt={att.name}
                className="rounded-xl max-h-48 w-full object-cover border border-slate-200 shadow-sm"
                loading="lazy"
              />
            </a>
            {onRemove && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-white/95 border border-slate-200 shadow-sm hover:text-red-500 transition-colors"
                style={{ color: '#64748b' }}
                title="Eliminar adjunto"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ) : (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-xs text-cyan-700 hover:text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-lg px-2.5 py-1.5"
          >
            <FileText size={11} className="shrink-0" />
            <a href={att.url} target="_blank" rel="noopener noreferrer" className="max-w-[180px] truncate hover:underline">
              {att.name}
            </a>
            <a href={att.url} download={att.name} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:text-cyan-900" title="Descargar">
              <Download size={11} />
            </a>
            {onRemove && (
              <button type="button" onClick={() => onRemove(i)} className="shrink-0 hover:text-red-500" title="Eliminar adjunto">
                <Trash2 size={11} />
              </button>
            )}
          </span>
        ),
      )}
    </div>
  );
}
