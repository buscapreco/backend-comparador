const fs = require('fs');

function analyze(filename) {
    console.log(`Analyzing ${filename}...`);
    const content = fs.readFileSync(filename, 'utf8');
    console.log('Content length:', content.length);

    if (content.toLowerCase().includes('iphone')) {
        console.log('Found "iphone"');
        const index = content.toLowerCase().indexOf('iphone');
        console.log('Snippet:', content.substring(index - 50, index + 100));
    } else {
        console.log('"iphone" NOT found');
    }
}

analyze('fs_search_result.html');
analyze('cb_search_result.html');
