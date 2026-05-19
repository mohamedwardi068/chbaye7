import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { User } from "../models/User.js";
import type { AuthRequest } from "../middlewares/auth.js";

function generateToken(id: string, role: string): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.sign({ id, role }, secret, { expiresIn: "30d" });
}

function formatUser(user: { _id: unknown; name: string; email: string; role: string; phone: string }) {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const { name, email, password, role, phone } = req.body as {
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
  };

  if (!name || !email || !password || !role || !phone) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    const user = await User.create({ name, email, password, role, phone });
    const token = generateToken(String(user._id), user.role);

    res.status(201).json({ user: formatUser(user), token });
  } catch (err) {
    req.log?.error({ err }, "Registration error");
    res.status(400).json({ message: "Registration failed" });
  }
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(String(user._id), user.role);
    res.json({ user: formatUser(user), token });
  } catch (err) {
    req.log?.error({ err }, "Login error");
    res.status(400).json({ message: "Login failed" });
  }
}

export async function getMeHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(formatUser(user));
  } catch (err) {
    req.log?.error({ err }, "Get me error");
    res.status(400).json({ message: "Failed to get user" });
  }
}
