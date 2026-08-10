/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import FacilityDrawer from './FacilityDrawer';
import { FacilityObjectData } from '@/types/facility';

// Interface untuk data telemetri fisik 3D dari C#
export interface Metrics3D {
  objectName: string;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
}

// Daftar Pilihan Aset Fasilitas untuk Dropdown HUD
const FACILITY_ASSETS = [
  {
    category: 'Pemain / Karakter',
    items: [{ id: 'NestedParentArmature_Unpack', label: '🚶 Karakter Inspeksi' }],
  },
  {
    category: 'Large Tanks',
    items: [
      { id: 'Large Tank (1)', label: 'Large Tank 01' },
      { id: 'Large Tank (2)', label: 'Large Tank 02' },
      { id: 'Large Tank (3)', label: 'Large Tank 03' },
      { id: 'Large Tank (4)', label: 'Large Tank 04' },
    ],
  },
  {
    category: 'Long Tanks',
    items: [
      { id: 'Long_Tanks (1)', label: 'Long Tank 01' },
      { id: 'Long_Tanks (2)', label: 'Long Tank 02' },
      { id: 'Long_Tanks (3)', label: 'Long Tank 03' },
      { id: 'Long_Tanks (4)', label: 'Long Tank 04' },
    ],
  },
  {
    category: 'Round Tanks',
    items: [
      { id: 'Round_tanks (1)', label: 'Round Tank 01' },
      { id: 'Round_tanks (2)', label: 'Round Tank 02' },
    ],
  },
  {
    category: 'Cisterns Standard',
    items: [
      { id: 'cistern (1)', label: 'Cistern 01' },
      { id: 'cistern (2)', label: 'Cistern 02' },
      { id: 'cistern (3)', label: 'Cistern 03' },
      { id: 'cistern (4)', label: 'Cistern 04' },
    ],
  },
  {
    category: 'Cisterns Big',
    items: [
      { id: 'cistern_big (1)', label: 'Cistern Big 01' },
      { id: 'cistern_big (2)', label: 'Cistern Big 02' },
      { id: 'cistern_big (3)', label: 'Cistern Big 03' },
      { id: 'cistern_big (4)', label: 'Cistern Big 04' },
    ],
  },
];

