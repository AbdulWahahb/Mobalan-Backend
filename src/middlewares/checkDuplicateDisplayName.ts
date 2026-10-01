import { Request, Response, NextFunction } from "express";
import connection from "../db";

export const checkDuplicate = (
  table: string,
  field: string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = req.body[field];

      const [rows]: any = await connection.execute(
        `SELECT id FROM \`${table}\` WHERE \`${field}\` = ?`,
        [value]
      );

      if (rows.length > 0) {
        return res.status(400).json({
          stataus: 400,
          message: `Dupliacted Entery already exists`,
        });
      }

      next();
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        message: "Server error",
      });
    }
  };
};
