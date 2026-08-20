import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRensponese";


const appointmentCreate=catchAsync(async(req:Request,res:Response)=>{

    sendResponse(res,{
        success:true,
        statusCode:201,
        message:'appointment created successfully',
        data:null
        
    })
})


export const appointmentContoller={
    appointmentCreate
}