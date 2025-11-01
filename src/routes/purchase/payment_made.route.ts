import { Router } from "express";
import {  createPaymentMade, fetchPaymentMade, fetchPaymentsMade } from "../../controllers/purchase/payment_made.controller";
// import {fetchPaymentMade} from '../../controllers/purchase/ '

const paymentMadeRoutes = Router();
paymentMadeRoutes.get("/payment_made", fetchPaymentsMade);
paymentMadeRoutes.get("/payment_made/show/:id", fetchPaymentMade);
paymentMadeRoutes.post(
  "/payment_made/create",
  // checkSchema(createUniteValidationSchema),
  createPaymentMade
);
// paymentsReceivedRoutes.delete(
//   "/payment_received/delete/:id",
//   deletePaymentReceive
// );
// paymentsReceivedRoutes.put("/payment_received/update/:id", updatePaymentReceive);

export default paymentMadeRoutes;
