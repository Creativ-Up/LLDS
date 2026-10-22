/**
 * Construit le seed de développement depuis `seed/demo-seed.json` :
 *   - supabase/seed.sql                  → exécuté par `supabase db reset`
 *   - supabase/seed-media/manifest.json  → fichiers à téléverser dans Storage (`pnpm seed:upload`)
 *   - supabase/seed-media/…              → médias placeholder générés
 *
 * Les médias absents du seed sont remplacés par des placeholders : carte postale (image),
 * vidéo et audio seul (si ffmpeg est installé) et sous-titres, en français.
 * Toutes les métadonnées (taille, empreinte, dimensions, durée) sont mesurées sur les fichiers.
 *
 * Usage : `pnpm seed:build [--force]` (--force régénère les placeholders existants).
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';

import {
  pickText,
  seedFileSchema,
  type I18nText,
  type Lang,
  type MediaBucket,
  type SeedLine,
  type SeedStop,
  type StopMediaKind,
} from '@llds/shared';
import { tokens } from '@llds/shared/tokens';
import sharp from 'sharp';

import { repoRoot } from '../lib/supabase-cli';
import { mediaManifestSchema, type MediaManifest } from './manifest';

const force = process.argv.includes('--force');
const seedPath = resolve(repoRoot, 'seed/demo-seed.json');
const outSql = resolve(repoRoot, 'supabase/seed.sql');
const mediaDir = resolve(repoRoot, 'supabase/seed-media');

const PLACEHOLDER_DURATION_S = 24;
const PLACEHOLDER_LANG: Lang = 'fr';
const CREDIT_DEMO = 'Média de démonstration (Figma LLDS) — droits à vérifier avant diffusion.';
const CREDIT_PLACEHOLDER = 'Média provisoire généré pour le développement.';

const seed = seedFileSchema.parse(JSON.parse(readFileSync(seedPath, 'utf8')));

// ---------------------------------------------------------------------------
// Identifiants déterministes (UUID v5) : stables d'un reset à l'autre.
// ---------------------------------------------------------------------------

const UUID_NAMESPACE = Buffer.from('3f6a2c1e8b4d4e7a9c0d5b6e7f8a9b0c', 'hex');

function seedId(name: string): string {
  const hash = createHash('sha1').update(UUID_NAMESPACE).update(name).digest();
  hash.writeUInt8((hash.readUInt8(6) & 0x0f) | 0x50, 6);
  hash.writeUInt8((hash.readUInt8(8) & 0x3f) | 0x80, 8);
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------------------------------------------------------------------------
// Médias
// ---------------------------------------------------------------------------

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.vtt': 'text/vtt',
};

interface MediaRow {
  id: string;
  bucket: MediaBucket;
  path: string;
  mime: string;
  size_bytes: number;
  duration_s: number | null;
  width: number | null;
  height: number | null;
  sha256: string;
  credit: string | null;
  original_name: string | null;
  /** Fichier local, relatif à la racine du dépôt. */
  file: string;
}

const mediaRows: MediaRow[] = [];

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
const hasFfprobe = spawnSync('ffprobe', ['-version']).status === 0;

function probeDuration(file: string): number | null {
  if (!hasFfprobe) return null;
  const result = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file],
    { encoding: 'utf8' },
  );
  const value = Number.parseFloat(result.stdout.trim());
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null;
}

async function registerMedia(input: {
  key: string;
  bucket: MediaBucket;
  path: string;
  file: string;
  credit: string | null;
  durationFallback?: number;
}): Promise<string> {
  const ext = extname(input.file).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) throw new Error(`Format non pris en charge : ${input.file}`);
  if (!existsSync(input.file)) throw new Error(`Fichier introuvable : ${input.file}`);

  let width: number | null = null;
  let height: number | null = null;
  let duration: number | null = null;
  if (mime.startsWith('image/')) {
    const meta = await sharp(input.file).metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;
  } else if (mime.startsWith('video/') || mime.startsWith('audio/')) {
    duration = probeDuration(input.file) ?? input.durationFallback ?? null;
    if (mime.startsWith('video/')) {
      const dims = probeVideoSize(input.file);
      width = dims?.width ?? null;
      height = dims?.height ?? null;
    }
  }

  const id = seedId(`media:${input.key}`);
  mediaRows.push({
    id,
    bucket: input.bucket,
    path: input.path,
    mime,
    size_bytes: statSync(input.file).size,
    duration_s: duration,
    width,
    height,
    sha256: createHash('sha256').update(readFileSync(input.file)).digest('hex'),
    credit: input.credit,
    original_name: input.file.split(sep).pop() ?? null,
    file: relative(repoRoot, input.file).split(sep).join('/'),
  });
  return id;
}

