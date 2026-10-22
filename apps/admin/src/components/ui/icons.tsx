import type { SVGProps } from 'react';

// Icônes de la maquette (prototype/source/Dashboard admin LLDS.dc.html), en `currentColor`.

type IconProps = SVGProps<SVGSVGElement>;

export function DashboardIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" />
      <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" />
      <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" />
      <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" />
    </svg>
  );
}

export function LinesIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <path d="M2 15c3-1 3-5 6-6s4-5 8-6" />
      <circle cx="2.5" cy="14.8" r="1.6" fill="currentColor" />
      <circle cx="8.6" cy="8.8" r="1.6" fill="currentColor" />
      <circle cx="15.5" cy="3.2" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function StampsIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <circle cx="9" cy="9" r="7.4" />
      <circle cx="9" cy="9" r="4.2" strokeDasharray="2.4 1.8" />
    </svg>
  );
}

export function PartnersIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" {...props}>
      <path d="M1.6 6.2h14.8v3a1.8 1.8 0 0 0 0 3.6v3H1.6v-3a1.8 1.8 0 0 0 0-3.6Z" />
      <path d="M11.5 6.4v9.2" strokeDasharray="1.6 1.6" />
    </svg>
  );
}

export function MediaIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" {...props}>
      <rect x="1.5" y="2.5" width="15" height="13" rx="2" />
      <circle cx="6" cy="7" r="1.6" />
      <path d="M2 13.5l4.4-4 3.4 3 2.4-2 3.8 3.4" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <circle cx="7" cy="6" r="3.2" />
      <path d="M1.5 16c0-3.2 2.4-5.2 5.5-5.2s5.5 2 5.5 5.2" />
      <path d="M12.2 3.2a3 3 0 0 1 0 5.6M14 10.9c1.6.6 2.6 2.2 2.6 4.6" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <circle cx="10" cy="10" r="3" />
      <path
        d="M10 1.4v2.2M10 16.4v2.2M18.6 10h-2.2M3.6 10H1.4M16.1 3.9l-1.6 1.6M5.5 14.5l-1.6 1.6M16.1 16.1l-1.6-1.6M5.5 5.5 3.9 3.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6" />
      <path d="M10.5 11 13.5 8l-3-3M13.3 8H6.5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M7 1.5v11M1.5 7h11" />
    </svg>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <svg width="10" height="7" viewBox="0 0 10 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 6l4-4.5L9 6" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg width="10" height="7" viewBox="0 0 10 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 1l4 4.5L9 1" />
    </svg>
  );
}

export function DragHandleIcon(props: IconProps) {
  return (
    <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" {...props}>
      <circle cx="4" cy="4" r="1.6" />
      <circle cx="10" cy="4" r="1.6" />
      <circle cx="4" cy="10" r="1.6" />
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="4" cy="16" r="1.6" />
      <circle cx="10" cy="16" r="1.6" />
    </svg>
  );
}

export function TrackIcon(props: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...props}>
      <path d="M2 15c3-1 3-5 6-6s4-5 8-6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 4.2 3.7 6.8 9 1.2" />
    </svg>
  );
}

export function CrossIcon(props: IconProps) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" {...props}>
      <path d="M1 1l6 6M7 1 1 7" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 16V4" />
      <path d="M7 8.5 12 3.5l5 5" />
      <path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="7" cy="7" r="5.4" />
      <path d="m11 11 4 4" strokeLinecap="round" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg width="10" height="11" viewBox="0 0 11 12" fill="currentColor" {...props}>
      <path d="M1 .5l9.5 5.5L1 11.5z" />
    </svg>
  );
}

/** Pastille de validation du toast (cercle tilleul, coche encre). */
export function ToastCheckIcon(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 30 30" fill="none" {...props}>
      <circle cx="15" cy="15" r="15" className="fill-tilleul" />
      <path d="M8.6 15.4l4.2 4.2 8.6-8.6" className="stroke-ink" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
