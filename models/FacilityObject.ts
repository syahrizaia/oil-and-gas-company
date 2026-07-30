import mongoose, { Schema, Document } from 'mongoose';

export interface IFacilityObject extends Document {
  objectId: string;         // ID yang sesuai dengan GameObject Unity (contoh: "TANK_OIL_01")
  name: string;             // Nama aset (contoh: "Tangki Penyimpanan Crude Oil A")
  category: string;         // Tangki, Pipa Penyalur, Pompa Transfer, Flare Stack, Kilang
  zone: string;             // Zone A, Offshore Platform, Block B
  status: 'Normal' | 'Warning' | 'Critical' | 'Maintenance';
  specifications: {
    capacity?: string;      // Contoh: "50,000 Barrels"
    pressure?: string;      // Contoh: "150 PSI"
    temperature?: string;   // Contoh: "65°C"
    flowRate?: string;      // Contoh: "1,200 BPD"
    fluidType?: string;     // Crude Oil, Natural Gas, Diesel
  };
  maintenanceHistory: {
    date: Date;
    technician: string;
    description: string;
  }[];
  updatedAt: Date;
}

const FacilityObjectSchema: Schema = new Schema(
  {
    objectId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    zone: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['Normal', 'Warning', 'Critical', 'Maintenance'], 
      default: 'Normal' 
    },
    specifications: {
      capacity: { type: String },
      pressure: { type: String },
      temperature: { type: String },
      flowRate: { type: String },
      fluidType: { type: String },
    },
    maintenanceHistory: [
      {
        date: { type: Date, default: Date.now },
        technician: { type: String },
        description: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.FacilityObject ||
  mongoose.model('FacilityObject', FacilityObjectSchema);