function probeVideoSize(file: string): { width: number; height: number } | null {
  if (!hasFfprobe) return null;
  const result = spawnSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file],
    { encoding: 'utf8' },
  );
  const [w, h] = result.stdout.trim().split(',').map((v) => Number.parseInt(v, 10));
  return w && h ? { width: w, height: h } : null;
}

function assetFile(assetPath: string): string {
  return resolve(repoRoot, assetPath);
}

function placeholderFile(...segments: string[]): string {
  const file = resolve(mediaDir, ...segments);
  mkdirSync(dirname(file), { recursive: true });
  return file;
}

function needsGeneration(file: string): boolean {
  return force || !existsSync(file);
}

// ---------------------------------------------------------------------------
// Placeholders
// ---------------------------------------------------------------------------

const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Carte postale provisoire : cadre « billet perforé », nom de l'arrêt et année. */
async function generateArchivePlaceholder(file: string, title: string, year: number | null): Promise<void> {
  if (!needsGeneration(file)) return;
  const { color } = tokens;
  const w = 1200;
  const h = 800;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${color.palette.brown300}"/>
  <rect x="48" y="48" width="${w - 96}" height="${h - 96}" rx="13" fill="${color.cream}"
        stroke="${color.sepia}" stroke-width="6" stroke-linecap="round" stroke-dasharray="150 12 58 12 190 12 70 12"/>
  <text x="${w / 2}" y="${h / 2 - 10}" text-anchor="middle" font-family="Inter, Arial, sans-serif"
        font-size="64" font-weight="600" fill="${color.sepia}">${escapeXml(title)}</text>
  <text x="${w / 2}" y="${h / 2 + 70}" text-anchor="middle" font-family="Inter, Arial, sans-serif"
        font-size="44" fill="${color.olive}">${year ?? ''}</text>
  <text x="${w / 2}" y="${h - 110}" text-anchor="middle" font-family="Inter, Arial, sans-serif"
        font-size="26" letter-spacing="5" fill="${color.grey}">IMAGE PROVISOIRE</text>
</svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(file);
}

function runFfmpeg(args: string[]): void {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`ffmpeg a échoué :\n${result.stderr}`);
}

const ambience = `anoisesrc=color=brown:amplitude=0.05:sample_rate=44100:duration=${PLACEHOLDER_DURATION_S}`;
const fades = `afade=t=in:d=1,afade=t=out:st=${PLACEHOLDER_DURATION_S - 1}:d=1`;

/** Vidéo provisoire : lent zoom sur la carte postale + ambiance sonore discrète (H.264 + AAC). */
function generateVideoPlaceholder(file: string, archive: string): void {
  if (!needsGeneration(file)) return;
  const frames = PLACEHOLDER_DURATION_S * 25;
  runFfmpeg([
    '-i', archive,
    '-f', 'lavfi', '-i', ambience,
    '-filter_complex',
    `[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,` +
      `zoompan=z='min(zoom+0.0004,1.2)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=960x540:fps=25,` +
      `format=yuv420p[v];[1:a]${fades}[a]`,
    '-map', '[v]', '-map', '[a]',
    '-t', String(PLACEHOLDER_DURATION_S),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30',
    '-c:a', 'aac', '-b:a', '64k',
    '-movflags', '+faststart',
    file,
  ]);
}

/** Audio seul provisoire (AAC / M4A). */
function generateAudioPlaceholder(file: string): void {
  if (!needsGeneration(file)) return;
  runFfmpeg(['-f', 'lavfi', '-i', ambience, '-af', fades, '-c:a', 'aac', '-b:a', '64k', file]);
}

const vttTime = (seconds: number): string => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `00:${mm}:${ss}.000`;
};

