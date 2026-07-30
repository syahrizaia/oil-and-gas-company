/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/seed/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FacilityObject from '@/models/FacilityObject';

const dummyData = [
  {
    objectId: 'TANK_OIL_01',
    name: 'Tangki Penyimpanan Crude Oil Alpha',
    category: 'Tangki Penyimpanan',
    zone: 'Zone 1 - Tank Farm',
    status: 'Normal',
    specifications: {
      capacity: '100,000 Barrel',
      pressure: '14.7 PSI',
      temperature: '32°C',
      fluidType: 'Light Crude Oil',
    },
    maintenanceHistory: [
      {
        technician: 'Budi Santoso',
        description: 'Inspeksi rutin katup pengaman dan pembersihan endapan.',
      },
    ],
  },
  {
    objectId: 'PIPE_MAIN_GAS_02',
    name: 'Pipa Penyalur Gas Utama 24 Inch',
    category: 'Pipa Penyalur',
    zone: 'Zone 2 - Distribution Line',
    status: 'Warning',
    specifications: {
      pressure: '450 PSI',
      temperature: '55°C',
      flowRate: '50 MMSCFD',
      fluidType: 'Natural Gas',
    },
    maintenanceHistory: [
      {
        technician: 'Ahmad Supriadi',
        description: 'Terdeteksi anomali tekanan kecil. Pengetatan baut flange.',
      },
    ],
  },
  {
    objectId: 'PUMP_CRUDE_01',
    name: 'Pompa Transfer Utama Crude Oil',
    category: 'Pompa Transfer',
    zone: 'Zone 1 - Tank Farm',
    status: 'Normal',
    specifications: {
      capacity: '2,500 GPM',
      pressure: '220 PSI',
      temperature: '40°C',
    },
  },
];

export async function GET() {
  try {
    await dbConnect();
    await FacilityObject.deleteMany({}); // Bersihkan data lama
    await FacilityObject.insertMany(dummyData);

    return NextResponse.json({
      message: 'Data sampel fasilitas migas berhasil dimasukkan ke MongoDB!',
      totalData: dummyData.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}