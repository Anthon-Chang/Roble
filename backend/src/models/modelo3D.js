import mongoose from 'mongoose';

const Model3DSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  modelUrl: { type: String, required: true }, // URL pública del GLB
  createdAt: { type: Date, default: Date.now }
});

const Model3D = mongoose.model('Model3D', Model3DSchema);

export default Model3D;
