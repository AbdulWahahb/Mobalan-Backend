import { NextFunction, Response, Request } from "express";
import connection from "../db";

export const checkExists = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const sql = `SELECT * FROM \`${tableName}\` WHERE id = ?`;
      const [rows] = await connection.execute(sql, [id]);

      if (Object.keys(rows).length === 0) {
        return res.status(404).json({ message: "Not Found" });
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  };
};
