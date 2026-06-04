import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export type PasteStatus = 'idle' | 'uploading' | 'done' | 'error';

interface UseImagePasteOptions {
  onInsert: (markdown: string) => void;
}

export function useImagePaste({ onInsert }: UseImagePasteOptions) {
  const [status, setStatus] = useState<PasteStatus>('idle');

  const uploadImageBlob = async (blob: Blob): Promise<string | null> => {
    const ext = blob.type.split('/')[1] || 'png';
    const path = `activity-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('attachments')
      .upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from('attachments').getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (!imageItem) return;

      e.preventDefault();
      setStatus('uploading');

      const blob = imageItem.getAsFile();
      if (!blob) {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
        return;
      }

      const url = await uploadImageBlob(blob);
      if (url) {
        onInsert(`![imagen](${url})`);
        setStatus('done');
      } else {
        setStatus('error');
      }
      setTimeout(() => setStatus('idle'), 2000);
    },
    [onInsert]
  );

  return { handlePaste, status };
}
