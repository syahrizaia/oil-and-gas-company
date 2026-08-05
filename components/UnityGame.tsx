/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import FacilityDrawer from './FacilityDrawer';
import { FacilityObjectData } from '@/types/facility';

// Interface untuk data telemetri fisik 3D yang dikirim dari C#
export interface Metrics3D {
  objectName: string;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
}

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

  // 2. State Management
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<FacilityObjectData | null>(null);
  const [metrics3D, setMetrics3D] = useState<Metrics3D | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State untuk 3 Kamera di Unity
  const [activeCamIndex, setActiveCamIndex] = useState<number>(0);

  // Daftar opsi kamera beserta ID & nama GameObject
  const cameraOptions = [
    { id: 0, label: '🗺️ Map Overview', name: 'OverviewCamera' },
    { id: 1, label: '🛢️ Orbit Focus', name: 'OrbitCamera' },
    { id: 2, label: '🔍 Detail Inspector', name: 'InspectionCamera' },
  ];

  // =========================================================================
  // HELPER: Fetch Data Fasilitas dari MongoDB API
  // =========================================================================
  const fetchFacilityData = useCallback(async (targetId: string) => {
    setIsDrawerOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      // Encode targetId untuk menangani spasi & karakter khusus (misal: "Large Tank (1)")
      const encodedId = encodeURIComponent(targetId);
      const response = await fetch(`/api/facility/${encodedId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Data fasilitas untuk '${targetId}' belum terdaftar di database.`);
        }
        throw new Error(`Gagal mengambil data fasilitas (${response.status})`);
      }

      const result = await response.json();
      const apiData = result.data || result;
      setSelectedData(apiData);
    } catch (err: any) {
      console.error('[React] Error Fetch Facility:', err);
      setError(err.message || 'Terjadi kesalahan sistem saat mengambil data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================================================================
  // A. KONTROL DARI UNITY KE REACT (Event Listener dari .jslib)
  // =========================================================================
  const handleObjectSelected = useCallback((payload: string) => {
    console.log('[React] Payload diterima dari Unity:', payload);

    let targetId = payload;

    // Cek apakah payload berisi JSON string dari C# ObjectMetrics
    try {
      if (payload.startsWith('{')) {
        const parsedMetrics: Metrics3D = JSON.parse(payload);
        setMetrics3D(parsedMetrics);
        targetId = parsedMetrics.objectName; // Gunakan nama objek sebagai ID
      }
    } catch (e) {
      console.warn('[React] Payload bukan JSON string, menggunakan ID mentah:', e);
    }

    // Ambil data fasilitas dari API
    fetchFacilityData(targetId);
  }, [fetchFacilityData]);

  useEffect(() => {
    // Daftarkan listener event dari Unity (.jslib)
    addEventListener('OnObjectSelected', handleObjectSelected);

    // Pembersihan listener saat komponen ditutup
    return () => {
      removeEventListener('OnObjectSelected', handleObjectSelected);
    };
  }, [addEventListener, removeEventListener, handleObjectSelected]);

  // =========================================================================
  // B. KONTROL DARI REACT KE UNITY (sendMessage ke C#)
  // =========================================================================

  // 1. Fungsi Terintegrasi: Pilih Fasilitas dari UI React (Fokus Kamera + Fetch Data)
  const handleSelectFacility = (objectName: string) => {
    if (isLoaded) {
      // 1. Minta Unity gerakkan kamera ke nama GameObject tersebut
      sendMessage('CameraManager', 'FocusOnObject', objectName);

      // 2. Fetch data detail dari Next.js API
      fetchFacilityData(objectName);
    }
  };

  // 2. Fungsi Switch Kamera (3 Kamera)
  const handleSwitchCamera = (index: number) => {
    if (!isLoaded) return;
    setActiveCamIndex(index);
    sendMessage('CameraManager', 'SwitchCameraByIndex', index);
  };

  // 3. Switch Camera POV
  const handleSetPOV = (mode: string) => {
    if (isLoaded) {
      sendMessage('CameraManager', 'SetPOV', mode);
    }
  };

  // 4. Set Kecepatan Karakter
  const handleSetSpeed = (speedValue: number) => {
    if (isLoaded) {
      sendMessage('Player', 'SetSpeed', speedValue);
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
          
          {/* SWITCH 3 KAMERA */}
          <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700/60">
            <span className="text-xs font-medium text-slate-400 px-1">Kamera:</span>
            {cameraOptions.map((cam) => (
              <button
                key={cam.id}
                onClick={() => handleSwitchCamera(cam.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                  activeCamIndex === cam.id
                    ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700/50 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

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
          <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700/60">
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

          {/* Quick Focus Buttons (Menggunakan handleSelectFacility) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 px-1">Fokus Cepat:</span>
            <button
              onClick={() => handleSelectFacility('Large Tank (1)')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition border border-blue-500/50"
            >
              🛢️ Tangki 01
            </button>
            <button
              onClick={() => handleSelectFacility('Large Tank (2)')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition border border-blue-500/50"
            >
              🛢️ Tangki 02
            </button>
            <button
              onClick={() => handleSelectFacility('Large Tank (3)')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition border border-blue-500/50"
            >
              🛢️ Tangki 03
            </button>
            <button
              onClick={() => handleSelectFacility('Large Tank (4)')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition border border-blue-500/50"
            >
              🛢️ Tangki 04
            </button>
          </div>
        </div>
      )}

      {/* Card Telemetri 3D Real-time (Koordinat XYZ & Dimensi Fisik) */}
      {isLoaded && metrics3D && isDrawerOpen && (
        <div className="absolute top-30 left-4 z-10 w-72 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl shadow-2xl text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-blue-400">TELEMETRI RUANG 3D</span>
            <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded">
              LIVE
            </span>
          </div>
          
          <div>
            <span className="text-slate-400 block text-[11px]">Posisi (World XYZ):</span>
            <div className="grid grid-cols-3 gap-1.5 mt-1 font-mono text-center">
              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/50">
                <span className="text-red-400 block text-[9px]">X</span>
                {metrics3D.position.x.toFixed(2)}
              </div>
              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/50">
                <span className="text-green-400 block text-[9px]">Y</span>
                {metrics3D.position.y.toFixed(2)}
              </div>
              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/50">
                <span className="text-blue-400 block text-[9px]">Z</span>
                {metrics3D.position.z.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Dimensi Bounding Box (PxLxT):</span>
            <div className="grid grid-cols-3 gap-1.5 mt-1 font-mono text-center">
              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/50">
                <span className="text-slate-400 block text-[9px]">P (m)</span>
                {metrics3D.size.x.toFixed(2)}
              </div>
              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/50">
                <span className="text-slate-400 block text-[9px]">L (m)</span>
                {metrics3D.size.z.toFixed(2)}
              </div>
              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/50">
                <span className="text-slate-400 block text-[9px]">T (m)</span>
                {metrics3D.size.y.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Drawer UI Telemetri MongoDB */}
      <FacilityDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        data={selectedData}
        isLoading={isLoading}
        error={error}
        onFocusCamera={handleSelectFacility}
      />
    </div>
  );
}