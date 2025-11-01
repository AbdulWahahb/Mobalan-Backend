import { Router } from "express";
import { checkSchema } from "express-validator";
import { createInvoice, deleteInvoice, fetchInvoice, fetchInvoices, updateInvoices } from "../controllers/invoices.controller";

const invoicesRoutes = Router();
invoicesRoutes.get("/invoices", fetchInvoices);
invoicesRoutes.get("/invoice/show/:id", fetchInvoice);
invoicesRoutes.post(
  "/invoice/create",
  // checkSchema(createCustomerValidationSchema),
  createInvoice
);
invoicesRoutes.delete("/invoice/delete/:id", deleteInvoice);
invoicesRoutes.put("/invoice/update/:id", updateInvoices);

export default invoicesRoutes;
