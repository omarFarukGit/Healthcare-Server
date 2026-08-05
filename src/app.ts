import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRoutes } from "./app/modules/auth/auth.routes";

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

export default app;
