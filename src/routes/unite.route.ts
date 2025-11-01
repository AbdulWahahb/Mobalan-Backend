import { Router } from "express";
import { checkSchema } from "express-validator";
import {
  createUniteValidationSchema,
} from "../middlewares/validationSchemas";
import {
  createUnite,
  deleteUnite,
  fetchUnite,
  fetchUnites,
  updateUnite,
} from "../controllers/unite.controller";

const uniteRoutes = Router();
uniteRoutes.get("/unites", fetchUnites);
uniteRoutes.get("/unite/show/:id", fetchUnite);
uniteRoutes.post(
  "/unite/create",
  checkSchema(createUniteValidationSchema),
  createUnite
);
uniteRoutes.delete("/unite/delete/:id", deleteUnite);
uniteRoutes.put("/unite/update/:id", updateUnite);

export default uniteRoutes;
