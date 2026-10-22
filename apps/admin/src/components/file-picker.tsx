'use client';

import { useRef, type ReactNode } from 'react';

interface FilePickerProps {
  accept: string;
  onFile: (file: File) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
  children: ReactNode;
}

/** Bouton qui ouvre le sélecteur de fichiers du navigateur (champ de fichier masqué). */
export function FilePicker({ accept, onFile, className, disabled, label, children }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        className={className}
        onClick={(event) => {
          event.stopPropagation();
          inputRef.current?.click();
        }}
      >
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onFile(file);
        }}
      />
    </>
  );
}
