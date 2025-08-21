import express from "express";
import { generateImage } from "../controller/GenerateImage.js";

const router = express.Router();

router.post("/", generateImage);

export default router;