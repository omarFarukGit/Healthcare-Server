import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRoutes } from "./app/modules/auth/auth.routes";
import { notFound } from "./app/middleware/not-found";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Healthcare-Server running....");
});

//api
app.use("/api/auth", authRoutes);

//not found
app.use(notFound);
//Global Error Handler
app.use(globalErrorHandler);

export default app;
