const Razorpay = require("razorpay");
const crypto = require("crypto");

const { CREDIT_TO_PAISA_MAPPING } = require("../constants/paymentConstants");
const User = require("../model/User");

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error(
      "Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env"
    );
    error.statusCode = 503;
    throw error;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const paymentsController = {
  /* -------------------- CREATE ORDER -------------------- */
  createOrder: async (request, response) => {
    try {
      const razorpayClient = getRazorpayClient();
      const { credits } = request.body;

      // Validate credits
      const amountInPaise = CREDIT_TO_PAISA_MAPPING[credits];
      if (!amountInPaise) {
        return response.status(400).json({
          message: "Invalid credit value",
        });
      }

      const order = await razorpayClient.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      return response.status(200).json({
        order,
        credits, // echo back for frontend reference
      });
    } catch (error) {
      console.error("Create order error:", error);
      return response.status(error.statusCode || 500).json({
        message: error.message || "Internal server error",
      });
    }
  },

  
  verifyOrder: async (request, response) => {
    try {
      // Ensures keys exist for signature verification as well
      getRazorpayClient();
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        credits,
      } = request.body;

      // Basic payload validation
      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return response.status(400).json({
          message: "Incomplete payment details",
        });
      }

      // Verify Razorpay signature
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return response.status(400).json({
          message: "Invalid transaction",
        });
      }

      // Validate credits again (never trust frontend blindly)
      const validAmount = CREDIT_TO_PAISA_MAPPING[credits];
      if (!validAmount) {
        return response.status(400).json({
          message: "Invalid credit value",
        });
      }

      // Fetch user
      const userId = request.user?.userId;
      const user = userId ? await User.findById(userId) : null;
      if (!user) {
        return response.status(404).json({
          message: "User not found",
        });
      }

      // Add credits
      user.credits += Number(credits);
      await user.save();

      return response.status(200).json({
        message: "Payment successful",
        credits: user.credits,
        user,
      });
    } catch (error) {
      console.error("Verify order error:", error);
      return response.status(error.statusCode || 500).json({
        message: error.message || "Internal server error",
      });
    }
  },
};

module.exports = paymentsController;
