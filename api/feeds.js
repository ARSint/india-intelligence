// Vercel serverless function to aggregate RSS/Atom feeds from a built-in default list.
// Adds: simple in-memory cache (5 min) and server-side keyword mapping into known sections

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache = { ts: 0, items: [] };

const normalize = s => (s||"").replace(/<!\[CDATA\[|\]\]>/g, "").trim();

const DEFAULT_FEED_URLS = [
  "https://www.reuters.com/places/india/rss",
  "https://economictimes.indiatimes.com/markets/daily-market-report/rssfeeds/1977021503.cms",
  "https://www.livemint.com/rss/homepage",
  "https://www.business-standard.com/rss/news-116.rss",
  "https://www.moneycontrol.com/rss/MCtopnews.xml",
  "https://www.business-standard.com/rss/markets-704.rss"
];

// Keyword mapping for app sections (tune as needed)
const SECTION_KEYWORDS = {
  market: ['sensex','nifty','market','fii','dii','index','brokers','bse','nse','india market','india equity','india stocks','domestic market'],
  stocks: ['earnings','q1','q2','quarter','results','shares','stock','ipo','ticker','upgrade','downgrade','blockquote','brokerage','market cap','share price','stock rally'],
  mf: ['mutual fund','sip','amfi','aum','asset under management','fund house','mf','fund flows'],
  broker: ['broker','research','motilal','kotak','icici securities','jefferies','target price','rating','analyst','brokerage','call'],
  orders: ['order','contract','order win','contract award','order worth','won a contract','order win','contract win','project award'],
  global: ['trump','us','fed','dollar','nasdaq','dow','america','united states','global markets','international'],
  china: ['china','chinese','beijing','xi jinping','trade with china','tariff','export to china','chinese import','chinese export','china trade'],
  msci: ['msci','msci india','index rebalanc','index inclusion','index reconstitution','index committee','passive fund','benchmark index','index weight'],
  policy: ['minister','ministry','cabinet','government','govt','rbi','sebi','policy','regulation','tax','budget','finance minister','commerce minister','union minister','economic affairs','ministry of finance','ministry of commerce','ministry of corporate affairs'],
  trade: ['export','import','trade','fta','tariff','trade deficit','exports','imports','customs','trade deal','export duty'],
  economy: ['gdp','inflation','cpi','wpi','industrial production','pmi','economic','fiscal','growth rate','rbi repo','fiscal deficit']
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const urls = DEFAULT_FEED_URLS;

  try {
    // Return cached result when fresh
    if (Date.now() - cache.ts < CACHE_TTL && cache.items && cache.items.length) {
      // If a specific section was requested, filter server-side
      const body = req.body || {};
      if (body.section) {
        const filtered = cache.items.filter(it => (it.sections||[]).includes(body.section));
        return res.status(200).json(filtered);
      }
      return res.status(200).json(cache.items);
    }

    const fetches = await Promise.allSettled(urls.map(u => fetch(u).then(r => r.text())));
    const items = [];

    for (let i = 0; i < fetches.length; i++) {
      const f = fetches[i];
      const source = urls[i];
      if (f.status !== 'fulfilled') continue;
      const text = f.value;
      // Find item or entry blocks (RSS <item> or Atom <entry>)
      const itemMatches = text.match(/<item[\s\S]*?<\/item>/gi) || text.match(/<entry[\s\S]*?<\/entry>/gi) || [];
      for (const im of itemMatches) {
        const getTag = (tag) => {
          const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
          const m = im.match(re);
          return m ? normalize(m[1]) : null;
        };
        const title = getTag('title') || getTag('summary') || getTag('content') || '';
        const description = getTag('description') || getTag('summary') || '';
        const link = getTag('link') || (() => {
          // try to extract atom-style <link href="..."/>
          const m = im.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
          return m ? m[1] : null;
        })();
        const pubDateRaw = getTag('pubDate') || getTag('updated') || getTag('dc:date') || null;
        const pubDate = pubDateRaw ? (new Date(pubDateRaw)).toISOString() : null;

        if (!title) continue;

        // Determine sections for this item based on keywords
        const textLower = (title + ' ' + (description||'')).toLowerCase();
        const sections = Object.keys(SECTION_KEYWORDS).filter(sec => {
          return SECTION_KEYWORDS[sec].some(k => textLower.includes(k));
        });

        items.push({ title, description, link, pubDate, source, sections });
      }
    }

    // Deduplicate by link or title
    const seen = new Set();
    const deduped = items.filter(it => {
      const key = (it.link || it.title).slice(0,200);
      if (seen.has(key)) return false; seen.add(key); return true;
    });

    // Sort by pubDate desc (items without date go last)
    deduped.sort((a,b) => {
      if (a.pubDate && b.pubDate) return new Date(b.pubDate) - new Date(a.pubDate);
      if (a.pubDate) return -1; if (b.pubDate) return 1; return 0;
    });

    // Limit to top 200
    const limited = deduped.slice(0,200);

    // Cache and return
    cache = { ts: Date.now(), items: limited };

    const body = req.body || {};
    if (body.section) {
      const filtered = limited.filter(it => (it.sections||[]).includes(body.section));
      return res.status(200).json(filtered);
    }

    return res.status(200).json(limited);
  } catch (err) {
    console.error('feed aggregation error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
