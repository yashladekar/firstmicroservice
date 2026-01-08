import { Router } from "express";
import AuthController from "../controllers/AuthController";
import { validate } from "../middleware";
import { registerSchema, loginSchema } from "../validation/auth.schema";

const router = Router();

// Routes for direct access
router.post("/auth/register", validate(registerSchema), AuthController.register);
router.post("/auth/login", validate(loginSchema), AuthController.login);

// Routes for gateway access (gateway forwards /api/users/* → /users/*)
router.post("/users/auth/register", validate(registerSchema), AuthController.register);
router.post("/users/auth/login", validate(loginSchema), AuthController.login);

export default router;
