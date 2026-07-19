// Vercel serverless function to aggregate RSS/Atom feeds specified in FEED_URLS env var
// FEED_URLS should be a comma-separated list of full feed URLs
// Adds: simple in-memory cache (5 min) and server-side keyword mapping into known sections

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache = { ts: 0, items: [] };

const normalize = s => (s||"").replace(/<!\[CDATA\[|\]\]>/g, "").trim();

// Keyword mapping for app sections (tune as needed)
const SECTION_KEYWORDS = {
  market: ['sensex','nifty','market','fii','dii','index','brokers','bse','nse'],
  stocks: ['earnings','q1','q2','quarter','results','shares','stock','shares','ipo','ticker','upgrade','downgrade'],
  mf: ['mutual fund','sip','amfi','aum','asset under management','fund house','mf'],
  broker: ['broker','research','motilal','kotak','icici securities','jefferies','target price','rating','analyst'],
  orders: ['order','contract','order win','contract award','order worth','won a contract','order win'],
  global: ['trump','us','fed','dollar','nasdaq','dow','america','united states'],
  china: ['china','chinese','beijing','xi jinping','trade with china','tariff','export to china'],
  msci: ['msci','rebalancing','msci india','index rebalan'],
  policy: ['rbi','sebi','policy','ministry','regulation','tax','budget','government'],
  trade: ['export','import','trade','fta','tariff','trade deficit','exports','imports'],
  economy: ['gdp','inflation','cpi','wpi','industrial production','pmi','economic','fiscal']
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const feedEnv = process.env.FEED_URLS || process.env.feed_urls;
  if (!feedEnv) return res.status(500).json({ error: "Server misconfigured: FEED_URLS or feed_urls not set" });

  const urls = feedEnv.split(',').map(u => u.trim()).filter(Boolean);
  if (urls.length === 0) return res.status(500).json({ error: "FEED_URLS empty" });

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
