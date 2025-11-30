const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

async function dumpResults() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // FastShop
    try {
        console.log('Dumping FastShop Search...');
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto('https://site.fastshop.com.br/s/?q=iphone 15', { waitUntil: 'domcontentloaded', timeout: 60000 });
        const html = await page.content();
        fs.writeFileSync('fs_search_result.html', html);
        console.log('FastShop dump saved.');
    } catch (e) {
        console.error('FastShop Error:', e.message);
    }

    // Casas Bahia
    try {
        console.log('Dumping Casas Bahia Search...');
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto('https://www.casasbahia.com.br/busca/iphone 15', { waitUntil: 'domcontentloaded', timeout: 60000 });
        const html = await page.content();
        fs.writeFileSync('cb_search_result.html', html);
        console.log('Casas Bahia dump saved.');
    } catch (e) {
        console.error('Casas Bahia Error:', e.message);
    }

    await browser.close();
}

dumpResults();
