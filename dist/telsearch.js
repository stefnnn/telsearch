var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
import { config } from "dotenv";
import { chromium } from "playwright";
import { setUpNewPage, scrollAndWaitFor } from "./lib/playlib.js";
// read .env file into process.env
config();
const url = process.env.URL;
const debug = ((_a = process.env.DEBUG) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "true";
debug && console.log("Debug=TRUE");
export function telSearch(name, where) {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield chromium.launch({ headless: !debug, slowMo: 0 });
        const page = yield setUpNewPage(browser, "https://tel.search.ch", debug);
        page.setDefaultTimeout(2000);
        yield page.goto(url);
        if (name)
            yield page.fill("input.tel-feedback[name='was']", name);
        if (where)
            yield page.fill("input.tel-feedback[name='wo']", where);
        debug && console.log("SEARCH", page.url());
        yield page.click(".tel-submit-col > input");
        let response = null;
        yield page.waitForEvent("response", (res) => __awaiter(this, void 0, void 0, function* () {
            if (res.request().url().indexOf("feedback.php") >= 0) {
                debug && console.log("Got Feedback.php", yield res.json());
                response = yield res.json();
                return true;
            }
        }));
        const count = (response === null || response === void 0 ? void 0 : response.count) || 0;
        if (count === 0) {
            console.log("Nothing found...");
            process.exit(1);
        }
        else {
            console.log(`Found ${count} entries...`);
        }
        const times = Math.min(Math.ceil(count / 10), 19);
        yield scrollAndWaitFor(page, {
            times,
            requestPattern: "loadmore",
            debug,
        });
        // Extract the results from the page.
        const resultsSelector = "article.tel-resultentry > table.tel-resultentry";
        const entries = yield page.evaluate((resultsSelector) => {
            const results = Array.from(document.querySelectorAll(resultsSelector));
            return results.map((result) => {
                var _a, _b;
                const titleEl = result.getElementsByTagName("h1")[0];
                const name = (_a = titleEl) === null || _a === void 0 ? void 0 : _a.innerText;
                const telEl = result.getElementsByClassName("tel-result-action")[0];
                const tel = (_b = telEl) === null || _b === void 0 ? void 0 : _b.innerText.replace(/\s*\*/, "");
                return { name, tel };
            });
        }, resultsSelector);
        entries.forEach((e, i) => {
            console.log(`${i + 1}) ${e.name}: ${e.tel}`);
        });
        yield browser.close();
    });
}
const [a, b, name, where] = process.argv;
console.log(`Searching for ${name || "everyone"} in ${where || "everywhere"}\n`);
telSearch(name, where);
