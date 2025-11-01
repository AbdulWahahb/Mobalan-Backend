import { Router } from "express";
import mysql from "mysql2/promise"; // Using mysql2 with promise support
import connection from "../db";
import { Request, Response } from "express";
import {
  checkSchema,
  matchedData,
  query,
  validationResult,
} from "express-validator";
import { handleDatabaseError } from "../middlewares/databaseErrorHandler";
// import { handleDatabaseError } from "../utils/databaseErrorHandler.mjs";
const router = Router();
// get data

const modulaName = "Users";
// fetch
export const fetchUsers = async (req: Request, res: Response) => {
  try {
    const [result] = await connection.execute("SELECT * FROM users");

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
// // SHOW
export const fetchUser = async (req: Request, res: Response) => {
  const account_id = Number(req.params.id);

  if (!account_id || isNaN(account_id)) {
    return res.status(400).json({ error: "Invalid Todo  ID" });
  }
  try {
    const account_id = req.params.id;
    const [result]: any = await connection.execute(
      "SELECT * FROM chart_of_accounts WHERE `id` = ?",
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
  } catch (error) {
    console.error("Database error:", error);

    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to add ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
// // CREATE
export const createUser = async (req: Request, res: Response) => {
  const result = validationResult(req);
  // check if there was not error then = > save new record
  try {
    const {
      account_code,
      account_name,
      account_type,
      normal_balance,
      description,
      current_balance,
      is_active,
    } = req.body;
    const [result]:any = await connection.execute(
      "INSERT INTO chart_of_accounts (account_code, account_name, account_type, normal_balance, description, current_balance, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        account_code,
        account_name,
        account_type,
        normal_balance,
        description || null,
        current_balance || 0,
        is_active !== undefined ? is_active : true,
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
// router.delete("/account/delete/:id", async (req, res) => {
//   try {
//     const account_id = parseInt(req.params.id); // Explicitly parse as integer

//     if (!account_id || isNaN(account_id)) {
//       return res.status(400).json({ error: `Invalid ${modulaName} ID` });
//     }

//     // Optional: First check if the todo exists
//     const [existing] = await connection.execute(
//       "SELECT id FROM chart_of_accounts WHERE id = ?",
//       [account_id]
//     );

//     if (existing.length === 0) {
//       return res.status(404).json({ error: `${modulaName} not found` });
//     }

//     // Then proceed with deletion
//     const [result] = await connection.execute(
//       "DELETE FROM chart_of_accounts WHERE id = ?",
//       [account_id]
//     );

//     res.status(200).json({
//       message: `${modulaName} deleted successfully`,
//       deletedId: account_id,
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
// });
// // UPDATE
// router.put("/account/update/:id", async (req, res) => {
//   try {
//     const {
//       account_code,
//       account_name,
//       account_type,
//       normal_balance,
//       description,
//       current_balance,
//       is_active,
//     } = req.body;
//     const id = req.params.id;
//     const [result] = await connection.execute(
//       "UPDATE chart_of_accounts SET account_code = ?, account_name = ?, account_type = ? ,normal_balance = ? , description = ?, current_balance = ?, is_active = ? WHERE id = ?",
//       [
//         account_code,
//         account_name,
//         account_type,
//         normal_balance,
//         description,
//         current_balance,
//         is_active,
//         id,
//       ]
//     );
//     // Check if any row was actually updated;
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: `${modulaName} not found` });
//     }
//     // Fetch the updated todo to return it
//     const [updateAccount] = await connection.execute(
//       "SELECT * FROM chart_of_accounts WHERE id = ?",
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
// });
export default router;
