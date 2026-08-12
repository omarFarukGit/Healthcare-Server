import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);

router.get(
  "/me",
  auth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN),
  authController.me,
);

router.post('/google',authController.googleLogin)
router.post('/forgot-password',authController.forgotPassword)
router.post('/reset-password',authController.resetPassword)

export const authRoutes = router;
