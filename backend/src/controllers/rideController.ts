import type { Response } from "express";
import { Ride } from "../models/Ride.js";
import type { AuthRequest } from "../middlewares/auth.js";
import { getIO } from "../sockets/index.js";

function formatRide(ride: {
  _id: unknown;
  riderId: unknown;
  driverId: unknown;
  status: string;
  pickupLocation: string;
  destination: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    _id: String(ride._id),
    riderId: String(ride.riderId),
    driverId: ride.driverId ? String(ride.driverId) : null,
    status: ride.status,
    pickupLocation: ride.pickupLocation,
    destination: ride.destination,
    createdAt: ride.createdAt.toISOString(),
    updatedAt: ride.updatedAt.toISOString(),
  };
}

export async function createRideHandler(req: AuthRequest, res: Response): Promise<void> {
  const { pickupLocation, destination } = req.body as {
    pickupLocation: string;
    destination: string;
  };

  if (!pickupLocation || !destination) {
    res.status(400).json({ message: "Pickup and destination are required" });
    return;
  }

  try {
    const ride = await Ride.create({
      riderId: req.userId,
      pickupLocation,
      destination,
    });

    const formatted = formatRide(ride);

    try {
      const io = getIO();
      io.to("drivers").emit("ride:new", formatted);
    } catch {
      // Socket.io may not be initialized yet
    }

    res.status(201).json(formatted);
  } catch (err) {
    req.log?.error({ err }, "Create ride error");
    res.status(400).json({ message: "Failed to create ride" });
  }
}

export async function getActiveRideHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const role = req.userRole;
    let rideDoc;

    if (role === "rider") {
      rideDoc = await Ride.findOne({
        riderId: req.userId,
        status: { $in: ["searching", "accepted", "arrived", "started"] },
      })
        .populate("driverId", "name phone email")
        .sort({ createdAt: -1 });
    } else {
      rideDoc = await Ride.findOne({
        driverId: req.userId,
        status: { $in: ["accepted", "arrived", "started"] },
      })
        .populate("riderId", "name phone email")
        .sort({ createdAt: -1 });
    }

    if (!rideDoc) {
      res.json({ ride: null });
      return;
    }

    const base = formatRide(rideDoc);
    const rideResponse: typeof base & { driver?: unknown } = { ...base };

    if (role === "rider" && rideDoc.driverId) {
      rideResponse.driver = rideDoc.driverId;
    }

    res.json({ ride: rideResponse });
  } catch (err) {
    req.log?.error({ err }, "Get active ride error");
    res.status(400).json({ message: "Failed to get active ride" });
  }
}
