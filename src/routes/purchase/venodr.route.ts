import { Router } from "express";
import { checkSchema } from "express-validator";
import {
  createCustomerValidationSchema,
  createUniteValidationSchema,
} from "../../middlewares/validationSchemas";
import { createVendor, deleteVendor, fetchVendor, fetchVendors, updateVendor } from "../../controllers/purchase/vendor.controller";



const vendorRoutes = Router();
vendorRoutes.get("/vendors", fetchVendors);
vendorRoutes.get("/vendor/show/:id", fetchVendor);
vendorRoutes.post(
  "/vendor/create",
  checkSchema(createCustomerValidationSchema),
  createVendor
);
vendorRoutes.delete("/vendor/delete/:id", deleteVendor);
vendorRoutes.put("/vendor/update/:id", updateVendor);

export default vendorRoutes;
