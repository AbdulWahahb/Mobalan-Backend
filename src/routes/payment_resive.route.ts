import { Router } from "express";

import {
  createPaymentReceive,
  deletePaymentReceive,
  fetchPaymentReceive,
  fetchPaymentReceives,
  updatePaymentReceive,
} from "../controllers/payment_received.controller";

const paymentsReceivedRoutes = Router();
paymentsReceivedRoutes.get("/payment_received", fetchPaymentReceives);
paymentsReceivedRoutes.get("/payment_received/show/:id", fetchPaymentReceive);
paymentsReceivedRoutes.post(
  "/payment_received/create",
  // checkSchema(createUniteValidationSchema),
  createPaymentReceive
);
paymentsReceivedRoutes.delete(
  "/payment_received/delete/:id",
  deletePaymentReceive
);
paymentsReceivedRoutes.put("/payment_received/update/:id", updatePaymentReceive);

export default paymentsReceivedRoutes;
