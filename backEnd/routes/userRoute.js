import express from 'express';
import { 
  loginUser, 
  registerUser, 
  loginAdmin, 
  getAllUsers,  
  getUserById   
} from '../controllers/userController.js';

const userRouter = express.Router();

// 🔹 Normal user routes
userRouter.post('/register', registerUser);   // Register user
userRouter.post('/login', loginUser);         // User login

// 🔹 Admin login route
userRouter.post('/admin/login', loginAdmin);

// 🔹 Fetch users (GET requests)
userRouter.get('/all', getAllUsers);          // ✅ Fetch all users
userRouter.get('/:id', getUserById);          // ✅ Fetch single user by ID

export default userRouter;

