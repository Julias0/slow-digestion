import fs from 'fs';
import PDFParse from 'pdf-parse';
import { parseInvoicePDF } from './swiggy_receipt_parse';

const hsnChapterMap = new Map([
    [1, "Live animals; animal products"],
    [2, "Vegetable products"],
    [3, "Animal or vegetable fats and oils"],
    [4, "Prepared foodstuffs; beverages, spirits, tobacco"],
    [5, "Mineral products"],
    [6, "Products of chemical or allied industries"],
    [7, "Plastics and articles thereof; rubber and articles thereof"],
    [8, "Raw hides and skins, leather, furskins"],
    [9, "Wood and articles of wood"],
    [10, "Pulp of wood, paper and paperboard"],
    [11, "Textiles and textile articles"],
    [12, "Footwear, headgear, umbrellas"],
    [13, "Articles of stone, plaster, cement, asbestos, mica, ceramic products, glass and glassware"],
    [14, "Natural/cultured pearls, precious or semi-precious stones, precious metals"],
    [15, "Base metals and articles of base metal"],
    [16, "Machinery and mechanical appliances; electrical equipment"],
    [17, "Vehicles, aircraft, vessels and associated transport equipment"],
    [18, "Optical, photographic, cinematographic, measuring, checking, precision, medical instruments"],
    [19, "Arms and ammunition"],
    [20, "Miscellaneous manufactured articles"],
    [21, "Works of art, collectors' pieces and antiques"]
]);

function mapHSNChapter(firstTwoDigits) {
    return hsnChapterMap.get(parseInt(firstTwoDigits)) || "General Grocery";
}

async function processReceipts() {
    try {
        const files = fs.readdirSync("./receipts").filter(file => file.endsWith(".pdf"));
        const receiptDataPromises = files.map((file) => {
            const filePath = `./receipts/${file}`;
            return parseInvoicePDF(filePath);
        });

        const receiptData = await Promise.all(receiptDataPromises);
        const combinedData = receiptData.reduce((acc, data) => acc.concat(data), []);
        console.log("Combined Data:", combinedData);
    } catch (error) {
        console.error("Error processing receipts:", error);
    }
}

async function swiggyOrderSummaryParse() {
    try {
        const dataBuffer = fs.readFileSync('./order_summary.pdf');
        const pdf = new PDFParse({ data: dataBuffer });
        const data = await pdf.getText({ parseHyperlinks: true });
        const hyperlinksRegex = /https?:\/\/[^\s]+/g;
        const hyperlinks = data.text.match(hyperlinksRegex);

        const filePromises = hyperlinks.flat()
            .map(hyperlink => fetch(hyperlink.replace(/[)\]\}>.,]+$/, '').trim(), {
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json());

        const parsedData = await Promise.all(filePromises);
        console.log("Parsed Data:", parsedData);
    } catch (error) {
        console.error("Error parsing order summary:", error);
    }
}

async function main() {
    try {
        // Uncomment the following lines to process receipts
        // await processReceipts();

        // Uncomment the following lines to parse Licious data
        // const liciousData = await parseLiciousData();
        // fs.writeFileSync("./output/parsed_receipts.json", JSON.stringify(licesData, null, 2));
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main();
