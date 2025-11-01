import { Router } from "express";
// import { validateBody } from "../middlewares/validation";
import z from "zod";
import {
  createUser,
  fetchUser,
  fetchUsers,
} from "../controllers/user.controller";

const userRoutes = Router();

userRoutes.get("/users", fetchUsers);
userRoutes.get("/user/:id", fetchUser);
userRoutes.post("/user/create", createUser);

export default userRoutes;
