import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { Role } from "../../../generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        name: string;
        userId: string;
        role: Role;
      };
    }
  }
}

const auth = (...requiredRole: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      throw new Error(
        "you are not logged in. please login to access this resource",
      );
    }
    const verifiyToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verifiyToken.success) {
      throw new Error(verifiyToken.error);
    }

    const { name, userId, email, role } = verifiyToken.data as JwtPayload;

    if (requiredRole.length && !requiredRole.includes(role)) {
      throw new Error(
        "Forbidden. You don't have permission to access this resource.",
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
        name,
        role,
      },
    });

    if (!user) {
      throw new Error("user not found. please log in agin");
    }
    if (user.status === "BLOCKED") {
      throw new Error("Your account has been blocked. Please contact support.");
    }

    req.user = {
      email,
      name,
      userId,
      role,
    };

    next();
  });
};
