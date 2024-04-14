import { DrizzleDB } from "../db/db";
import { sql } from "drizzle-orm";

export async function checkMigrationTable(db: DrizzleDB) {
    try {
        await db.execute(sql`SELECT 1;`);
        await db.execute(sql`CREATE TABLE IF NOT EXISTS migration_history (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            time TIMESTAMP NOT NULL,
            executed_at TIMESTAMP,
            deleted_at TIMESTAMP
        );`);

        console.log("🚨🚨 PLEASE RUN THIS COMMAND TO SYNC THE DATABASE: /'npm run drizzle:push/'");
    } catch (error) {
        console.error("Error connecting to the database ❌", error);
        process.exit(1);
    }
}