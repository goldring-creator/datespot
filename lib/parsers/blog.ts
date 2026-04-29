import { chromium } from 'playwright'
import type { ParsedPlace } from './router'

export async function parseBlogUrl(url: string): Promise<ParsedPlace | null> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })

    if (url.includes('blog.naver.com')) {
      const frame = page.frame({ name: 'mainFrame' }) ?? page
      const mapLink = await frame.$('a[href*="map.naver.com"], a[href*="kko.to"]')
      if (mapLink) {
        const href = await mapLink.getAttribute('href')
        if (href) {
          await browser.close()
          const { parseUrl } = await import('./router')
          return parseUrl(href)
        }
      }
    }

    const mapLinks = await page.$$eval(
      'a[href*="map.naver.com"], a[href*="map.kakao.com"], a[href*="kko.to"]',
      (els: Element[]) => els.map(el => el.getAttribute('href')).filter(Boolean)
    )
    if (mapLinks.length > 0) {
      await browser.close()
      const { parseUrl } = await import('./router')
      return parseUrl(mapLinks[0] as string)
    }

    const bodyText = await page.$eval('article, .se-main-container, #postViewArea, body',
      (el: Element) => el.textContent?.slice(0, 2000) ?? ''
    ).catch(() => '')

    await browser.close()
    return extractPlaceFromText(bodyText, url)
  } catch {
    await browser.close()
    return null
  }
}

function extractPlaceFromText(text: string, sourceUrl: string): ParsedPlace | null {
  const pinMatch = text.match(/📍\s*([^\n]{2,30})/)
  if (pinMatch) return { name: pinMatch[1].trim(), sourceUrl }

  const addrMatch = text.match(/서울\s+\S+구\s+\S+/)
  if (addrMatch) return { address: addrMatch[0], name: addrMatch[0], sourceUrl }

  return null
}
