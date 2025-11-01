import { Request, Response, Router } from "express";
import connection from "../../db";
import { handleDatabaseError } from "../../middlewares/databaseErrorHandler";
import { validationResult } from "express-validator";

const router = Router();
// get data

const modulaName = "expenses";
const tableName = "expenses";

// fetch
export const fetchExpenses = async (req: Request, res: Response) => {
  try {
    const [result] = await connection.execute(`SELECT * FROM ${tableName}`);

    if (result) {
      res.status(201).json({
        message: `${modulaName} Fetch Successfully`,
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch ${modulaName}` });
  }
};
// SHOW
export const fetchExpense = async (req: Request, res: Response) => {
  const expense_id = Number(req.params.id);

  if (!expense_id || isNaN(expense_id)) {
    return res.status(400).json({ error: `Invalid ${modulaName} ID` });
  }
  try {
    const [result]: any = await connection.execute(
      "SELECT * FROM expenses WHERE `id` = ?",
      [expense_id]
    );
    if (result.length == 0) {
      res.status(201).json({
        message: `${modulaName} not found`,
      });
    }
    res.status(201).json({
      message: `${modulaName} Fetch successfully`,
      data: result,
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to add ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
// CREATE
export const createExpense = async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result?.isEmpty()) {
    return res.status(401).send({ errors: result.array() });
  }
  try {
    const {
      expense_date,
      amount,
      description,
      account_id,
      vendor_id,
      bill_id,
      payment_made_id,
    } = req.body;
    const [result]: any = await connection.execute(
      "INSERT INTO expenses (expense_date, amount, description, account_id, vendor_id, bill_id, payment_made_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        expense_date,
        amount,
        description,
        account_id,
        vendor_id,
        bill_id,
        payment_made_id,
      ]
    );

    res.status(200).json({
      message: ` ${modulaName} added successfully`,
      id: result.insertId,
    });
  } catch (err) {
    console.error("Database error:", err);

    const errorResponse = handleDatabaseError(err);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to add ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
// DELETE
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const expense_id = parseInt(req.params.id); // Explicitly parse as integer

    if (!expense_id || isNaN(expense_id)) {
      return res.status(400).json({ error: `Invalid ${modulaName} ID` });
    }

    // Optional: First check if the todo exists
    const [existing]: any = await connection.execute(
      "SELECT * FROM expenses WHERE id = ?",
      [expense_id]
    );
    // check if expense
    if (existing.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    // Then proceed with deletion
    const [result]: any = await connection.execute(
      "DELETE FROM expenses WHERE id = ?",
      [expense_id]
    );

    res.status(200).json({
      message: `${modulaName} deleted successfully`,
      deletedId: expense_id,
      affectedRows: result.affectedRows,
    });
  } catch (error: any) {
    console.error("Delete error:", error);

    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to add ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
// UPDATE
export const updateExpense = async (req: Request, res: Response) => {
  try {
    const {
      expense_date,
      amount,
      description,
      account_id,
      vendor_id,
      bill_id,
      payment_made_id,
    } = req.body;
    const id = req.params.id;
    const [result]: any = await connection.execute(
      "UPDATE expenses SET expense_date = ?, amount = ?, description = ? ,account_id = ? , vendor_id = ?, bill_id = ?, payment_made_id = ? WHERE id = ?",
      [
        expense_date,
        amount,
        description,
        account_id,
        vendor_id,
        bill_id,
        payment_made_id,
        id,
      ]
    );
    // Check if any row was actually updated;
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    // Fetch the updated todo to return it
    const [updateAccount]: any = await connection.execute(
      "SELECT * FROM expenses WHERE id = ?",
      [id]
    );
    res.status(200).json({
      message: `${modulaName} updated successfully`,
      data: updateAccount[0],
    });
  } catch (error) {
    console.error("Delete error:", error);

    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to add ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
export default router;
