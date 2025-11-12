import express from "express";
import { getMunicipios, getMunicipioById } from "../controllers/municipiosController.js";

const router = express.Router();

router.get("/", getMunicipios);
router.get("/:id", getMunicipioById);

export default router;