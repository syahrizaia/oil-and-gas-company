/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/facility/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FacilityObject from '@/models/FacilityObject';

export async function GET() {
  try {
    await dbConnect();
    const allFacilities = await FacilityObject.find({}).select('objectId name category status zone');
    return NextResponse.json(allFacilities, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Gagal mengambil daftar aset', error: error.message },
      { status: 500 }
    );
  }
}