
import { exec } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";
dotenv.config();



const execAsync = promisify(exec);

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backups/backup-${timestamp}.sql`;

    console.log("📦 Creating database backup...");

    try {
        // Ensure backup directory exists
        await execAsync("mkdir -p backups");

        // Create backup using pg_dump
        const databaseUrl = process.env.DATABASE_URL!;
        await execAsync(`pg_dump "${databaseUrl}" > ${backupFile}`);

        console.log(`✅ Backup created: ${backupFile}`);
        return backupFile;
    } catch (error) {
        console.error("❌ Backup failed:", error);
        process.exit(1);
    }
}

createBackup();

