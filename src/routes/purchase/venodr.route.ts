import { Router } from "express";
import { checkSchema } from "express-validator";
import {
  createCustomerValidationSchema,
} from "../../middlewares/validationSchemas";
import { createVendor, deleteVendor, fetchVendor, fetchVendors, updateVendor, changeVendorStatus } from "../../controllers/purchase/vendor.controller";
import { checkDuplicate } from "../../middlewares/checkDuplicateDisplayName";



const vendorRoutes = Router();
vendorRoutes.get("/vendors", fetchVendors);
vendorRoutes.get("/vendor/show/:id", fetchVendor);
vendorRoutes.post(
  "/vendor/create",
  checkSchema(createCustomerValidationSchema),
  checkDuplicate("vendors", "display_name"),
  createVendor
);


vendorRoutes.put("/vendor/status/:id", changeVendorStatus);
vendorRoutes.delete("/vendor/delete/:id", deleteVendor);
vendorRoutes.put("/vendor/update/:id", updateVendor);

export default vendorRoutes;
