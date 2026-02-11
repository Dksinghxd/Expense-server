const usersDao = require("../dao/userDao");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const emailService = require("../service/emailService");
const { validationResult } = require("express-validator");
const { ADMIN_ROLE } = require("../constants/roles");

/* ================= TOKEN HELPERS ================= */

const generateAccessToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      adminId: user.adminId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1m" } // keep short for testing
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { email: user.email },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );

/* ================= CONTROLLER ================= */

const authController = {
  /* -------- LOGIN -------- */
  login: async (request, response) => {
    const errors = validationResult(request);
    const { email, password } = request.body;

    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    const user = await usersDao.findByEmail(email);

    if (!user) {
      return response.status(401).json({ error: "Invalid credentials" });
    }

    // Google-only account protection
    if (user.googleId && !user.password) {
      return response
        .status(403)
        .json({ error: "Please login using Google" });
    }

    // ✅ SAFE PASSWORD CHECK
    const isPasswordMatch = await bcrypt.compare(
      password,
      user?.password
    );

    if (!isPasswordMatch) {
      return response.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ DEFAULT ROLE + ADMIN ID
    user.role = user.role ? user.role : ADMIN_ROLE;
    user.adminId = user.adminId ? user.adminId : user._id;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    response
      .cookie("jwtToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

    return response.status(200).json({
      message: "Login successful",
      user,
    });
  },

  /* -------- REGISTER -------- */
  register: async (request, response) => {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({ error: "All fields are required" });
    }

    const userExists = await usersDao.findByEmail(email);
    if (userExists) {
      return response.status(409).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await usersDao.create({
      name,
      email,
      password: hashedPassword,
      role: ADMIN_ROLE,
    });

    return response.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  },

  /* -------- AUTH CHECK -------- */
  isUserLoggedIn: async (req, res) => {
    try {
      const accessToken = req.cookies?.jwtToken;

      if (accessToken) {
        try {
          const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
          return res.status(200).json({
            user: {
              id: decoded.userId,
              name: decoded.name,
              email: decoded.email,
              role: decoded.role,
              adminId: decoded.adminId,
            },
          });
        } catch {
          // access token expired → try refresh
        }
      }

      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const decodedRefresh = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET
      );

      const user = await usersDao.findByEmail(decodedRefresh.email);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      user.role = user.role ? user.role : ADMIN_ROLE;
      user.adminId = user.adminId ? user.adminId : user._id;

      const newAccessToken = generateAccessToken(user);

      res.cookie("jwtToken", newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      });

      return res.status(200).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          adminId: user.adminId,
        },
      });
    } catch (error) {
      console.error("isUserLoggedIn error:", error);
      return res.status(401).json({ message: "Session expired" });
    }
  },

  /* -------- LOGOUT -------- */
  logout: async (req, res) => {
    res.clearCookie("jwtToken").clearCookie("refreshToken");
    return res.json({ message: "Logout successful" });
  },

  /* -------- GOOGLE SSO -------- */
  googleSso: async (req, res) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ message: "Missing Google idToken" });
      }

      if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).json({
          message: "Google SSO not configured (missing GOOGLE_CLIENT_ID)",
        });
      }

      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const googleResponse = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = googleResponse.getPayload();
      if (!payload?.sub || !payload?.email) {
        return res.status(401).json({ message: "Invalid Google token" });
      }

      const { sub: googleId, name, email } = payload;

      let user = await usersDao.findByEmail(email);
      if (!user) {
        user = await usersDao.create({
          name,
          email,
          googleId,
          role: ADMIN_ROLE,
        });
      }

      user.role = user.role ? user.role : ADMIN_ROLE;
      user.adminId = user.adminId ? user.adminId : user._id;

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res
        .cookie("jwtToken", accessToken, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 60 * 60 * 1000,
        })
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

      return res.status(200).json({
        message: "Google login successful",
        user,
      });
    } catch (error) {
      console.error("googleSso error:", error?.message || error);

      // Common verifyIdToken failures (bad/expired token, audience mismatch)
      if (
        typeof error?.message === "string" &&
        (error.message.toLowerCase().includes("audience") ||
          error.message.toLowerCase().includes("token") ||
          error.message.toLowerCase().includes("jwt"))
      ) {
        return res.status(401).json({
          message: "Google token verification failed",
          details: error.message,
        });
      }

      return res.status(500).json({
        message: "Internal server error",
        details: error?.message,
      });
    }
  },

  /* -------- RESET PASSWORD -------- */
  resetPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ msg: "Email is required" });
      }

      const user = await usersDao.findByEmail(email);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      const now = Date.now();
      if (
        user.resetPasswordLastRequestedAt &&
        now - user.resetPasswordLastRequestedAt.getTime() < 2 * 60 * 1000
      ) {
        return res.status(429).json({
          msg: "Please wait 2 minutes before requesting again",
        });
      }

      if (!emailService?.isEnabled) {
        return res.status(503).json({
          msg:
            "Email service is not configured. Set GOOGLE_EMAIL and GOOGLE_APP_PASSWORD",
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.resetOtp = otp;
      user.resetOtpExpiry = now + 10 * 60 * 1000;
      user.resetPasswordLastRequestedAt = now;
      await user.save();

      await emailService.send(
        email,
        "Password Reset OTP",
        `Your OTP is ${otp}`
      );

      return res.status(200).json({ msg: "OTP sent to email" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },

  /* -------- CHANGE PASSWORD -------- */
  changePassword: async (request, response) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
      }

      const { email, otp } = request.body;
      const newPassword =
        request.body?.newPassword || request.body?.password;

      const user = await usersDao.findByEmail(email);
      if (!user) {
        return response.status(404).json({ msg: "User not found" });
      }

      if (user.resetOtp !== otp || user.resetOtpExpiry < Date.now()) {
        return response.status(400).json({ msg: "Invalid or expired OTP" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      await user.save();

      return response
        .status(200)
        .json({ msg: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      return response.status(500).json({ msg: "Internal server error" });
    }
  },
};

module.exports = authController;
