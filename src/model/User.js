const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    /* ================= BASIC USER INFO ================= */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: false,
    },

    googleId: {
      type: String,
      required: false,
      index: true,
    },

    /* ================= PASSWORD RESET (OTP) ================= */

    resetOtp: {
      type: String,
      default: null,
    },

    resetOtpExpiry: {
      type: Date,
      default: null,
    },

    resetPasswordLastRequestedAt: {
      type: Date,
      default: null,
    },

    /* ================= ROLE-BASED ACCESS ================= */

    role: {
      type: String,
      required: true,
      default: "admin",
      index: true,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /* ================= CREDIT SYSTEM (RAZORPAY) ================= */

    credits: {
      type: Number,
      default: 1,        // 1 free trial credit
      min: 0,            // prevent negative credits
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
