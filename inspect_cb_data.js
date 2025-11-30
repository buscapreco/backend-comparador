const fs = require('fs');

function inspectNextData(filename, siteName) {
    console.log(`\n--- Inspecting ${siteName} (${filename}) ---`);
    try {
        const html = fs.readFileSync(filename, 'utf8');

        const startMarker = '<script id="__NEXT_DATA__" type="application/json"';
        const endMarker = '</script>';

        let startIndex = html.indexOf(startMarker);
        if (startIndex === -1) {
            const altMarker = '<script id="__NEXT_DATA__"';
            startIndex = html.indexOf(altMarker);
        }

        if (startIndex === -1) {
            console.log('__NEXT_DATA__ script not found.');
            return;
        }

        const openTagEnd = html.indexOf('>', startIndex);
        const scriptContentStart = openTagEnd + 1;
        const scriptContentEnd = html.indexOf(endMarker, scriptContentStart);
        const scriptContent = html.substring(scriptContentStart, scriptContentEnd);
        const data = JSON.parse(scriptContent);

        if (siteName === 'Casas Bahia') {
            try {
                const pageProps = data.props.pageProps;
                if (pageProps.initialState && pageProps.initialState.search) {
                    const search = pageProps.initialState.search;
                    if (search.results) {
                        const results = search.results;
                        console.log('Results keys:', Object.keys(results));
                        if (results.products) {
                            console.log('Found products in results.products');
                            console.log('Count:', results.products.length);
                            if (results.products.length > 0) {
                                console.log('First product:', JSON.stringify(results.products[0], null, 2));
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('Error traversing Casas Bahia data:', e.message);
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

inspectNextData('cb_search_result.html', 'Casas Bahia');
