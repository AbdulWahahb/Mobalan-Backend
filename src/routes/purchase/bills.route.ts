import { Router } from "express";
import { createBill, deleteBill, fetchBill, fetchBills, updateBill } from "../../controllers/purchase/bills.controller";

const billRoutes = Router();
billRoutes.get("/bills", fetchBills);
billRoutes.get("/bill/show/:id", fetchBill);
billRoutes.post(
  "/bill/create",
  // checkSchema(createCustomerValidationSchema),
  createBill
);
billRoutes.delete("/bill/delete/:id", deleteBill);
billRoutes.put("/bill/update/:id", updateBill);

export default billRoutes;
