const puppeteer = require('puppeteer-core');

async function scrapeOncoKB() {
  const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'; // Replace with the actual path

  // Launch browser
  const browser = await puppeteer.launch({ executablePath });

  try {
    // Create a new page
    const page = await browser.newPage();

    // Navigate to the OncoKB actionable genes page
    await page.goto('https://www.oncokb.org/actionableGenes');

    // Introduce a delay before processing the alteration node
    await page.waitForTimeout(10000);

    // Extract gene information
    const genes = await page.$$eval('.rt-tr', async (geneNodes) => {
      async function fetchData(geneName, alterationName,geneUrl, alterationNameUrl) {
        // Make XHR calls and wait for responses
        console.log(geneName);
        console.log(alterationName);

        const geneDataResponse = await fetch(`https://www.oncokb.org/api/private/utils/numbers/gene/${geneName}`);
        const geneData = await geneDataResponse.json();

        const variantDataResponse = await fetch(`https://www.oncokb.org/api/v1/variants/lookup?hugoSymbol=${geneName}&variant=${alterationName}`);
        const variantData = await variantDataResponse.json();

        return { geneName, geneData, alterationName, variantData };
      }

      const results = [];

      for (const geneNode of geneNodes) {
        const geneNameElement = geneNode.querySelector(':nth-child(2) > a');
        const alterationNode = geneNode.querySelector(':nth-child(3) a');

        if (geneNameElement && alterationNode) {
          const geneName = geneNameElement.textContent.trim();
          const geneURL = geneNameElement.getAttribute('href');

          const alterationName = alterationNode.textContent.trim();
          const alterationURL = alterationNode.getAttribute('href');

          // Check if the alteration text contains unwanted patterns
          if (!/Exon 19 in-frame deletions/.test(alterationName)) {
            console.log(geneURL);
            console.log(alterationURL);

            // Use page parameter from outer scope
            const fetchDataResult = await fetchData(geneName,alterationName,geneURL, alterationURL);

            results.push({ geneName, alterationName, geneURL, alterationURL, fetchDataResult });
            // Break out of the loop after the first iteration
            break;
          }
        }
      }

      return results;
    });

    return genes;
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the scraper
// Run the scraper
scrapeOncoKB().then((result) => {
    console.log(JSON.stringify(result, null, 2));
  });
