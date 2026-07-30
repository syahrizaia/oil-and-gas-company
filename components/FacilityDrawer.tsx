// components/FacilityDrawer.tsx
'use client';

import React from 'react';
import { FacilityObjectData } from '@/types/facility';

interface FacilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: FacilityObjectData | null;
  isLoading: boolean;
  error: string | null;
  onFocusCamera: (objectId: string) => void;
}

export default function FacilityDrawer({
  isOpen,
  onClose,
  data,
  isLoading,
  error,
  onFocusCamera,
}: FacilityDrawerProps) {
  if (!isOpen) return null;

  // Fungsi bantuan pewarnaan badge berdasarkan status fasilitas
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Operational':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'Maintenance':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/90 backdrop-blur-md border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col transition-all duration-300 transform">
      {/* Header Drawer */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Telemetry & Specs
          </span>
          <h2 className="text-xl font-bold text-white">
            {isLoading ? 'Memuat Data...' : data?.name || 'Detail Objek'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Tutup Drawer"
        >
          ✕
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Mengambil data dari MongoDB...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Content Data */}
        {!isLoading && data && (
          <>
            {/* Status Badge & Action Focus Camera */}
            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                  data.status
                )}`}
              >
                ● {data.status}
              </span>
              <button
                onClick={() => onFocusCamera(data.objectId)}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-medium flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
              >
                🎯 Fokus Kamera 3D
              </button>
            </div>

            {/* Grid Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Tekanan (Pressure)</p>
                <p className="text-lg font-semibold text-blue-400">
                  {data.pressure || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Suhu (Temperature)</p>
                <p className="text-lg font-semibold text-amber-400">
                  {data.temperature || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Flow Rate</p>
                <p className="text-lg font-semibold text-emerald-400">
                  {data.flowRate || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Kapasitas Maks</p>
                <p className="text-lg font-semibold text-slate-200">
                  {data.capacity || 'N/A'}
                </p>
              </div>
            </div>

            {/* Info Detail */}
            <div className="space-y-2 text-sm bg-slate-800/30 p-4 rounded-xl border border-slate-800/80">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Tag / ID Objek:</span>
                <span className="font-mono text-slate-200 font-semibold">{data.objectId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Kategori:</span>
                <span className="text-slate-200">{data.type}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Inspeksi Terakhir:</span>
                <span className="text-slate-200">{data.lastInspected || '-'}</span>
              </div>
            </div>

            {/* Maintenance Log */}
            {data.maintenanceHistory && data.maintenanceHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Riwayat Pemeliharaan
                </h3>
                <div className="space-y-2">
                  {data.maintenanceHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 text-xs"
                    >
                      <div className="flex justify-between font-medium text-slate-300 mb-1">
                        <span>{item.date}</span>
                        <span className="text-blue-400">{item.technician}</span>
                      </div>
                      <p className="text-slate-400">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}