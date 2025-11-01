import { Router } from "express";
import { checkSchema } from "express-validator";
import {
  createCustomerValidationSchema,
  createUniteValidationSchema,
} from "../middlewares/validationSchemas";

import {
  createCustomer,
  deleteCustomer,
  fetchCustomer,
  fetchCustomers,
  updateCustomer,
} from "../controllers/customer.controller";

const customerRoutes = Router();
customerRoutes.get("/customers", fetchCustomers);
customerRoutes.get("/customer/show/:id", fetchCustomer);
customerRoutes.post(
  "/customer/create",
  checkSchema(createCustomerValidationSchema),
  createCustomer
);
customerRoutes.delete("/customer/delete/:id", deleteCustomer);
customerRoutes.put("/customer/update/:id", updateCustomer);

export default customerRoutes;
