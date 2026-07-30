/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/facility/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Facility from '@/models/Facility';

// 1. GET Handler
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params; // Jangan lupa await di sini

    const facility = await Facility.findOne({ objectId: id });
    if (!facility) {
      return NextResponse.json(
        { success: false, message: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: facility });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 2. PATCH Handler (Penyebab error di log terbaru)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- Ubah ke Promise
) {
  try {
    await connectToDatabase();
    const { id } = await params; // <-- Wajib await params
    const body = await request.json();

    const updatedFacility = await Facility.findOneAndUpdate(
      { objectId: id },
      body,
      { new: true, runValidators: true }
    );

    if (!updatedFacility) {
      return NextResponse.json(
        { success: false, message: 'Fasilitas tidak ditemukan untuk diupdate' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedFacility });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 3. DELETE Handler (jika ada)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deletedFacility = await Facility.findOneAndDelete({ objectId: id });
    if (!deletedFacility) {
      return NextResponse.json(
        { success: false, message: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Fasilitas berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}