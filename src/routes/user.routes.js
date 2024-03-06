import { Router } from "express";
import {
  login,
  logout,
  register,
  updateAllDetails,
  updateDetails,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  register
);
router.route("/login").post(login);
router.route("/logout").post(verifyJWT, logout);
router.route("/update-details").patch(verifyJWT, updateDetails);
router.route("/update-all-details").patch(
  verifyJWT,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateAllDetails
);

export default router;
