
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs/promises");

const sendEmail = require("../utils/sendEmail");

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// ===============================
// REGISTER CLIENT
// ===============================
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      country,
      password,
      documentType
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !country ||
      !password ||
      !documentType
    ) {
      return res.status(400).json({
        message: "Please complete all required fields."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload your identity document."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phoneNumber.trim();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phoneNumber: normalizedPhone }
      ]
    });

    if (existingUser) {
      await fs.unlink(req.file.path).catch(() => {});

      return res.status(409).json({
        message: "An account with this email or phone number already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      country,
      password: hashedPassword,
      documentType,
      identityDocument: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        path: req.file.path
      },
      role: "client",
      verificationStatus: "PENDING_VERIFICATION"
    });

    return res.status(201).json({
      message: "Registration successful. Your account is awaiting identity verification.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        verificationStatus: user.verificationStatus
      }
    });

  } catch (error) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed. Please try again."
    });
  }
};

// ===============================
// LOGIN
// ADMIN: USERNAME + PASSWORD
// CLIENT: EMAIL + PASSWORD
// ===============================
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
      return res.status(400).json({
        message: "Please provide your login details."
      });
    }

    let user;

    // ADMIN LOGIN USING USERNAME
    if (username) {
      user = await User.findOne({
        username: username.trim().toLowerCase(),
        role: "admin"
      }).select("+password");

      if (!user) {
        return res.status(401).json({
          message: "Invalid administrator username or password."
        });
      }
    }

    // CLIENT LOGIN USING EMAIL
    else {
      user = await User.findOne({
        email: email.trim().toLowerCase(),
        role: "client"
      }).select("+password");

      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password."
        });
      }
    }

    // CHECK PASSWORD
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid login credentials."
      });
    }

    // CHECK ACCOUNT APPROVAL
    if (user.verificationStatus === "PENDING_VERIFICATION") {
      return res.status(403).json({
        message: user.role === "admin"
          ? "Administrator account is awaiting approval."
          : "Your identity is awaiting verification."
      });
    }

    if (user.verificationStatus === "REJECTED") {
      return res.status(403).json({
        message: "Your account verification was rejected. Please contact support."
      });
    }

    // GENERATE JWT
    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        verificationStatus: user.verificationStatus
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to log in. Please try again."
    });
  }
};

// ===============================
// FORGOT PASSWORD
// ===============================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Please enter your email address."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return res.status(200).json({
        message: "If an account exists, a password reset link will be sent."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetURL =
      `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "AssetWise Password Reset",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2 style="color:#145c40">AssetWise</h2>
            <h3>Password Reset Request</h3>
            <p>We received a request to reset your AssetWise password.</p>
            <p>Click the button below to create a new password.</p>
            <a href="${resetURL}"
              style="background:#145c40;color:white;padding:13px 22px;
              text-decoration:none;border-radius:6px;display:inline-block">
              Reset Password
            </a>
            <p>This link expires in 15 minutes.</p>
            <p>If you did not request this change, you can ignore this email.</p>
          </div>
        `
      });

    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      throw emailError;
    }

    return res.status(200).json({
      message: "If an account exists, a password reset link will be sent."
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Unable to process your request. Please try again."
    });
  }
};

// ===============================
// RESET PASSWORD
// ===============================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters."
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match."
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Password reset link is invalid or has expired."
      });
    }

    user.password = await bcrypt.hash(password, 12);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully. You can now log in."
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Unable to reset your password."
    });
  }
};

// ===============================
// GET CURRENT USER
// ===============================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -resetPasswordToken -resetPasswordExpires -identityDocument");

    if (!user) {
      return res.status(404).json({
        message: "Account not found."
      });
    }

    return res.status(200).json({ user });

  } catch (error) {
    return res.status(500).json({
      message: "Unable to retrieve account details."
    });
  }
};
