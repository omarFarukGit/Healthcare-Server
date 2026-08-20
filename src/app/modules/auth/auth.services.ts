import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import {
  IForgotPasswordPayload,
  IGooleLoginPayload,
  ILoginUserPayload,
  IRegisterPatientPayload,
  IResetpaswordPyalod,
} from "./auth.interface";
import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../../../generated/prisma/enums";
import { jwtUtils } from "../../utils/jwt";
import config from "../../config";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";

const register = async (payload: IRegisterPatientPayload) => {
  const { name, password } = payload;
  const email = payload.email.trim().toLocaleLowerCase();

  const userExits = await prisma.user.findUnique({
    where: { email },
  });

  if (userExits) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  const createUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.PATIENT,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      patient: {
        create: { name, email },
      },
    },
    omit: {
      password: true,
    },
    include: {
      patient: true,
    },
  });

  const { patient, ...user } = createUser;

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );
  return {
    user,
    patient,
    accessToken,
    refreshToken,
  };
};

const login = async (payload: ILoginUserPayload) => {
  const email = payload.email.trim().toLocaleLowerCase();
  const password = payload.password;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("User not found please registerd");
  }

  if (user.status == "BLOCKED") {
    throw new Error("your account is bolocked please contact support");
  }
  if (user.isDeleted && user.status === "DELETED") {
    throw new Error("your account has been deleted");
  }

  if (user.password === null && user.googleId !== null) {
    throw new Error(
      "user alread has account registerd with google ,try to login with google",
    );
  }

  const passwordMatch = await bcrypt.compare(password, user.password as string);
  if (!passwordMatch) {
    throw new Error("invaild creadentials");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const refreshToken = async (token: string) => {
  const verifiyToken = jwtUtils.verifyToken(token, config.jwt_refresh_secret);
  if (!verifiyToken?.success || !verifiyToken.data) {
    throw new Error(
      config.node_env === "development"
        ? verifiyToken.error
        : "invaild refresh token",
    );
  }
  const data = verifiyToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new Error("user is inactive or not found");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const me = async (email: string) => {
  const isUserExits = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      patient: true,
    },
    omit: {
      password: true,
    },
  });

  if (!isUserExits) {
    throw new Error("user not exits");
  }
  return isUserExits;
};

const googleLogin = async (payload: IGooleLoginPayload) => {
  //  const result= await googleClient.verifyIdToken({
  //     idToken:payload.idToken
  //   })
  //  const googleInfo= result.getPayload()
  //  googleInfo?.email

  let googleIdTokenPayload: TokenPayload | null | undefined = null;
  try {
    const tiket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });
    googleIdTokenPayload = tiket.getPayload();
  } catch (error) {
    console.log("Google Id Token vaerification Failed", error);
    throw new Error("Invaild or Expired Google Id Token");
  }

  if (!googleIdTokenPayload) {
    throw new Error("Invaild or Expired Google Id Token");
  }
  if (!googleIdTokenPayload.email) {
    throw new Error("Google Email not found");
  }
  if (!googleIdTokenPayload.name) {
    throw new Error("Google Name not found");
  }

  const ifPatientExistWithGoogleAuth = await prisma.user.findUnique({
    where: {
      email: googleIdTokenPayload.email,
      role: Role.PATIENT,
      googleId: googleIdTokenPayload.sub,
    },
  });

  let user = ifPatientExistWithGoogleAuth;
  //user nah thakle create korte hobe
  if (!ifPatientExistWithGoogleAuth) {
    //credentials user login to google
    const ifPatientExistWithCredentials = await prisma.user.findUnique({
      where: {
        email: googleIdTokenPayload.email,
        role: Role.PATIENT,
        authProvider: AuthProvider.CREDENTIAL,
      },
    });

    if (ifPatientExistWithCredentials) {
      if (!ifPatientExistWithCredentials.emailVerified) {
        throw new Error("email not verified");
      }
      if (ifPatientExistWithCredentials.status === UserStatus.BLOCKED) {
        throw new Error("user is blocked");
      }
      if (
        ifPatientExistWithCredentials.isDeleted ||
        ifPatientExistWithCredentials.status === UserStatus.DELETED
      ) {
        throw new Error("user is deleted");
      }
      user = await prisma.user.update({
        where: {
          id: ifPatientExistWithCredentials.id,
        },
        data: {
          googleId: googleIdTokenPayload.sub,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: googleIdTokenPayload.name,
          email: googleIdTokenPayload.email,
          role: Role.PATIENT,
          googleId: googleIdTokenPayload.sub,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: true,
          patient: {
            create: {
              name: googleIdTokenPayload.name,
              email: googleIdTokenPayload.email,
            },
          },
        },
      });
    }
  }

  if (!user) {
    throw new Error("user not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new Error("user is blocked");
  }
  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error("user is deleted");
  }
  //user thakle token res pahtabo
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const { email } = payload;

  const isUserExits = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!isUserExits) {
    throw new Error("user not found");
  }
  if (isUserExits.status === "BLOCKED") {
    throw new Error("your acccout has been block");
  }
  if (isUserExits.status === "DELETED") {
    throw new Error("user has deleted found");
  }
  if (isUserExits.googleId && isUserExits.authProvider === "GOOGLE") {
    throw new Error("user has account with google");
  }

  const otp = crypto.randomInt(100000, 10000000).toString();

  const key = `forgot-password-otp:${isUserExits.email}`;
  await redisClient.set(key, otp, {
    expiration: {
      type: "EX",
      value: 5 * 60,
    },
  });

  //email sent
};
const resetPassword = async (payload: IResetpaswordPyalod) => {
  const { email, otp, newPassword } = payload;

  const isUserExits = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!isUserExits) {
    throw new Error("user not found");
  }
  if (isUserExits.status === "BLOCKED") {
    throw new Error("your acccout has been block");
  }
  if (isUserExits.status === "DELETED") {
    throw new Error("user has deleted found");
  }
  if (isUserExits.googleId && isUserExits.authProvider === "GOOGLE") {
    throw new Error("user has account with google");
  }
  const key = `forgot-password-otp:${isUserExits.email}`;

  const redisOtp = await redisClient.get(key);

  console.log(otp, redisOtp,'otp');

  if (!redisOtp) {
    throw new Error("Invaild otp");
  }
  if (redisOtp !== otp) {
    throw new Error("OTP Does not match");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 8);

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      password: hashedPassword,
    },
  });

  //manuali delete otp

  await redisClient.del([key]);
};
export const authServices = {
  register,
  login,
  refreshToken,
  me,
  googleLogin,
  forgotPassword,
  resetPassword,
};
