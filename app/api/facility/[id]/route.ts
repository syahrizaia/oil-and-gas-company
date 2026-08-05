/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/facility/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Facility from '@/models/Facility';

// Helper function untuk membangun kueri pencarian fleksibel
function buildSearchQuery(rawId: string) {
  const decodedId = decodeURIComponent(rawId);

  const searchConditions: any[] = [
    { objectId: decodedId },
    { objectName: decodedId },
    { name: decodedId },
    { code: decodedId },
  ];

  // Tambahkan pencarian berdasarkan MongoDB _id jika nilainya valid 24-char ObjectId
  if (mongoose.Types.ObjectId.isValid(decodedId)) {
    searchConditions.push({ _id: decodedId });
  }

  return { decodedId, query: { $or: searchConditions } };
}

// =========================================================================
// 1. GET Handler - Mengambil Data Fasilitas
// =========================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { decodedId, query } = buildSearchQuery(id);

    const facility = await Facility.findOne(query);

    if (!facility) {
      return NextResponse.json(
        { success: false, message: `Fasilitas '${decodedId}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: facility }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// =========================================================================
// 2. PATCH Handler - Memperbarui Data Fasilitas
// =========================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { decodedId, query } = buildSearchQuery(id);
    const body = await request.json();

    const updatedFacility = await Facility.findOneAndUpdate(query, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedFacility) {
      return NextResponse.json(
        { success: false, message: `Fasilitas '${decodedId}' tidak ditemukan untuk diupdate.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedFacility }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// =========================================================================
// 3. DELETE Handler - Menghapus Data Fasilitas
// =========================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { decodedId, query } = buildSearchQuery(id);

    const deletedFacility = await Facility.findOneAndDelete(query);

    if (!deletedFacility) {
      return NextResponse.json(
        { success: false, message: `Fasilitas '${decodedId}' tidak ditemukan untuk dihapus.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: `Fasilitas '${decodedId}' berhasil dihapus.` },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}