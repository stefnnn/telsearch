import { ElementHandle, Browser, Page } from "playwright";

/**
 * This will get the property of the element if you pass in a handle and the property desired.
 *
 * @param handle
 * @param property
 */
export async function getPropertyByHandle(
  handle: ElementHandle | null,
  property: string = ""
) {
  if (handle) {
    return await (await handle.getProperty(property)).jsonValue();
  } else {
    return null;
  }
}

/**
 * This will get the property with just the selector and the page or handle.
 * @param page
 * @param selector
 * @param property
 */
export async function getPropertyBySelector(
  handleOrPage: Page | ElementHandle | null,
  selector: string,
  property: string = ""
) {
  if (handleOrPage) {
    const handle = await handleOrPage.$(selector);
    if (handle) {
      return await (await handle.getProperty(property)).jsonValue();
    } else {
      return null;
    }
  } else {
    return null;
  }
}

export async function getBodyHtml(page: Page) {
  return await getPropertyByHandle(await page.$("body"), "innerHTML");
}

export async function getSelectorHtml(page: Page, selector: string) {
  return await getPropertyByHandle(await page.$(selector), "innerHTML");
}

export async function getSelectorText(page: Page, selector: string) {
  return await getPropertyByHandle(await page.$(selector), "innerText");
}

export async function setUpNewPage(
  browser: Browser,
  ignoreExcept: string,
  debug = false
) {
  const page = await browser.newPage();
  await page.route("**/*", (route) => {
    const request = route.request();
    const url = request.url();
    if (ignoreExcept && !url.startsWith(ignoreExcept)) {
      debug && console.log("Ignoring: ", url);
      route.abort();
    } else if (request.resourceType() === "image") {
      route.abort();
    } else route.continue();
  });
  return page;
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * scroll to end of page down to trigger loadMore behaviour
 * then wait for a specific url pattern to finish loading
 */
export async function scrollAndWaitFor(
  page: Page,
  {
    times,
    requestPattern,
    debug,
  }: { times: number; requestPattern: string; debug?: boolean }
) {
  for (let i = 0; i < times; ++i) {
    await page.evaluate(() => {
      window.scrollTo(0, window.document.body.scrollHeight);
    });
    await page.waitForEvent("response", (res) => {
      if (res.url().indexOf(requestPattern) >= 0) {
        debug && console.log("Received: ", res.url(), res.status());
        process.stdout.write(".");
        return true;
      } else {
        debug && console.log("Ignoring: ", res.url());
      }
    });
  }
  process.stdout.write("\n");
}
