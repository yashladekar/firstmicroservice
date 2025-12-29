import ExcelJS from "exceljs";
import { ParsedRecordModel } from "../database/models/ParsedRecordModel";
import { fixEmail, fixNumber, fixString } from "../utils/autoFix";

interface ParseResult {
  validCount: number;
  errorCount: number;
  errors: any[];
}

export const parseExcel = async (file: Express.Multer.File): Promise<ParseResult> => {
  const workbook = new ExcelJS.Workbook();

  // Node 22 types model Buffer as generic; ExcelJS expects a plain Buffer.
  // Buffer.from(...) normalizes the runtime value; casting avoids TS's Buffer generic incompatibility.
  await workbook.xlsx.load(Buffer.from(file.buffer) as any);

  const worksheet = workbook.worksheets[0];

  let validCount = 0;
  let errorCount = 0;
  let errors: any[] = [];

  for (let i = 2; i <= worksheet.rowCount; i++) {
    try {
      const row = worksheet.getRow(i);

      // AUTO-HEALING FIELDS
      const name = fixString(row.getCell(1).value);
      const age = fixNumber(row.getCell(2).value);
      const email = fixEmail(row.getCell(3).value);

      // REQUIRED FIELD VALIDATION
      if (!name || !email) {
        throw new Error(`Missing required fields at row: ${i}`);
      }

      // SAVE TO DB
      await ParsedRecordModel.create({ name, age, email });

      validCount++;
    } catch (err: any) {
      errorCount++;
      errors.push({ row: i, message: err.message });
      continue; // self-healing: continue parsing
    }
  }

  return {
    validCount,
    errorCount,
    errors
  };
};
