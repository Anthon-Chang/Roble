import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rooms: Number,
  style: String,
  area_m2: Number,
  description: String,
  image_url: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Plan", planSchema);
