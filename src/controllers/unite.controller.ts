import { Request, Response, Router } from "express";
import connection from "../db";
import { RowDataPacket } from "mysql2";
import { checkSchema, validationResult } from "express-validator";
import { handleDatabaseError } from "../middlewares/databaseErrorHandler";
import { createAccountValidationSchema } from "../middlewares/validationSchemas";

const router = Router();
// get data

const modulaName = "Unite";
const tableName = "unites";

// fetch
export const fetchUnites = async (req: Request, res: Response) => {
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
export const fetchUnite = async (req: Request, res: Response) => {
  const unite_id = Number(req.params.id);

  if (!unite_id || isNaN(unite_id)) {
    return res.status(400).json({ error: "Invalid ${modulaName} ID" });
  }
  try {
    const [result]: any = await connection.execute(
      "SELECT * FROM unites WHERE `id` = ?",
      [unite_id]
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
export const createUnite = async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result?.isEmpty()) {
    return res.status(401).send({ errors: result.array() });
  }
  try {
    const { unite_name } = req.body;
    const [result]: any = await connection.execute(
      "INSERT INTO unites (unite_name) VALUES (?)",
      [unite_name]
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

// // // DELETE
export const deleteUnite = async (req: Request, res: Response) => {
  try {
    const unite_id = parseInt(req.params.id); // Explicitly parse as integer

    if (!unite_id || isNaN(unite_id)) {
      return res.status(400).json({ error: `Invalid ${modulaName} ID` });
    }

    // Optional: First check if the todo exists
    const [existing]: any = await connection.execute(
      "SELECT * FROM unites WHERE id = ?",
      [unite_id]
    );
    // check if exsist
    if (existing.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    // Then proceed with deletion
    const [result]: any = await connection.execute(
      "DELETE FROM items WHERE id = ?",
      [unite_id]
    );

    res.status(200).json({
      message: `${modulaName} deleted successfully`,
      deletedId: unite_id,
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
export const updateUnite = async (req: Request, res: Response) => {
  try {
    const { unite_name } = req.body;
    const id = req.params.id;
    const [result]: any = await connection.execute(
      "UPDATE unites SET unite_name = ? WHERE id = ?",
      [unite_name, id]
    );
    // Check if any row was actually updated;
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    // Fetch the updated todo to return it
    const [updateAccount]: any = await connection.execute(
      "SELECT * FROM unites WHERE id = ?",
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
