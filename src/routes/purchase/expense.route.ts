import { Router } from "express";
import { createExpense, deleteExpense, fetchExpense, fetchExpenses, updateExpense } from "../../controllers/purchase/expense.controller";
import { checkSchema } from "express-validator";

const expenseRoutes = Router();
expenseRoutes.get("/expense", fetchExpenses);
expenseRoutes.get("/expense/show/:id", fetchExpense);
expenseRoutes.post(
  "/expense/create",
  createExpense
);
expenseRoutes.delete("/expense/delete/:id", deleteExpense);
expenseRoutes.put("/expense/update/:id", updateExpense);

export default expenseRoutes;
