# Table of Contents

- [Drizzle Migration Manager](#drizzle-migration-manager)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage) 
  - [Generating a New Migration](#generating-a-new-migration)
  - [Running Migrations](#running-migrations)
- [Database Schema](#database-schema)
- [Utility Functions](#utility-functions)
- [Usage Examples](#usage-examples) 
  - [Running Migrations](#running-migrations-1)
  - [Marking Migrations as Deleted](#marking-migrations-as-deleted)
- [Motivation](#motivation)
- [Contributing](#contributing)
- [Dependencies and Compatibility](#dependencies-and-compatibility)
- [Missing Functionalities](#missing-functionalities)
- [License](#license)

# Drizzle Migration Manager

Drizzle Migration Manager is a powerful tool for managing database migrations in your TypeScript projects using the Drizzle ORM. It provides a streamlined and efficient way to create, execute, and manage database migrations, ensuring consistency and maintainability of your application's data structure.

## Features

- **Migration Generation**: Automatically generate new migration files with a timestamp and optional custom name.
- **Migration Execution**: Run all pending migrations or specific migrations based on your requirements.
- **Migration History Tracking**: Keep track of executed and deleted migrations in the database for easy maintenance.
- **User Prompts**: Interactive user prompts for critical operations, such as marking migrations as deleted.
- **Error Handling**: Robust error handling and logging for smooth migration execution.

## Installation

1. Install the required dependencies:

```bash
npm install drizzle-orm drizzle-orm-postgres faker-js
```

1. Create the necessary directories and files:

```
project/
├── src/
│   ├── db/
│   │   ├── generateMigration.ts
│   │   ├── runAllMigrations.ts
│   │   ├── schema.ts
│   │   └── migs/
│   └── utils/
│       └── promptUser.ts
└── package.json
```

1. Add the following scripts to your `package.json`:

```json
"scripts": {
  "migration:generate": "npx tsx src/db/generateMigration.ts",
  "migration:generate:named": "npx tsx src/db/generateMigration.ts [migration-name]",
  "migration:all": "npx tsx src/db/runAllMigrations.ts"
}
```

## Usage

### Generating a New Migration

To generate a new migration file, run:

```bash
npm run migration:generate
```

This will create a new migration file with a timestamp and a random name in the `src/db/migs` directory.

Alternatively, you can provide a custom name for the migration:

```bash
npm run migration:generate:named create_users
```

This will generate a migration file with the provided name (`create_users`) and a timestamp.  
  
The generated migration file will have the following structure:

```typescript
// Migration: [migration-name.ts]

import { DrizzleDB } from "@/db/db";
import { sql } from "drizzle-orm";

export async function migration(db: DrizzleDB) {
  // Write your migration logic here
}
```

Here's an example of how to use the generated migration file:

```typescript
// Migration: create_users

import { DrizzleDB } from "@/db/db";
import { sql } from "drizzle-orm";
import { users } from "@/db/schema";

export async function migration(db: DrizzleDB) {
  await db.execute(
    sql`CREATE TABLE ${users} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL
    )`
  );
}
```

In this example, the `migration` function creates a new table called `users` with columns for `id`, `name`, and `email`..

### Running Migrations

To run all pending migrations, execute:

```bash
npm run migration:all
```

This command will execute all migrations that have not been run previously or have been marked as deleted.

## Database Schema

The migration manager uses a `migrationHistory` table to keep track of executed and deleted migrations. The table has the following schema:

```b
CREATE TABLE migrationHistory (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  time TIMESTAMP NOT NULL,
  executedAt TIMESTAMP NULL,
  deletedAt TIMESTAMP NULL
);
```

In schema.ts:

```typescript
export const migrationHistory = pgTable("migration_history", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  time: timestamp("time").notNull(),
  executedAt: timestamp("executed_at"),
  deletedAt: timestamp("deleted_at"),
});
```

- `id`: A unique identifier for each migration entry.
- `name`: The name of the migration file.
- `time`: The timestamp when the migration file was created.
- `executedAt`: The timestamp when the migration was executed, or `NULL` if it hasn't been executed yet.
- `deletedAt`: The timestamp when the migration was marked as deleted, or `NULL` if it hasn't been deleted.

In db.ts:

```typesciprt
export const db = drizzle(client, { schema });

export type DrizzleDB = typeof db;
```

## Utility Functions

The migration manager includes a utility function for prompting the user for input:

```typescript
// src/utils/promptUser.ts
import * as readline from "readline";

const promptUser = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export default promptUser;
```

## Usage Examples

Suppose we have the following situation:

The `migs` folder contains the following migration files:

- `001-create-users.ts`
- `002-create-products.ts`
- `003-create-orders.ts`

The `migrationHistory` table in the database contains the following data:

| id | name                | time                | executedAt          | deletedAt |
|----|---------------------|---------------------|---------------------|-----------|
| 1  | 001-create-users    | 2023-05-01 10:00:00 | 2023-05-01 10:00:10 | NULL      |
| 2  | 002-create-products | 2023-05-01 10:00:20 | NULL                | NULL      |
| 3  | 004-create-invoices | 2023-05-01 10:00:30 | 2023-05-01 10:00:40 | NULL      |

### Running Migrations

When you run the `npm run migration:all` command, the following sequence of events will occur:

1. The migration manager will scan the `migs` folder and find the migration files: `001-create-users.ts`, `002-create-products.ts`, and `003-create-orders.ts`.
2. It will compare the migration files with the `migrationHistory` table in the database.
3. It will detect the following issues: 
   - The migration `003-create-orders.ts` is not present in the `migrationHistory` table, indicating that it has not been executed yet.
   - The migration `004-create-invoices` is present in the `migrationHistory` table, but its corresponding file is missing from the `migs` folder.

Output:

```
🚀 Searching for migrations...
❌ The following migrations are not present in the database: 003-create-orders
❌ The following migrations have been deleted from the migs folder: 004-create-invoices
❓ Do you want to mark these migrations as deleted in the database? (y/n): y
✅ Migration '004-create-invoices' marked as deleted successfully.
🔄 Migrations synced with database.
🚀 Migrations to run: 2 🚀
🚀 002-create-products was executed successfully ✅
🚀 003-create-orders was executed successfully ✅
✅ 2 migrations executed successfully.
```

1. The migration manager will prompt you to mark the missing migration `004-create-invoices` as deleted in the database. Assuming you enter `y`, it will update the `deletedAt` column for that migration with the current timestamp.
2. After syncing the migrations, it will execute the pending migrations: `002-create-products` and `003-create-orders`.

At the end of the process, the `migrationHistory` table will be updated to reflect the executed migrations and the deleted migration:

| id | name                | time                | executedAt          | deletedAt           |
|----|---------------------|---------------------|---------------------|---------------------|
| 1  | 001-create-users    | 2023-05-01 10:00:00 | 2023-05-01 10:00:10 | NULL                |
| 2  | 002-create-products | 2023-05-01 10:00:20 | 2023-05-02 12:00:00 | NULL                |
| 3  | 004-create-invoices | 2023-05-01 10:00:30 | 2023-05-01 10:00:40 | 2023-05-02 12:00:20 |
| 4  | 003-create-orders   | 2023-05-02 12:00:10 | 2023-05-02 12:00:15 | NULL                |

Note that the `deletedAt` column for `004-create-invoices` has been updated with the timestamp when it was marked as deleted.

### Marking Migrations as Deleted

If you need to mark a migration as deleted without running the `migration:all` command, you can use the following procedure:

1. Locate the migration you want to delete in the `migs` folder and remove the corresponding file.
2. Run the `migration:all` command, and when prompted to mark migrations as deleted, enter `y`.
3. The migration manager will update the `deletedAt` column for the missing migration file with the current timestamp.

This process ensures that the `migrationHistory` table accurately reflects the state of your migrations, including any deleted migrations.

## Motivation

The motivation behind this Drizzle Migration Manager project is to provide a structured and efficient way to manage database migrations in TypeScript projects using the Drizzle ORM. By centralizing migration management logic and automating various tasks, such as migration generation and execution, the project aims to streamline the development process, reduce errors, and improve the overall maintainability and reliability of database structures.

Additionally, the project's focus on tracking migration history, handling deletions, and providing interactive prompts adds an extra layer of safety and control, minimizing the risk of data loss or corruption during migration operations.

While the project introduces some complexity and dependencies, its benefits in terms of automation, organization, and maintainability can outweigh these drawbacks, particularly for projects with complex database structures or teams working on large-scale applications. The modular nature of the migration manager also promotes extensibility and customization, allowing for future enhancements or integration with other tools or technologies.

Overall, the Drizzle Migration Manager project aims to strike a balance between automation, reliability, and maintainability, providing a robust solution for managing database migrations in TypeScript projects while acknowledging the potential trade-offs and limitations.

## Dependencies and Compatibility

The Drizzle Migration Manager has been tested with PostgreSQL, with the following dependencies and versions:

- drizzle-orm: "^0.30.4"
- pg: "^8.11.3"
- postgres: "^3.4.4"

It is recommended to use Node.js version 18 or higher when running the migration manager.

Additionally, to ensure compatibility with certain language features used in the project, such as the `Set` object, you should add the following compiler option to your `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "downlevelIteration": true
  }
}
```

## Missing Functionalities

While the Drizzle Migration Manager provides a solid foundation for managing database migrations, there are a few additional functionalities that could be implemented to further enhance its capabilities in the future:

 1. **Rollback Migrations**: Currently, the migration manager only supports executing migrations in a forward direction. Implementing a rollback mechanism would allow users to undo previously executed migrations, providing greater flexibility and control over the database structure.
 2. **Selective Migration Execution**: The current implementation only supports running all pending migrations or marking migrations as deleted. Adding the ability to selectively execute or rollback specific migrations could be beneficial for more granular migration management.
 3. **Migration Dependencies**: In some cases, migrations may depend on other migrations being executed first. Introducing a way to define and manage migration dependencies could improve the overall migration process and prevent conflicts or errors.
 4. **Dry Run Mode**: Implementing a dry run mode could allow users to simulate the execution of migrations without actually modifying the database. This feature could be useful for testing and validating migrations before applying them to a production environment.
 5. **Migration Versioning**: While the migration manager tracks execution and deletion timestamps, it could be useful to incorporate a versioning system for migrations. This would allow users to easily identify and manage different versions of migrations, facilitating collaboration and tracking changes over time.
 6. **Database Backup and Restore**: Integrating database backup and restore functionality could enhance the safety and reliability of the migration process. Users could create backups before executing migrations and restore the database if needed, providing an additional layer of protection against data loss or corruption.
 7. **Migration Progress Tracking**: Implementing a mechanism to track the progress of migration execution could be valuable, especially for long-running or complex migrations. This could include displaying a progress bar, estimated time remaining, or logging detailed information about the execution process.
 8. **Migration Validation**: Adding validation checks for migrations could help ensure the integrity and consistency of the database schema. This could include checks for naming conventions, data types, constraints, and other schema-related rules.
 9. **Migration Documentation Generation**: Generating documentation for migrations could be a useful feature, particularly for larger projects or teams. This documentation could include details about the migration's purpose, changes made, and any relevant notes or instructions.
10. **Migration Conflict Resolution**: In scenarios where multiple developers are working on migrations simultaneously, implementing a mechanism for conflict resolution could prevent issues and ensure smooth collaboration.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

MIT License

Copyright (c) [year] [fullname]

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 