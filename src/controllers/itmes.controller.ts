import { Request, Response, Router } from "express";
import connection from "../db";
import { checkSchema, validationResult } from "express-validator";
import { handleDatabaseError } from "../middlewares/databaseErrorHandler";
import { cleanRegex } from "zod/v4/core/util.cjs";
import { createJournalEntry } from "./AccountEntry/journal_entries.controller";
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
    const [unite]: any = await connection.execute(
      "SELECT * FROM unites WHERE `id` = ?",
      [result[0]?.unite_id]
    );

    const [inventory_account]: any = await connection.execute(
      "SELECT * FROM accounts WHERE `id` = ?",
      [result[0]?.inventory_account]
    );
    const [sales_account]: any = await connection.execute(
      "SELECT * FROM accounts WHERE `id` = ?",
      [result[0]?.sales_account]
    );

    const [purchase_account]: any = await connection.execute(
      "SELECT * FROM accounts WHERE `id` = ?",
      [result[0]?.purchase_account]
    );

    // console.log('Here is the result', result, unite);
    if (result.length == 0) {
      res.status(201).json({
        message: `${modulaName} not found`,
      });
    }
    res.status(201).json({
      message: `${modulaName} Fetch successfully`,
      status: 200,
      data: {
        0:
        {
          ...result[0],
          unite: unite[0],
          inventory_account: inventory_account[0],
          sales_account: sales_account[0],
          purchase_account: purchase_account[0]
        }
      },
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
      item_type,
      sku,
      selling_price,
      sales_account,
      saleable,
      purchase_account,
      sales_description,
      purchasable,
      cost_price,
      purchase_description,
      unite_id,
      track_inventory,
      inventory_account,
      opening_stock,
      opening_stock_per_unite,
      is_active
    } = req.body;
    const openingStock = opening_stock === '' ? null : opening_stock;
    const openingStockPerUnit = opening_stock_per_unite === '' ? null : opening_stock_per_unite;
    const [result]: any = await connection.execute(
      "INSERT INTO items (item_name, item_type, sku, selling_price, sales_account, saleable, purchase_account, sales_description, purchasable, cost_price, purchase_description, unite_id, track_inventory, inventory_account, opening_stock, opening_stock_per_unite, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        item_name,
        item_type,
        sku,
        selling_price,
        sales_account,
        saleable,
        purchase_account,
        sales_description,
        purchasable,
        cost_price,
        purchase_description,
        unite_id,
        track_inventory ? 1 : 0,
        inventory_account,
        openingStock,
        openingStockPerUnit,
        is_active ? 1 : 0
      ]
    );
    // 2. ACCOUNTING LOGIC (IMPORTANT)
    const itemId = result.insertId;
    const stockQty = Number(openingStock || 0);
    const unitCost = Number(cost_price || 0);
    const amount = stockQty * unitCost;
    const INVENTORY = 1060;
    const OPENING_BALANCE_EQUITY = 1064;
    if (
      track_inventory &&
      stockQty > 0 &&
      amount > 0
    ) {

      await createJournalEntry({

        date: new Date()
          .toISOString()
          .split("T")[0],

        reference:
          `item-opening-${itemId}`,

        description:
          `Opening stock for ${item_name}`,

        created_by: 1,

        lines: [
          {
            account_id: INVENTORY,
            debit: amount,
            credit: 0
          },

          {
            account_id:
              OPENING_BALANCE_EQUITY,

            debit: 0,
            credit: amount
          }
        ]
      });
    }
    res.status(200).json({
      message: ` ${modulaName} Created successfully`,
      status: 200,
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
// change status
export const changeItemStatus = async (req: Request, res: Response) => {
  try {
    const item_id = parseInt(req.params.id); // Explicitly parse as integer
    const { is_active } = req.body
    const status = is_active ? 1 : 0
    if (!item_id || isNaN(item_id)) {
      return res.status(400).json({ error: `Invalid ${modulaName} ID` });
    }

    // Optional: First check if the item  exists
    const [existing]: any = await connection.execute(
      "SELECT * FROM items WHERE id = ?",
      [item_id]
    );

    // 2. Prevent deletion if stock is not zero
    // check if exsist
    const [newStatus]: any = await connection.execute(
      "UPDATE items SET is_active = ? WHERE id = ? "
      , [status, item_id])
    if (existing.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    res.status(200).json({
      message: ` ${modulaName} Status Changed successfully`,
      status: 200,
      id: newStatus.insertId,
    });
  } catch (error: any) {
    console.error("Chnage Status  error:", error);

    const errorResponse = handleDatabaseError(error);
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
    console.log('Here is starting ata', item_id);

    // First, check if the item exists
    const [existing]: any = await connection.execute(
      "SELECT * FROM items WHERE id = ?",
      [item_id]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    const currentStock = existing[0]?.opening_stock || 0;
    // Prevent deletion if stock is not zero
    if (currentStock > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete item with the opening stocks`,
      });
    }

    // Delete the item from the database
    const result = await connection.execute("DELETE FROM items WHERE id = ?", [item_id]);
    console.log('Delete result:', result);

    return res.status(200).json({
      success: true,
      message: `${modulaName} deleted successfully`,
      status: 200,
    });

  } catch (error: any) {

    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to delete ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
// BUlk Delete;
// BULK DELETE
export const deleteBulkItems = async (req: Request, res: Response) => {
  try {
    const { itemIdes } = req.body[0];

    // 1. Validate input
    if (!itemIdes || !Array.isArray(itemIdes) || itemIdes.length === 0) {
      return res.status(400).json({
        success: false,
        message: `${modulaName} No Items Selected`,
      });
    }

    // 2. Create placeholders (?, ?, ?)
    const placeholders = itemIdes.map(() => "?").join(",");

    // 3. Check opening stock
    const [items]: any = await connection.execute(
      `SELECT id, opening_stock FROM items WHERE id IN (${placeholders})`,
      itemIdes
    );

    const itemsWithStock = items.filter(
      (item: any) => item.opening_stock > 0
    );

    if (itemsWithStock.length > 0) {

      return res.status(400).json({
        success: false,
        message: `Cannot delete item with the opening stocks`,
        items: itemsWithStock.map((i: any) => i.id),
      });
    }

    // 4. Delete items
    await connection.execute(
      `DELETE FROM items WHERE id IN (${placeholders})`,
      itemIdes
    );

    // 5. Success response
    return res.status(200).json({
      success: true,
      message: `${modulaName} deleted successfully`,
      deletedIds: itemIdes,
    });

  } catch (error: any) {
    console.error("Delete error:", error);

    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: `Failed to delete ${modulaName}`,
      error: errorResponse.error,
    });
  }
};
// // UPDATE

export const updateItem = async (req: Request, res: Response) => {
  try {
    const {
      item_name,
      item_type,
      sku,
      selling_price,
      sales_account,
      saleable,
      sales_description,
      purchasable,
      purchase_account,
      cost_price,
      purchase_description,
      unite_id,
      track_inventory,
      inventory_account,
      opening_stock,
      opening_stock_per_unite,
      is_active
    } = req.body;
    const id = req.params.id;
    const [result]: any = await connection.execute(
      `UPDATE items SET 
    item_name = ?, 
    item_type = ?, 
    unite_id = ?, 
    sku = ?, 
    selling_price = ?, 
    sales_account = ?, 
    saleable = ?, 
    sales_description = ?, 
    purchasable = ?, 
    purchase_account = ?, 
    cost_price = ?, 
    purchase_description = ?, 
    track_inventory = ?, 
    inventory_account = ?, 
    opening_stock = ?, 
    opening_stock_per_unite = ?, 
    is_active = ?
  WHERE id = ?`,
      [
        item_name,
        item_type,
        unite_id,
        sku,
        selling_price,
        sales_account,
        saleable,
        sales_description,
        purchasable,
        purchase_account,
        cost_price,
        purchase_description,
        track_inventory,
        inventory_account,
        opening_stock,
        opening_stock_per_unite,
        is_active,
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
      data: { updateItem: updateAccount[0], status: 200 },
      status: 200,
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
