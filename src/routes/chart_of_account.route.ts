import { Router } from "express";
import {
  changeBulkStatus,
  createAccount,
  deleteAccount,
  deleteBulkAccount,
  fetchAccount,
  fetchAccounts,
  fetchAccountTypes,
  updateAccount,
} from "../controllers/Account/ChartOfAccount/chart_of_account.controller";
import { createAccountValidationSchema } from "../middlewares/validationSchemas";
import { checkSchema } from "express-validator";

const chartOfAccountRoutes = Router();
chartOfAccountRoutes.get("/account_types", fetchAccountTypes);
// fetchAccountTypeList
chartOfAccountRoutes.get("/accounts", fetchAccounts);
chartOfAccountRoutes.get("/account/show/:id", fetchAccount);
chartOfAccountRoutes.post(
  "/account/create",
  checkSchema(createAccountValidationSchema),
  createAccount
);
chartOfAccountRoutes.delete("/account/delete/:id", deleteAccount);
chartOfAccountRoutes.delete("/account/bulk_delete", deleteBulkAccount);
chartOfAccountRoutes.put("/account/bulk_status", changeBulkStatus);
// changeBulkStatus
chartOfAccountRoutes.put("/account/update/:id", updateAccount);
// updateAccount
// account/delete/17

export default chartOfAccountRoutes;