export default function UnityGame() {
  // 1. Inisialisasi Context WebGL
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

  // State Navigation Mode
  const [isWalkMode, setIsWalkMode] = useState<boolean>(false);
  const [activeCamIndex, setActiveCamIndex] = useState<number>(0);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

  const cameraOptions = [
    { id: 0, label: '🗺️ Overview', name: 'OverviewCamera' },
    { id: 1, label: '🛢️ Orbit Focus', name: 'OrbitCamera' },
    { id: 2, label: '🔍 Inspection', name: 'InspectionCamera' },
  ];

  // =========================================================================
  // HELPER: Fetch Data Fasilitas dari MongoDB API
  // =========================================================================
  const fetchFacilityData = useCallback(async (targetId: string) => {
    setIsDrawerOpen(true);
    setIsLoading(true);
    setError(null);

    try {
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
  // A. EVENT LISTENERS (DARI UNITY/JSLIB KE REACT)
  // =========================================================================
  const handleObjectSelected = useCallback(
    (payload: string) => {
      console.log('[React] Payload diterima dari Unity:', payload);
      let targetId = payload;

      try {
        if (payload.startsWith('{')) {
          const parsedMetrics: Metrics3D = JSON.parse(payload);
          setMetrics3D(parsedMetrics);
          targetId = parsedMetrics.objectName;
        }
      } catch (e) {
        console.warn('[React] Payload bukan JSON, menggunakan ID mentah:', e);
      }

      setSelectedAssetId(targetId);
      fetchFacilityData(targetId);
    },
    [fetchFacilityData]
  );

  // Sync status Walk Mode dari Unity (saat user tekan ESC di Unity)
  const handleWalkModeChange = useCallback((isWalk: any) => {
    const active = typeof isWalk === 'boolean' ? isWalk : String(isWalk) === 'true';
    setIsWalkMode(active);
  }, []);

  useEffect(() => {
    addEventListener('OnObjectSelected', handleObjectSelected);
    addEventListener('ON_WALK_MODE_CHANGE', handleWalkModeChange);

    return () => {
      removeEventListener('OnObjectSelected', handleObjectSelected);
      removeEventListener('ON_WALK_MODE_CHANGE', handleWalkModeChange);
    };
  }, [addEventListener, removeEventListener, handleObjectSelected, handleWalkModeChange]);

  // =========================================================================
  // B. KONTROL INTERAKSI (DARI REACT KE UNITY)
  // =========================================================================

  // Function Khusus: Kembali & Sinkronisasi Ke Karakter (Walk Mode + Camera Sync)
  const handleFocusPlayer = () => {
    if (!isLoaded) return;
    setSelectedAssetId('PlayerArmature');
    
    // Panggil fungsi FocusOnPlayer di Unity untuk sinkronisasi arah pandang & rotasi jalan
    sendMessage('CameraManager', 'FocusOnPlayer');
    setIsWalkMode(true);
  };

  // 1. Fokus Kamera & Fetch Data berdasarkan Aset yang dipilih
  const handleSelectFacility = (objectName: string) => {
    if (!objectName) return;
    setSelectedAssetId(objectName);

    // Jika user memilih Player/Karakter, jalankan sinkronisasi khusus ke Karakter
    if (objectName === 'PlayerArmature') {
      handleFocusPlayer();
      return;
    }

    if (isLoaded) {
      // Keluar dari Walk Mode jika sedang melihat tangki lain
      if (isWalkMode) handleExitWalk();

      sendMessage('CameraManager', 'FocusOnObject', objectName);
      fetchFacilityData(objectName);
    }
  };

  // 2. Walk Mode Handlers
  const handleEnterWalk = () => {
    if (!isLoaded) return;
    sendMessage('CameraManager', 'EnterWalkMode');
    setIsWalkMode(true);
  };

  const handleExitWalk = () => {
    if (!isLoaded) return;
    sendMessage('CameraManager', 'ExitWalkMode');
    setIsWalkMode(false);
  };

  // 3. Switch Kamera Presets
  const handleSwitchCamera = (index: number) => {
    if (!isLoaded) return;
    setActiveCamIndex(index);
    sendMessage('CameraManager', 'SwitchCameraByIndex', index);
  };

  // 4. Set Speed Karakter
  const handleSetSpeed = (speedValue: number) => {
    if (isLoaded) {
      sendMessage('Player', 'SetSpeed', speedValue);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      {/* Loading Overlay */}
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

      {/* Canvas WebGL Unity */}
      <Unity
        unityProvider={unityProvider}
        className="w-full h-full"
        style={{ visibility: isLoaded ? 'visible' : 'hidden' }}
      />

      {/* Floating Alert Indicator saat Walk Mode Aktif */}
      {isLoaded && isWalkMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-amber-500/90 text-slate-950 font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-md border border-amber-400 text-xs animate-pulse">
          <span>🎮 Mode Jalan Aktif — Gunakan WASD / Mouse</span>
          <button
            onClick={handleExitWalk}
            className="bg-slate-950 text-white px-2.5 py-1 rounded-full text-[11px] hover:bg-slate-800 transition"
          >
            Keluar (ESC)
          </button>
        </div>
      )}

      {/* HUD Bar Control */}
      {isLoaded && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-slate-900/85 backdrop-blur-md p-2 rounded-xl border border-slate-800/80 shadow-2xl text-xs">
          
          {/* Mode Switcher: Walk Mode & Reset Player */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
            {!isWalkMode ? (
              <button
                onClick={handleEnterWalk}
                className="flex items-center gap-1.5 px-3 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-md shadow-emerald-900/30"
              >
                <span>🚶</span>
                <span>Mode Jalan</span>
              </button>
            ) : (
              <button
                onClick={handleExitWalk}
                className="flex items-center gap-1.5 px-3 py-1.5 font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition shadow-md shadow-rose-900/30"
              >
                <span>🛑</span>
                <span>Keluar Walk</span>
              </button>
            )}

            {/* Tombol Pintas: Kembali / Sinkron Ke Karakter */}
            <button
              onClick={handleFocusPlayer}
              title="Kamera & karakter langsung sinkron ke arah depan"
              className="flex items-center gap-1 px-2.5 py-1.5 font-medium bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg transition"
            >
              <span>🎯</span>
              <span>Reset Ke Karakter</span>
            </button>
          </div>

          {/* Selector Kamera Presets */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-800">
            {cameraOptions.map((cam) => (
              <button
                key={cam.id}
                onClick={() => handleSwitchCamera(cam.id)}
                className={`px-2.5 py-1.5 font-medium rounded-lg transition border ${
                  activeCamIndex === cam.id
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Dropdown Asset Selector */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
            <span className="text-slate-400 pl-1 font-medium">Aset:</span>
            <select
              value={selectedAssetId}
              onChange={(e) => handleSelectFacility(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
            >
              <option value="" disabled>
                -- Pilih Aset Tangki --
              </option>
              {FACILITY_ASSETS.map((group, idx) => (
                <optgroup key={idx} label={group.category} className="bg-slate-900 text-slate-300">
                  {group.items.map((asset) => (
                    <option key={asset.id} value={asset.id} className="bg-slate-800 text-white">
                      {asset.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Controls Kecepatan Karakter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 px-1 font-medium">Speed:</span>
            <button
              onClick={() => handleSetSpeed(2)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition border border-slate-700/50 text-[11px]"
            >
              2x
            </button>
            <button
              onClick={() => handleSetSpeed(10)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition border border-slate-700/50 text-[11px]"
            >
              10x
            </button>
          </div>
        </div>
      )}

      {/* Card Telemetri Ruang 3D (Posisi & Bounding Box) */}
      {isLoaded && metrics3D && isDrawerOpen && (
        <div className="absolute top-20 left-4 z-10 w-72 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl shadow-2xl text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-blue-400">TELEMETRI RUANG 3D</span>
            <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-mono">
              LIVE
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Posisi Koordinat (World XYZ):</span>
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

      {/* Drawer Detail Fasilitas (MongoDB) */}
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