const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log('Inspecting Kabum...');
        await page.goto('https://www.kabum.com.br/busca/iphone+13', { waitUntil: 'domcontentloaded', timeout: 30000 });

        const kabumItems = await page.evaluate(() => {
            const items = [];
            // Kabum usually uses article or div for products
            const cards = document.querySelectorAll('article.productCard, div.productCard, article');

            cards.forEach(card => {
                if (items.length >= 3) return;
                items.push({
                    html: card.outerHTML.substring(0, 200),
                    text: card.innerText.substring(0, 100)
                });
            });
            return items;
        });
        console.log('Kabum:', kabumItems);

    } catch (e) { console.error(e); }

    await browser.close();
})();
