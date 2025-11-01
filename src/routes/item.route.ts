import { Router } from "express";
import { createItem, deleteItems, fetchItem, fetchItems, updateItem } from "../controllers/itmes.controller";
import { checkSchema } from "express-validator";
import {  createItemValidationSchema } from "../middlewares/validationSchemas";


const itemRoutes = Router();
itemRoutes.get("/items", fetchItems);
itemRoutes.get("/item/show/:id", fetchItem);
itemRoutes.post(
  "/item/create",
  checkSchema(createItemValidationSchema),
  createItem
);
itemRoutes.delete("/item/delete/:id", deleteItems);
itemRoutes.put("/item/update/:id", updateItem);
// // updateAccount
// // account/delete/17

export default itemRoutes;
