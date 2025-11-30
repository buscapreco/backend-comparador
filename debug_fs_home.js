const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

async function debugHome() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // FastShop Home Dump
    try {
        console.log('Dumping FastShop Home...');
        const pageFS = await browser.newPage();
        await pageFS.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await pageFS.goto('https://www.fastshop.com.br', { waitUntil: 'domcontentloaded', timeout: 60000 });
        const htmlFS = await pageFS.content();
        fs.writeFileSync('fs_home.html', htmlFS);
        console.log('FastShop Home dumped.');
    } catch (e) {
        console.error('FastShop Error:', e.message);
    }

    // Casas Bahia Result Dump (via navigation)
    try {
        console.log('Navigating and Dumping Casas Bahia...');
        const pageCB = await browser.newPage();
        await pageCB.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await pageCB.goto('https://www.casasbahia.com.br', { waitUntil: 'domcontentloaded', timeout: 60000 });

        const searchInputSelector = '#search-form-input, input[type="search"], input[name="strBusca"]';
        await pageCB.waitForSelector(searchInputSelector, { timeout: 10000 });
        await pageCB.type(searchInputSelector, 'iphone 15');
        await pageCB.keyboard.press('Enter');

        await pageCB.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait a bit for dynamic content
        await new Promise(r => setTimeout(r, 5000));

        const htmlCB = await pageCB.content();
        fs.writeFileSync('cb_result.html', htmlCB);
        console.log('Casas Bahia Result dumped.');
    } catch (e) {
        console.error('Casas Bahia Error:', e.message);
    }

    await browser.close();
}

debugHome();
