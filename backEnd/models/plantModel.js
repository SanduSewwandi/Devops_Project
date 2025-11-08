import mongoose from "mongoose";

const plantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: { type: [String], required: true }, 
  category: { type: String, required: true },
  rating: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 10 }, 
  care: {
    water: { type: String },
    light: { type: String },
    difficulty: { type: String },
  },
  popular: { type: Boolean, default: false },
  dateAdded: { type: Date, default: Date.now },
});

const plantModel = mongoose.models.plant || mongoose.model("plant", plantSchema);

export default plantModel;