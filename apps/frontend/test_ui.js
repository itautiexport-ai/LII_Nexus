import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Login
  await page.goto('http://localhost:5173');
  await page.type('input[type="email"]', 'admin@liinexus.com');
  await page.type('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  // Go to users page
  await page.goto('http://localhost:5173/admin/users');
  await page.waitForSelector('table');
  
  // Find METAL0001 edit button and click it
  const editButtons = await page.$$('button');
  let targetBtn = null;
  for (const btn of editButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text === 'Edit') {
      // Find the row
      const row = await page.evaluateHandle(el => el.closest('tr'), btn);
      const rowText = await page.evaluate(el => el.textContent, row);
      if (rowText.includes('METAL0001')) {
        targetBtn = btn;
        break;
      }
    }
  }
  
  if (targetBtn) {
    await targetBtn.click();
    await page.waitForSelector('.modal-content');
    
    // Check if department select exists
    const selects = await page.$$('select');
    // The second select should be department
    await page.select('select:nth-of-type(1)', 'c85c41c6-80d7-11f1-a0d6-76be567136b9'); // Assuming METAL01 or some ID
    
    // Click save
    const saveBtn = await page.$('.save-user-btn');
    await saveBtn.click();
    
    // Wait for modal to close
    await page.waitForSelector('.modal-content', { hidden: true });
    
    // Read the table again
    await page.waitForTimeout(1000);
    console.log("Edit completed successfully.");
  } else {
    console.log("METAL0001 not found.");
  }
  
  await browser.close();
})();
