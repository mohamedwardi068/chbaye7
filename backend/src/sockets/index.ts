import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Ride } from "../models/Ride.js";
import { logger } from "../lib/logger.js";

let io: Server;

const userSocketMap = new Map<string, string>();

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    path: "/api/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket: Socket, next) => {
    const token =
      (socket.handshake.auth as Record<string, string>)?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const secret = process.env["JWT_SECRET"];
    if (!secret) return next(new Error("Server misconfiguration"));

    try {
      const decoded = jwt.verify(token, secret) as { id: string; role: string };
      (socket as Socket & { userId: string; userRole: string }).userId = decoded.id;
      (socket as Socket & { userId: string; userRole: string }).userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId, userRole } = socket as Socket & { userId: string; userRole: string };

    userSocketMap.set(userId, socket.id);
    logger.info({ userId, userRole, socketId: socket.id }, "Socket connected");

    if (userRole === "driver") {
      socket.join("drivers");
    }

    socket.on("driver:online", async () => {
      if (userRole === "driver") {
        socket.join("drivers");
        logger.info({ userId }, "Driver went online");

        try {
          const pendingRides = await Ride.find({ status: "searching" });
          for (const ride of pendingRides) {
            socket.emit("ride:new", {
              _id: String(ride._id),
              riderId: String(ride.riderId),
              driverId: null,
              status: ride.status,
              pickupLocation: ride.pickupLocation,
              destination: ride.destination,
              createdAt: ride.createdAt.toISOString(),
              updatedAt: ride.updatedAt.toISOString(),
            });
          }
        } catch (err) {
          logger.error({ err }, "Error sending pending rides to driver");
        }
      }
    });

    socket.on("driver:offline", () => {
      if (userRole === "driver") {
        socket.leave("drivers");
        logger.info({ userId }, "Driver went offline");
      }
    });

    socket.on("ride:accept", async ({ rideId }: { rideId: string }) => {
      if (userRole !== "driver") return;

      try {
        const ride = await Ride.findOneAndUpdate(
          { _id: rideId, driverId: null, status: "searching" },
          { driverId: userId, status: "accepted" },
          { new: true },
        );

        if (!ride) {
          socket.emit("ride:taken", { message: "Ride already taken" });
          return;
        }

        const riderSocketId = userSocketMap.get(String(ride.riderId));
        if (riderSocketId) {
          io.to(riderSocketId).emit("ride:accepted", {
            rideId: String(ride._id),
            status: "accepted",
            driver: { userId },
          });
        }

        socket.to("drivers").emit("ride:taken_broadcast", { rideId: String(ride._id) });
        socket.emit("ride:accept_success", {
          rideId: String(ride._id),
          status: "accepted",
        });

        logger.info({ rideId, driverId: userId }, "Ride accepted");
      } catch (err) {
        logger.error({ err }, "Error accepting ride");
        socket.emit("ride:error", { message: "Failed to accept ride" });
      }
    });

    socket.on("ride:reject", ({ rideId }: { rideId: string }) => {
      logger.info({ rideId, driverId: userId }, "Ride rejected");
    });

    socket.on(
      "ride:status",
      async ({ rideId, status }: { rideId: string; status: string }) => {
        if (userRole !== "driver") return;

        const validStatuses = ["arrived", "started", "completed"];
        if (!validStatuses.includes(status)) return;

        try {
          const ride = await Ride.findOneAndUpdate(
            { _id: rideId, driverId: userId },
            { status },
            { new: true },
          );

          if (!ride) return;

          const riderSocketId = userSocketMap.get(String(ride.riderId));
          if (riderSocketId) {
            io.to(riderSocketId).emit("ride:status_update", { rideId, status });
          }

          logger.info({ rideId, status }, "Ride status updated");
        } catch (err) {
          logger.error({ err }, "Error updating ride status");
        }
      },
    );

    socket.on("disconnect", () => {
      userSocketMap.delete(userId);
      logger.info({ userId, userRole }, "Socket disconnected");
    });
  });

  return io;
}
