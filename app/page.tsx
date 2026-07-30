// app/page.tsx
import UnityGameWrapper from '@/components/UnityGameWrapper';

export const metadata = {
  title: '3D Facility Viewer | Migas',
  description: 'Sistem monitoring telemetri dan fasilitas 3D interaktif berbasis Next.js dan Unity WebGL',
};

export default function Page() {
  return (
    <main className="w-full h-screen overflow-hidden bg-slate-950">
      <UnityGameWrapper />
    </main>
  );
}