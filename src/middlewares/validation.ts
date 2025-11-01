import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodTypeAny } from "zod";

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // parse and assign the validated body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((item) => ({
            path: item.path.join("."), // handles nested fields
            message: item.message,
          })),
        });
      }
      next(error);
    }
  };
}
