const fs = require('fs');

function inspectCBProducts(filename) {
    console.log(`\n--- Inspecting Casas Bahia Products ---`);
    try {
        const html = fs.readFileSync(filename, 'utf8');
        const startMarker = '<script id="__NEXT_DATA__" type="application/json"';
        const endMarker = '</script>';
        let startIndex = html.indexOf(startMarker);
        if (startIndex === -1) {
            const altMarker = '<script id="__NEXT_DATA__"';
            startIndex = html.indexOf(altMarker);
        }
        const openTagEnd = html.indexOf('>', startIndex);
        const scriptContentStart = openTagEnd + 1;
        const scriptContentEnd = html.indexOf(endMarker, scriptContentStart);
        const scriptContent = html.substring(scriptContentStart, scriptContentEnd);
        const data = JSON.parse(scriptContent);

        const products = data.props.pageProps.initialState.search.results.products;

        products.slice(0, 5).forEach((p, i) => {
            console.log(`\nProduct ${i}:`);
            console.log('Title:', p.title); // It was "Busca" before, maybe "name"?
            console.log('Name:', p.name); // Check if 'name' exists
            console.log('ID:', p.id);
            console.log('Price:', p.price); // Check if 'price' exists
            console.log('Prices:', p.prices); // Check if 'prices' exists
            console.log('Keys:', Object.keys(p));
        });

    } catch (e) {
        console.error('Error:', e.message);
    }
}

inspectCBProducts('cb_search_result.html');
