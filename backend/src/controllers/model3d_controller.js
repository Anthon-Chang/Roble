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

export const searchModelByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "El parámetro 'name' es obligatorio",
      });
    }

    const model = await Model3D.findOne({
      name: { $regex: new RegExp(name, "i") }, // búsqueda flexible
    });

    if (!model) {
      return res.status(404).json({
        status: "error",
        message: "Modelo no encontrado",
      });
    }

    res.status(200).json({
      status: "success",
      data: model,
    });

  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error al buscar el modelo",
      details: err.message,
    });
  }
};
