import { v2 as cloudinary } from "cloudinary";
import fs from "fs";//used to delete temporary uploads
import plantModel from "../models/plantModel.js";

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/plants\/([^\.]+)/);
  return match ? `plants/${match[1]}` : null;
};

// Generate SVG placeholder
const generatePlaceholderSVG = (width = 150, height = 150, text = "No Image") => {
  const svgString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
          fill="#999" text-anchor="middle" dy=".3em">${text}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
};

// ✅ Get all plants for management
export const managePlants = async (req, res) => {
  try {
    const plants = await plantModel.find({}).sort({ date: -1 });
    res.status(200).json({ 
      success: true, 
      message: "Plants retrieved successfully",
      data: plants 
    });
  } catch (error) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch plants",
      error: error.message 
    });
  }
};

// ✅ Add Plant
export const addPlant = async (req, res) => {
  try {
    const { name, description, price, category, rating, popular, care, stockQuantity } = req.body;

    // Extract uploaded images
    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];
    const images = [image1, image2, image3, image4].filter(Boolean);

    // Upload images to Cloudinary
    let imagesUrl = [];
    if (images.length > 0) {
      imagesUrl = await Promise.all(
        images.map(async (item) => {
          const result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image",
            folder: "plants",
          });
          fs.unlinkSync(item.path); // remove temp file
          return result.secure_url;
        })
      );
    } else {
      // Use a data URL placeholder instead of external service
      imagesUrl = [generatePlaceholderSVG(150, 150, "Plant Image")];
    }

    // Build plant data - ADDED STOCK QUANTITY HANDLING
    const plantData = {
      name,
      description,
      price: Number(price),
      category,
      rating: rating ? Number(rating) : 0,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0, 
      popular: popular === "true" || popular === true,
      care,
      images: imagesUrl,
      date: Date.now(),
    };

    const plant = new plantModel(plantData);
    await plant.save();

    res.status(201).json({ success: true, message: "Plant Added", plant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Plant (delete old images if new uploaded)
export const updatePlant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, rating, popular, care, stockQuantity } = req.body;

    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];
    const images = [image1, image2, image3, image4].filter(Boolean);

    let imagesUrl = [];
    if (images.length > 0) {
      imagesUrl = await Promise.all(
        images.map(async (item) => {
          const result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image",
            folder: "plants",
          });
          fs.unlinkSync(item.path);
          return result.secure_url;
        })
      );
    }

    const updateData = {
      ...(name && { name }),
      ...(description && { description }),
      ...(price && { price: Number(price) }),
      ...(category && { category }),
      ...(rating && { rating: Number(rating) }),
      ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity) }), 
      ...(popular !== undefined && {
        popular: popular === "true" || popular === true,
      }),
      ...(care && { care }),
    };

    const plant = await plantModel.findById(id);
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    // If new images uploaded, delete old Cloudinary images and replace
    if (imagesUrl.length > 0) {
      if (plant.images && plant.images.length > 0) {
        await Promise.all(
          plant.images.map(async (url) => {
            // Don't delete placeholder images (data URLs)
            if (url.startsWith('data:')) return;
            
            const publicId = getPublicIdFromUrl(url);
            if (publicId) {
              try {
                await cloudinary.uploader.destroy(publicId);
                console.log("Deleted old image from Cloudinary:", publicId);
              } catch (err) {
                console.error("Cloudinary delete error:", err);
              }
            }
          })
        );
      }
      updateData.images = imagesUrl;
    }

    const updatedPlant = await plantModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: "Plant Updated", plant: updatedPlant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Remove Plant (delete Cloudinary images too)
export const removePlant = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Attempting to delete plant with ID:", id);

    if (!id) {
      return res.status(400).json({ success: false, message: "Plant ID is required" });
    }

    let deletedPlant;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      deletedPlant = await plantModel.findByIdAndDelete(id);
    } else {
      deletedPlant = await plantModel.findOneAndDelete({
        $or: [{ id: id }, { name: id }],
      });
    }

    if (!deletedPlant) {
      console.log("Plant not found with ID:", id);
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    // Delete Cloudinary images (skip placeholder images)
    if (deletedPlant.images && deletedPlant.images.length > 0) {
      await Promise.all(
        deletedPlant.images.map(async (url) => {
          // Don't delete placeholder images (data URLs)
          if (url.startsWith('data:')) return;
          
          const publicId = getPublicIdFromUrl(url);
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
              console.log("Deleted image from Cloudinary:", publicId);
            } catch (err) {
              console.error("Cloudinary delete error:", err);
            }
          }
        })
      );
    }

    console.log("Plant deleted from MongoDB:", deletedPlant.name);
    res.json({ success: true, message: "Plant and images removed successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Single Plant (id from URL param)
export const singlePlant = async (req, res) => {
  try {
    const { id } = req.params;
    const plant = await plantModel.findById(id);

    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    res.json({ success: true, plant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ List All Plants
export const listPlant = async (req, res) => {
  try {
    const plants = await plantModel.find({}).sort({ date: -1 });
    res.json({ success: true, plants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};