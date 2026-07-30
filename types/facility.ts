// types/facility.ts

export interface MaintenanceRecord {
  date: string;
  description: string;
  technician: string;
}

export interface FacilityObjectData {
  _id: string;
  objectId: string;        // ID penghubung dengan Unity (misal: "TANK_OIL_01")
  name: string;            // Nama fasilitas (misal: "Storage Tank A-12")
  type: string;            // Jenis (misal: "Crude Oil Storage")
  status: 'Operational' | 'Maintenance' | 'Critical' | 'Offline';
  pressure?: string;       // Telemetri tekanan (misal: "14.2 PSI")
  temperature?: string;    // Telemetri suhu (misal: "65°C")
  flowRate?: string;       // Debit aliran (misal: "120 L/min")
  capacity?: string;       // Kapasitas (misal: "50,000 Barrels")
  lastInspected?: string;
  maintenanceHistory?: MaintenanceRecord[];
}