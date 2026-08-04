import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";

const register = catchAsync(async (req: Request, res: Response) => {});

export const authController = {
  register,
};
