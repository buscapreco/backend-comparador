const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

async function dumpHTML() {
    const query = 'iphone 15';
    console.log(`Dumping HTML for Casas Bahia and FastShop...`);

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

    // Casas Bahia
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto(`https://www.casasbahia.com.br/${query}/b`, { waitUntil: 'networkidle2', timeout: 60000 });
        const html = await page.content();
        fs.writeFileSync('cb_dump.html', html);
        console.log('Casas Bahia dump saved.');
    } catch (e) {
        console.error('CB Error:', e.message);
    }

    // FastShop
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto(`https://www.fastshop.com.br/web/s/${query}`, { waitUntil: 'networkidle2', timeout: 60000 });
        const html = await page.content();
        fs.writeFileSync('fs_dump.html', html);
        console.log('FastShop dump saved.');
    } catch (e) {
        console.error('FS Error:', e.message);
    }

    await browser.close();
}

dumpHTML();
