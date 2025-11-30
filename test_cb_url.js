const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testCasasBahiaURL() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Try /busca/ format
        const query = 'iphone 15';
        const url1 = `https://www.casasbahia.com.br/busca/${query}`;
        console.log(`Testing URL 1: ${url1}`);

        try {
            await page.goto(url1, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('URL 1 loaded');
            const title1 = await page.title();
            console.log('Title 1:', title1);
        } catch (e) {
            console.log('URL 1 failed:', e.message);
        }

        // Try /b format
        const url2 = `https://www.casasbahia.com.br/${query}/b`;
        console.log(`Testing URL 2: ${url2}`);

        try {
            await page.goto(url2, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('URL 2 loaded');
            const title2 = await page.title();
            console.log('Title 2:', title2);
        } catch (e) {
            console.log('URL 2 failed:', e.message);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }

    await browser.close();
}

testCasasBahiaURL();
