/* eslint-disable @typescript-eslint/no-unused-vars */
// models/Facility.ts
import mongoose, { Schema, model, models } from 'mongoose';

const FacilitySchema = new Schema(
  {
    objectId: { type: String, required: true, unique: true }, // Contoh: "TANK_OIL_01"
    name: { type: String, required: true },
    type: { type: String, required: true },
    status: {
      type: String,
      enum: ['Operational', 'Maintenance', 'Critical', 'Offline'],
      default: 'Operational',
    },
    pressure: { type: String },
    temperature: { type: String },
    flowRate: { type: String },
    capacity: { type: String },
    lastInspected: { type: String },
    maintenanceHistory: [
      {
        date: { type: String },
        description: { type: String },
        technician: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default models.Facility || model('Facility', FacilitySchema);