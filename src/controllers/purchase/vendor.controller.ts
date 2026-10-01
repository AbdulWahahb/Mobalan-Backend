import { Request, Response, Router } from "express";
import connection from "../../db";
import { validationResult } from "express-validator";
import { handleDatabaseError } from "../../middlewares/databaseErrorHandler";
import { createJournalEntry } from "../AccountEntry/journal_entries.controller";

const router = Router();
// get data
const modulaName = "vendor";
const tableName = "vendors";

// fetch
export const fetchVendors = async (req: Request, res: Response) => {
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
export const fetchVendor = async (req: Request, res: Response) => {
  const vendor_id = Number(req.params.id);

  if (!vendor_id || isNaN(vendor_id)) {
    return res.status(400).json({ error: `Invalid ${modulaName} ID` });
  }
  try {
    const [result]: any = await connection.execute(
      "SELECT * FROM vendors WHERE `id` = ?",
      [vendor_id]
    );
    if (result.length == 0) {
      res.status(201).json({
        message: `${modulaName} not found`,
      });
    }
    res.status(201).json({
      message: `${modulaName} Fetch successfully`,
      status: 200,
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
export const createVendor = async (req: Request, res: Response) => {
  const result = validationResult(req);
  if (!result?.isEmpty()) {
    return res.status(401).send({ errors: result.array() });
  }
  try {
    const {
      saltation,
      first_name,
      last_name,
      display_name,
      city_id,
      data_key,
      company_name,
      email_address,
      phone,
      mobile,
      balance_id,
      opening_balance,
      opening_balance_date,
      is_active,
    } = req.body;

    // 1. CREATE VENDOR
    const [result]: any = await connection.execute(
      `INSERT INTO vendors (
        saltation, first_name, last_name, display_name, city_id,
        data_key, company_name, email_address, phone, mobile,
        balance_id, is_active, opening_balance, opening_balance_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saltation ?? null,
        first_name ?? null,
        last_name ?? null,
        display_name ?? null,
        city_id ?? null,
        data_key ?? null,
        company_name ?? null,
        email_address ?? null,
        phone ?? null,
        mobile ?? null,
        balance_id ?? null,
        is_active ?? 1,
        opening_balance ?? 0,
        opening_balance_date?.replace("T", " ") ?? null,
      ]
    );
    const vendorId = result.insertId;
    // 2. ACCOUNTING LOGIC (IMPORTANT)
    if (opening_balance && Number(opening_balance) !== 0) {
      const amount = Math.abs(Number(opening_balance));
      const isPositive = Number(opening_balance) > 0;
      const ACCOUNTS_PAYABLE = 1062;
      const OPENING_BALANCE_EQUITY = 1064;
      await createJournalEntry({
        date:
          opening_balance_date?.split("T")[0] ||
          new Date().toISOString().split("T")[0],

        reference: `vendor-opening-${vendorId}`,

        description:
          `Opening balance for vendor ${display_name}`,
        created_by: 1,
        lines: [
          {
            account_id:
              isPositive
                ? OPENING_BALANCE_EQUITY
                : ACCOUNTS_PAYABLE,
            debit: amount,
            credit: 0
          },

          {
            account_id:
              isPositive
                ? ACCOUNTS_PAYABLE
                : OPENING_BALANCE_EQUITY,
            debit: 0,
            credit: amount
          }
        ]
      });
    }
    return res.status(200).json({
      message: `${modulaName} added successfully`,
      status: 200,
      id: vendorId,
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
export const changeVendorStatus = async (req: Request, res: Response) => {
  try {
    const vendor_id = parseInt(req.params.id); // Explicitly parse as integer
    const { is_active } = req.body
    const status = is_active ? 1 : 0
    if (!vendor_id || isNaN(vendor_id)) {
      return res.status(400).json({ error: `Invalid ${modulaName} ID` });
    }

    // Optional: First check if the item  exists
    const [existing]: any = await connection.execute(
      "SELECT * FROM vendors WHERE id = ?",
      [vendor_id]
    );

    // 2. Prevent deletion if stock is not zero
    // check if exsist
    const [newStatus]: any = await connection.execute(
      "UPDATE vendors SET is_active = ? WHERE id = ? "
      , [status, vendor_id])
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
// DELETE
export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const vendor_id = parseInt(req.params.id); // Explicitly parse as integer

    if (!vendor_id || isNaN(vendor_id)) {
      return res.status(400).json({ error: `Invalid ${modulaName} ID` });
    }

    // Optional: First check if the todo exists
    const [existing]: any = await connection.execute(
      "SELECT * FROM vendors WHERE id = ?",
      [vendor_id]
    );
    // check if exsist
    if (existing.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    // Then proceed with deletion
    const [result]: any = await connection.execute(
      "DELETE FROM vendors WHERE id = ?",
      [vendor_id]
    );

    res.status(200).json({
      message: `${modulaName} deleted successfully`,
      deletedId: vendor_id,
      affectedRows: result.affectedRows,
      status: 200,
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
// // UPDATE
export const updateVendor = async (req: Request, res: Response) => {
  try {
    const {
      saltation,
      first_name,
      last_name,
      display_name,
      city_id,
      data_key,
      company_name,
      email_address,
      phone,
      mobile,
      balance_id,
      opening_balance,
      opening_balance_date,
      is_active,
    } = req.body;
    const id = req.params.id;
    const [result]: any = await connection.execute(
      "UPDATE vendors SET saltation = ?, first_name = ?, last_name = ? ,display_name = ? , city_id = ?, data_key = ?, company_name = ?, email_address = ?, phone = ?, mobile = ?, balance_id = ?, is_active = ?, opening_balance = ?   WHERE id = ?",
      [
        saltation ?? null,
        first_name ?? null,
        last_name ?? null,
        display_name ?? null,
        city_id ?? null,
        data_key ?? null,
        company_name ?? null,
        email_address ?? null,
        phone ?? null,
        mobile ?? null,
        balance_id ?? null,
        is_active ?? null,
        opening_balance ?? null,
        id,
      ]
    );
    // Check if any row was actually updated;
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    // Fetch the updated todo to return it
    const [updateAccount]: any = await connection.execute(
      "SELECT * FROM vendors WHERE id = ?",
      [id]
    );
    res.status(200).json({

      status: 200,
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
