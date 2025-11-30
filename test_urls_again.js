const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testURLs() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Test Casas Bahia URL with dash
        console.log('Testing Casas Bahia (dash)...');
        try {
            await page.goto('https://www.casasbahia.com.br/iphone-15/b', { waitUntil: 'domcontentloaded', timeout: 30000 });
            const title = await page.title();
            console.log('CB Dash Title:', title);
            const content = await page.content();
            if (content.includes('Apple iPhone 15')) {
                console.log('CB Dash: Found "Apple iPhone 15"');
            } else {
                console.log('CB Dash: "Apple iPhone 15" NOT found');
            }
        } catch (e) {
            console.log('CB Dash Error:', e.message);
        }

        // Test Casas Bahia URL with query param
        console.log('Testing Casas Bahia (query param)...');
        try {
            await page.goto('https://www.casasbahia.com.br/b?strBusca=iphone+15', { waitUntil: 'domcontentloaded', timeout: 30000 });
            const title = await page.title();
            console.log('CB Query Title:', title);
            const content = await page.content();
            if (content.includes('Apple iPhone 15')) {
                console.log('CB Query: Found "Apple iPhone 15"');
            } else {
                console.log('CB Query: "Apple iPhone 15" NOT found');
            }
        } catch (e) {
            console.log('CB Query Error:', e.message);
        }

        // Test FastShop with wait
        console.log('Testing FastShop with wait...');
        try {
            await page.goto('https://site.fastshop.com.br/s/?q=iphone 15', { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Try to wait for something that looks like a product
            try {
                // Common selectors for products
                await page.waitForSelector('div[data-fs-product-card], div[class*="product-card"], a[href*="/p/"]', { timeout: 15000 });
                console.log('FastShop: Product selector found');
            } catch (e) {
                console.log('FastShop: Product selector timeout');
            }

            const content = await page.content();
            if (content.includes('iPhone 15')) {
                console.log('FastShop: Found "iPhone 15"');
            }

            // Dump FastShop HTML if successful
            const fs = require('fs');
            fs.writeFileSync('fs_wait_dump.html', content);

        } catch (e) {
            console.log('FastShop Error:', e.message);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }

    await browser.close();
}

testURLs();