/** Sous-titres provisoires reprenant le nom et la description de l'arrêt. */
function generateSubtitles(file: string, stop: SeedStop): void {
  const name = pickText(stop.name, PLACEHOLDER_LANG);
  const cues = [
    stop.year ? `${name}, ${stop.year}.` : name,
    pickText(stop.description, PLACEHOLDER_LANG),
  ].filter((text) => text.trim() !== '');
  const step = Math.floor(PLACEHOLDER_DURATION_S / Math.max(cues.length, 1));
  const body = cues
    .map((text, i) => `${vttTime(i * step)} --> ${vttTime((i + 1) * step)}\n${text}`)
    .join('\n\n');
  writeFileSync(file, `WEBVTT\n\n${body}\n`, 'utf8');
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

type SqlValue = string | number | boolean | null;

const sqlString = (value: string): string => `'${value.replace(/'/g, "''")}'`;
const sqlJson = (value: I18nText | Record<string, string>): string => `${sqlString(JSON.stringify(value))}::jsonb`;
const sqlLiteral = (value: SqlValue): string => {
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return sqlString(value);
};
const sqlRaw = (expression: string): { raw: string } => ({ raw: expression });

type SqlCell = SqlValue | { raw: string };

function insert(table: string, rows: Record<string, SqlCell>[]): string {
  const first = rows[0];
  if (!first) return `-- ${table} : aucune ligne\n`;
  const columns = Object.keys(first);
  const values = rows.map(
    (row) =>
      `  (${columns
        .map((col) => {
          const cell = row[col] ?? null;
          return typeof cell === 'object' && cell !== null ? cell.raw : sqlLiteral(cell);
        })
        .join(', ')})`,
  );
  return `insert into public.${table} (${columns.join(', ')}) values\n${values.join(',\n')};\n`;
}

const geographyLine = (coordinates: [number, number][]): string =>
  `'SRID=4326;LINESTRING(${coordinates.map(([lng, lat]) => `${lng} ${lat}`).join(', ')})'::extensions.geography`;

const geographyPoint = (lng: number, lat: number): string =>
  `'SRID=4326;POINT(${lng} ${lat})'::extensions.geography`;

/** « Guinaumont 75, 7890 Ellezelles » → « Ellezelles » (code postal belge à 4 chiffres). */
function cityFromAddress(address: string): string | null {
  return /\b\d{4}\s+(.+)$/.exec(address)?.[1]?.trim() ?? null;
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  mkdirSync(mediaDir, { recursive: true });
  if (!hasFfmpeg) {
    console.warn('⚠ ffmpeg introuvable : pas de vidéo ni d’audio placeholder (sous-titres et images seulement).');
  }

  const lineIdByCode = new Map<string, string>();
  const stopIdByKey = new Map<string, string>();
  const stampIdByKey = new Map<string, string>();

  for (const line of seed.lines) lineIdByCode.set(line.code, seedId(`line:${line.code}`));
  for (const stamp of seed.stamps) stampIdByKey.set(stamp.key, seedId(`stamp:${stamp.key}`));
  for (const line of seed.lines) {
    for (const stop of line.stops) {
      if (stopIdByKey.has(stop.key)) throw new Error(`Clé d’arrêt en double : ${stop.key}`);
      stopIdByKey.set(stop.key, seedId(`stop:${line.code}:${stop.key}`));
    }
  }

  const requireId = (map: Map<string, string>, key: string, kind: string): string => {
    const id = map.get(key);
    if (!id) throw new Error(`${kind} inconnu dans le seed : ${key}`);
    return id;
  };

  // Lignes
  const lineRows: Record<string, SqlCell>[] = [];
  for (const [index, line] of seed.lines.entries()) {
    const coverId = line.cover
      ? await registerMedia({
          key: `line:${line.code}:cover`,
          bucket: 'media-public',
          path: `seed/lines/${line.code.toLowerCase()}/cover${extname(line.cover)}`,
          file: assetFile(line.cover),
          credit: CREDIT_DEMO,
        })
      : null;
    lineRows.push({
      id: requireId(lineIdByCode, line.code, 'Ligne'),
      code: line.code,
      name: sqlRaw(sqlJson(line.name)),
      tagline: sqlRaw(sqlJson(line.tagline ?? {})),
      cover_media_id: coverId,
      track: sqlRaw(line.track ? geographyLine(line.track.coordinates) : 'null'),
      // La publication est contrôlée en base : la ligne est publiée après l'insertion de ses arrêts.
      status: line.status === 'published' ? 'draft' : line.status,
      sort_order: index,
    });
  }

  // Cachets
  const stampRows: Record<string, SqlCell>[] = [];
  for (const [index, stamp] of seed.stamps.entries()) {
    const imageId = stamp.image
      ? await registerMedia({
          key: `stamp:${stamp.key}:image`,
          bucket: 'media-public',
          path: `seed/stamps/${stamp.key}${extname(stamp.image)}`,
          file: assetFile(stamp.image),
          credit: CREDIT_DEMO,
        })
      : null;
    stampRows.push({
      id: requireId(stampIdByKey, stamp.key, 'Cachet'),
      name: sqlRaw(sqlJson(stamp.name)),
      image_media_id: imageId,
      rule: stamp.rule,
      line_id: stamp.line ? requireId(lineIdByCode, stamp.line, 'Ligne') : null,
      points_threshold: stamp.points_threshold ?? null,
      sort_order: index,
    });
  }

  // Arrêts et leurs médias
  const stopRows: Record<string, SqlCell>[] = [];
  const stopMediaRows: Record<string, SqlCell>[] = [];
  for (const line of seed.lines) {
    for (const [index, stop] of line.stops.entries()) {
      await buildStop(line, stop, index, stopRows, stopMediaRows, {
        stopId: requireId(stopIdByKey, stop.key, 'Arrêt'),
        lineId: requireId(lineIdByCode, line.code, 'Ligne'),
        stampId: stop.stamp ? requireId(stampIdByKey, stop.stamp, 'Cachet') : null,
      });
    }
  }

  // Partenaires et avantages
  const partnerIdByKey = new Map<string, string>();
  const partnerRows: Record<string, SqlCell>[] = [];
  for (const partner of seed.partners) {
    const id = seedId(`partner:${partner.key}`);
    partnerIdByKey.set(partner.key, id);
    const photoId = partner.photo
      ? await registerMedia({
          key: `partner:${partner.key}:photo`,
          bucket: 'media-public',
          path: `seed/partners/${partner.key}/photo${extname(partner.photo)}`,
          file: assetFile(partner.photo),
          credit: CREDIT_DEMO,
        })
      : null;
    const logoId = partner.logo
      ? await registerMedia({
          key: `partner:${partner.key}:logo`,
          bucket: 'media-public',
          path: `seed/partners/${partner.key}/logo${extname(partner.logo)}`,
          file: assetFile(partner.logo),
          credit: CREDIT_DEMO,
        })
      : null;
    partnerRows.push({
      id,
      name: partner.name,
      address: partner.address,
      city: cityFromAddress(partner.address),
      opening_hours: sqlRaw(sqlJson(partner.opening_hours)),
      photo_media_id: photoId,
      logo_media_id: logoId,
    });
  }

  const offerRows = seed.offers.map((offer, index): Record<string, SqlCell> => ({
    id: seedId(`offer:${offer.partner}:${index}`),
    partner_id: requireId(partnerIdByKey, offer.partner, 'Partenaire'),
    title: sqlRaw(sqlJson(offer.title)),
    description: sqlRaw(sqlJson(offer.description)),
    conditions: sqlRaw(sqlJson(offer.conditions)),
    required_stamp_id: offer.required_stamp ? requireId(stampIdByKey, offer.required_stamp, 'Cachet') : null,
    visible_from_stop_id: offer.visible_from_stop ? requireId(stopIdByKey, offer.visible_from_stop, 'Arrêt') : null,
    active: true,
  }));

  const publishedIds = seed.lines
    .filter((line) => line.status === 'published')
    .map((line) => sqlString(requireId(lineIdByCode, line.code, 'Ligne')));
  const publishSql = publishedIds.length
    ? `-- Publication (refusée par la base si un arrêt est incomplet).\nupdate public.lines set status = 'published' where id in (${publishedIds.join(', ')});\n`
    : '';

  const settings = seed.app_settings;
  const sql = [
    '-- Généré par scripts/seed/build-seed.ts depuis seed/demo-seed.json — ne pas modifier.',
    '-- Données FICTIVES de démonstration. Le compte admin et les fichiers Storage sont créés par `pnpm seed:upload`.',
    '',
    `update public.app_settings set
  default_geofence_radius_m = ${settings.default_geofence_radius_m},
  walk_kmh = ${settings.walk_kmh},
  bike_kmh = ${settings.bike_kmh},
  car_kmh = ${settings.car_kmh},
  default_guest_preview_s = ${settings.default_guest_preview_s}
where id;
`,
    insert(
      'media',
      mediaRows.map(({ file: _file, ...row }) => row),
    ),
    insert('lines', lineRows),
    insert('stamps', stampRows),
    insert('stops', stopRows),
    insert('stop_media', stopMediaRows),
    insert('partners', partnerRows),
    insert('offers', offerRows),
    hasFfmpeg ? publishSql : '-- Sans ffmpeg, les arrêts n’ont pas de narration : aucune ligne n’est publiée.\n',
  ].join('\n');

  writeFileSync(outSql, sql, 'utf8');

  const manifest: MediaManifest = mediaManifestSchema.parse({
    files: mediaRows.map((row) => ({ bucket: row.bucket, path: row.path, file: row.file, mime: row.mime })),
  });
  writeFileSync(resolve(mediaDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const totalMb = mediaRows.reduce((sum, row) => sum + row.size_bytes, 0) / 1024 / 1024;
  console.log(
    `seed → supabase/seed.sql : ${seed.lines.length} lignes, ${stopRows.length} arrêts, ` +
      `${stampRows.length} cachets, ${partnerRows.length} partenaires, ${offerRows.length} avantages, ` +
      `${mediaRows.length} médias (${totalMb.toFixed(1)} Mo).`,
  );
}

async function buildStop(
  line: SeedLine,
  stop: SeedStop,
  index: number,
  stopRows: Record<string, SqlCell>[],
  stopMediaRows: Record<string, SqlCell>[],
  ids: { stopId: string; lineId: string; stampId: string | null },
): Promise<void> {
  const folder = `${line.code.toLowerCase()}-${stop.key}`;
  const storagePrefix = `seed/stops/${folder}`;
  const name = pickText(stop.name, PLACEHOLDER_LANG);

  let archiveFile: string;
  let archiveCredit: string;
  if (stop.archive) {
    archiveFile = assetFile(stop.archive);
    archiveCredit = CREDIT_DEMO;
  } else {
    archiveFile = placeholderFile('stops', folder, 'archive.jpg');
    archiveCredit = CREDIT_PLACEHOLDER;
    await generateArchivePlaceholder(archiveFile, name, stop.year ?? null);
  }
  const archiveId = await registerMedia({
    key: `stop:${line.code}:${stop.key}:archive`,
    bucket: 'media',
    path: `${storagePrefix}/archive${extname(archiveFile)}`,
    file: archiveFile,
    credit: archiveCredit,
  });

  const narration: { kind: StopMediaKind; file: string; ext: string }[] = [];
  if (hasFfmpeg) {
    const video = placeholderFile('stops', folder, PLACEHOLDER_LANG, 'video.mp4');
    generateVideoPlaceholder(video, archiveFile);
    narration.push({ kind: 'video', file: video, ext: '.mp4' });

    const audio = placeholderFile('stops', folder, PLACEHOLDER_LANG, 'audio.m4a');
    generateAudioPlaceholder(audio);
    narration.push({ kind: 'audio', file: audio, ext: '.m4a' });
  }
  const subtitles = placeholderFile('stops', folder, PLACEHOLDER_LANG, 'subtitles.vtt');
  generateSubtitles(subtitles, stop);
  narration.push({ kind: 'subtitles', file: subtitles, ext: '.vtt' });

  for (const item of narration) {
    const mediaId = await registerMedia({
      key: `stop:${line.code}:${stop.key}:${PLACEHOLDER_LANG}:${item.kind}`,
      bucket: 'media',
      path: `${storagePrefix}/${PLACEHOLDER_LANG}/${item.kind}${item.ext}`,
      file: item.file,
      credit: CREDIT_PLACEHOLDER,
      durationFallback: PLACEHOLDER_DURATION_S,
    });
    stopMediaRows.push({ stop_id: ids.stopId, lang: PLACEHOLDER_LANG, kind: item.kind, media_id: mediaId });
  }

  stopRows.push({
    id: ids.stopId,
    line_id: ids.lineId,
    position: index + 1,
    name: sqlRaw(sqlJson(stop.name)),
    year: stop.year ?? null,
    location: sqlRaw(geographyPoint(stop.lng, stop.lat)),
    description: sqlRaw(sqlJson(stop.description)),
    services: sqlRaw(`array[${stop.services.map(sqlString).join(', ')}]::public.stop_service[]`),
    points: stop.points,
    archive_media_id: archiveId,
    stamp_id: ids.stampId,
  });
}

await main();
