import { Request, Response, Router } from "express";
import connection from "../db";
import { RowDataPacket } from "mysql2";
import { checkSchema, validationResult } from "express-validator";
import { handleDatabaseError } from "../middlewares/databaseErrorHandler";
import { createAccountValidationSchema } from "../middlewares/validationSchemas";

const router = Router();
// get data

const modulaName = "Items";
// fetch
export const fetchItems = async (req: Request, res: Response) => {
  try {
    const [result] = await connection.execute("SELECT * FROM items");

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
// // SHOW
export const fetchItem = async (req: Request, res: Response) => {
  const item_id = Number(req.params.id);

  if (!item_id || isNaN(item_id)) {
    return res.status(400).json({ error: "Invalid Account  ID" });
  }
  try {
    const item_id = req.params.id;
    const [result]: any = await connection.execute(
      "SELECT * FROM items WHERE `id` = ?",
      [item_id]
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
// // CREATE
export const createItem = async (req: Request, res: Response) => {
  const result = validationResult(req);
  // check if there was not error then = > save new record
  if (!result?.isEmpty()) {
    return res.status(401).send({ errors: result.array() });
  }
  try {
    const {
      item_name,
      selling_price,
      sales_description,
      cost_price,
      purchase_description,
      unite_id,
      opening_stock,
      opening_stock_per_unite,
    } = req.body;
    const [result]: any = await connection.execute(
      "INSERT INTO items (item_name, selling_price, sales_description, cost_price, purchase_description, unite_id, opening_stock, opening_stock_per_unite) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        item_name,
        selling_price,
        sales_description,
        cost_price,
        purchase_description,
        unite_id,
        opening_stock,
        opening_stock_per_unite,
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
export const deleteItems = async (req: Request, res: Response) => {
  try {
    const item_id = parseInt(req.params.id); // Explicitly parse as integer

    if (!item_id || isNaN(item_id)) {
      return res.status(400).json({ error: `Invalid ${modulaName} ID` });
    }

    // Optional: First check if the todo exists
    const [existing]: any = await connection.execute(
      "SELECT * FROM items WHERE id = ?",
      [item_id]
    );
    const currentStock = existing[0]?.opening_stock || 0;

    // 2. Prevent deletion if stock is not zero
    if (currentStock > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete item with the opening stocks`,
      });
    }

    // check if exsist
    if (existing.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    // Then proceed with deletion
    // const [result]: any = await connection.execute(
    //   "DELETE FROM items WHERE id = ?",
    //   [item_id]
    // );

    // res.status(200).json({
    //   message: `${modulaName} deleted successfully`,
    //   deletedId: item_id,
    //   affectedRows: result.affectedRows,
    // });
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
// // UPDATE

export const updateItem = async (req: Request, res: Response) => {
  try {
    const {
      item_name,
      selling_price,
      sales_description,
      cost_price,
      purchase_description,
      opening_stock,
      opening_stock_per_unite,
    } = req.body;
    const id = req.params.id;
    const [result]: any = await connection.execute(
      "UPDATE items SET item_name = ?, selling_price = ?, sales_description = ? ,cost_price = ? , purchase_description = ?, opening_stock = ?, opening_stock_per_unite = ? WHERE id = ?",
      [
        item_name,
        selling_price,
        sales_description,
        cost_price,
        purchase_description,
        opening_stock,
        opening_stock_per_unite,
        id,
      ]
    );
    // Check if any row was actually updated;
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    // Fetch the updated todo to return it
    const [updateAccount]: any = await connection.execute(
      "SELECT * FROM items WHERE id = ?",
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
