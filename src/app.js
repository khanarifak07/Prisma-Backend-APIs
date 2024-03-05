import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
const app = express();

//cors configuration
app.use(
  cors({
    credentials: true,
    origin: process.env.CORS,
  })
);

//json configuration via express
app.use(express.json({ limit: "16kb" }));
//url configuration via express
app.use(express.urlencoded({ limit: "16kb", extended: true }));
//cookie-parser configuration
app.use(cookieParser());
//asset congiuraion via express eg: pdf, image file
app.use(express.static("public"));

//import user router
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/user", userRouter);

export default app;
