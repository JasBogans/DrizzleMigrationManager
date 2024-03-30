import {
  pgTable,
  varchar,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const migrationHistory = pgTable("migration_history", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  time: timestamp("time").notNull(),
  executedAt: timestamp("executed_at"),
  deletedAt: timestamp("deleted_at"),
});