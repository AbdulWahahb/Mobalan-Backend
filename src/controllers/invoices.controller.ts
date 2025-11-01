import { Request, Response, Router } from "express";
import connection from "../db";
import { validationResult } from "express-validator";
import { handleDatabaseError } from "../middlewares/databaseErrorHandler";

const router = Router();
const modulaName = "invoice";
const tableName = "invoices";

// FETCH ALL
export const fetchInvoices = async (req: Request, res: Response) => {
  try {
    const [invoices]: any = await connection.execute(
      `SELECT * FROM ${tableName}`
    );
    const [items]: any = await connection.execute(
      `SELECT * FROM invoice_items`
    );

    // group invoice items by invoice_id
    const invoiceMap = invoices.map((inv: any) => ({
      ...inv,
      items: items.filter((it: any) => it.invoice_id === inv.id),
    }));

    res.status(200).json({
      message: `${modulaName}s fetched successfully`,
      data: invoiceMap,
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    res.status(errorResponse.statusCode).json(errorResponse);
  }
};

// FETCH ONE
export const fetchInvoice = async (req: Request, res: Response) => {
  const invoice_id = Number(req.params.id);

  if (!invoice_id || isNaN(invoice_id)) {
    return res.status(400).json({ error: `Invalid ${modulaName} ID` });
  }

  try {
    const [invoice]: any = await connection.execute(
      "SELECT * FROM invoices WHERE id = ?",
      [invoice_id]
    );
    if (invoice.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    const [invoice_items]: any = await connection.execute(
      "SELECT * FROM invoice_items WHERE invoice_id = ?",
      [invoice_id]
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

// CREATE
export const createInvoice = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    invoice_number,
    invoice_date,
    due_date,
    customer_id,
    subtotal_amount,
    tax_rate,
    tax_amount,
    discount_amount,
    discount_type,
    notes,
    total_amount,
    status,
    items,
  } = req.body;

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    const [result]: any = await conn.execute(
      `INSERT INTO invoices (invoice_number, invoice_date, due_date, customer_id, subtotal_amount, tax_rate, tax_amount, discount_amount, discount_type, notes, total_amount, status )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_number,
        invoice_date,
        due_date,
        customer_id,
        subtotal_amount,
        tax_rate,
        tax_amount,
        discount_amount,
        discount_type,
        notes,
        total_amount,
        status,
      ]
    );

    const invoiceId = result.insertId;

    if (items && items.length > 0) {
      for (const item of items) {
        await conn.execute(
          "INSERT INTO invoice_items (invoice_id, item_id, quantity, description) VALUES (?, ?, ?, ?)",
          [invoiceId, item.item_id, item.quantity_value, item.description]
        );
      }
    }

    await conn.commit();

    res.status(201).json({
      message: `${modulaName} created successfully`,
      id: invoiceId,
    });
  } catch (err) {
    await conn.rollback();
    const errorResponse = handleDatabaseError(err);
    res.status(errorResponse.statusCode).json(errorResponse);
  } finally {
    conn.release();
  }
};

// UPDATE
export const updateInvoices = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const {
    invoice_number,
    invoice_date,
    due_date,
    customer_id,
    subtotal_amount,
    tax_rate,
    tax_amount,
    discount_amount,
    discount_type,
    notes,
    total_amount,
    status,
    items,
  } = req.body;

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    const [result]: any = await conn.execute(
      `UPDATE invoices 
       SET invoice_number=?, invoice_date=?, due_date=?, customer_id=?, subtotal_amount=?, tax_rate=?, tax_amount=?, discount_amount=?, discount_type=?, notes=?, total_amount=?, status=? 
       WHERE id=?`,
      [
        invoice_number,
        invoice_date,
        due_date,
        customer_id,
        subtotal_amount,
        tax_rate,
        tax_amount,
        discount_amount,
        discount_type,
        notes,
        total_amount,
        status,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    // Delete old items & insert new ones
    await conn.execute("DELETE FROM invoice_items WHERE invoice_id = ?", [id]);
    if (items && items.length > 0) {
      for (const item of items) {
        await conn.execute(
          "INSERT INTO invoice_items (invoice_id, item_id, quantity, description) VALUES (?, ?, ?, ?)",
          [id, item.item_id, item.quantity_value, item.description]
        );
      }
    }

    await conn.commit();

    res.status(200).json({
      message: `${modulaName} updated successfully`,
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
export const deleteInvoice = async (req: Request, res: Response) => {
  const invoice_id = Number(req.params.id);

  if (!invoice_id || isNaN(invoice_id)) {
    return res.status(400).json({ error: `Invalid ${modulaName} ID` });
  }

  const conn = await connection.getConnection();
  await conn.beginTransaction();

  try {
    const [existing]: any = await conn.execute(
      "SELECT * FROM invoices WHERE id = ?",
      [invoice_id]
    );

    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: `${modulaName} not found` });
    }

    await conn.execute("DELETE FROM invoice_items WHERE invoice_id = ?", [
      invoice_id,
    ]);
    const [result]: any = await conn.execute(
      "DELETE FROM invoices WHERE id = ?",
      [invoice_id]
    );

    await conn.commit();

    res.status(200).json({
      message: `${modulaName} deleted successfully`,
      deletedId: invoice_id,
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
