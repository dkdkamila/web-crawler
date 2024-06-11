const axios = require('axios');
const cheerio = require('cheerio');
const robotsParser = require('robots-parser');

const crawledUrls = new Set();
const delayMs = 1000;
// funktion för fördröjning för att inte överbelasta sidan
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// funktion för att kolla om crawl är tillåtet
async function isAllowedToCrawl(url) {
    const { origin } = new URL(url);
    const robotsUrl = `${origin}/robots.txt`;

    try {
        const { data } = await axios.get(robotsUrl);
        const robots = robotsParser(robotsUrl, data);
        return robots.isAllowed(url);
    } catch (error) {
        return true; // Om det inte går att hämta robots.txt, antar vi att det är tillåtet.
    }
}
// funktion för crawl
async function crawl(url) {
    if (crawledUrls.has(url)) {
        return;
    }
    crawledUrls.add(url);

    if (!await isAllowedToCrawl(url)) {
        console.log(`Blockerad av robots.txt: ${url}`);
        return;
    }

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const pageTitle = $('title').text();
        const metaDescription = $('meta[name="description"]').attr('content');

        console.log(`URL: ${url}`);
        console.log(`Titel: ${pageTitle}`);
        console.log(`Beskrivning: ${metaDescription}`);
        console.log(`-----------------------------`);

        const links = [];
        $('a').each((index, element) => {
            const link = $(element).attr('href');
            if (link && link.startsWith('http')) {
                links.push(link);
            }
        });

        console.log(`Hittade ${links.length} länkar på ${url}`);
        console.log(links);

        for (const link of links) {
            await delay(delayMs); // Fördröjning mellan begäran
            await crawl(link);
        }
    } catch (error) {
        console.error(`Kunde inte hämta ${url}: ${error.message}`);
    }
}

const url = 'https://din adress du vill crawla'; // Ersätt med URL:en du vill crawla
crawl(url);
