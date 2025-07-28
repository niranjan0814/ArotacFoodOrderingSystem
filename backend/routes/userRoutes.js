import express from "express";
import userAuth from "../middleware/userAuth.js";
import { 
  getUserData, 
  updateUserData,
  changePassword 
} from "../controllers/userController.js";
import upload from "../middleware/uploadMiddleware.js";

const userRouter = express.Router();

userRouter.get("/data", userAuth, getUserData);
userRouter.get("/:id", userAuth, getUserData);
userRouter.put("/:id", userAuth, upload.single('profilePhoto'), updateUserData);
userRouter.post("/change-password", userAuth, changePassword); // Add this line

export default userRouter;