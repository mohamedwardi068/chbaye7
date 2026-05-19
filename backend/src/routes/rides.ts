import { Router } from "express";
import {
  createRideHandler,
  getActiveRideHandler,
} from "../controllers/rideController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/", authMiddleware, createRideHandler);
router.get("/active", authMiddleware, getActiveRideHandler);

export default router;
