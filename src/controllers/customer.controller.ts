import { Request, Response, Router } from "express";
import connection from "../db";
import { RowDataPacket } from "mysql2";
import { checkSchema, validationResult } from "express-validator";
import { handleDatabaseError } from "../middlewares/databaseErrorHandler";
import { createAccountValidationSchema } from "../middlewares/validationSchemas";

const router = Router();
// get data

const modulaName = "customers";
const tableName = "customers";

// fetch
export const fetchCustomers = async (req: Request, res: Response) => {
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
export const fetchCustomer = async (req: Request, res: Response) => {
  const unite_id = Number(req.params.id);

  if (!unite_id || isNaN(unite_id)) {
    return res.status(400).json({ error: `Invalid ${modulaName} ID` });
  }
  try {
    const [result]: any = await connection.execute(
      "SELECT * FROM customers WHERE `id` = ?",
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
export const createCustomer = async (req: Request, res: Response) => {
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
      "INSERT INTO customers (saltation, first_name, last_name, display_name, city_id, company_name, email_address, phone, mobile, balance_id ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const customer_id = parseInt(req.params.id); // Explicitly parse as integer

    if (!customer_id || isNaN(customer_id)) {
      return res.status(400).json({ error: `Invalid ${modulaName} ID` });
    }

    // Optional: First check if the todo exists
    const [existing]: any = await connection.execute(
      "SELECT * FROM customers WHERE id = ?",
      [customer_id]
    );
    // check if exsist
    if (existing.length === 0) {
      return res.status(404).json({ error: `${modulaName} not found` });
    }
    // Then proceed with deletion
    const [result]: any = await connection.execute(
      "DELETE FROM items WHERE id = ?",
      [customer_id]
    );

    res.status(200).json({
      message: `${modulaName} deleted successfully`,
      deletedId: customer_id,
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
export const updateCustomer = async (req: Request, res: Response) => {
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
      "UPDATE customers SET saltation = ?, first_name = ?, last_name = ? ,display_name = ? , city_id = ?, company_name = ?, email_address = ?, phone = ?, mobile = ?, balance_id = ? WHERE id = ?",
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
      "SELECT * FROM customers WHERE id = ?",
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
