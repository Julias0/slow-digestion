import fs from "fs";
import { PDFParse } from "pdf-parse";

export async function parseInvoicePDF(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdfData = new PDFParse({ data: dataBuffer });
  const data = await pdfData.getText();
  const text = data.text;

  return extractInvoiceData(text);
}

/**
 * Extracts structured invoice data from the raw text of the PDF.
 * @param {string} text - The raw text extracted from the PDF.
 * @returns {object[]} An object containing the date of invoice and an array of goods with their details.
 */
function extractInvoiceData(text) {
  const lines = text.replace(/--\[.*?\]of\[.*?\]--/g, '').split("\n").map((l) => l.trim()).filter(Boolean);
 
  let dateOfInvoice = null;
  const result = {
    goods: [],
  };

 
  // --- Extract Date of Invoice ---
  for (const line of lines) {
    const dateMatch = line.match(/Date of Invoice[:\s]+(\d{2}-\d{2}-\d{4})/i);
    if (dateMatch) {
      dateOfInvoice = dateMatch[1];
      break;
    }
  }
 
  // --- Find table boundaries ---
  // Table starts after the header row containing "Total" and "Amount"
  // Items start at lines beginning with "<number>."
  // Table ends at "Invoice Value"
  let tableStartIdx = -1;
  let tableEndIdx = lines.length;
 
  for (let i = 0; i < lines.length; i++) {
    if (tableStartIdx === -1 && /^\d+\./.test(lines[i])) {
      tableStartIdx = i;
    }
    if (tableStartIdx !== -1 && lines[i].startsWith("Invoice Value")) {
      tableEndIdx = i;
      break;
    }
  }
 
  if (tableStartIdx === -1) {
    throw new Error("Could not find goods table in PDF text");
  }
 
  const tableLines = lines.slice(tableStartIdx, tableEndIdx);
 
  // --- Group lines into per-item blocks ---
  // Each item starts with a line matching "^<number>."
  const itemBlocks = [];
  let currentBlock = null;
 
  for (const line of tableLines) {
    const srMatch = line.match(/^(\d+)\.\s*(.*)/);
    if (srMatch) {
      if (currentBlock) itemBlocks.push(currentBlock);
      currentBlock = {
        srNo: parseInt(srMatch[1]),
        // first line after "N." may already have description text or be empty
        rawLines: srMatch[2] ? [srMatch[2]] : [],
      };
    } else if (currentBlock) {
      currentBlock.rawLines.push(line);
    }
  }
  if (currentBlock) itemBlocks.push(currentBlock);
 
  // --- Parse each block ---
  // Two layouts exist in the PDF:
  //
  // Layout A — description spans multiple lines, numbers on their own line:
  //   "Yelakki Banana"
  //   "(Baalehannu)"
  //   "1 NOS 08039010 56 11 45 0 0 0 0 0 0 0 45"
  //
  // Layout B — everything on one line (short descriptions):
  //   "Basil (Cleaned, No Roots) 1 NOS 07031010 16 5 11 0 0 0 0 0 0 0 11"
  //
  // The numeric suffix is always: <qty> <UQC> <8-digit-HSN> <11 numbers>
  // We extract it from the END of the joined block text so both layouts work.
 
  // Matches the numeric suffix anywhere in a string
  const numericSuffixRegex =
    /^(.*?)\s*(\d+)\s+([A-Z]+)\s+(\d{8})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$/s;
 
  for (const block of itemBlocks) {
    // Join all raw lines for this item into one string
    const fullText = block.rawLines.join(" ").trim();
 
    const match = fullText.match(numericSuffixRegex);
 
    if (!match) {
      console.warn(`Warning: could not parse numeric fields for item ${block.srNo}: "${fullText}"`);
      continue;
    }
 
    // match[1] is everything before the numeric fields = description
    const numericFields = match;
    
 
    result.goods.push({
      description: match[1].trim(),
      dateOfInvoice,
      quantity: parseFloat(numericFields[2]),
      uqc: numericFields[3],
      hsnCode: numericFields[4],
      taxableValue: parseFloat(numericFields[5]),
      discount: parseFloat(numericFields[6]),
      netTaxableValue: parseFloat(numericFields[7]),
      cgstPercent: parseFloat(numericFields[8]),
      cgst: parseFloat(numericFields[9]),
      sgstPercent: parseFloat(numericFields[10]),
      sgst: parseFloat(numericFields[11]),
      cessPercent: parseFloat(numericFields[12]),
      cess: parseFloat(numericFields[13]),
      additionalCess: parseFloat(numericFields[14]),
      totalAmount: parseFloat(numericFields[15]),
    });
  }
 
  return result.goods;
}
