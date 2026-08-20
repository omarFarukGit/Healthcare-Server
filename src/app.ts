import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRoutes } from "./app/modules/auth/auth.routes";
import { notFound } from "./app/middleware/not-found";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import z from "zod";
import { redisClient } from "./app/lib/redis";
import crypto from "crypto";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.get("/", async (req: Request, res: Response) => {
  const otp = crypto.randomInt(100000, 1000000);

  // redis check
  await redisClient.set("forgot-password-otp", otp, {
    expiration: {
      type: "EX",
      value: 60,
    },
  });
  res.send("Healthcare-Server running....");
});
// app.post("/zod", (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const UserZodSchema = z.object({
//       name: z.string(),
//       age: z.number(),
//       isVerify: z.boolean(),
//       books: z.array(z.string()),
//     });

//     const payload = req.body;

//     const result = UserZodSchema.parse(payload);

//     res.status(201).json({
//       success: true,
//       message: "welcome to ",
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

//api
app.use("/api/auth", authRoutes);

//not found
app.use(notFound);
//Global Error Handler
app.use(globalErrorHandler);

export default app;

app.get("/");
