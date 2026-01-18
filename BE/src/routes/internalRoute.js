import { Router } from "express";
import { getProductsForAI, getReviewsForAI } from "../controllers/Internal/internalController.js";

const router = Router();

router.get("/products/search", getProductsForAI);
router.get("/reviews/search", getReviewsForAI);

export default router;

