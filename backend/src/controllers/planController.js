import Plan from "../models/Plan.js";

// Crear un nuevo plano (con Cloudinary)
const createPlan = async (req, res) => {
  try {
    const { name, rooms, style, area_m2, description } = req.body;

    // Validación básica
    if (!req.file) {
      return res.status(400).json({ message: "La imagen es obligatoria" });
    }

    const nuevoPlano = new Plan({
      name,
      rooms,
      style,
      area_m2,
      description,
      image_url: req.file.path // URL de Cloudinary
    });

    await nuevoPlano.save();
    res.status(201).json(nuevoPlano);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el plano", error });
  }
};

// Obtener todos los planos
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener planos", error });
  }
};

// Obtener un plano por ID
const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plano no encontrado" });

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el plano", error });
  }
};

// Actualizar un plano
const updatePlan = async (req, res) => {
  try {
    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedPlan);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el plano", error });
  }
};

// Eliminar un plano
const deletePlan = async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ message: "Plano eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el plano", error });
  }
};


export { createPlan, getPlans, getPlanById, updatePlan, deletePlan };
