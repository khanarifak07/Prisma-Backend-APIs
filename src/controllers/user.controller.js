import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { uploadFilesOnCloudinary } from "../utils/cloudinary.js";

const register = asyncHandler(async (req, res) => {
  //get the details from the user -- req.body
  //check the detials
  //check user is already registered with username or email
  //check for avatar
  //upload image to cloudinary
  //create the user
  //retrieve the created user
  //return res
  var { username, email, password } = req.body;

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  if ([username, email, password].some((field) => field == null)) {
    throw new ApiError(400, "All fields are required");
  }
  //
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });
  if (existingUser) {
    throw new ApiError(
      400,
      "user is already registered with this email or username"
    );
  }
  //check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(avatarLocalPath);
  //check for coverImage
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  console.log(coverImageLocalPath);
  //upload avatar
  const avatar = await uploadFilesOnCloudinary(avatarLocalPath);
  console.log(`avatarUrl:- ${avatar.url}`);
  const coverImage = await uploadFilesOnCloudinary(coverImageLocalPath);
  if (coverImage != null) {
    console.log(`coverImageUrl ${coverImage.url}`);
  }

  //hashing password
  const salt = bcrypt.genSaltSync(10);
  password = bcrypt.hashSync(password, salt);
  //create the user in database
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      // coverImage: coverImage ? coverImage.url : null,
    },
  });
  //retrive the created user
  const createdUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!createdUser) {
    throw new ApiError(400, "registered user not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created successfully"));

  //   return res.json("OK");
});

async function generateAccessAndRefreshToken(user) {
  //generate access token
  const accessToken = jwt.sign(
    { id: user.id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
  //generate refresh token
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
  //store refresh token in database
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      refreshToken,
    },
  });

  return { accessToken, refreshToken };
}

const login = asyncHandler(async (req, res) => {
  //check user credenteial
  //check user is regisered or not
  //check password is correct
  //generate access and refrehs token
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required");
  }
  //check user is registered or not
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });
  if (!user) {
    throw new ApiError(
      400,
      "User is not registered with this username or email"
    );
  }
  //check for correct password
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password");
  }
  //generate refresh and access token
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user);

  const loggedInUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      Post: true,
      profile: true,
    },
  });

  //create options to send in cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged In successfully"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  //
  await prisma.user.update({
    where: {
      id: req.user.id,
    },
    data: {
      refreshToken: null,
    },
  });
  //now we need to clear the cookies for that we need to add options
  const options = {
    httpOnly: true,
    secure: true,
  };
  //send the response with options to clear cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export { login, logout, register };
