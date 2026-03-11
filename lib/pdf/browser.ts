import type { Browser } from 'puppeteer-core';

let browserInstance: Browser | null = null;

export async function launchBrowser(): Promise<Browser> {
  if (browserInstance) {
    try {
      await browserInstance.version();
      return browserInstance;
    } catch {
      browserInstance = null;
    }
  }

  if (process.env.NODE_ENV === 'development' || !process.env.CHROMIUM_BINARY_URL) {
    const puppeteer = await import('puppeteer');
    browserInstance = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } else {
    const puppeteer = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium-min');

    const executablePath = await chromium.default.executablePath(
      process.env.CHROMIUM_BINARY_URL
    );

    browserInstance = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: { width: 794, height: 1123 },
      executablePath,
      headless: true,
    });
  }

  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
