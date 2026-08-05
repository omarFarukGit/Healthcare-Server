import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ILoginUserPayload, IRegisterPatientPayload } from "./auth.interface";
import { Role, UserStatus } from "../../../../generated/prisma/enums";
import { jwtUtils } from "../../utils/jwt";
import config from "../../config";
import { JwtPayload, SignOptions } from "jsonwebtoken";

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

  const passwordMatch = await bcrypt.compare(password, user.password);
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
export const authServices = {
  register,
  login,
  refreshToken,
  me,
};
