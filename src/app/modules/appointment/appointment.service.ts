import config from "../../config"
import getBkashIdToken from "../../lib/bkash"


const bookAppointment=async()=>{

    // businness logic for booking appointment will be here


    const bkashIdToken= await getBkashIdToken()

    if(!bkashIdToken){
        throw new Error('No bkash access token found')
    }
    const bkashCreatePayment=await fetch(`${config.bkash_base_url}/tokenized/checkout/create`,{
        method:'POST',
        headers:{
            "Content-Type":"application/json",
            accept:"application/json",
            Authorization:bkashIdToken,
            "X-App-Key":config.bkash_app_key
        },
        body:JSON.stringify({  
            agreementID:'',
   mode: "0011",
   payerReference: "01723888888",
   callbackURL: `${config.bkash_callback_url}/appointment/book-appointment/payment/callback`,
   merchantAssociationInfo:'' ,MI05MID54RF09123456One:'',
   amount: "500",
   currency: "BDT",
   intent: "sale",
   merchantInvoiceNumber: "Inv0124"
})
    })

    const bkashCreatePaymentResult=await bkashCreatePayment.json()
    return bkashCreatePaymentResult
}

export const appointmentServices={
    bookAppointment
}