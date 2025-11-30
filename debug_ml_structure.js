const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugMLStructure() {
    const query = 'iphone 15';
    console.log(`Debugging ML Structure for: ${query}`);

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`https://lista.mercadolivre.com.br/${query}`, { waitUntil: 'domcontentloaded' });

    const structure = await page.evaluate(() => {
        const item = document.querySelector('.ui-search-layout__item');
        if (!item) return 'No item found';

        // Recursive function to get class names
        function getStructure(el, depth = 0) {
            if (depth > 3) return '';
            let str = `${'  '.repeat(depth)}<${el.tagName.toLowerCase()} class="${el.className}">\n`;
            Array.from(el.children).forEach(child => {
                str += getStructure(child, depth + 1);
            });
            return str;
        }

        return getStructure(item);
    });

    console.log(structure);
    await browser.close();
}

debugMLStructure();
