'use client';

import type { LineStringGeometry } from '@llds/shared';
import { colors } from '@llds/shared/tokens';
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  ScaleControl,
  setWorkerUrl,
  type GeoJSONSource,
  type MapOptions,
} from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';

import 'maplibre-gl/dist/maplibre-gl.css';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

setWorkerUrl('/vendor/maplibre-gl-worker.mjs');

export interface MapStop {
  id: string;
  n: number;
  name: string;
  lng: number;
  lat: number;
  radius: number;
  warn: boolean;
}

interface LineMapProps {
  lineId: string;
  track: LineStringGeometry | null;
  stops: MapStop[];
  selectedId: string | null;
  addMode: boolean;
  onAdd: (lng: number, lat: number) => void;
  onSelect: (stopId: string) => void;
  onMove: (stopId: string, lng: number, lat: number) => void;
}

// Centre par défaut : Wallonie (avant import du tracé).
const DEFAULT_CENTER: [number, number] = [4.47, 50.5];
const DEFAULT_ZOOM = 7.4;
const FIT_PADDING = 48;
const EARTH_METERS_PER_DEGREE = 111_320;

/** Style sans tuiles (fond uni) quand aucun fond de carte n'est configuré. */
const BLANK_STYLE: Exclude<MapOptions['style'], string | undefined> = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': colors.admin.mapBg } }],
};

/** Polygone approchant le cercle de déclenchement (rayon en mètres). */
function circlePolygon(lng: number, lat: number, radiusM: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const dLat = radiusM / EARTH_METERS_PER_DEGREE;
  const dLng = radiusM / (EARTH_METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = Array.from({ length: 65 }, (_, i) => {
    const angle = (i / 64) * 2 * Math.PI;
    return [lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)];
  });
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

function markerElement(stop: MapStop, selected: boolean): HTMLDivElement {
  const element = document.createElement('div');
  element.setAttribute('role', 'button');
  element.setAttribute('title', stop.name);
  element.className =
    'relative grid size-7 cursor-pointer place-items-center rounded-full text-[12px] font-semibold leading-none text-cream shadow-[0_0_0_3px_var(--color-cream),0_3px_8px_var(--color-admin-shadow-strong)]';
  element.style.background = selected ? colors.red : colors.ink;
  element.textContent = String(stop.n);
  if (stop.warn) {
    const dot = document.createElement('span');
    dot.className = 'absolute -top-[3px] -right-[3px] block size-2.5 rounded-full bg-red shadow-[0_0_0_2px_var(--color-cream)]';
    element.append(dot);
  }
  return element;
}

/** Carte de l'éditeur de ligne : tracé, arrêts numérotés déplaçables, placement aimanté. */
export function LineMap({ lineId, track, stops, selectedId, addMode, onAdd, onSelect, onMove }: LineMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const fittedRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const handlers = useRef({ onAdd, onSelect, onMove, addMode });
  useEffect(() => {
    handlers.current = { onAdd, onSelect, onMove, addMode };
  }, [onAdd, onSelect, onMove, addMode]);

  // Création de la carte.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const map = new MapLibreMap({
      container,
      style: publicEnv.NEXT_PUBLIC_MAP_STYLE_URL || BLANK_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });
    map.addControl(new ScaleControl({ unit: 'metric', maxWidth: 80 }), 'bottom-left');
    map.on('load', () => {
      map.addSource('radius', { type: 'geojson', data: EMPTY });
      map.addLayer({ id: 'radius-fill', type: 'fill', source: 'radius', paint: { 'fill-color': colors.admin.radiusFill } });
      map.addLayer({
        id: 'radius-line',
        type: 'line',
        source: 'radius',
        paint: { 'line-color': colors.olive, 'line-width': 1.5 },
      });
      map.addSource('track', { type: 'geojson', data: EMPTY });
      map.addLayer({
        id: 'track-line',
        type: 'line',
        source: 'track',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': colors.ink, 'line-width': 5 },
      });
      setReady(true);
    });
    map.on('click', (event) => {
      if (handlers.current.addMode) handlers.current.onAdd(event.lngLat.lng, event.lngLat.lat);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Curseur en croix en mode placement.
  useEffect(() => {
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = addMode ? 'crosshair' : '';
  }, [addMode, ready]);

  // Tracé.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource<GeoJSONSource>('track');
    source?.setData(track ? { type: 'Feature', properties: {}, geometry: track } : EMPTY);
  }, [track, ready]);

  // Cercle de déclenchement de l'arrêt sélectionné.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const selected = stops.find((stop) => stop.id === selectedId);
    map.getSource<GeoJSONSource>('radius')?.setData(
      selected ? circlePolygon(selected.lng, selected.lat, selected.radius) : EMPTY,
    );
  }, [stops, selectedId, ready]);

  // Marqueurs (recréés à chaque changement : quelques dizaines au plus).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const marker of markersRef.current) marker.remove();
    markersRef.current = stops.map((stop) => {
      const element = markerElement(stop, stop.id === selectedId);
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        handlers.current.onSelect(stop.id);
      });
      const marker = new Marker({ element, draggable: true }).setLngLat([stop.lng, stop.lat]).addTo(map);
      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        handlers.current.onMove(stop.id, lng, lat);
      });
      return marker;
    });
  }, [stops, selectedId]);

  // Cadrage initial sur le tracé (ou les arrêts), une fois par ligne.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || fittedRef.current === lineId) return;
    const points: [number, number][] = track ? track.coordinates : stops.map((stop) => [stop.lng, stop.lat]);
    const first = points[0];
    if (!first) return;
    const bounds = points.reduce((acc, point) => acc.extend(point), new LngLatBounds(first, first));
    map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: 15, duration: 0 });
    fittedRef.current = lineId;
  }, [lineId, track, stops, ready]);

  return (
    <div className="relative aspect-[640/420] w-full">
      <div ref={containerRef} className="h-full w-full" />
      {addMode && (
        <div className="pointer-events-none absolute top-3.5 left-1/2 z-10 -translate-x-1/2 animate-adm-fade whitespace-nowrap rounded-full bg-ink px-3.5 py-[9px] text-[13px] font-medium leading-none text-cream">
          {track ? t('line.map.placeHint') : t('line.map.placeHintNoTrack')}
        </div>
      )}
      <div className="absolute right-3.5 bottom-3.5 z-10 flex flex-col overflow-hidden rounded-[8px] bg-cream shadow-[inset_0_0_0_1px_var(--color-admin-border)]">
        <button
          type="button"
          aria-label={t('line.map.zoomIn')}
          onClick={() => mapRef.current?.zoomIn()}
          className="grid h-8 w-[34px] place-items-center border-b border-admin-border text-[18px] font-medium leading-none text-ink hover:bg-admin-nav-hover"
        >
          +
        </button>
        <button
          type="button"
          aria-label={t('line.map.zoomOut')}
          onClick={() => mapRef.current?.zoomOut()}
          className="grid h-8 w-[34px] place-items-center text-[18px] font-medium leading-none text-ink hover:bg-admin-nav-hover"
        >
          −
        </button>
      </div>
    </div>
  );
}
