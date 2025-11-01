import { Request, Response, Router } from "express";
import connection from "../db";
import { RowDataPacket } from "mysql2";
import { checkSchema, validationResult } from "express-validator";
import { handleDatabaseError } from "../middlewares/databaseErrorHandler";
import { createAccountValidationSchema } from "../middlewares/validationSchemas";

const router = Router();
// get data

const modulaName = "adjustment";
// fetch
export const fetchAdjustments = async (req: Request, res: Response) => {
  try {
    const [result] = await connection.execute(
      "SELECT * FROM inventory_adjustment"
    );

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
export const fetchAdjustment = async (req: Request, res: Response) => {
  const adjust_id = Number(req.params.id);

  if (!adjust_id || isNaN(adjust_id)) {
    return res.status(400).json({ error: `Invalid ${modulaName} ID` });
  }
  try {
    const [result]: any = await connection.execute(
      "SELECT * FROM inventory_adjustment WHERE `id` = ?",
      [adjust_id]
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
export const createAdjustments = async (req: Request, res: Response) => {
  const result = validationResult(req);
  // check if there was not error then = > save new record
  if (!result?.isEmpty()) {
    return res.status(401).send({ errors: result.array() });
  }
  try {
    const {
      reference_number,
      date,
      account_id,
      reason_id,
      description,
      item_id,
      adjusted_quantity,
      status,
    } = req.body;
    const [result]: any = await connection.execute(
      "INSERT INTO inventory_adjustment (reference_number, date, account_id, reason_id, description, item_id, adjusted_quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        reference_number,
        date,
        account_id,
        reason_id,
        description,
        item_id,
        adjusted_quantity,
        status,
      ]
    );

    // Update the Item Table;

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

// Change status
export const adjustmentsChangeStatus = async (req: Request, res: Response) => {
  const adjust_id = Number(req.params.id);

  if (!adjust_id || isNaN(adjust_id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  const { status } = req.body;
  // check the status
  try {
    const [result]: any = await connection.execute(
      "UPDATE inventory_adjustment SET status = ? WHERE id = ?",
      [status, adjust_id]
    );
    const [updated]: any = await connection.execute(
      "SELECT * FROM inventory_adjustment WHERE `id` = ?",
      [adjust_id]
    );
    if (status == "accepted") {
      const [foundedItem]: any = await connection.execute(
        "SELECT * FROM items WHERE `id` = ?",
        [updated[0]?.item_id]
      );
      const newItemAvailableStock =
        foundedItem[0]?.available_stock - updated[0]?.adjusted_quantity;
      // check if status be

      // then update the item
      const [updateItem]: any = await connection.execute(
        "UPDATE items SET available_stock = ? WHERE id = ?",
        [newItemAvailableStock, updated[0]?.item_id]
      );
    }

    if (result.length == 0) {
      res.status(201).json({
        message: `${modulaName} not found`,
      });
    }
    res.status(200).json({
      message: `${modulaName} UPDATED `,
      data: updated,
    });
  } catch (error) {
    console.log("erer is error", error);
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to add ${modulaName}`,
      error: errorResponse.error,
    });
  }
};

// DELETE
export const deleteAdjustments = async (req: Request, res: Response) => {
  try {
    const adjust_id = parseInt(req.params.id); // Explicitly parse as integer

    if (!adjust_id || isNaN(adjust_id)) {
      return res.status(400).json({ error: `Invalid ${modulaName} ID` });
    }

    // Optional: First check if the todo exists
    const [existing]: any = await connection.execute(
      "SELECT * FROM inventory_adjustment WHERE id = ?",
      [adjust_id]
    );

    // check if exsist
    if (existing.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    if (existing[0]?.status == "accepted") {
      return res.status(404).json({
        error: `You can not delete ${modulaName} with accepted status `,
      });
    }
    // Then proceed with deletion
    const [result]: any = await connection.execute(
      "DELETE FROM inventory_adjustment WHERE id = ?",
      [adjust_id]
    );

    res.status(200).json({
      message: `${modulaName} deleted successfully`,
      deletedId: adjust_id,
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

export const updateAdjustment = async (req: Request, res: Response) => {
  try {
    const {
      reference_number,
      date,
      account_id,
      reason_id,
      description,
      item_id,
      adjusted_quantity,
      status,
    } = req.body;
    const id = req.params.id;
    const [result]: any = await connection.execute(
      "UPDATE inventory_adjustment SET reference_number = ?, date = ?, account_id = ? ,reason_id = ? , description = ?, item_id = ?, adjusted_quantity = ?, status = ? WHERE id = ?",
      [
        reference_number,
        date,
        account_id,
        reason_id,
        description,
        item_id,
        adjusted_quantity,
        status,
        id,
      ]
    );
    // Check if any row was actually updated;
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    // Fetch the updated todo to return it
    const [updateAccount]: any = await connection.execute(
      "SELECT * FROM inventory_adjustment WHERE id = ?",
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
