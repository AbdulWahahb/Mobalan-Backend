import { Request, Response, Router } from "express";
import connection from "../../db";
import { handleDatabaseError } from "../../middlewares/databaseErrorHandler";
import { body, validationResult } from "express-validator";

const router = Router();
const modulaName = "bill";
const tableName = "bills";

// FETCH ALL
export const fetchBills = async (req: Request, res: Response) => {
  try {
    const [invoices]: any = await connection.execute(
      `SELECT * FROM ${tableName}`
    );
    const [items]: any = await connection.execute(`SELECT * FROM bill_items`);

    // group invoice items by invoice_id
    const billsMap = invoices.map((inv: any) => ({
      ...inv,
      items: items.filter((it: any) => it.bill_id === inv.id),
    }));

    res.status(200).json({
      message: `${modulaName}s fetched successfully`,
      data: billsMap,
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    res.status(errorResponse.statusCode).json(errorResponse);
  }
};

// // FETCH ONE
export const fetchBill = async (req: Request, res: Response) => {
  const bill_id = Number(req.params.id);

  if (!bill_id || isNaN(bill_id)) {
    return res.status(400).json({ error: `Invalid ${modulaName} ID` });
  }

  try {
    const [invoice]: any = await connection.execute(
      "SELECT * FROM bills WHERE id = ?",
      [bill_id]
    );
    if (invoice.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    const [invoice_items]: any = await connection.execute(
      "SELECT * FROM bill_items WHERE bill_id = ?",
      [bill_id]
    );
    res.status(200).json({
      message: `${modulaName} fetched successfully`,
      data: { ...invoice[0], items: invoice_items },
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    res.status(errorResponse.statusCode).json(errorResponse);
  }
};

// // CREATE
// CREATE
export const createBill = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    vendor_id,
    bill_number,
    bill_date,
    due_date,
    total_amount,
    tax_amount,
    discount_amount,
    discount_type,
    net_amount,
    notes,
    status,
    items,
  } = req.body;

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    // Insert main bill
    const [result]: any = await conn.execute(
      `INSERT INTO bills (
        vendor_id, bill_number, bill_date, due_date,
        total_amount, tax_amount, 
        discount_amount, discount_type, net_amount,
        notes, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendor_id ?? null,
        bill_number ?? null,
        bill_date ?? null,
        due_date ?? null,
        total_amount ?? 0,
        tax_amount ?? 0,
        discount_amount ?? 0,
        discount_type ?? null,
        net_amount ?? null,
        notes ?? null,
        status ?? "draft",
      ]
    );

    const bill_id = result.insertId;

    // Insert bill items
    if (items && items.length > 0) {
      for (const item of items) {
        await conn.execute(
          `INSERT INTO bill_items (
             item_id, bill_id, description, quantity, rate_value
           )
           VALUES (?, ?, ?, ?, ?)`,
          [
            item.item_id ?? null,
            bill_id,
            item.description ?? "No description",
            item.quantity_value ?? 0, // make sure DB column is "quantity"
            item.rate_value ?? 0,
          ]
        );
      }
    }

    await conn.commit();

    res.status(201).json({
      message: `Bill created successfully`,
      id: bill_id,
    });
  } catch (err) {
    console.log("HERE IS ERROR 😀😀😀😀", err);
    await conn.rollback();
    const errorResponse = handleDatabaseError(err);
    res.status(errorResponse.statusCode).json(errorResponse);
  } finally {
    conn.release();
  }
};

 // UPDATE
export const updateBill = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const {
    vendor_id,
    bill_number,
    bill_date,
    due_date,
    total_amount,
    tax_amount,
    discount_amount,
    discount_type,
    net_amount,
    notes,
    status,
    items,
  } = req.body;

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    // Update bill
    const [result]: any = await conn.execute(
      `UPDATE bills
       SET vendor_id=?, bill_number=?, bill_date=?, due_date=?, 
           total_amount=?, tax_amount=?, discount_amount=?, 
           discount_type=?, net_amount=?, notes=?, status=?
       WHERE id=?`,
      [
        vendor_id ?? null,
        bill_number ?? null,
        bill_date ?? null,
        due_date ?? null,
        total_amount ?? 0,
        tax_amount ?? 0,
        discount_amount ?? 0,
        discount_type ?? null,
        net_amount ?? null,
        notes ?? null,
        status ?? "draft",
        id,
      ]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: `Bill not found` });
    }

    // Delete old items & insert new ones
    await conn.execute("DELETE FROM bill_items WHERE bill_id = ?", [id]);

    if (items && items.length > 0) {
      for (const item of items) {
        await conn.execute(
          `INSERT INTO bill_items (
             item_id, bill_id, description, quantity, rate_value
           )
           VALUES (?, ?, ?, ?, ?)`,
          [
            item.item_id ?? null,
            id,
            item.description ?? "No description",
            item.quantity_value ?? 0,
            item.rate_value ?? 0,
          ]
        );
      }
    }

    await conn.commit();

    res.status(200).json({
      message: `Bill updated successfully`,
      id,
    });
  } catch (error) {
    await conn.rollback();
    const errorResponse = handleDatabaseError(error);
    res.status(errorResponse.statusCode).json(errorResponse);
  } finally {
    conn.release();
  }
};

// DELETE
export const deleteBill = async (req: Request, res: Response) => {
  const bill_id = Number(req.params.id);

  if (!bill_id || isNaN(bill_id)) {
    return res.status(400).json({ error: `Invalid ${modulaName} ID` });
  }

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    const [existing]: any = await conn.execute(
      "SELECT * FROM bills WHERE id = ?",
      [bill_id]
    );

    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    await conn.execute("DELETE FROM bill_items WHERE bill_id = ?", [
      bill_id,
    ]);
    const [result]: any = await conn.execute(
      "DELETE FROM bills WHERE id = ?",
      [bill_id]
    );

    await conn.commit();

    res.status(200).json({
      message: `${modulaName} deleted successfully`,
      deletedId: bill_id,
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    await conn.rollback();
    const errorResponse = handleDatabaseError(error);
    res.status(errorResponse.statusCode).json(errorResponse);
  } finally {
    conn.release();
  }
};

export default router;
