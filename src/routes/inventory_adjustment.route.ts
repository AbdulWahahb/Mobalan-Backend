import { Router } from "express";
import { checkSchema } from "express-validator";
import { adjustmentsChangeStatus, createAdjustments, deleteAdjustments, fetchAdjustment, fetchAdjustments, updateAdjustment } from "../controllers/inventory_adjustment.controller";


const inventoryAdjustmentRoutes = Router();
inventoryAdjustmentRoutes.get("/adjustments", fetchAdjustments);
inventoryAdjustmentRoutes.get("/adjustments/show/:id", fetchAdjustment);
inventoryAdjustmentRoutes.post(
  "/adjustment/create",
  createAdjustments
);
inventoryAdjustmentRoutes.post('/adjustment/change_status/:id',  adjustmentsChangeStatus)
inventoryAdjustmentRoutes.delete("/adjustment/delete/:id", deleteAdjustments);
inventoryAdjustmentRoutes.put("/adjustment/update/:id", updateAdjustment);

export default inventoryAdjustmentRoutes;
