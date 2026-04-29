import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
import type { ParsedPlace } from './router'

const COOKIES_PATH = process.env.INSTAGRAM_COOKIES_PATH
  ?? path.join(process.env.HOME!, '.instagram/goldpic__/cookies.json')

export async function parseInstagramUrl(url: string): Promise<ParsedPlace | null> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  if (fs.existsSync(COOKIES_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'))
    await context.addCookies(cookies)
  }

  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })

    // 1. 위치 태그
    const locationEl = await page.$('[data-testid="location-name"], a[href*="/explore/locations/"]')
    if (locationEl) {
      const locationText = await locationEl.innerText()
      if (locationText.trim()) {
        await browser.close()
        return { name: locationText.trim(), sourceUrl: url, instagramUrl: url }
      }
    }

    // 2. 캡션에서 📍 파싱
    const caption = await page.$eval(
      '[data-testid="post-comment-root"] span, article span',
      (el: Element) => el.textContent ?? '',
    ).catch(() => '')

    const pinMatch = caption.match(/📍\s*([^\n#@]+)/)
    if (pinMatch) {
      await browser.close()
      return { name: pinMatch[1].trim(), sourceUrl: url, instagramUrl: url }
    }

    // 3. Claude Vision fallback
    const imgSrc = await page.$eval('article img', (el: HTMLImageElement) => el.src).catch(() => null)
    if (imgSrc) {
      const place = await extractPlaceFromImage(imgSrc, url)
      if (place) { await browser.close(); return place }
    }

    await browser.close()
    return null
  } catch {
    await browser.close()
    return null
  }
}

async function extractPlaceFromImage(imageUrl: string, sourceUrl: string): Promise<ParsedPlace | null> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic()

    const imgRes = await fetch(imageUrl)
    const imgBuffer = await imgRes.arrayBuffer()
    const base64 = Buffer.from(imgBuffer).toString('base64')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: '이 사진에서 장소(카페·식당·전시 등) 이름이나 위치 힌트가 보이면 JSON으로 답해줘: {"name": "장소명", "address": "주소(있으면)"}. 없으면 null.' },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[^}]+\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.name) return null

    return { name: parsed.name, address: parsed.address, sourceUrl, instagramUrl: sourceUrl }
  } catch { return null }
}
