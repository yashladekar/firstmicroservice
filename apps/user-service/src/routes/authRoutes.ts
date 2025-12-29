import { Router } from "express";
import AuthController from "../controllers/AuthController";
import { validate } from "../middleware";
import { registerSchema, loginSchema } from "../validation/auth.schema";

const router = Router();

router.post("/auth/register", validate(registerSchema), AuthController.register);
router.post("/auth/login", validate(loginSchema), AuthController.login);

export default router;
