import { Request, Response } from "express";
import type { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { User } from "../database";
import { encryptPassword, isPasswordMatch } from "../utils";
import config from "../config/config";

const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
};

const signToken = (payload: any) =>
    jwt.sign(payload, config.JWT_SECRET!, { expiresIn: "1d" });

export default {
    async register(req: Request, res: Response) {
        const { name, email, password } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "User already exists" });

        const hashed = await encryptPassword(password);

        const user = await User.create({
            name,
            email,
            password: hashed,
        });

        return res.json({
            message: "User registered",
            data: { id: user._id, name: user.name, email: user.email },
        });
    },

    async login(req: Request, res: Response) {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const match = await isPasswordMatch(password, user.password);
        if (!match) return res.status(400).json({ message: "Invalid credentials" });

        const token = signToken({ id: user._id, email: user.email });

        res.cookie("jwt", token, cookieOptions);

        return res.json({
            message: "Login successful",
            token,
        });
    },
};
