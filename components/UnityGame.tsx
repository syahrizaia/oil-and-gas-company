/* eslint-disable @typescript-eslint/no-explicit-any */
// components/UnityGame.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import FacilityDrawer from './FacilityDrawer';
import { FacilityObjectData } from '@/types/facility';

export default function UnityGame() {
  // 1. Inisialisasi Provider dan Fungsi Komunikasi dari useUnityContext
  const {
    unityProvider,
    isLoaded,
    loadingProgression,
    addEventListener,
    removeEventListener,
    sendMessage,
  } = useUnityContext({
    loaderUrl: '/unity-build/Build/BuildOutput.loader.js',
    dataUrl: '/unity-build/Build/BuildOutput.data',
    frameworkUrl: '/unity-build/Build/BuildOutput.framework.js',
    codeUrl: '/unity-build/Build/BuildOutput.wasm',
  });

  // 2. State Management untuk Drawer Telemetri & Fetch Data
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<FacilityObjectData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // =========================================================================
  // A. KONTROL DARI UNITY KE REACT (Event Listener)
  // =========================================================================
  const handleObjectSelected = useCallback(async (objectId: string) => {
    console.log('[React] Objek terpilih dari Unity:', objectId);
    setIsDrawerOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      // Fetch data fasilitas dari Next.js API Route yang terhubung ke MongoDB
      const response = await fetch(`/api/facility/${objectId}`);
      if (!response.ok) {
        throw new Error(`Gagal mengambil data fasilitas (${response.status})`);
      }
      const result = await response.json();
      setSelectedData(result.data || result);
    } catch (err: any) {
      console.error('[React] Error Fetch Facility:', err);
      setError(err.message || 'Terjadi kesalahan sistem saat mengambil data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Daftarkan listener event dari Unity (.jslib)
    addEventListener('OnObjectSelected', handleObjectSelected);

    // Pembersihan listener saat komponen ditutup
    return () => {
      removeEventListener('OnObjectSelected', handleObjectSelected);
    };
  }, [addEventListener, removeEventListener, handleObjectSelected]);

  // =========================================================================
  // B. KONTROL DARI REACT KE UNITY (sendMessage)
  // =========================================================================
  const handleSetPOV = (mode: string) => {
    if (isLoaded) {
      // Panggil method SetPOV pada GameObject CameraManager di Unity
      sendMessage('CameraManager', 'SetPOV', mode);
    }
  };

  const handleSetSpeed = (speedValue: number) => {
    if (isLoaded) {
      // Panggil method SetSpeed pada GameObject Player di Unity
      sendMessage('Player', 'SetSpeed', speedValue);
    }
  };

  const handleFocusCamera = (objectId: string) => {
    if (isLoaded) {
      // Panggil method FocusObject pada CameraManager
      sendMessage('CameraManager', 'FocusObject', objectId);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      {/* Loading Overlay (Ditampilkan saat file WebGL sedang dimuat) */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-lg font-medium text-slate-300 mb-2">
            Memuat Modul 3D Migas... {Math.round(loadingProgression * 100)}%
          </p>
          <div className="w-64 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${loadingProgression * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Canvas WebGL 3D Unity */}
      <Unity
        unityProvider={unityProvider}
        className="w-full h-full"
        style={{ visibility: isLoaded ? 'visible' : 'hidden' }}
      />

      {/* HUD Controls Overlay (Melayang di atas Canvas 3D) */}
      {isLoaded && (
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-3 bg-slate-900/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 shadow-2xl">
          {/* Switch Camera POV */}
          <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700/60">
            <span className="text-xs font-medium text-slate-400 px-1">POV:</span>
            <button
              onClick={() => handleSetPOV('Overview')}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg transition border border-slate-700/50"
            >
              🗺️ Map 3D
            </button>
            <button
              onClick={() => handleSetPOV('Character')}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg transition border border-slate-700/50"
            >
              🚶 Karakter
            </button>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 px-1">Kecepatan:</span>
            <button
              onClick={() => handleSetSpeed(2)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700/50"
            >
              Pelan (2)
            </button>
            <button
              onClick={() => handleSetSpeed(10)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700/50"
            >
              Cepat (10)
            </button>
          </div>
        </div>
      )}

      {/* Slide-Over Drawer UI Telemetri */}
      <FacilityDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        data={selectedData}
        isLoading={isLoading}
        error={error}
        onFocusCamera={handleFocusCamera}
      />
    </div>
  );
}