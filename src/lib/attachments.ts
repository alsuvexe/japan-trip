import { supabase } from './supabase';

export interface FileAttachment {
  url: string;
  name: string;
}

type AttachmentSource = {
  attachments?: unknown;
  attachment_url?: string | null;
  attachment_name?: string | null;
};

// Normalizes both the new attachments array and the legacy single-file columns
export function parseAttachments(act: AttachmentSource): FileAttachment[] {
  if (Array.isArray(act.attachments)) {
    return (act.attachments as unknown[]).filter(
      (a): a is FileAttachment =>
        !!a && typeof a === 'object' && typeof (a as FileAttachment).url === 'string',
    );
  }
  if (act.attachment_url) {
    return [{ url: act.attachment_url, name: act.attachment_name || 'Adjunto' }];
  }
  return [];
}

export function isImageAttachment(att: FileAttachment): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(att.url) || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name);
}

export async function uploadActivityFile(file: File): Promise<FileAttachment | null> {
  const ext = file.name.split('.').pop();
  const path = `activities/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('attachments').upload(path, file);
  if (error) return null;
  const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
  return { url: urlData.publicUrl, name: file.name };
}

export async function uploadActivityFiles(files: File[]): Promise<FileAttachment[]> {
  const uploaded: FileAttachment[] = [];
  for (const file of files) {
    const res = await uploadActivityFile(file);
    if (res) uploaded.push(res);
  }
  return uploaded;
}

// Best-effort storage cleanup for a removed attachment
export async function deleteAttachmentFile(url: string): Promise<void> {
  const marker = '/object/public/attachments/';
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length).split('?')[0];
  await supabase.storage.from('attachments').remove([path]);
}
