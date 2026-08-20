import { Router } from "express";
import { appointmentContoller } from "./appointment.controller";

const router=Router();
router.post('/book-appointment',appointmentContoller.appointmentCreate)

export const appointmentRoutes=router