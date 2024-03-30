import "@/lib/config";
import { drizzle } from "drizzle-orm/postgres-js"; //change this line with your driver
import postgres from "postgres"; //change this line with your database library
import * as schema from "./schema";

const client = postgres({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),
  username: process.env.DB_USERNAME!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
});

export const db = drizzle(client, { schema });

export type DrizzleDB = typeof db;