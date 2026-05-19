import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { getBackendUrl } from "../constants/config";

export interface RideRequest {
  _id: string;
  riderId: string;
  pickupLocation: string;
  destination: string;
  status: string;
  createdAt: string;
}

interface SocketContextType {
  isConnected: boolean;
  isOnline: boolean;
  goOnline: () => void;
  goOffline: () => void;
  pendingRequests: RideRequest[];
  currentRideStatus: string | null;
  currentRideDriverId: string | null;
  acceptedRideId: string | null;
  acceptRide: (rideId: string) => void;
  rejectRide: (rideId: string) => void;
  updateRideStatus: (rideId: string, status: "arrived" | "started" | "completed") => void;
  setCurrentRideStatus: React.Dispatch<React.SetStateAction<string | null>>;
  clearAcceptedRide: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([]);
  const [currentRideStatus, setCurrentRideStatus] = useState<string | null>(null);
  const [currentRideDriverId, setCurrentRideDriverId] = useState<string | null>(null);
  const [acceptedRideId, setAcceptedRideId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setIsOnline(false);
        setPendingRequests([]);
      }
      return;
    }

    const socket = io(getBackendUrl(), {
      path: "/api/socket.io",
      auth: { token },
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", (err) =>
      console.log("Socket connect_error:", err.message),
    );

    socket.on("ride:new", (request: RideRequest) => {
      setPendingRequests((prev) => {
        if (prev.some((r) => r._id === request._id)) return prev;
        return [request, ...prev];
      });
    });

    socket.on("ride:taken_broadcast", ({ rideId }: { rideId: string }) => {
      setPendingRequests((prev) => prev.filter((r) => r._id !== rideId));
    });

    socket.on("ride:accept_success", ({ rideId }: { rideId: string }) => {
      setAcceptedRideId(rideId);
      setPendingRequests([]);
    });

    socket.on(
      "ride:accepted",
      ({ driver }: { rideId: string; driver: { userId: string } }) => {
        setCurrentRideStatus("accepted");
        setCurrentRideDriverId(driver.userId);
      },
    );

    socket.on(
      "ride:status_update",
      ({ status }: { rideId: string; status: string }) => {
        setCurrentRideStatus(status);
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const goOnline = () => {
    socketRef.current?.emit("driver:online");
    setIsOnline(true);
  };

  const goOffline = () => {
    socketRef.current?.emit("driver:offline");
    setIsOnline(false);
    setPendingRequests([]);
  };

  const acceptRide = (rideId: string) => {
    socketRef.current?.emit("ride:accept", { rideId });
  };

  const rejectRide = (rideId: string) => {
    socketRef.current?.emit("ride:reject", { rideId });
    setPendingRequests((prev) => prev.filter((r) => r._id !== rideId));
  };

  const updateRideStatus = (
    rideId: string,
    status: "arrived" | "started" | "completed",
  ) => {
    socketRef.current?.emit("ride:status", { rideId, status });
    if (status === "completed") {
      setAcceptedRideId(null);
    }
  };

  const clearAcceptedRide = () => {
    setAcceptedRideId(null);
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        isOnline,
        goOnline,
        goOffline,
        pendingRequests,
        currentRideStatus,
        currentRideDriverId,
        acceptedRideId,
        acceptRide,
        rejectRide,
        updateRideStatus,
        setCurrentRideStatus,
        clearAcceptedRide,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
