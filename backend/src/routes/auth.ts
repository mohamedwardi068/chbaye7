import { Router } from "express";
import { registerHandler, loginHandler, getMeHandler } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/me", authMiddleware, getMeHandler);

export default router;
