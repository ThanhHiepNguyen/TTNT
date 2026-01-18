import { Router } from "express";
import authRouter from "./authRoute.js";
import categoryRouter from "./categoryRoute.js";
import productRouter from "./productRoute.js";
import cartRouter from "./cartRoute.js";
import orderRouter from "./orderRoute.js";
import reviewRouter from "./reviewRoute.js";
import paymentRouter from "./paymentRoute.js";
import chatRouter from "./chatRoute.js";
import { sendResponse } from "../utils/response.js";
import chatAnalyticsRouter from "./chatAnalyticsRoute.js";

const router = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is running
 */
router.get("/health", (_req, res) => {
  return sendResponse(res, 200, "Server is running", { status: "ok" });
});

router.use("/auth", authRouter);
router.use("/categories", categoryRouter);
router.use("/products", productRouter);
router.use("/cart", cartRouter);
router.use("/orders", orderRouter);
router.use("/reviews", reviewRouter);
router.use("/payment", paymentRouter);
router.use("/chat", chatRouter);
router.use("/admin", chatAnalyticsRouter);

import internalRouter from "./internalRoute.js";
router.use("/internal", internalRouter);

export default router;