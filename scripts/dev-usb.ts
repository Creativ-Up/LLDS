/**
 * Lance l'app sur un téléphone Android branché en USB, sans dépendre du Wi-Fi :
 *   1. redirige les ports Metro (8081) et Supabase (54321) du téléphone vers le PC (`adb reverse`) ;
 *   2. démarre Metro en annonçant l'hôte 127.0.0.1.
 *
 * Metro reste en mode « lan » (écoute sur toutes les interfaces, IPv4 comprise) : en mode
 * `--localhost`, il n'écoute que sur [::1] sous Windows, injoignable pour `adb reverse` (IPv4).
 *
 * Usage : `pnpm dev:usb [--clear]` (débogage USB activé sur le téléphone), puis « a » pour ouvrir Expo Go.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import { repoRoot } from './lib/supabase-cli';

const PORTS = [8081, 54321];

function adbPath(): string {
  const sdk =
    process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
  const candidate = join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
  return existsSync(candidate) ? candidate : 'adb';
}

function adb(args: string[]): string {
  const result = spawnSync(adbPath(), args, { encoding: 'utf8' });
  if (result.error) throw new Error(`adb introuvable (${result.error.message}). Installez les platform-tools Android.`);
  if (result.status !== 0) throw new Error(`adb ${args.join(' ')} a échoué :\n${result.stderr || result.stdout}`);
  return result.stdout;
}

const devices = adb(['devices'])
  .split('\n')
  .slice(1)
  .map((line) => line.trim().split(/\s+/))
  .filter(([serial, state]) => serial && state === 'device');

if (devices.length === 0) {
  console.error(
    'Aucun téléphone Android détecté. Branchez-le en USB, activez le débogage USB ' +
      '(Options pour les développeurs) et acceptez l’autorisation affichée sur le téléphone.',
  );
  process.exit(1);
}

for (const port of PORTS) adb(['reverse', `tcp:${port}`, `tcp:${port}`]);
console.log(`adb reverse → ports ${PORTS.join(', ')} redirigés vers le PC (${devices.length} appareil(s)).`);
console.log('Dans le terminal Expo, appuyez sur « a » pour ouvrir l’app dans Expo Go.\n');

const mobileDir = resolve(repoRoot, 'apps/mobile');
const expoCli = resolve(dirname(createRequire(join(mobileDir, 'package.json')).resolve('expo/package.json')), 'bin/cli');

// Options supplémentaires transmises à `expo start` (ex. `pnpm dev:usb --clear`).
const expo = spawnSync(process.execPath, [expoCli, 'start', '--port', String(PORTS[0]), ...process.argv.slice(2)], {
  cwd: mobileDir,
  stdio: 'inherit',
  env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1' },
});
process.exit(expo.status ?? 0);
