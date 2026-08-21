import { Router } from "express";
import { appointmentContoller } from "./appointment.controller";

const router=Router();
router.post('/book-appointment',appointmentContoller.bookAppointment)
router.get('/book-appointment/payment/callback',()=>{})

export const appointmentRoutes=router