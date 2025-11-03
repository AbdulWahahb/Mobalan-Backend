// import userRoute from "./routes/user.route";
import express from "express";
import chartOfAccountRoutes from "./routes/chart_of_account.route";
import itemRoutes from "./routes/item.route";
import inventoryAdjustmentRoutes from "./routes/inventory_adjustment.route";
import uniteRoutes from "./routes/unite.route";
import customerRoutes from "./routes/customer.route";
import invoicesRoutes from "./routes/invoices.route";
import paymentsReceivedRoutes from "./routes/payment_resive.route";
import vendorRoutes from "./routes/purchase/venodr.route";
import billRoutes from "./routes/purchase/bills.route";
import payment_made from "./routes/purchase/payment_made.route";
import paymentMadeRoutes from "./routes/purchase/payment_made.route";
import expenseRoutes from "./routes/purchase/expense.route";
import cors from 'cors';
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Your React app's URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());
// register routes
// account
app.use("/api/inventory_system", chartOfAccountRoutes);
// inventory
app.use("/api/inventory_system", itemRoutes);
app.use("/api/inventory_system", inventoryAdjustmentRoutes);
app.use("/api/inventory_system", uniteRoutes);
// sales
app.use("/api/inventory_system", customerRoutes);
app.use("/api/inventory_system", invoicesRoutes);
app.use("/api/inventory_system", paymentsReceivedRoutes);
// purchase
app.use("/api/inventory_system", vendorRoutes);
app.use("/api/inventory_system", billRoutes);
app.use("/api/inventory_system", paymentMadeRoutes);
app.use("/api/inventory_system", expenseRoutes);


export default app;
