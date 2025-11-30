const puppeteer = require('puppeteer');

async function debugScrapers() {
    const query = 'iphone 15';
    console.log(`Debugging scrapers for query: ${query}`);

    // Mercado Livre Debug
    console.log('\n--- Mercado Livre ---');
    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://lista.mercadolivre.com.br/${query}`, { waitUntil: 'domcontentloaded' });

        const results = await page.evaluate(() => {
            const items = document.querySelectorAll('.ui-search-layout__item');
            return Array.from(items).map(item => {
                const title = item.querySelector('.ui-search-item__title')?.innerText;
                const price = item.querySelector('.andes-money-amount__fraction')?.innerText;
                return { title, price };
            });
        });
        console.log(`Found ${results.length} items.`);
        if (results.length > 0) console.log('First item:', results[0]);
        await browser.close();
    } catch (e) {
        console.error('ML Error:', e.message);
    }

    // Amazon Debug
    console.log('\n--- Amazon ---');
    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.amazon.com.br/s?k=${query}`, { waitUntil: 'domcontentloaded' });

        const results = await page.evaluate(() => {
            const items = document.querySelectorAll('[data-component-type="s-search-result"]');
            return Array.from(items).map(item => {
                const title = item.querySelector('h2 a span')?.innerText;
                const price = item.querySelector('.a-price-whole')?.innerText;
                return { title, price };
            });
        });
        console.log(`Found ${results.length} items.`);
        if (results.length > 0) console.log('First item:', results[0]);
        await browser.close();
    } catch (e) {
        console.error('Amazon Error:', e.message);
    }
}

debugScrapers();
