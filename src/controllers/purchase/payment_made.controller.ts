import { Router } from "express";
import mysql from "mysql2/promise"; // Using mysql2 with promise support
import connection from "../../db";
import { Request, Response } from "express";
import {

  validationResult,
} from "express-validator";
import { handleDatabaseError } from "../../middlewares/databaseErrorHandler";
const router = Router();
// get data

const modulaName = "purchase_payments";
// fetch
export const fetchPaymentsMade = async (req: Request, res: Response) => {
  try {
    const [result] = await connection.execute(
      "SELECT * FROM  purchase_payments"
    );

    // Always send a response, even if result is empty
    res.status(200).json({
      message: `${modulaName} fetched successfully`,
      data: result || [], // Ensure data is always an array
    });
  } catch (error) {
    console.error(`Failed to fetch ${modulaName}:`, error);
    res.status(500).json({
      error: `Failed to fetch ${modulaName}`,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
// SHOW
export const fetchPaymentMade = async (req: Request, res: Response) => {
  const account_id = Number(req.params.id);

  if (!account_id || isNaN(account_id)) {
    return res.status(400).json({ error: "Invalid payment ID" });
  }
  try {
    const account_id = req.params.id;
    const [result]: any = await connection.execute(
      "SELECT * FROM purchase_payments WHERE `id` = ?",
      [account_id]
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
//  CREATE
export const createPaymentMade = async (req: Request, res: Response) => {
  const result = validationResult(req);
  // check if there was not error then = > save new record
  try {
    const {
      bill_id,
      vendor_id,
      payment_date,
      payment_method,
      reference_no,
      amount,
      notes,
    } = req.body;
    const [result]: any = await connection.execute(
      "INSERT INTO purchase_payments (bill_id, vendor_id, payment_date, payment_method, reference_no, amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        bill_id,
        vendor_id,
        payment_date,
        payment_method,
        reference_no,
        amount,
        notes,
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

// // DELETE
// export const deletePaymentReceive = async (req: Request, res: Response) => {
//   try {
//     const payment_received_id = parseInt(req.params.id); // Explicitly parse as integer

//     if (!payment_received_id || isNaN(payment_received_id)) {
//       return res.status(400).json({ error: `Invalid ${modulaName} ID` });
//     }

//     // Optional: First check if the todo exists
//     const [existing]: any = await connection.execute(
//       "SELECT id FROM payments WHERE id = ?",
//       [payment_received_id]
//     );

//     if (existing.length === 0) {
//       return res.status(404).json({ error: `${modulaName} not found` });
//     }

//     // Then proceed with deletion
//     const [result]: any = await connection.execute(
//       "DELETE FROM payments WHERE id = ?",
//       [payment_received_id]
//     );

//     res.status(200).json({
//       message: `${modulaName} deleted successfully`,
//       deletedId: payment_received_id,
//       affectedRows: result.affectedRows,
//     });
//   } catch (error) {
//     console.error("Delete error:", error);

//     const errorResponse = handleDatabaseError(err);
//     return res.status(errorResponse.statusCode).json({
//       success: false,
//       message: `Failed to add ${modulaName}`,
//       error: errorResponse.error,
//     });
//   }
// };

// // UPDATE
// export const updatePaymentReceive = async (req, res) => {
//   try {
//     const {
//       invoice_id,
//       customer_id,
//       payment_date,
//       payment_method,
//       amount,
//       notes,
//     } = req.body;
//     const id = req.params.id;
//     const [result] = await connection.execute(
//       "UPDATE payments SET invoice_id = ?, customer_id = ?, payment_date = ?, payment_method = ?, amount = ?, notes = ? WHERE id = ?", // Added WHERE clause with 7th placeholder
//       [invoice_id, customer_id, payment_date, payment_method, amount, notes, id] // 7 values for 7 placeholders
//     );
//     // Check if any row was actually updated;
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: `${modulaName} not found` });
//     }
//     // Fetch the updated todo to return it
//     const [updateAccount] = await connection.execute(
//       "SELECT * FROM payments WHERE id = ?",
//       [id]
//     );
//     res.status(200).json({
//       message: `${modulaName} updated successfully`,
//       data: updateAccount[0],
//     });
//   } catch (error) {
//     console.error("Delete error:", error);

//     const errorResponse = handleDatabaseError(err);
//     return res.status(errorResponse.statusCode).json({
//       success: false,
//       message: `Failed to add ${modulaName}`,
//       error: errorResponse.error,
//     });
//   }
// };
export default router;
