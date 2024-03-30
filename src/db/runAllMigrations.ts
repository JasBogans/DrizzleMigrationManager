import { resolve } from "path";
import { readdirSync } from "fs";
import { db, DrizzleDB } from "@/db/db";
import { migrationHistory } from "./schema";
import { eq } from "drizzle-orm";
import promptUser from "@/utils/promptUser";

const runAllMigrations = async (db: DrizzleDB) => {
  console.log("🚀 Searching for migrations...");
  const migrationsDirectory = resolve(process.cwd(), "src/db/migs");
  const migrationFiles = readdirSync(migrationsDirectory).filter((file) =>
    file.endsWith(".ts")
  );

  const storedMigrations = await db.query.migrationHistory.findMany();

  const availableMigrations = new Set(
    migrationFiles.map((file) => file.replace(".ts", ""))
  );
  const storedMigrationNames = new Set(storedMigrations.map((m) => m.name));

  const notOnDbMigrations = [...availableMigrations].filter(
    (migration) => !storedMigrationNames.has(migration)
  );

  if (notOnDbMigrations.length > 0) {
    console.error(
      "❌ The following migrations are not present in the database:",
      notOnDbMigrations.join(", ")
    );

    // Sync migrations with the database
    for (const migration of notOnDbMigrations) {
      await db.insert(migrationHistory).values({
        name: migration,
        time: new Date(),
        executedAt: null,
        deletedAt: null,
      });
    }
    console.log("🔄 Migrations synced with database.");
  }

  const deletedMigrations = [...storedMigrationNames].filter(
    (migration) => !availableMigrations.has(migration)
  );

  if (deletedMigrations.length > 0) {
    console.error(
      "❌ The following migrations have been deleted from the migs folder:",
      deletedMigrations.join(", ")
    );
    await deleteMigrationsFromDb(db, deletedMigrations);
  }

  const pendingMigrations = [
    ...notOnDbMigrations,
    ...storedMigrations
      .filter((m) => m.executedAt === null && m.deletedAt === null)
      .map((m) => m.name),
  ];

  console.log(`🚀 Migrations to run: ${pendingMigrations.length} 🚀`);

  if (pendingMigrations.length === 0) {
    console.log("✅ All migrations have already been executed.");
    process.exit(0);
  }

  const results = await Promise.allSettled(
    pendingMigrations.map((migration) =>
      runMigration(db, `${migration}.ts`, migrationsDirectory)
    )
  );

  const successfulMigrations = results.filter(
    (result) => result.status === "fulfilled"
  );
  const failedMigrations = results.filter(
    (result) => result.status === "rejected"
  );

  if (successfulMigrations.length > 0) {
    console.log(
      `✅ ${successfulMigrations.length} migrations executed successfully.`
    );
  }

  if (failedMigrations.length > 0) {
    console.error(
      `❌ ${failedMigrations.length} migrations failed to execute.`
    );
    failedMigrations.forEach((result) => {
      console.error(`❌ ${(result as PromiseRejectedResult).reason}`);
    });
    process.exit(1);
  }

  process.exit(0);
};

const runMigration = async (
  db: DrizzleDB,
  migrationFileName: string,
  migrationsDirectory: string
) => {
  const migrationName = migrationFileName.replace(".ts", "");
  const migrationPath = resolve(migrationsDirectory, migrationFileName);
  const { migration } = require(migrationPath);

  await db.transaction(async (tx) => {
    await migration(tx);
    const existingMigration = await tx
      .select()
      .from(migrationHistory)
      .where(eq(migrationHistory.name, migrationName));

    const date = new Date();
    if (existingMigration.length === 0) {
      await tx.insert(migrationHistory).values({
        name: migrationName,
        time: date,
        executedAt: date,
        deletedAt: null,
      });
    } else {
      await tx
        .update(migrationHistory)
        .set({
          executedAt: date,
          deletedAt: null,
        })
        .where(eq(migrationHistory.name, migrationName));
    }
    console.log(`🚀 ${migrationName} was executed successfully ✅`);
  });
};

const deleteMigrationsFromDb = async (db: DrizzleDB, migrations: string[]) => {
  const answer = await promptUser(
    "❓ Do you want to mark these migrations as deleted in the database? (y/n): "
  );

  if (answer.toLowerCase() === "y") {
    await db.transaction(async (tx) => {
      const date = new Date();
      const results = await Promise.allSettled(
        migrations.map((migration) =>
          tx
            .update(migrationHistory)
            .set({ deletedAt: date })
            .where(eq(migrationHistory.name, migration))
            .execute()
        )
      );

      const successfulMigrationsDelete = results.filter(
        (result) => result.status === "fulfilled"
      );
      const failedMigrationsDelete = results.filter(
        (result) => result.status === "rejected"
      );

      if (successfulMigrationsDelete.length > 0) {
        console.log(
          `✅ ${successfulMigrationsDelete.length} migrations marked as deleted successfully.`
        );
      }

      if (failedMigrationsDelete.length > 0) {
        console.error(
          `❌ ${failedMigrationsDelete.length} migrations failed to mark as deleted.`
        );
      }
    });
  } else {
    console.log("⚠️ No migrations were marked as deleted.");
  }
};

runAllMigrations(db).catch((error) => {
  console.error("❌ An error occurred while running migrations:", error);
  process.exit(1);
});
