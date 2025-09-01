// src/sources.js - Với nhóm tin tức
export const SOURCE_GROUPS = {
  vietnam: {
    id: "vietnam",
    name: "Tin tức Việt Nam",
    description: "Tổng hợp báo chí trong nước"
  },
  internationaleconomics: {
    id: "internationaleconomics", 
    name: "Kinh tế quốc tế",
    description: "Tin tức kinh tế thế giới"
  },
  internationaltech: {
    id: "internationaltech", 
    name: "Tech quốc tế",
    description: "Tin tức tech thế giới"
  }
};

export const SOURCES = {
   // NHÓM TIN TỨC VIỆT NAM
   vnexpress: {
    id: "vnexpress",
    name: "VnExpress",
    group: "vietnam",
    type: "rss",
    url: "https://vnexpress.net/rss/tin-moi-nhat.rss",
    homepage: "https://vnexpress.net",
  },
  tuoitre: {
    id: "tuoitre",
    name: "Tuổi Trẻ",
    group: "vietnam",
    type: "rss",
    url: "https://tuoitre.vn/rss/tin-moi-nhat.rss",
    homepage: "https://tuoitre.vn",
  },
  laodong: {
    id: "laodong",
    name: "Lao Động",
    group: "vietnam",
    type: "rss",
    url: "https://laodong.vn/rss/home.rss",
    homepage: "https://laodong.vn",
  },
  cafebiz: {
    id: "cafebiz",
    name: "CafeBiz",
    group: "vietnam",
    type: "rss",
    url: "https://cafebiz.vn/rss/home.rss",
    homepage: "https://cafebiz.vn",
  },
  thanhnien: {
    id: "thanhnien",
    name: "Thanh Niên",
    group: "vietnam",
    type: "rss",
    url: "https://thanhnien.vn/rss/home.rss",
    homepage: "https://thanhnien.vn",
  },
  baophapluat: {
    id: "baophapluat",
    name: "Báo Pháp Luật VN",
    group: "vietnam",
    type: "rss",
    url: "https://doanhnhan.baophapluat.vn/tin-moi.rss",
    homepage: "https://baophapluat.vn",
  },
  vnbusiness: {
    id: "vnbusiness",
    name: "VnBusiness",
    group: "vietnam",
    type: "rss",
    url: "https://vnbusiness.vn/rss/tin-moi.rss",
    homepage: "https://vnbusiness.vn",
  },
  dantri: {
    id: "dantri",
    name: "Dân Trí",
    group: "vietnam",
    type: "rss",
    url: "https://dantri.com.vn/rss.htm",
    homepage: "https://dantri.com.vn",
  },
  vietnamnet: {
    id: "vietnamnet",
    name: "VietNamNet",
    group: "vietnam",
    type: "rss",
    url: "https://infonet.vietnamnet.vn/rss/doi-song.rss",
    homepage: "https://vietnamnet.vn",
  },
  vietstock: {
    id: "vietstock",
    name: "Vietstock",
    group: "vietnam",
    type: "rss",
    url: "https://vietstock.vn/rss",
    homepage: "https://vietstock.vn",
  },
  brandsvietnam: {
    id: "brandsvietnam",
    name: "BrandsVietnam",
    group: "vietnam",
    type: "html",
    url: "https://www.brandsvietnam.com/",
    homepage: "https://www.brandsvietnam.com",
  },
  _24hmoney: {
    id: "_24hmoney",
    name: "24HMoney",
    group: "vietnam",
    type: "html",
    url: "https://24hmoney.vn",
    homepage: "https://24hmoney.vn",
  },
  vneconomy: {
    id: "vneconomy",
    name: "VnEconomy",
    group: "vietnam",
    type: "html",
    url: "https://vneconomy.vn",
    homepage: "https://vneconomy.vn",
  },
  cafef: {
    id: "cafef",
    name: "CafeF",
    group: "vietnam",
    type: "html",
    url: "https://cafef.vn",
    homepage: "https://cafef.vn",
  },
  bnews: {
    id: "bnews",
    name: "BNEWS",
    group: "vietnam",
    type: "html",
    url: "https://bnews.vn",
    homepage: "https://bnews.vn",
  },
  vietnamfinance: {
    id: "vietnamfinance",
    name: "VietnamFinance",
    group: "vietnam",
    type: "html",
    url: "https://vietnamfinance.vn/",
    homepage: "https://vietnamfinance.vn",
  },
  vietstock_moi_cap_nhat: {
    id: "vietstock_moi_cap_nhat",
    name: "Vietstock - Mới cập nhật",
    group: "vietnam",
    type: "html",
    url: "https://vietstock.vn/chu-de/1-2/moi-cap-nhat.htm",
    homepage: "https://vietstock.vn",
  },
  thoibaotaichinhvietnam: {
    id: "thoibaotaichinhvietnam",
    name: "Thời Báo Tài Chính VN",
    group: "vietnam",
    type: "html",
    url: "https://thoibaotaichinhvietnam.vn/",
    homepage: "https://thoibaotaichinhvietnam.vn",
  },
  fireant: {
    id: "fireant",
    name: "FireAnt",
    group: "vietnam",
    type: "html",
    url: "https://fireant.vn/",
    homepage: "https://fireant.vn",
  },

  // NHÓM TIN TỨC KINH TẾ QUỐC TẾ
  wsj: {
    id: "wsj",
    name: "Wall Street Journal",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.a.dj.com/rss/RSSOpinion.xml",
    homepage: "https://www.wsj.com",
  },
  economist: {
    id: "economist",
    name: "The Economist",
    group: "internationaleconomics",
    type: "rss", 
    url: "https://www.economist.com/finance-and-economics/rss.xml",
    homepage: "https://www.economist.com",
  },
  reuters: {
    id: "reuters",
    name: "Reuters Business",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best",
    homepage: "https://www.reuters.com/business",
  },
  cnbc: {
    id: "cnbc",
    name: "CNBC",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.cnbc.com/id/100003570/device/rss/rss.html",
    homepage: "https://www.cnbc.com",
  },
  marketwatch: {
    id: "marketwatch",
    name: "MarketWatch",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    homepage: "https://www.marketwatch.com",
  },
// ==== Internationaleconomics (refreshed to RSS-capable sources) ====
  bbc_business: {
    id: "bbc_business",
    name: "BBC Business",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
    homepage: "https://www.bbc.com/news/business"
  },
  guardian_economics: {
    id: "guardian_economics",
    name: "The Guardian - Economics",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.theguardian.com/business/economics/rss",
    homepage: "https://www.theguardian.com/business/economics"
  },
  marketwatch_economy: {
    id: "marketwatch_economy",
    name: "MarketWatch - Economy & Politics",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.marketwatch.com/rss/economy-politics",
    homepage: "https://www.marketwatch.com/economy-politics"
  },
  investing_economy: {
    id: "investing_economy",
    name: "Investing.com - Economy News",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.investing.com/rss/news_14.rss",
    homepage: "https://www.investing.com/news/economy"
  },
  voxeu: {
    id: "voxeu",
    name: "CEPR VoxEU Columns",
    group: "internationaleconomics",
    type: "rss",
    url: "https://cepr.org/rss/vox-content",
    homepage: "https://cepr.org/voxeu/columns"
  },
  imf_news: {
    id: "imf_news",
    name: "IMF News",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.imf.org/en/News/rss",
    homepage: "https://www.imf.org/en/News"
  },
  wto_news: {
    id: "wto_news",
    name: "WTO News",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.wto.org/english/news_e/news_e.xml",
    homepage: "https://www.wto.org/english/news_e/news_e.htm"
  },
  // # cnbc markets – official section but RSS is not clearly documented; keep legacy RSS endpoint compatible with your current parser
  cnbc_markets: {
    id: "cnbc_markets",
    name: "CNBC Markets",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.cnbc.com/id/100003570/device/rss/rss.html",
    homepage: "https://www.cnbc.com/markets/"
  },
  // # Reuters/AP/Al Jazeera/AsiaTimes/OECD/TradingEconomics – fallback via Google News RSS (official RSS not available or inconsistent)
  reuters_business: {
    id: "reuters_business",
    name: "Reuters Business (via Google News)",
    group: "internationaleconomics",
    type: "rss",
    url: "https://news.google.com/rss/search?q=site:reuters.com/business",
    homepage: "https://www.reuters.com/business/"
  },
  ap_business: {
    id: "ap_business",
    name: "AP News Business (via Google News)",
    group: "internationaleconomics",
    type: "rss",
    url: "https://news.google.com/rss/search?q=site:apnews.com/business",
    homepage: "https://apnews.com/business"
  },
  aljazeera_economy: {
    id: "aljazeera_economy",
    name: "Al Jazeera Economy (via Google News)",
    group: "internationaleconomics",
    type: "rss",
    url: "https://news.google.com/rss/search?q=site:aljazeera.com/economy",
    homepage: "https://www.aljazeera.com/economy"
  },
  asiatimes_business: {
    id: "asiatimes_business",
    name: "Asia Times Business (via Google News)",
    group: "internationaleconomics",
    type: "rss",
    url: "https://news.google.com/rss/search?q=site:asiatimes.com%20business",
    homepage: "https://asiatimes.com/category/business-trends/business/"
  },
  brookings_econ: {
    id: "brookings_econ",
    name: "Brookings Economic Studies (via Google News)",
    group: "internationaleconomics",
    type: "rss",
    url: "https://news.google.com/rss/search?q=site:brookings.edu%20%22Economic%20Studies%22",
    homepage: "https://www.brookings.edu/programs/economic-studies/"
  },
  oecd_news: {
    id: "oecd_news",
    name: "OECD (via Google News)",
    group: "internationaleconomics",
    type: "rss",
    url: "https://news.google.com/rss/search?q=site:oecd.org",
    homepage: "https://www.oecd.org"
  },
  tradingeconomics_news: {
    id: "tradingeconomics_news",
    name: "TradingEconomics (via Google News)",
    group: "internationaleconomics",
    type: "rss",
    url: "https://news.google.com/rss/search?q=site:tradingeconomics.com",
    homepage: "https://tradingeconomics.com/"
  },
  // ===== International Tech (Tech quốc tế) =====
  techcrunch: {
    id: "techcrunch",
    name: "TechCrunch",
    group: "internationaltech",
    type: "rss",
    url: "https://techcrunch.com/feed/",
    homepage: "https://techcrunch.com"
  },
  theverge: {
    id: "theverge",
    name: "The Verge",
    group: "internationaltech",
    type: "rss",
    url: "https://www.theverge.com/rss/index.xml",
    homepage: "https://www.theverge.com"
  },
  wired: {
    id: "wired",
    name: "WIRED",
    group: "internationaltech",
    type: "rss",
    url: "https://www.wired.com/feed/rss",
    homepage: "https://www.wired.com"
  },
  arstechnica: {
    id: "arstechnica",
    name: "Ars Technica",
    group: "internationaltech",
    type: "rss",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    homepage: "https://arstechnica.com"
  },
  gizmodo: {
    id: "gizmodo",
    name: "Gizmodo",
    group: "internationaltech",
    type: "rss",
    url: "https://gizmodo.com/rss",
    homepage: "https://gizmodo.com"
  },
  bleepingcomputer: {
    id: "bleepingcomputer",
    name: "BleepingComputer",
    group: "internationaltech",
    type: "rss",
    url: "https://www.bleepingcomputer.com/feed/",
    homepage: "https://www.bleepingcomputer.com"
  },
  slashdot: {
    id: "slashdot",
    name: "Slashdot",
    group: "internationaltech",
    type: "rss",
    url: "https://rss.slashdot.org/Slashdot/slashdotMain",
    homepage: "https://slashdot.org"
  },
  bitai_blog: {
    id: "bitai_blog",
    name: "Bit.ai Blog",
    group: "internationaltech",
    type: "rss",
    url: "https://blog.bit.ai/feed/",
    homepage: "https://blog.bit.ai"
  },
  technologymagazine: {
    id: "technologymagazine",
    name: "Technology Magazine",
    group: "internationaltech",
    type: "rss",
    url: "https://news.google.com/rss/search?q=site:technologymagazine.com",
    homepage: "https://technologymagazine.com"
  },
  thenextweb: {
    id: "thenextweb",
    name: "The Next Web",
    group: "internationaltech",
    type: "rss",
    url: "https://thenextweb.com/feed",
    homepage: "https://thenextweb.com"
  },
  zdnet: {
    id: "zdnet",
    name: "ZDNET",
    group: "internationaltech",
    type: "rss",
    url: "https://www.zdnet.com/news/rss.xml",
    homepage: "https://www.zdnet.com"
  },
  techradar: {
    id: "techradar",
    name: "TechRadar",
    group: "internationaltech",
    type: "rss",
    url: "https://www.techradar.com/feeds/rss",
    homepage: "https://www.techradar.com/"
  },
  engadget: {
    id: "engadget",
    name: "Engadget",
    group: "internationaltech",
    type: "rss",
    url: "https://www.engadget.com/rss.xml",
    homepage: "https://www.engadget.com"
  },
  mashable_sea: {
    id: "mashable_sea",
    name: "Mashable SEA",
    group: "internationaltech",
    type: "rss",
    url: "https://news.google.com/rss/search?q=site:sea.mashable.com",
    homepage: "https://sea.mashable.com"
  },
  theregister: {
    id: "theregister",
    name: "The Register",
    group: "internationaltech",
    type: "rss",
    url: "https://www.theregister.com/headlines.rss",
    homepage: "https://www.theregister.com"
  },
  computerworld: {
    id: "computerworld",
    name: "Computerworld",
    group: "internationaltech",
    type: "rss",
    url: "https://www.computerworld.com/index.rss",
    homepage: "https://www.computerworld.com"
  },
  geekwire: {
    id: "geekwire",
    name: "GeekWire",
    group: "internationaltech",
    type: "rss",
    url: "https://www.geekwire.com/feed/",
    homepage: "https://www.geekwire.com"
  },
  techinasia: {
    id: "techinasia",
    name: "Tech in Asia",
    group: "internationaltech",
    type: "rss",
    url: "https://www.techinasia.com/feed",
    homepage: "https://www.techinasia.com"
  }
};

// Helper functions
export function getSourcesByGroup(groupId) {
  return Object.values(SOURCES).filter(s => s.group === groupId);
}

export function listSources(groupId = null) {
  const sources = groupId ? getSourcesByGroup(groupId) : Object.values(SOURCES);
  return sources.map(({ id, name, homepage, url, type, group }) => ({ 
    id, name, homepage, url, type, group 
  }));
}