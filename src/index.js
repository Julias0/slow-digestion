import fs from "fs";
import { PDFParse } from "pdf-parse";
import { parseInvoicePDF } from "./swiggy_receipt_parse.js";
import { parseLiciousData } from "./licious_parse.js";
import _ from "lodash";

async function processReceipts() {
    const files = fs.readdirSync("./receipts").filter(file => file.endsWith(".pdf"));
    const receiptDataPromises = files.map((file) => {
        const filePath = `./receipts/${file}`;
        const invoiceData = parseInvoicePDF(filePath);
        return invoiceData;
    });

    const receiptData = await Promise.all(receiptDataPromises);
    const combinedData = receiptData.reduce((acc, data) => acc.concat(data), [])

    return combinedData;
}

async function swiggyOrderSummaryParse() {
    const dataBuffer = fs.readFileSync('./order_summary.pdf');
    const pdf = new PDFParse({ data: dataBuffer });
    const data = await pdf.getText({ parseHyperlinks: true });
    const hyperlinksRegex = /https?:\/\/[^\s]+/g;
    const hyperlinks = data.text.match(hyperlinksRegex);

    const filePromises = hyperlinks.flat()
        .map(hyperlink => fetch(hyperlink.replace(/[)\]\}>.,]+$/, '').trim(), {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/pdf",
                "Referer": "https://www.swiggy.com/"
            }
        }));

    const responses = await Promise.all(filePromises);
    const fileWrites = responses.map(async (res, i) => {
        if (!res.ok) {
            throw new Error(`Failed ${i}: ${res.status}`);
        }

        const buffer = Buffer.from(await res.arrayBuffer());
        await fs.promises.writeFile(`./receipts/${i}.pdf`, buffer);
    });

    await Promise.all(fileWrites);

    const combinedData = await processReceipts();

    const tempReceiptFiles = fs.readdirSync("./receipts").filter(file => file.endsWith(".pdf"));
    tempReceiptFiles.forEach(file => fs.unlinkSync(`./receipts/${file}`));
    return combinedData;
}

function mapHSNChapter(firstTwoDigits) {
    if (firstTwoDigits >= 1 && firstTwoDigits<= 5) return "Live animals; animal products";
    if (firstTwoDigits >= 6 && firstTwoDigits<= 14) return "Vegetable products";
    if (firstTwoDigits === 15) return "Animal or vegetable fats and oils";
    if (firstTwoDigits >= 16 && firstTwoDigits<= 24) return "Prepared foodstuffs; beverages, spirits, tobacco";
    if (firstTwoDigits >= 25 && firstTwoDigits<= 27) return "Mineral products";
    if (firstTwoDigits >= 28 && firstTwoDigits<= 38) return "Products of chemical or allied industries";
    if (firstTwoDigits >= 39 && firstTwoDigits<= 40) return "Plastics and articles thereof; rubber and articles thereof";
    if (firstTwoDigits >= 41 && firstTwoDigits<= 43) return "Raw hides and skins, leather, furskins";
    if (firstTwoDigits >= 44 && firstTwoDigits<= 46) return "Wood and articles of wood";
    if (firstTwoDigits >= 47 && firstTwoDigits<= 49) return "Pulp of wood, paper and paperboard";
    if (firstTwoDigits >= 50 && firstTwoDigits<= 63) return "Textiles and textile articles";
    if (firstTwoDigits >= 64 && firstTwoDigits<= 67) return "Footwear, headgear, umbrellas";
    if (firstTwoDigits >= 68 && firstTwoDigits<= 70) return "Articles of stone, plaster, cement, asbestos, mica, ceramic products, glass and glassware";
    if (firstTwoDigits === 71) return" Natural/cultured pearls, precious or semi-precious stones, precious metals";
    if (firstTwoDigits >= 72 && firstTwoDigits<= 83) return "Base metals and articles of base metal";
    if (firstTwoDigits >= 84 && firstTwoDigits<= 85) return "Machinery and mechanical appliances; electrical equipment";
    if (firstTwoDigits >= 86 && firstTwoDigits<= 89) return "Vehicles, aircraft, vessels and associated transport equipment";
    if (firstTwoDigits >= 90 && firstTwoDigits<= 92) return "Optical, photographic, cinematographic, measuring, checking, precision, medical instruments";
    if (firstTwoDigits === 93) return "Arms and ammunition";
    if (firstTwoDigits >= 94 && firstTwoDigits<= 96) return "Miscellaneous manufactured articles";
    if (firstTwoDigits >= 97 && firstTwoDigits<= 98) return "Works of art, collectors' pieces and antiques";
}

async function main() {
    // const swiggyData = await swiggyOrderSummaryParse();

    // const liciousData = parseLiciousData();

    // const allData = [...swiggyData];
    // fs.writeFileSync("./output/parsed_receipts.json", JSON.stringify(allData, null, 2));
    const data = fs.readFileSync("./output/parsed_receipts.json", "utf-8");
    const parsedData = JSON.parse(data);

    

    const categorized = parsedData.map(item => ({
        ...item,
        category: mapHSNChapter(parseInt(item.hsnCode.substring(0, 2))) || "General Grocery"
    }));

    const groupedByCategory = _.groupBy(categorized, "category");
    const aggregateByCategory = _.mapValues(groupedByCategory, items => ({
        totalAmount: _.floor(_.sumBy(items, item => parseFloat(item.totalAmount))),
        count: _.uniq(items.map(item => item.description)).length,
        items: _.uniq(items.map(item => item.description))
    }));

    const highSpendCategories = Object.entries(aggregateByCategory)
                                    .filter(([_, value]) => value.totalAmount > 1000)
                                    .map(([key, _]) => { return { category: key, totalAmount: aggregateByCategory[key].totalAmount, count: aggregateByCategory[key].count, items: aggregateByCategory[key].items } });

    console.log("High Spend Categories:", highSpendCategories);


}

main();