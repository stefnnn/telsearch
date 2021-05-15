import { config } from "dotenv";
import { chromium } from "playwright";
import { setUpNewPage, scrollAndWaitFor } from "./lib/playlib.js";

// read .env file into process.env
config();

const url = process.env.URL;
const debug = process.env.DEBUG?.toLowerCase() === "true";
debug && console.log("Debug=TRUE");

export async function telSearch(name: string, where?: string) {
  const browser = await chromium.launch({
    headless: !debug,
    slowMo: 0,
    chromiumSandbox: false,
  });
  const page = await setUpNewPage(browser, "https://tel.search.ch", debug);
  page.setDefaultTimeout(2000);
  await page.goto(url);
  if (name) await page.fill("input.tel-feedback[name='was']", name);
  if (where) await page.fill("input.tel-feedback[name='wo']", where);
  debug && console.log("SEARCH", page.url());
  await page.click(".tel-submit-col > input");

  let response: any = null;

  await page.waitForEvent("response", async (res) => {
    if (res.request().url().indexOf("feedback.php") >= 0) {
      debug && console.log("Got Feedback.php", await res.json());
      response = await res.json();
      return true;
    }
  });
  const count = (response?.count as number) || 0;
  if (count === 0) {
    console.log("Nothing found...");
    await browser.close();
    process.exit(1);
  } else {
    console.log(`Found ${count} entries...`);
  }

  const times = Math.min(Math.ceil(count / 10), 19);
  await scrollAndWaitFor(page, {
    times,
    requestPattern: "loadmore",
    debug,
  });

  // Extract the results from the page.
  const resultsSelector = "article.tel-resultentry > table.tel-resultentry";
  const entries = await page.evaluate((resultsSelector) => {
    const results = Array.from(document.querySelectorAll(resultsSelector));
    return results.map((result) => {
      const titleEl = result.getElementsByTagName("h1")[0];
      const name = (titleEl as HTMLElement)?.innerText;
      const telEl = result.getElementsByClassName("tel-result-action")[0];
      const tel = (telEl as HTMLElement)?.innerText.replace(/\s*\*/, "");
      return { name, tel };
    });
  }, resultsSelector);
  entries.forEach((e, i) => {
    console.log(`${i + 1}) ${e.name}: ${e.tel}`);
  });
  await browser.close();
}

const [a, b, name, where] = process.argv;
console.log(
  `Searching for ${name || "everyone"} in ${where || "everywhere"}\n`
);

telSearch(name, where);
