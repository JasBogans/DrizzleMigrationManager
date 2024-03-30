import { resolve } from "path";
import { writeFileSync } from "fs";
import { faker } from "@faker-js/faker";
import { db } from "@/db/db";
import { migrationHistory } from "./schema";

const generateMigration = async () => {
  console.log("🚀 Generating migration file... ⏳");

  const migrationsDirectory = resolve(process.cwd(), "src/db/migs");
  const time = new Date();
  const timestamp = time.toISOString().replace(/[-:.TZ]/g, "");
  const migrationName =
    process.argv[2] || faker.system.fileName().replace(/\..*/, "");
  const migrationFileName = `${timestamp}_${migrationName}.ts`;
  const migrationFilePath = resolve(migrationsDirectory, migrationFileName);

  const migrationTemplate = `// Migration: ${migrationFileName.replace(
    ".ts",
    ""
  )}
   
import { DrizzleDB } from "@/db/db";
import { sql } from "drizzle-orm";

export async function migration(db: DrizzleDB) {
  // Write your migration logic here
}
`;

  try {
    writeFileSync(migrationFilePath, migrationTemplate);
  } catch (error: any) {
    console.error(`Error generating migration file: ${error.message} ❌`);
    process.exit(1);
  }

  const insertMigration = async (
    migration: typeof migrationHistory.$inferInsert
  ) => {
    try {
      await db.insert(migrationHistory).values(migration);

      console.log(
        `🚀 New migration ${migrationFileName} created successfully.`
      );
      process.exit(0);
    } catch (error) {
      console.error("Error inserting migration history ❌", error);
      process.exit(1);
    }
  };

  insertMigration({
    name: migrationFileName.replace(".ts", ""),
    time: new Date(),
    executedAt: null,
  });
};

generateMigration();
