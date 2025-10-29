import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';//for hashing password
import jwt from 'jsonwebtoken';//creates tokens for authentication.
import validator from "validator";

// 🔹 Create JWT token
const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// 🔹 User Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken({ id: user._id, role: "user" });

    return res.json({
      success: true,
      token,
      role: "user",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      message: "User login successful"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Admin Login (separate endpoint)
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
      const token = createToken({ email, role: "admin", isAdmin: true });
      return res.json({
        success: true,
        token,
        role: "admin",
        message: "Admin login successful"
      });
    } else {
      return res.json({ success: false, message: "Invalid admin credentials" });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Register normal user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // Validate email & password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Please enter a strong password" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    const token = createToken({ id: user._id, role: "user" });

    return res.json({
      success: true,
      token,
      role: "user",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      message: "User registered successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Get all users (for AdminPage)
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({});
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// 🔹 Get single user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

// 🔹 Delete user by ID (for AdminPage)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await userModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

export { loginUser, loginAdmin, registerUser, getAllUsers, getUserById, deleteUser };
