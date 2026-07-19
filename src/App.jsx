import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const BG = "#070d1a", CARD = "rgba(255,255,255,0.04)", BORDER = "rgba(255,255,255,0.08)", ACCENT = "#f97316";

const SECTORS = [
  { name:"Banking & NBFC",   color:"#60a5fa", keys:["bank","hdfc","sbi","icici","axis","kotak","rbi","nbfc","loan","credit","monetary","repo"] },
  { name:"IT & Tech",        color:"#a78bfa", keys:["tcs","infosys","wipro","hcl","tech mahindra","software","digital","cloud","ai "] },
  { name:"Pharma",           color:"#34d399", keys:["pharma","drug","sun pharma","cipla","reddy","medicine","fda","health","biocon"] },
  { name:"Auto & EV",        color:"#fbbf24", keys:["tata motors","maruti","mahindra","bajaj","hero","tvs","ev ","electric vehicle","automobile"] },
  { name:"Energy & Oil",     color:"#fb923c", keys:["oil","crude","reliance","ongc","bpcl","hpcl","ioc","petroleum","energy","fuel"] },
  { name:"Infra & Realty",   color:"#f87171", keys:["l&t","construction","road","nhai","real estate","housing","dlf"] },
  { name:"Metals",           color:"#9ca3af", keys:["steel","tata steel","jsw","hindalco","vedanta","metal","copper","aluminium","coal"] },
  { name:"FMCG",             color:"#22d3ee", keys:["itc","hindustan unilever","hul","nestle","britannia","dabur","marico","fmcg"] },
  { name:"Capital Markets",  color:"#f472b6", keys:["sebi","nse","bse","sensex","nifty","ipo","mutual fund","fii","dii","fpi"] },
  { name:"Telecom",          color:"#2dd4bf", keys:["jio","airtel","vi ","vodafone","5g","spectrum","trai","telecom"] },
  { name:"Power",            color:"#f97316", keys:["ntpc","adani power","tata power","solar","wind","renewable","electricity","power"] },
  { name:"Defence",          color:"#fcd34d", keys:["defence","hal","bhel","drdo","military","army","aerospace"] },
  { name:"Electronics",      color:"#38bdf8", keys:["electronics","dixon","kaynes","pli","semiconductor","chip","manufacturing"] },
];

const STOCK_MAP = {
  "Banking & NBFC":  ["HDFCBANK","SBIN","ICICIBANK","KOTAKBANK","AXISBANK"],
  "IT & Tech":       ["TCS","INFY","WIPRO","HCLTECH","TECHM"],
  "Pharma":          ["SUNPHARMA","CIPLA","DRREDDY","BIOCON","AUROPHARMA"],
  "Auto & EV":       ["TATAMOTORS","MARUTI","M&M","BAJAJ-AUTO","HEROMOTOCO"],
  "Energy & Oil":    ["RELIANCE","ONGC","BPCL","HPCL","IOC"],
  "Infra & Realty":  ["LT","DLF","GODREJPROP","OBEROIRLTY","PRESTIGE"],
  "Metals":          ["TATASTEEL","JSWSTEEL","HINDALCO","VEDL","COALINDIA"],
  "FMCG":            ["ITC","HINDUNILVR","NESTLEIND","BRITANNIA","DABUR"],
  "Capital Markets": ["BSE","CDSL","MCX","ANGELONE","ICICIGI"],
  "Telecom":         ["BHARTIARTL","RELIANCE","INDUSTOWER"],
  "Power":           ["NTPC","ADANIPOWER","TATAPOWER","POWERGRID","CESC"],
  "Defence":         ["HAL","BEL","BHEL","MTAR","COCHINSHIP"],
  "Electronics":     ["DIXON","KAYNES","AMBER","SYRMA","AVALON"],
};

const PAGES = [
  {id:"home",     icon:"⚡", label:"Home"},
  {id:"market",   icon:"📰", label:"Market"},
  {id:"stocks",   icon:"📊", label:"Stocks"},
  {id:"mf",       icon:"💰", label:"MF"},
  {id:"broker",   icon:"📈", label:"Broker"},
  {id:"orders",   icon:"📦", label:"Orders"},
  {id:"global",   icon:"🇺🇸", label:"US/Trump"},
  {id:"china",    icon:"🇨🇳", label:"China"},
  {id:"msci",     icon:"🌍", label:"MSCI"},
  {id:"policy",   icon:"🏛️", label:"Policy"},
  {id:"ministry", icon:"🧾", label:"Ministry"},
  {id:"trade",    icon:"🌐", label:"Trade"},
  {id:"economy",  icon:"🏦", label:"Economy"},
  {id:"table",    icon:"📋", label:"Table"},
];

