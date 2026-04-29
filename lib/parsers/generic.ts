import { chromium } from 'playwright'
import type { ParsedPlace } from './router'

export async function parseGenericUrl(url: string): Promise<ParsedPlace | null> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 })

    const jsonLd = await page.$$eval('script[type="application/ld+json"]',
      (els: Element[]) => els.map(el => {
        try { return JSON.parse(el.textContent ?? '') } catch { return null }
      }).filter(Boolean)
    )

    for (const schema of jsonLd) {
      if (schema['@type'] === 'LocalBusiness' || schema['@type'] === 'Restaurant' || schema['@type'] === 'CafeOrCoffeeShop') {
        const geo = schema.geo
        await browser.close()
        return {
          name: schema.name,
          address: schema.address?.streetAddress ?? schema.address,
          lat: geo?.latitude ? parseFloat(geo.latitude) : undefined,
          lng: geo?.longitude ? parseFloat(geo.longitude) : undefined,
          sourceUrl: url,
        }
      }
    }

    const ogTitle = await page.$eval('meta[property="og:title"]', (el: Element) => el.getAttribute('content')).catch(() => null)
    await browser.close()
    if (ogTitle) return { name: ogTitle, sourceUrl: url }
    return null
  } catch {
    await browser.close()
    return null
  }
}
