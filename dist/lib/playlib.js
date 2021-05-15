var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * This will get the property of the element if you pass in a handle and the property desired.
 *
 * @param handle
 * @param property
 */
export function getPropertyByHandle(handle, property = "") {
    return __awaiter(this, void 0, void 0, function* () {
        if (handle) {
            return yield (yield handle.getProperty(property)).jsonValue();
        }
        else {
            return null;
        }
    });
}
/**
 * This will get the property with just the selector and the page or handle.
 * @param page
 * @param selector
 * @param property
 */
export function getPropertyBySelector(handleOrPage, selector, property = "") {
    return __awaiter(this, void 0, void 0, function* () {
        if (handleOrPage) {
            const handle = yield handleOrPage.$(selector);
            if (handle) {
                return yield (yield handle.getProperty(property)).jsonValue();
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    });
}
export function getBodyHtml(page) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getPropertyByHandle(yield page.$("body"), "innerHTML");
    });
}
export function getSelectorHtml(page, selector) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getPropertyByHandle(yield page.$(selector), "innerHTML");
    });
}
export function getSelectorText(page, selector) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getPropertyByHandle(yield page.$(selector), "innerText");
    });
}
export function setUpNewPage(browser, ignoreExcept, debug = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const page = yield browser.newPage();
        yield page.route("**/*", (route) => {
            const request = route.request();
            const url = request.url();
            if (ignoreExcept && !url.startsWith(ignoreExcept)) {
                debug && console.log("Ignoring: ", url);
                route.abort();
            }
            else if (request.resourceType() === "image") {
                route.abort();
            }
            else
                route.continue();
        });
        return page;
    });
}
export function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
/**
 * scroll to end of page down to trigger loadMore behaviour
 * then wait for a specific url pattern to finish loading
 */
export function scrollAndWaitFor(page, { times, requestPattern, debug, }) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < times; ++i) {
            yield page.evaluate(() => {
                window.scrollTo(0, window.document.body.scrollHeight);
            });
            yield page.waitForEvent("response", (res) => {
                if (res.url().indexOf(requestPattern) >= 0) {
                    debug && console.log("Received: ", res.url(), res.status());
                    process.stdout.write(".");
                    return true;
                }
                else {
                    debug && console.log("Ignoring: ", res.url());
                }
            });
        }
        process.stdout.write("\n");
    });
}
