import { redisClient } from "./redis"

const getBkashIdToken=async()=>{

    try {
        const idTokenKey='bkash:idToken'
    const refreshTokenKey='bkash:resfreshToken'

    let bkashIdToken= await redisClient.get(idTokenKey)
    const bkashIdTokenTTl=await redisClient.ttl(idTokenKey)
    let bkashRefreshToken=await redisClient.get(refreshTokenKey)
    const bkashRefreshTokenTTl=await redisClient.ttl(refreshTokenKey)
//bkash id token reamining time is less than equal 10 minutes
// bkash refresh token must exits
//bkash refresh token remainig time is more than 10 minites
    if((bkashIdTokenTTl<=600 || !bkashIdToken) && bkashRefreshToken && bkashRefreshTokenTTl>600){
            const responseRefreshToken=await fetch(`${process.env.BKASH_BASER_URL}/tokenized/checkout/token/refresh`,{
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
            refresh_token:bkashRefreshToken
        })
    })
const bkashRefreshTokenResult=await responseRefreshToken.json();

bkashIdToken=bkashRefreshTokenResult.id_token as string


await redisClient.set(idTokenKey,bkashIdToken,{
    expiration:{
        type:"EX",
        value:60*60
    }
})
return bkashIdToken
    }

    if(bkashIdTokenTTl>600){
        return bkashIdToken
    }
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

    if(!response.ok){
        throw new Error('bkash access Token Faild')
    }
    const result=await response.json();

    //bkash id token set
  await redisClient.set(idTokenKey,result.id_token,{
        expiration:{
            type:'EX',
            value:60*60
        }
    })
    //bkash refresh token set
  await redisClient.set(refreshTokenKey,result.refresh_token,{
        expiration:{
            type:'EX',
            value:60*60*24*28
        }
    })

    bkashIdToken=result.id_token
    return bkashIdToken
    } catch (error:any) {
        throw new Error(error.message)
    }
}

export default getBkashIdToken;