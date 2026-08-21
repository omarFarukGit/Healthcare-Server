import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRensponese";
import { appointmentServices } from "./appointment.service";


const bookAppointment=catchAsync(async(req:Request,res:Response)=>{

    const result=await appointmentServices.bookAppointment()
    sendResponse(res,{
        success:true,
        statusCode:201,
        message:'appointment created successfully',
        data:result
        
    })
})


export const appointmentContoller={
    bookAppointment
}