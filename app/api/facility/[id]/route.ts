/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/facility/[id]/route.ts
import { NextResponse } from 'next/server';
import FacilityObject from '@/models/FacilityObject';
import dbConnect from '@/lib/dbConnect';

// GET: Ambil detail objek berdasarkan objectId dari Unity
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    const facilityData = await FacilityObject.findOne({ objectId: id });

    if (!facilityData) {
      return NextResponse.json(
        { message: `Aset dengan ID '${id}' tidak ditemukan di database.` },
        { status: 404 }
      );
    }

    return NextResponse.json(facilityData, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Gagal mengambil data', error: error.message },
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