import fs from 'fs';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

async function parse() {
  const data = new Uint8Array(fs.readFileSync('apps/backend/uploads/7c6d7e7f-4c47-4ae5-a10a-b52fe75252cc.pdf'));
  const pdf = await pdfjsLib.getDocument({data}).promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  console.log(content.items.map(item => item.str).join(' '));
}
parse().catch(console.error);
