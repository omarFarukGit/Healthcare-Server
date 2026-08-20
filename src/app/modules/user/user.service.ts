import cloudinary from "../../lib/cloudinary"

import {UploadApiResponse } from 'cloudinary'
import { prisma } from "../../lib/prisma";
import { id, tr } from "zod/locales";



const uploadProfileImage=async(buffer:Buffer,userId:string)=>{

    const currentUser=await prisma.user.findUnique({
        where:{
            id:userId,

        },
        select:{
            imagePublicId:true,
            imageUrl:true
        }
    })

const cloudonaryResult=await new Promise<UploadApiResponse >((resolve,reject)=>{
     cloudinary.uploader.upload_stream({
    resource_type:'auto',
 },
async (error,result)=>{
    if(error){
        return reject(error)
    }
    if(!result){
        return reject(new Error('not result relt not found') )
    }
    resolve(result)
    console.log(result,'result');

}).end(buffer)
})

    const updatedUser=await prisma.user.update({
        where:{
            id:userId
        },
        data:{
            imageUrl:cloudonaryResult?.secure_url,
            imagePublicId:cloudonaryResult.public_id
        },
        omit:{
            password:true
        }
    })

    if(currentUser?.imagePublicId && currentUser.imageUrl){
        await cloudinary.uploader.destroy(currentUser.imagePublicId)
    }

return updatedUser
}
// const uploadProfileImage=async(buffer:Buffer,userId:string)=>{
//  const cloudonaryResult= cloudinary.uploader.upload_stream({
//     resource_type:'auto',
//  },
// async (error,result)=>{
//     if(error){
//         throw new Error(error.message)
//     }
//     console.log(result,'result');

//     const updatedUser=await prisma.user.update({
//         where:{
//             id:userId
//         },
//         data:{
//             imageUrl:result?.secure_url,
//             imagePublicId:result?.public_id
//         }
//     })
//     // return result;
// }).end(buffer)

// const user=await prisma.user.findUnique({
//     where:{
//         id:userId
//     },
//     omit:{
//         password:true
//     }
// });

// return user
// }




export const userService={
    uploadProfileImage
}