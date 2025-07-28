import express from "express";
import { login, logout, register, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetPassword, updateUser,changePassword } from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js";
import upload from "../middleware//uploadMiddleware.js"; 
import { getUserData } from "../controllers/userController.js";

const router = express.Router();

// Register route: Added the upload middleware to handle profile photo upload
router.post("/register", upload.single('profilePhoto'), register);

// Login route
router.post("/login", login);

// Logout route
router.post('/logout', logout);

// Send OTP for verification route: Protected by userAuth middleware
router.post('/send-verify-otp',  sendVerifyOtp);

// Verify account route: Protected by userAuth middleware
router.post('/verify-account',  verifyEmail);

// Check if the user is authenticated route: Protected by userAuth middleware
router.get('/is-auth', isAuthenticated);

// Send OTP for password reset route
router.post('/send-reset-otp', sendResetOtp);

// Reset password route
router.post('/reset-password', resetPassword);

// Profile update route: Allows users to update their profile, including the profile photo
router.put('/update-user/:id',  upload.single('profilePhoto'), updateUser);

router.post('/change-password',  changePassword);
router.get("/data",  getUserData);
router.get("/:id",  getUserData);


export default router;