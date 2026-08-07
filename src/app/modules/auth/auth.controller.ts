import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authServices } from "./auth.services";
import config from "../../config";
import { sendResponse } from "../../utils/sendRensponese";
import httpStatus from "http-status";

const register = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await authServices.register(payload);

  const { user, patient, accessToken, refreshToken } = result;
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    maxAge: 100 * 60 * 60 * 24,
    sameSite: "none",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 100 * 60 * 60 * 24,
    sameSite: "none",
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "user created successfully",
    data: {
      user,
      patient,
      accessToken,
      refreshToken,
    },
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.login(req.body);
  const { accessToken, refreshToken } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    maxAge: 100 * 60 * 60 * 24,
    sameSite: "none",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 100 * 60 * 60 * 24,
    sameSite: "none",
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "user loging successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  if (!req.cookies.refreshToken) {
    throw new Error("refreshtoken is missing plase login");
  }

  const result = await authServices.refreshToken(req.cookies.refreshToken);
  const { accessToken, refreshToken } = result;
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    maxAge: 100 * 60 * 60 * 24,
    sameSite: "none",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 100 * 60 * 60 * 24,
    sameSite: "none",
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "user loging successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const me = catchAsync(async (req: Request, res: Response) => {
  const email = req.user?.email;
  const result = await authServices.me(email as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "get user profile successfully",
    data: result,
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await authServices.googleLogin(payload);

  const { accessToken, refreshToken } = result;
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    maxAge: 100 * 60 * 60 * 24,
    sameSite: "none",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 100 * 60 * 60 * 24,
    sameSite: "none",
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "user loging successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

export const authController = {
  register,
  login,
  refreshToken,
  me,
  googleLogin,
};
