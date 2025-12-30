import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as XLSX from "xlsx";
import * as fs from "fs";
import { env } from "../config/env";

const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ParseResult {
    success: boolean;
    totalRows: number;
    processedCount: number;
    errors: string[];
}

export class ClientFileService {

    /**
     * Reads a file from disk, parses it, and updates DB.
     * Returns a detailed report.
     */
    async processExcelFile(filePath: string): Promise<ParseResult> {
        const errors: string[] = [];
        let processedCount = 0;
        let totalRows = 0;

        try {
            // 1. Read File from Disk (Stream safe for larger files)
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found at path: ${filePath}`);
            }

            const fileBuffer = fs.readFileSync(filePath);
            const workbook = XLSX.read(fileBuffer, { type: "buffer" });
            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet) continue;

                // 2. Convert to JSON (typing loose here because inputs are unpredictable)
                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
                    defval: "",
                    raw: false, // Force strings to avoid date parsing issues
                });

                totalRows += jsonData.length;
                let currentSid: string | null = null;

                // 3. Iterate rows for this sheet
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    const rowNum = i + 2; // +2 because index is 0-based and Excel has a header

                    try {
                        // --- PARENT SYSTEM LOGIC ---
                        if (row.SID && row.SID.trim() !== "") {
                            const sid = row.SID.trim();
                            currentSid = sid;

                            const dbVersion = row['DB Version (from Tx DB02)'] || row['Databse'];
                            const osType = row['OS Type'] || row['OS'];
                            const mainProduct = row['Main Product'] ? row['Main Product'].trim() : null;

                            await prisma.system.upsert({
                                where: { sid },
                                update: {
                                    mainProduct,
                                    dbVersion,
                                    osType,
                                    osVersion: row['OS version'],
                                    osPatch: row['OS Patch'],
                                    kernelRelease: row['Kernel Release'],
                                    dbslVersion: row['DBSL Version'],
                                    dbslPatchLevel: row['DBSL Patch Level'],
                                    vmJavaVersion: row['VM Java Version'],
                                    vmRuntimeVersion: row['VM Runtime Version'],
                                    javaKernelVersion: row['Java Kernel Version'],
                                },
                                create: {
                                    sid,
                                    mainProduct,
                                    dbVersion,
                                    osType,
                                    osVersion: row['OS version'],
                                    osPatch: row['OS Patch'],
                                    kernelRelease: row['Kernel Release'],
                                    dbslVersion: row['DBSL Version'],
                                    dbslPatchLevel: row['DBSL Patch Level'],
                                    vmJavaVersion: row['VM Java Version'],
                                    vmRuntimeVersion: row['VM Runtime Version'],
                                    javaKernelVersion: row['Java Kernel Version'],
                                },
                            });
                        }

                        // --- CHILD COMPONENT LOGIC ---
                        if (currentSid) {
                            // Check ABAP
                            if (row.Component) {
                                await prisma.abapComponent.create({
                                    data: {
                                        systemSid: currentSid,
                                        component: row.Component,
                                        release: row.Release || "",
                                        spLevel: row["SP-Level"]?.toString(),
                                        supportPackage: row["Support Package"],
                                        shortDescription: row["Short Description of Components"],
                                    },
                                });
                                processedCount++;
                            }
                            // Check JAVA
                            else if (row.Name) {
                                await prisma.javaComponent.create({
                                    data: {
                                        systemSid: currentSid,
                                        name: row.Name,
                                        vendor: row.Vendor,
                                        version: row.Version || "",
                                        location: row.Location,
                                    },
                                });
                                processedCount++;
                            }
                        }
                    } catch (rowError) {
                        // SELF HEALING: Capture error, log it, but DO NOT STOP the loop
                        const msg = `Sheet ${sheetName} - Row ${rowNum} Error (SID: ${currentSid}): ${rowError instanceof Error ? rowError.message : 'Unknown'}`;
                        console.error(msg);
                        errors.push(msg);
                    }
                }
            }

            return { success: true, totalRows, processedCount, errors };

        } catch (err) {
            // Critical failure (e.g., file corrupt)
            console.error("Critical Parser Failure", err);
            throw err; // Rethrow to let BullMQ know the job failed
        }
    }
}

export default new ClientFileService();