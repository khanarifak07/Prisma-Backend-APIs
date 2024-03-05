//here we need to get the accessToken from the cookies and headers (req.cookies || req.header())
//syntax of sending via header Key:Authorization value:Bearer <token name>  (Authorization : Bearer <token_name>)

import jwt from "jsonwebtoken";
import prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    //1. Get the token from cookies or header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    //check for token
    if (!token) {
      throw new ApiError(400, "Unauthorized Access");
    }
    //now verify the token from jwt and decode the token via ACCESS_TOKEN_SECRET
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    //now we get the userid from decoded token
    const user = await prisma.user.findUnique({
      where: { id: decodedToken?.id },
    });

    if (!user) {
      throw new ApiError(400, "Invalid Access Token");
    }

    req.user = user; //we are injecting user to req.user
    next();
  } catch (error) {
    throw new ApiError(400, "Invalid Access Token");
  }
});

export { verifyJWT };
