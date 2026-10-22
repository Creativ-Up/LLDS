'use client';

import { mediaSchema, type Media, type MediaBucket } from '@llds/shared';

import { publicEnv } from '@/lib/env';
import { unwrap } from '@/lib/errors';
import { getSupabase } from '@/lib/supabase/client';

export type MediaFamily = 'image' | 'video' | 'audio' | 'subtitles';

/** Formats acceptés (docs/ADMIN.md § Médiathèque) : type MIME normalisé par extension. */
const ACCEPTED: Record<string, { mime: string; family: MediaFamily }> = {
  jpg: { mime: 'image/jpeg', family: 'image' },
  jpeg: { mime: 'image/jpeg', family: 'image' },
  png: { mime: 'image/png', family: 'image' },
  webp: { mime: 'image/webp', family: 'image' },
  mp4: { mime: 'video/mp4', family: 'video' },
  m4a: { mime: 'audio/mp4', family: 'audio' },
  mp3: { mime: 'audio/mpeg', family: 'audio' },
  vtt: { mime: 'text/vtt', family: 'subtitles' },
};

export const ACCEPT_ATTR: Record<MediaFamily | 'any', string> = {
  image: '.jpg,.jpeg,.png,.webp',
  video: '.mp4',
  audio: '.m4a,.mp3',
  subtitles: '.vtt',
  any: Object.keys(ACCEPTED)
    .map((ext) => `.${ext}`)
    .join(','),
};

/** Au-delà, un avertissement est affiché (la vidéo est tout de même téléversée). */
export const VIDEO_WARNING_BYTES = 200 * 1024 * 1024;

export function familyOfMime(mime: string): MediaFamily {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'subtitles';
}

const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

export function acceptedFormat(file: File): { mime: string; family: MediaFamily } | null {
  return ACCEPTED[extensionOf(file.name)] ?? null;
}

function slugify(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return (
    base
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'fichier'
  );
}

interface Measured {
  width: number | null;
  height: number | null;
  duration: number | null;
}

function measureElement(file: File, family: MediaFamily): Promise<Measured> {
  if (family === 'subtitles') return Promise.resolve({ width: null, height: null, duration: null });
  const url = URL.createObjectURL(file);
  return new Promise<Measured>((resolve) => {
    const done = (value: Measured) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    if (family === 'image') {
      const image = new Image();
      image.onload = () => done({ width: image.naturalWidth, height: image.naturalHeight, duration: null });
      image.onerror = () => done({ width: null, height: null, duration: null });
      image.src = url;
      return;
    }
    const element = document.createElement(family === 'video' ? 'video' : 'audio');
    element.preload = 'metadata';
    element.onloadedmetadata = () => {
      const isVideo = element instanceof HTMLVideoElement;
      done({
        width: isVideo && element.videoWidth ? element.videoWidth : null,
        height: isVideo && element.videoHeight ? element.videoHeight : null,
        duration: Number.isFinite(element.duration) ? Math.round(element.duration * 1000) / 1000 : null,
      });
    };
    element.onerror = () => done({ width: null, height: null, duration: null });
    element.src = url;
  });
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function putObject(
  bucket: MediaBucket,
  path: string,
  file: File,
  mime: string,
  token: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    xhr.open('POST', `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', mime);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('network'));
    xhr.send(file);
  });
}

export interface UploadOptions {
  file: File;
  /** media-public pour les images affichées sans URL signée (couvertures, cachets, partenaires). */
  bucket: MediaBucket;
  credit?: string | null;
  onProgress?: (pct: number) => void;
}

/** Téléverse un fichier dans Storage puis enregistre ses métadonnées réelles dans `media`. */
export async function uploadMedia({ file, bucket, credit, onProgress }: UploadOptions): Promise<Media> {
  const format = acceptedFormat(file);
  if (!format) throw new Error('unsupported');

  const supabase = getSupabase();
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error('forbidden');

  const [measured, hash] = await Promise.all([measureElement(file, format.family), sha256(file)]);
  const year = new Date().getFullYear();
  const path = `${year}/${crypto.randomUUID()}-${slugify(file.name)}.${extensionOf(file.name)}`;

  await putObject(bucket, path, file, format.mime, token, onProgress);

  const row = unwrap(
    await supabase
      .from('media')
      .insert({
        bucket,
        path,
        mime: format.mime,
        size_bytes: file.size,
        duration_s: measured.duration,
        width: measured.width,
        height: measured.height,
        sha256: hash,
        credit: credit?.trim() || null,
        original_name: file.name,
      })
      .select('*')
      .single(),
  );
  return mediaSchema.parse(row);
}
