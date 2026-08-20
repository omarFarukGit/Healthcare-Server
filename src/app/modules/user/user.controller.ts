import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRensponese";
import { userService } from "./user.service";


const uploadProfileImage=catchAsync(async(req:Request,res:Response)=>{

    const userId=req.user?.userId as string
if(!req.file){
    throw new Error('No File provided')
}

const result= await userService.uploadProfileImage(req.file.buffer,userId)


    console.log(req.file)
    sendResponse(res,{
        statusCode:200,
        success:true,
        message:'porfile updated successfully',
        data:result
    })
})

export const userController={
    uploadProfileImage
}