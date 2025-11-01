import { Request, Response, Router } from "express";
import connection from "../../db";
import { RowDataPacket } from "mysql2";
import { checkSchema, validationResult } from "express-validator";
import { handleDatabaseError } from "../../middlewares/databaseErrorHandler";
import { createAccountValidationSchema } from "../../middlewares/validationSchemas";

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
      company_name,
      email_address,
      phone,
      mobile,
      balance_id,
    } = req.body;
    const [result]: any = await connection.execute(
      "INSERT INTO vendors (saltation, first_name, last_name, display_name, city_id, company_name, email_address, phone, mobile, balance_id ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        saltation,
        first_name,
        last_name,
        display_name,
        city_id,
        company_name,
        email_address,
        phone,
        mobile,
        balance_id,
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
      company_name,
      email_address,
      phone,
      mobile,
      balance_id,
    } = req.body;
    const id = req.params.id;
    const [result]: any = await connection.execute(
      "UPDATE vendors SET saltation = ?, first_name = ?, last_name = ? ,display_name = ? , city_id = ?, company_name = ?, email_address = ?, phone = ?, mobile = ?, balance_id = ? WHERE id = ?",
      [
        saltation,
        first_name,
        last_name,
        display_name,
        city_id,
        company_name,
        email_address,
        phone,
        mobile,
        balance_id,
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