const SECTION_PROMPTS = {
  market:  `Search for the top 8 Indian stock market news items from today July 2026. Include Sensex/Nifty movement, major stock moves, FII/DII data, sector performance. For each item give: title, summary (2 sentences), sentiment (bullish/bearish/neutral), sectors affected, key stocks.`,
  stocks:  `Search for top 8 individual Indian stock news today July 2026. Include earnings results, stock price moves, analyst upgrades/downgrades, corporate actions (bonus, split, dividend, buyback). For each: title, summary, sentiment, ticker symbol, sector.`,
  mf:      `Search for top 6 Indian mutual fund news today July 2026. Include SIP inflows, AUM data, NFO launches, top performing funds, AMFI data, fund manager moves. For each: title, summary, fund name if mentioned.`,
  broker:  `Search for top 6 Indian broker reports and analyst calls today July 2026. Include buy/sell/hold ratings, target price changes, brokerage upgrades/downgrades from Motilal Oswal, ICICI Securities, Kotak, Jefferies, CLSA, Morgan Stanley, Goldman Sachs. For each: title, summary, broker name, rating, target price, stock ticker.`,
  orders:  `Search for top 6 Indian company new order wins and contract awards today July 2026. Include L&T, HAL, BHEL, defence orders, infrastructure contracts, PSU orders. For each: title, summary, company name, order value, client.`,
  global:  `Search for top 6 news about Trump/US policy impact on India today July 2026. Include US tariffs on India, trade deals, Fed Reserve decisions, Nasdaq/Dow moves, US-India relations, dollar-rupee. For each: title, summary, India impact.`,
  china:   `Search for top 6 news about China trade with India today July 2026. Include Chinese import restrictions on India, anti-dumping duties, Chinese FDI in India, India's restrictions on China, export relaxations, Chinese company approvals in India. For each: title, summary, trade impact.`,
  msci:    `Search for latest MSCI India index news July 2026. Include MSCI rebalancing, stocks added/removed from MSCI India, FII inflows/outflows, passive fund flows, index weight changes. Also include any Nifty/Sensex index reconstitution news. For each: title, summary, stocks affected, flow amounts.`,
  policy:  `Search for top 6 Indian government policy news today July 2026. Include RBI decisions, SEBI regulations, government announcements, budget updates, PLI schemes, tax changes, and regulatory reforms. For each: title, summary, ministry/department, impact.`,
  ministry: `Search for top 6 Indian ministry news today July 2026. Include minister statements, cabinet decisions, ministry directives, policy changes, and regulatory announcements from the finance ministry, commerce ministry, corporate affairs ministry, and other central departments. For each: title, summary, ministry/department, impact.`,
  trade:   `Search for top 6 India trade and export/import news today July 2026. Include trade deficit data, export figures, import duties changed, FTA developments, bilateral trade deals, WTO. For each: title, summary, trade impact.`,
  economy: `Search for top 6 Indian macroeconomic news today July 2026. Include GDP data, inflation (CPI/WPI), industrial production, PMI data, fiscal deficit, RBI policy, foreign exchange reserves. For each: title, summary, economic indicator value.`,
};

