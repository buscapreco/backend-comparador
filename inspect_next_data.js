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

        if (siteName === 'FastShop') {
            try {
                const pp = data.props.pageProps;
                if (pp.page && pp.page.sections) {
                    const sections = pp.page.sections;
                    for (const section of sections) {
                        if (section.name === 'FastshopProductGallery') {
                            console.log('Found FastshopProductGallery section');
                            console.log('Data keys:', Object.keys(section.data));
                            // Check for products in data
                            // Based on previous view_file, there was 'fastshopProductShelf' but it was configuration.
                            // Maybe the actual products are not in __NEXT_DATA__ but fetched via API?
                            // Or maybe they are in a different prop?

                            // Let's print the whole data object keys and some values if small
                            // console.log(JSON.stringify(section.data, null, 2)); 
                            // It was huge in view_file.

                            // Let's check if there is any array that looks like products
                            // The view_file showed "fastshopProductShelf" array with configs.
                            // Maybe "productGallery" key?
                        }
                    }
                }

                // Check if there is any other place for products
                // Maybe in 'globalSections'?
            } catch (e) {
                console.log('Error traversing FastShop data:', e.message);
            }
        } else if (siteName === 'Casas Bahia') {
            try {
                const pageProps = data.props.pageProps;
                if (pageProps.initialState && pageProps.initialState.search) {
                    const search = pageProps.initialState.search;
                    console.log('Search keys:', Object.keys(search));

                    if (search.products) {
                        console.log('Search.products keys:', Object.keys(search.products));
                        if (Array.isArray(search.products)) {
                            console.log('Search.products is array, length:', search.products.length);
                        } else {
                            // It might be an object with 'products' array
                            if (search.products.products) {
                                console.log('Found products array in search.products.products');
                            } else {
                                console.log('No products array in search.products');
                            }
                        }
                    }

                    // Check 'result' or similar
                    if (search.result) {
                        console.log('Found search.result');
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

inspectNextData('fs_search_result.html', 'FastShop');
inspectNextData('cb_search_result.html', 'Casas Bahia');
