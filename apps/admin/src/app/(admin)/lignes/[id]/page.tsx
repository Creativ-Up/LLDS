import { Suspense } from 'react';

import { LineEditor } from '@/features/lines/line-editor';

export default function LinePage() {
  return (
    <Suspense>
      <LineEditor />
    </Suspense>
  );
}
