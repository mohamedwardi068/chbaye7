import mongoose, { Document, Model } from "mongoose";

export interface IRide extends Document {
  riderId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId | null;
  status: "searching" | "accepted" | "arrived" | "started" | "completed";
  pickupLocation: string;
  destination: string;
  createdAt: Date;
  updatedAt: Date;
}

const RideSchema = new mongoose.Schema<IRide>(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["searching", "accepted", "arrived", "started", "completed"],
      default: "searching",
      required: true,
    },
    pickupLocation: { type: String, required: true },
    destination: { type: String, required: true },
  },
  { timestamps: true },
);

export const Ride: Model<IRide> = mongoose.model<IRide>("Ride", RideSchema);
