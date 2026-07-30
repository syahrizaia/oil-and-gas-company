// components/UnityGameWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamic import untuk UnityGame dengan mematikan SSR
const UnityGame = dynamic(() => import('@/components/UnityGame'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-slate-950 text-slate-300">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium animate-pulse">Menyiapkan Engine 3D Migas...</p>
    </div>
  ),
});

export default function UnityGameWrapper() {
  return <UnityGame />;
}