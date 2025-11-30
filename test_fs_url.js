const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testFastShopURL() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const query = 'iphone 15';
        const url = `https://site.fastshop.com.br/s/?q=${query}`;
        console.log(`Testing URL: ${url}`);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('Page loaded');

        // Check if we have results
        const title = await page.title();
        console.log('Page Title:', title);

        const content = await page.content();
        if (content.includes('iphone') || content.includes('iPhone')) {
            console.log('Found "iphone" in content');
        } else {
            console.log('"iphone" not found in content');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }

    await browser.close();
}

testFastShopURL();
