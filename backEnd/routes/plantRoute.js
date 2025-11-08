import express from "express";
import multer from "multer";
import {
  addPlant,
  updatePlant,
  listPlant,
  removePlant,
  singlePlant,
  managePlants,
} from "../controllers/plantController.js";
import adminAuth from "../middleware/adminAuth.js";

const plantRouter = express.Router();

// configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // save in uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// create upload instance
const upload = multer({ storage });

// ✅ Add plant with up to 4 images
plantRouter.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  (req, res, next) => {
    // Attach file paths to req.body before hitting controller
    const images = [];
    if (req.files.image1) images.push(req.files.image1[0].path);
    if (req.files.image2) images.push(req.files.image2[0].path);
    if (req.files.image3) images.push(req.files.image3[0].path);
    if (req.files.image4) images.push(req.files.image4[0].path);

    req.body.images = images;
    next();
  },
  addPlant
);

// ✅ Update plant (with optional new images)
plantRouter.put(
  "/update/:id",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  (req, res, next) => {
    const images = [];
    if (req.files.image1) images.push(req.files.image1[0].path);
    if (req.files.image2) images.push(req.files.image2[0].path);
    if (req.files.image3) images.push(req.files.image3[0].path);
    if (req.files.image4) images.push(req.files.image4[0].path);

    req.body.images = images;
    next();
  },
  updatePlant
);

// ✅ Remove a plant
plantRouter.delete('/delete/:id', adminAuth, removePlant);

// ✅ Get single plant details
plantRouter.get("/single/:id", singlePlant);

// ✅ List all plants (for customers)
plantRouter.get("/list", listPlant);

// ✅ Get all plants for management (with full details)
plantRouter.get("/manage", adminAuth, managePlants);

export default plantRouter;