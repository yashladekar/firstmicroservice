import ExcelJS from "exceljs";
import { ParsedRecordModel } from "../database/models/ParsedRecordModel";
import { fixString, fixNumber, fixEmail } from "../utils/autoFix";

export const parseExcel = async (file: Express.Multer.File) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(file.buffer) as any);

  let validCount = 0;
  let errorCount = 0;
  const errors: any[] = [];

  for (const worksheet of workbook.worksheets) {
    const headerRow = worksheet.getRow(1);

    interface Header {
      original: string;
      normalized: string;
    }

    const headers: Header[] = (headerRow.values as ExcelJS.CellValue[])
      .slice(1)
      .map((h: ExcelJS.CellValue) => normalizeHeader(h));

    if (headers.length === 0) continue;

    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
      try {
        const row = worksheet.getRow(rowIndex);

        const rawData: Record<string, any> = {};
        const normalizedData: Record<string, any> = {};

        interface Header {
          original: string;
          normalized: string;
        }

        (headers as Header[]).forEach((header: Header, i: number) => {
          const cellValue: ExcelJS.CellValue = row.getCell(i + 1).value;
          rawData[header.original] = cellValue;

          normalizedData[header.normalized] = autoFix(cellValue);
        });

        const extractionQuality = calculateQuality(normalizedData);

        await ParsedRecordModel.create({
          fileId: file.originalname,
          sheetName: worksheet.name,
          rowIndex,
          rawData,
          normalizedData,
          extractionQuality,
        });

        validCount++;
      } catch (err: any) {
        errorCount++;
        errors.push({
          sheet: worksheet.name,
          row: rowIndex,
          message: err.message,
        });
      }
    }
  }

  return { validCount, errorCount, errors };
};

/* ================= Helpers ================= */

const normalizeHeader = (v: any) => {
  const original = String(v ?? "").trim();
  const normalized = original
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  return { original, normalized };
};

const autoFix = (v: any) => {
  return (
    fixEmail(v) ??
    fixNumber(v) ??
    fixString(v)
  );
};

const calculateQuality = (row: Record<string, any>) => {
  const values = Object.values(row);
  const filled = values.filter((v) => v !== null && v !== undefined).length;
  return Math.round((filled / values.length) * 100);
};
