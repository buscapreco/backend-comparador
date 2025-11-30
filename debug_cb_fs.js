const puppeteer = require('puppeteer');

async function debugCasasBahiaAndFastShop() {
    const query = 'iphone 15';
    console.log(`Debugging Casas Bahia and FastShop for: ${query}`);

    // Casas Bahia
    console.log('\n--- Casas Bahia ---');
    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.casasbahia.com.br/${query}/b`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Log some HTML to see what we're dealing with
        const htmlSnippet = await page.evaluate(() => {
            const body = document.body.innerHTML;
            return body.substring(0, 1000); // First 1000 chars
        });
        // console.log('HTML Snippet:', htmlSnippet);

        const results = await page.evaluate(() => {
            // Try to find product cards
            const cards = document.querySelectorAll('[data-testid="product-card"]');
            const genericCards = document.querySelectorAll('.product-card');

            return {
                dataTestIdCount: cards.length,
                genericClassCount: genericCards.length,
                sample: cards.length > 0 ? {
                    title: cards[0].querySelector('[data-testid="product-title"]')?.innerText,
                    price: cards[0].querySelector('[data-testid="product-price-value"]')?.innerText
                } : 'No cards found'
            };
        });
        console.log('Results:', results);
        await browser.close();
    } catch (e) {
        console.error('Casas Bahia Error:', e.message);
    }

    // FastShop
    console.log('\n--- FastShop ---');
    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.fastshop.com.br/web/s/${query}`, { waitUntil: 'networkidle2', timeout: 45000 });

        const results = await page.evaluate(() => {
            const cards = document.querySelectorAll('[class*="product-card"]');
            const titles = document.querySelectorAll('[class*="title"]');

            return {
                cardCount: cards.length,
                titleCount: titles.length,
                sample: cards.length > 0 ? cards[0].innerText : 'No cards'
            };
        });
        console.log('Results:', results);
        await browser.close();
    } catch (e) {
        console.error('FastShop Error:', e.message);
    }
}

debugCasasBahiaAndFastShop();
