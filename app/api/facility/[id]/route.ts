/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/facility/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import FacilityObject from '@/models/FacilityObject';
import dbConnect from '@/lib/dbConnect';
import { connectToDatabase } from '@/lib/mongodb';
import Facility from '@/models/Facility';

// GET: Ambil detail objek berdasarkan objectId dari Unity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Wajib berbentuk Promise
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const facility = await Facility.findOne({ objectId: id });

    if (!facility) {
      return NextResponse.json(
        { success: false, message: `Fasilitas ID '${id}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: facility }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}

// PATCH: Update status/spesifikasi objek (untuk kebutuhan monitoring/IoT)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const updatedObject = await FacilityObject.findOneAndUpdate(
      { objectId: id },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedObject) {
      return NextResponse.json(
        { message: `Gagal memperbarui, ID '${id}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedObject, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Gagal memperbarui data', error: error.message },
      { status: 500 }
    );
  }
}