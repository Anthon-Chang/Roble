import Model3D from "../models/modelo3D.js";

// GET: Obtener todos los modelos
export const getAllModels = async (req, res) => {
  try {
    const models = await Model3D.find();

    res.status(200).json({
      status: "success",
      count: models.length,
      data: models,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error obteniendo modelos",
      details: err.message,
    });
  }
};

// POST: Crear un nuevo modelo
export const createModel = async (req, res) => {
  try {
    const { name, description, modelUrl } = req.body;

    const model = await Model3D.create({
      name,
      description,
      modelUrl,
    });

    res.status(201).json({
      status: "success",
      data: model,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "No se pudo crear el modelo",
      details: err.message,
    });
  }
};
