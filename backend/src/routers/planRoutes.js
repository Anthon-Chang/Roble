import express from "express";

import upload from "../middlewares/upload.js";
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} from "../controllers/planController.js";

const router = express.Router();

router.get("/", getPlans);
router.get("/:id", getPlanById);

// IMPORTANTE: el campo must be "image"
router.post("/", upload.single("image"), createPlan);

router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

export default router;
