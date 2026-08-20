
const getBkashIdToken=async()=>{

    const response=await fetch(`${process.env.BKASH_BASER_URL}/tokenized/checkout/token/grant`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            accept:"application/json",
            "username":process.env.BKASH_USERNAME!,
            "password":process.env.BKASH_PASSWORD!,
        },
        body:JSON.stringify({
            app_key:process.env.BKASH_APP_KEY!,
            app_secret:process.env.BKASH_APP_SECRET!,
        })
    })

    return response.json()
}

export default getBkashIdToken;