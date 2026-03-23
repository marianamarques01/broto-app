/**
 * Gera pitch-tcc-broto-dark.pdf a partir de ../pitch-tcc-broto.html (tema escuro).
 * Uso: cd docs && npm exec playwright install chromium && node scripts/export-pitch-pdf.mjs
 */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, "..");
const htmlPath = path.join(docsDir, "pitch-tcc-broto.html");
const pdfPath = path.join(docsDir, "pitch-tcc-broto-dark.pdf");
const url = `file://${htmlPath}`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: "load", timeout: 120_000 });
await page.evaluate(() => {
  document.documentElement.setAttribute("data-theme", "dark");
});
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: pdfPath,
  printBackground: true,
  format: "A4",
  landscape: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});
await browser.close();
console.log("PDF:", pdfPath);