const SECTION_COLORS = {
  market:"#6366f1", stocks:"#10b981", mf:"#f472b6", broker:"#fb923c",
  orders:"#2dd4bf", global:"#ef4444", china:"#fbbf24", msci:"#a855f7",
  policy:"#d97706", ministry:"#c2410c", trade:"#ea580c", economy:"#8b5cf6",
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const getSectors = t => { const l = t.toLowerCase(); return SECTORS.filter(s => s.keys.some(k => l.includes(k))); };
const getSentiment = t => { const l = t.toLowerCase(); const p = ["surge","rally","rise","gain","jump","beat","profit","growth","boost","soar","record","strong","win","increase","order win","awarded","up "].filter(k => l.includes(k)).length; const n = ["fall","drop","decline","crash","loss","miss","concern","risk","ban","penalty","fine","reject","cut","slump","weak","fail","decrease","down "].filter(k => l.includes(k)).length; return p > n+1 ? "bullish" : n > p+1 ? "bearish" : "neutral"; };
const getStocks = (sectorName, text) => { const stocks = STOCK_MAP[sectorName] || []; const t = text.toUpperCase(); const hit = stocks.filter(s => t.includes(s.replace("-",""))); return [...hit, ...stocks.filter(s => !hit.includes(s))].slice(0,3); };

// ─── API CALL ─────────────────────────────────────────────────────────────────
const fetchSection = async (key, prompt) => {
  const fullPrompt = `${prompt}

IMPORTANT: Respond ONLY with a JSON array. No markdown, no explanation, just the JSON.
Format each item as:
{"title":"headline","summary":"2 sentence summary","sentiment":"bullish|bearish|neutral","sectors":["sector1","sector2"],"ticker":"NSE_SYMBOL_IF_APPLICABLE","extra":"any extra detail like price/order value/target price"}

Return 6-8 items. Make sure all data is real and from today or very recent (July 2026).`;

  // Use the RSS aggregator endpoint to fetch real feed items for this section
  const response = await fetch("/api/feeds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section: key })
  });

  if (!response.ok) {
    const err = await response.json().catch(()=>({ error: 'unknown' }));
    throw new Error(err.error || `Feeds API error ${response.status}`);
  }

  const items = await response.json();
  // Map feed items into the expected shape
  return items.map(item => ({
    title: item.title,
    summary: item.description || '',
    sentiment: getSentiment(item.title + ' ' + (item.description||'')),
    sectors: getSectors(item.title + ' ' + (item.description||'')).map(s => s.name),
    ticker: '',
    extra: '',
    source: item.source || 'feed',
    pubDate: item.pubDate || new Date().toISOString(),
    link: item.link || ''
  }));
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState([]);
  const [fetchDone, setFetchDone] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState("all");
  const [sector, setSector] = useState(null);
  const hasFetched = useRef(false);

  const log = msg => setProgress(p => [...p, msg]);

  const fetchOne = useCallback(async (key) => {
    setLoading(l => ({...l, [key]: true}));
    setErrors(e => ({...e, [key]: null}));
    log(`⏳ ${key}...`);
    try {
      const items = await fetchSection(key, SECTION_PROMPTS[key]);
      setData(d => ({...d, [key]: items}));
      log(`✓ ${key}: ${items.length} items`);
    } catch(e) {
      // Auto-retry once on rate limit after 10s
      if (e.message?.includes("rate") || e.message?.includes("limit") || e.message?.includes("concurrent") || e.message?.includes("exceeded")) {
        log(`⏸ ${key}: rate limit — retrying in 10s...`);
        await new Promise(r => setTimeout(r, 10000));
        try {
          const items = await fetchSection(key, SECTION_PROMPTS[key]);
          setData(d => ({...d, [key]: items}));
          log(`✓ ${key}: ${items.length} items (retry OK)`);
        } catch(e2) {
          setErrors(err => ({...err, [key]: e2.message}));
          log(`✗ ${key}: ${e2.message}`);
        }
      } else {
        setErrors(err => ({...err, [key]: e.message}));
        log(`✗ ${key}: ${e.message}`);
      }
    } finally {
      setLoading(l => ({...l, [key]: false}));
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setProgress(["🚀 Aggregating RSS feeds..."]);
    setFetchDone(false);
    setData({});
    try {
      const resp = await fetch('/api/feeds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!resp.ok) {
        const err = await resp.json().catch(()=>({ error: 'unknown' }));
        throw new Error(err.error || `Feeds API error ${resp.status}`);
      }
      const items = await resp.json();
      // Attach sentiment and sectors on the client using existing helpers
      const enhanced = items.map(it => ({
        title: it.title,
        summary: it.description || '',
        link: it.link,
        pubDate: it.pubDate,
        sentiment: getSentiment(it.title + ' ' + (it.description||'')),
        sectors: getSectors(it.title + ' ' + (it.description||'')).map(s => s.name),
        source: it.source || 'feed'
      }));

      const keys = Object.keys(SECTION_PROMPTS);
      // Populate each section with items that the server labeled for that section
      const d = {};
      keys.forEach(k => d[k] = enhanced.filter(it => (it.sections||[]).includes(k)));
      setData(d);
      setFetchDone(true);
      setLastUpdated(new Date());
      log(`✅ Feeds loaded: ${enhanced.length} items`);
    } catch (e) {
      log(`✗ Feeds: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) { hasFetched.current = true; fetchAll(); }
  }, [fetchAll]);

  const isLoading = Object.values(loading).some(Boolean);
  const loadedCount = Object.keys(data).length;
  const totalCount = Object.keys(SECTION_PROMPTS).length;

  const applyFilters = items => {
    if (!items) return [];
    let out = items;
    if (search) out = out.filter(i => (i.title + (i.summary||"")).toLowerCase().includes(search.toLowerCase()));
    if (sentiment !== "all") out = out.filter(i => i.sentiment === sentiment);
    if (sector) out = out.filter(i => (i.sectors||[]).includes(sector));
    return out;
  };

  const allItems = Object.values(data).flat();
  const sentStats = () => {
    let bull=0, bear=0, neu=0;
    allItems.forEach(i => { if(i.sentiment==="bullish")bull++; else if(i.sentiment==="bearish")bear++; else neu++; });
    return {bull, bear, neu, total: bull+bear+neu};
  };

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:BG,color:"#e2e8f0",fontFamily:"system-ui,sans-serif",maxWidth:520,margin:"0 auto"}}>

      {/* HEADER */}
      <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,13,26,0.97)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${BORDER}`,padding:"10px 14px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:"#f1f5f9"}}>🇮🇳 India Market Intelligence</div>
            <div style={{fontSize:9,color:ACCENT,fontWeight:600,marginTop:1}}>
              {isLoading ? `Fetching ${loadedCount}/${totalCount}...` : allItems.length > 0 ? `${allItems.length} articles · ${lastUpdated ? "Updated " + Math.floor((Date.now()-lastUpdated)/60000) + "m ago" : ""}` : "AI-powered · Live web search"}
            </div>
          </div>
          <button onClick={fetchAll} disabled={isLoading} style={{padding:"6px 12px",borderRadius:8,border:"none",background:isLoading?"rgba(249,115,22,0.2)":ACCENT,color:isLoading?"#64748b":"#fff",fontSize:11,fontWeight:700,cursor:isLoading?"not-allowed":"pointer"}}>
            {isLoading?"...":"↻ All"}
          </button>
        </div>

        {/* Progress bar */}
        {(isLoading || fetchDone) && (
          <div style={{marginBottom:7}}>
            <div style={{height:3,background:BORDER,borderRadius:2,overflow:"hidden",marginBottom:3}}>
              <div style={{height:"100%",width:`${Math.round((loadedCount/totalCount)*100)}%`,background:`linear-gradient(90deg,${ACCENT},#ef4444)`,transition:"width 0.5s",borderRadius:2}}/>
            </div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {Object.keys(SECTION_PROMPTS).map(key => (
                <span key={key} style={{fontSize:9,color:data[key]?"#10b981":loading[key]?ACCENT:"#334155",fontWeight:600}}>
                  {PAGES.find(p=>p.id===key)?.icon||"•"}{data[key]?"✓":loading[key]?"…":""}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"6px 10px",display:"flex",gap:7,alignItems:"center",border:`1px solid ${BORDER}`}}>
          <span style={{fontSize:12,color:"#475569"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search all news..."
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#e2e8f0",fontSize:12,fontFamily:"inherit"}}/>
          {search && <button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:13,padding:0}}>✕</button>}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",paddingBottom:56}}>
        {page==="home"    && <HomePage data={data} allItems={applyFilters(allItems)} isLoading={isLoading} progress={progress} fetchAll={fetchAll} sentStats={sentStats} sentiment={sentiment} setSentiment={setSentiment} sector={sector} setSector={setSector} setPage={setPage} loadedCount={loadedCount} totalCount={totalCount}/>}
        {page!=="home" && page!=="table" && <SectionPage key={page} sKey={page} items={applyFilters(data[page]||[])} isLoading={loading[page]} error={errors[page]} onRefresh={()=>fetchOne(page)} sentiment={sentiment} setSentiment={setSentiment} sector={sector} setSector={setSector}/>}
        {page==="table"   && <TablePage items={applyFilters(allItems)}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,background:"rgba(7,13,26,0.97)",backdropFilter:"blur(16px)",borderTop:`1px solid ${BORDER}`,display:"flex",zIndex:200,overflowX:"auto"}}>
        {PAGES.map(p => {
          const active = page===p.id;
          const cnt = p.id==="home"||p.id==="table" ? 0 : (data[p.id]||[]).length;
          return (
            <button key={p.id} onClick={()=>setPage(p.id)} style={{flex:"0 0 auto",minWidth:44,display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"7px 3px 5px",border:"none",background:"transparent",cursor:"pointer",color:active?ACCENT:"#475569"}}>
              <span style={{fontSize:13}}>{p.icon}</span>
              <span style={{fontSize:7,fontWeight:active?700:400,whiteSpace:"nowrap"}}>{p.label}</span>
              {cnt > 0 && !active && <span style={{fontSize:7,color:"#334155"}}>{cnt}</span>}
              {active && <div style={{width:10,height:2,borderRadius:1,background:ACCENT}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({data, allItems, isLoading, progress, fetchAll, sentStats, sentiment, setSentiment, sector, setSector, setPage, loadedCount, totalCount}) {
  const {bull, bear, neu, total} = sentStats();
  const mood = bull>bear*1.2 ? "BULLISH" : bear>bull*1.2 ? "BEARISH" : "NEUTRAL";
  const mc = mood==="BULLISH" ? "#10b981" : mood==="BEARISH" ? "#ef4444" : "#94a3b8";
  const topSectors = SECTORS.map(s => ({...s, count: allItems.filter(i => (i.sectors||[]).includes(s.name)).length})).filter(s=>s.count>0).sort((a,b)=>b.count-a.count).slice(0,8);

  return (
    <div style={{padding:"14px"}}>
      <div style={{fontSize:9,color:ACCENT,fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>AI-Powered · Live Web Search · 11 Sections</div>
      <h1 style={{fontSize:20,fontWeight:900,color:"#f1f5f9",margin:"0 0 4px",letterSpacing:"-0.5px"}}>India Market Intelligence</h1>
      <p style={{fontSize:11,color:"#475569",margin:"0 0 14px",lineHeight:1.5}}>Real-time Indian market news via AI web search — market, stocks, MF, broker calls, orders, Trump/US, China trade, MSCI, policy</p>

      <button onClick={fetchAll} disabled={isLoading} style={{width:"100%",padding:"15px",borderRadius:13,border:"none",marginBottom:12,background:isLoading?"rgba(249,115,22,0.15)":"linear-gradient(135deg,#f97316,#ef4444)",color:isLoading?"#64748b":"#fff",fontSize:15,fontWeight:900,cursor:isLoading?"not-allowed":"pointer",boxShadow:isLoading?"none":"0 6px 20px rgba(249,115,22,0.3)"}}>
        {isLoading ? `🔄 Fetching ${loadedCount}/${totalCount} sections...` : "🚀 Fetch All Latest News"}
      </button>

      {/* Progress log */}
      {progress.length > 0 && (
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:11,padding:"10px 12px",marginBottom:12,maxHeight:150,overflowY:"auto"}}>
          <div style={{fontSize:9,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Live Log</div>
          {progress.map((msg, i) => (
            <div key={i} style={{fontSize:10,fontFamily:"monospace",color:msg.startsWith("✓")?"#10b981":msg.startsWith("✗")?"#ef4444":msg.startsWith("✅")?ACCENT:msg.startsWith("🚀")?"#a5b4fc":"#64748b",marginBottom:2}}>{msg}</div>
          ))}
        </div>
      )}

      {/* Mood */}
      {total > 0 && (
        <div style={{background:CARD,border:`1px solid ${mc}30`,borderRadius:13,padding:"13px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div>
              <div style={{fontSize:8,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Market Sentiment</div>
              <div style={{fontSize:20,fontWeight:900,color:mc}}>{mood}</div>
              <div style={{fontSize:9,color:"#64748b"}}>{total} articles</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              {[["📗",bull,"#10b981"],["📕",bear,"#ef4444"],["📘",neu,"#64748b"]].map(([icon,val,c]) => (
                <div key={icon} style={{textAlign:"center",background:`${c}12`,borderRadius:8,padding:"6px 9px"}}>
                  <div style={{fontSize:12}}>{icon}</div>
                  <div style={{fontSize:13,fontWeight:800,color:c}}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[["all","All"],["bullish","📗 Bull"],["bearish","📕 Bear"],["neutral","📘 Neu"]].map(([id,label]) => (
              <button key={id} onClick={()=>setSentiment(id)} style={{padding:"3px 8px",borderRadius:999,border:"none",fontSize:10,fontWeight:600,cursor:"pointer",background:sentiment===id?mc:"rgba(255,255,255,0.06)",color:sentiment===id?"#fff":"#64748b"}}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Sector filter */}
      {topSectors.length > 0 && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Sector Filter</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            <button onClick={()=>setSector(null)} style={{padding:"3px 8px",borderRadius:999,border:`1px solid ${!sector?ACCENT:BORDER}`,background:!sector?`${ACCENT}18`:"transparent",color:!sector?ACCENT:"#64748b",fontSize:9,cursor:"pointer"}}>All</button>
            {topSectors.map(s => (
              <button key={s.name} onClick={()=>setSector(sector===s.name?null:s.name)} style={{padding:"3px 8px",borderRadius:999,border:`1px solid ${sector===s.name?s.color:BORDER}`,background:sector===s.name?`${s.color}15`:"transparent",color:sector===s.name?s.color:"#64748b",fontSize:9,cursor:"pointer"}}>{s.name} {s.count}</button>
            ))}
          </div>
        </div>
      )}

      {/* Section grid */}
      {total > 0 && (
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>All Sections</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {PAGES.filter(p=>p.id!=="home"&&p.id!=="table").map(p => (
              <button key={p.id} onClick={()=>setPage(p.id)} style={{background:CARD,border:`1px solid ${SECTION_COLORS[p.id]||"#64748b"}20`,borderRadius:10,padding:"9px 10px",cursor:"pointer",textAlign:"left"}}>
                <div style={{fontSize:15,marginBottom:2}}>{p.icon}</div>
                <div style={{fontSize:10,fontWeight:700,color:"#f1f5f9",lineHeight:1.2}}>{p.label}</div>
                <div style={{fontSize:9,color:SECTION_COLORS[p.id]||ACCENT,marginTop:1}}>{(data[p.id]||[]).length} articles</div>
              </button>
            ))}
            <button onClick={()=>setPage("table")} style={{background:CARD,border:"1px solid rgba(56,189,248,0.2)",borderRadius:10,padding:"9px 10px",cursor:"pointer",textAlign:"left"}}>
              <div style={{fontSize:15,marginBottom:2}}>📋</div>
              <div style={{fontSize:10,fontWeight:700,color:"#f1f5f9"}}>Table</div>
              <div style={{fontSize:9,color:"#38bdf8",marginTop:1}}>{allItems.length}</div>
            </button>
          </div>
        </div>
      )}

      {/* Latest */}
      {allItems.slice(0,5).map((item,i) => <ArticleCard key={`home-${i}`} item={item}/>)}

      {!total && !isLoading && (
        <div style={{textAlign:"center",padding:"40px 0"}}>
          <div style={{fontSize:38,marginBottom:10}}>📡</div>
          <p style={{fontSize:12,color:"#475569",marginBottom:14}}>Tap the button above to fetch live Indian market news from 11 sections</p>
        </div>
      )}
    </div>
  );
}

// ─── SECTION PAGE ─────────────────────────────────────────────────────────────
function SectionPage({sKey, items, isLoading, error, onRefresh, sentiment, setSentiment, sector, setSector}) {
  const p = PAGES.find(p=>p.id===sKey)||{icon:"📋",label:sKey};
  const color = SECTION_COLORS[sKey]||ACCENT;
  const topSectors = SECTORS.map(s => ({...s, count: items.filter(i=>(i.sectors||[]).includes(s.name)).length})).filter(s=>s.count>0).sort((a,b)=>b.count-a.count).slice(0,6);

  return (
    <div style={{padding:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:"#f1f5f9"}}>{p.icon} {p.label}</div>
          <div style={{fontSize:9,color:"#475569",marginTop:1}}>{items.length} articles · AI web search</div>
        </div>
        <button onClick={onRefresh} disabled={isLoading} style={{padding:"6px 11px",borderRadius:8,border:"none",background:isLoading?`${color}20`:color,color:isLoading?"#64748b":"#fff",fontSize:11,fontWeight:700,cursor:isLoading?"not-allowed":"pointer"}}>{isLoading?"...":"↻"}</button>
      </div>

      {error && <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:9,padding:"8px 11px",fontSize:11,color:"#fca5a5",marginBottom:10}}>⚠️ {error}</div>}

      <div style={{display:"flex",gap:4,marginBottom:8}}>
        {[["all","All"],["bullish","📗 Bull"],["bearish","📕 Bear"],["neutral","📘 Neu"]].map(([id,label]) => (
          <button key={id} onClick={()=>setSentiment(id)} style={{padding:"4px 8px",borderRadius:999,border:"none",fontSize:10,fontWeight:600,cursor:"pointer",background:sentiment===id?color:CARD,color:sentiment===id?"#fff":"#64748b"}}>{label}</button>
        ))}
      </div>

      {topSectors.length > 0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:10}}>
          <button onClick={()=>setSector(null)} style={{padding:"2px 7px",borderRadius:999,border:`1px solid ${!sector?ACCENT:BORDER}`,background:!sector?`${ACCENT}12`:"transparent",color:!sector?ACCENT:"#64748b",fontSize:8,cursor:"pointer"}}>All</button>
          {topSectors.map(s => <button key={s.name} onClick={()=>setSector(sector===s.name?null:s.name)} style={{padding:"2px 7px",borderRadius:999,border:`1px solid ${sector===s.name?s.color:BORDER}`,background:sector===s.name?`${s.color}12`:"transparent",color:sector===s.name?s.color:"#64748b",fontSize:8,cursor:"pointer"}}>{s.name} {s.count}</button>)}
        </div>
      )}

      {isLoading && <div style={{textAlign:"center",padding:"30px",color:"#64748b",fontSize:12}}>🔄 AI searching for latest {p.label} news...</div>}

      {items.map((item,i) => <ArticleCard key={`${sKey}-${i}`} item={item}/>)}

      {!isLoading && items.length===0 && !error && (
        <div style={{textAlign:"center",padding:"40px",color:"#475569",fontSize:12}}>
          <div style={{fontSize:30,marginBottom:8}}>{p.icon}</div>
          No articles yet.
          <br/><button onClick={onRefresh} style={{marginTop:10,padding:"7px 16px",borderRadius:8,border:"none",background:color,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>↻ Fetch Now</button>
        </div>
      )}
    </div>
  );
}

// ─── TABLE PAGE ───────────────────────────────────────────────────────────────
function TablePage({items}) {
  const [sortBy, setSortBy] = useState("section");
  const [secFilter, setSecFilter] = useState("all");

  const filtered = secFilter==="all" ? items : items.filter(i => {
    const src = Object.keys(SECTION_PROMPTS).find(k => /* items are tagged by section */false);
    return true;
  });

  return (
    <div style={{padding:"14px"}}>
      <div style={{fontSize:15,fontWeight:800,color:"#f1f5f9",marginBottom:2}}>📋 Master Table</div>
      <div style={{fontSize:9,color:"#475569",marginBottom:10}}>{items.length} total articles</div>

      {items.map((item,i) => {
        const s = item.sentiment;
        const ic = s==="bullish"?"#10b981":s==="bearish"?"#ef4444":"#64748b";
        return (
          <div key={`tbl-${i}`} style={{background:CARD,border:`1px solid ${ic}18`,borderRadius:10,padding:"9px 11px",marginBottom:6}}>
            <div style={{display:"flex",gap:4,marginBottom:4,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:8,fontWeight:700,color:ic,background:`${ic}12`,padding:"1px 5px",borderRadius:3}}>{s==="bullish"?"📗":s==="bearish"?"📕":"📘"} {(s||"").toUpperCase()}</span>
              {(item.sectors||[]).slice(0,2).map(sec => {
                const sData = SECTORS.find(x=>x.name===sec);
                return <span key={sec} style={{fontSize:8,color:sData?.color||"#64748b",background:`${sData?.color||"#64748b"}10`,padding:"1px 4px",borderRadius:3}}>{sec}</span>;
              })}
              {item.ticker && <span style={{fontSize:8,fontWeight:700,color:"#a5b4fc",background:"rgba(99,102,241,0.15)",padding:"1px 5px",borderRadius:3}}>{item.ticker}</span>}
            </div>
            <div style={{fontSize:11,fontWeight:600,color:"#e2e8f0",lineHeight:1.4,marginBottom:item.extra?3:0}}>{item.title}</div>
            {item.extra && <div style={{fontSize:10,color:"#64748b"}}>{item.extra}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── ARTICLE CARD ─────────────────────────────────────────────────────────────
function ArticleCard({item}) {
  const [open, setOpen] = useState(false);
  const s = item.sentiment;
  const ic = s==="bullish"?"#10b981":s==="bearish"?"#ef4444":"#64748b";
  const sectors = (item.sectors||[]).map(name => SECTORS.find(x=>x.name===name)).filter(Boolean);

  return (
    <div style={{background:CARD,border:`1px solid ${ic}22`,borderRadius:11,overflow:"hidden",marginBottom:7}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"10px 11px 8px",cursor:"pointer"}}>
        <div style={{display:"flex",gap:4,marginBottom:4,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:8,fontWeight:800,color:ic,background:`${ic}15`,padding:"1px 5px",borderRadius:3}}>{s==="bullish"?"▲ BULL":s==="bearish"?"▼ BEAR":"● NEU"}</span>
          {item.ticker && <span style={{fontSize:8,fontWeight:700,color:"#a5b4fc",background:"rgba(99,102,241,0.15)",padding:"1px 5px",borderRadius:3}}>{item.ticker}</span>}
          {item.extra && <span style={{fontSize:8,color:"#64748b",marginLeft:"auto"}}>{item.extra}</span>}
        </div>
        <div style={{fontSize:12,fontWeight:700,color:"#f1f5f9",lineHeight:1.4,marginBottom:sectors.length?6:0}}>{item.title}</div>
        {sectors.length > 0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
            {sectors.slice(0,4).map(s => <span key={s.name} style={{fontSize:8,fontWeight:600,color:s.color,background:`${s.color}12`,border:`1px solid ${s.color}22`,padding:"1px 5px",borderRadius:3}}>{s.name}</span>)}
          </div>
        )}
      </div>

      {/* Sector impact table */}
      {sectors.length > 0 && (
        <div style={{borderTop:`1px solid ${BORDER}`}}>
          <div style={{display:"grid",gridTemplateColumns:"50px 1fr 1fr",padding:"3px 11px",background:"rgba(0,0,0,0.3)",borderBottom:`1px solid ${BORDER}`}}>
            {["Signal","Sector","Stocks"].map(h => <div key={h} style={{fontSize:7,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:0.4}}>{h}</div>)}
          </div>
          {sectors.slice(0,4).map((sec,i) => {
            const stks = getStocks(sec.name, item.title+" "+(item.summary||""));
            return (
              <div key={`${sec.name}-${i}`} style={{display:"grid",gridTemplateColumns:"50px 1fr 1fr",padding:"5px 11px",background:i%2===0?`${ic}05`:"transparent",borderBottom:i<Math.min(sectors.length,4)-1?`1px solid ${BORDER}`:"none",alignItems:"center"}}>
                <span style={{fontSize:7,fontWeight:800,color:ic,background:`${ic}15`,padding:"1px 4px",borderRadius:2}}>{s==="bullish"?"▲ BUY":s==="bearish"?"▼ SELL":"● HOLD"}</span>
                <span style={{fontSize:10,fontWeight:700,color:sec.color}}>{sec.name}</span>
                <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
                  {stks.map(st => <span key={st} style={{fontSize:7,fontWeight:700,color:ic,background:`${ic}12`,border:`1px solid ${ic}22`,padding:"0 3px",borderRadius:2}}>{st}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && item.summary && (
        <div style={{borderTop:`1px solid ${BORDER}`,padding:"8px 11px"}}>
          <p style={{margin:0,fontSize:11,color:"#94a3b8",lineHeight:1.6}}>{item.summary}</p>
        </div>
      )}
    </div>
  );
}
