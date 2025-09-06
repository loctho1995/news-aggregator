// Source definitions and management

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
  },
  startuptech: {
    id: "startuptech",
    name: "Startup & Tech",
    description: "Tin tức startup và công nghệ"
  },
  developernews: {
    id: "developernews",
    name: "Developer News",
    description: "Tin tức cho lập trình viên"
  },
  gamenews: {
    id: "gamenews",
    name: "Game News",
    description: "Tin tức game và ngành công nghiệp game"
  },
  designuiux: {
    id: "designuiux",
    name: "Design, UI/UX",
    description: "Tin tức thiết kế và trải nghiệm người dùng"
  }
};

export const SOURCES = {
  // ===== VIETNAM NEWS SOURCES =====
  vnexpress: {
    id: "vnexpress",
    name: "VnExpress",
    group: "vietnam",
    type: "rss",
    url: "https://vnexpress.net/rss/tin-moi-nhat.rss",
    homepage: "https://vnexpress.net"
  },
  tuoitre: {
    id: "tuoitre",
    name: "Tuổi Trẻ",
    group: "vietnam",
    type: "rss",
    url: "https://tuoitre.vn/rss/tin-moi-nhat.rss",
    homepage: "https://tuoitre.vn"
  },
  thanhnien: {
    id: "thanhnien",
    name: "Thanh Niên",
    group: "vietnam",
    type: "rss",
    url: "https://thanhnien.vn/rss/home.rss",
    homepage: "https://thanhnien.vn"
  },
  dantri: {
    id: "dantri",
    name: "Dân Trí",
    group: "vietnam",
    type: "rss",
    url: "https://dantri.com.vn/rss/home.rss",
    homepage: "https://dantri.com.vn"
  },
  vietnamnet: {
    id: "vietnamnet",
    name: "VietnamNet",
    group: "vietnam",
    type: "rss",
    url: "https://vietnamnet.vn/rss/tin-moi-nhat.rss",
    homepage: "https://vietnamnet.vn"
  },
  laodong: {
    id: "laodong",
    name: "Lao Động",
    group: "vietnam",
    type: "rss",
    url: "https://laodong.vn/rss/home.rss",
    homepage: "https://laodong.vn"
  },
  baophapluat: {
    id: "baophapluat",
    name: "Báo Pháp Luật",
    group: "vietnam",
    type: "rss",
    url: "https://baophapluat.vn/rss/home.rss",
    homepage: "https://baophapluat.vn"
  },
  cafef: {
    id: "cafef",
    name: "CafeF",
    group: "vietnam",
    type: "rss",
    url: "https://cafef.vn/trang-chu.rss",
    homepage: "https://cafef.vn"
  },
  cafebiz: {
    id: "cafebiz",
    name: "CafeBiz",
    group: "vietnam",
    type: "rss",
    url: "https://cafebiz.vn/home.rss",
    homepage: "https://cafebiz.vn"
  },
  bnews: {
    id: "bnews",
    name: "Bnews",
    group: "vietnam",
    type: "html",
    url: "https://bnews.vn",
    homepage: "https://bnews.vn"
  },
  vietstock: {
    id: "vietstock",
    name: "VietStock",
    group: "vietnam",
    type: "rss",
    url: "https://vietstock.vn/rss/home.rss",
    homepage: "https://vietstock.vn"
  },
  vnbusiness: {
    id: "vnbusiness",
    name: "Vietnam Business",
    group: "vietnam",
    type: "html",
    url: "https://vnbusiness.vn",
    homepage: "https://vnbusiness.vn"
  },
  brandsvietnam: {
    id: "brandsvietnam",
    name: "Brands Vietnam",
    group: "vietnam",
    type: "html",
    url: "https://www.brandsvietnam.com",
    homepage: "https://www.brandsvietnam.com"
  },
  vietnamfinance: {
    id: "vietnamfinance",
    name: "Vietnam Finance",
    group: "vietnam",
    type: "html",
    url: "https://vietnamfinance.vn",
    homepage: "https://vietnamfinance.vn"
  },
  fireant: {
    id: "fireant",
    name: "FireAnt",
    group: "vietnam",
    type: "html",
    url: "https://fireant.vn",
    homepage: "https://fireant.vn"
  },

  // ===== INTERNATIONAL ECONOMICS =====
  bloomberg: {
    id: "bloomberg",
    name: "Bloomberg",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.bloomberg.com/markets/news.rss",
    homepage: "https://www.bloomberg.com"
  },
  wsj: {
    id: "wsj",
    name: "WSJ Markets",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    homepage: "https://www.wsj.com"
  },
  ft: {
    id: "ft",
    name: "Financial Times",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.ft.com/?format=rss",
    homepage: "https://www.ft.com"
  },
  economist: {
    id: "economist",
    name: "The Economist",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.economist.com/feeds/print-sections/77/business.xml",
    homepage: "https://www.economist.com"
  },
  reuters_business: {
    id: "reuters_business",
    name: "Reuters Business",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.reuters.com/reuters/businessNews",
    homepage: "https://www.reuters.com/business"
  },
  cnbc: {
    id: "cnbc",
    name: "CNBC",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    homepage: "https://www.cnbc.com"
  },
  marketwatch: {
    id: "marketwatch",
    name: "MarketWatch",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.marketwatch.com/marketwatch/topstories",
    homepage: "https://www.marketwatch.com"
  },
  seekingalpha: {
    id: "seekingalpha",
    name: "Seeking Alpha",
    group: "internationaleconomics",
    type: "rss",
    url: "https://seekingalpha.com/feed.xml",
    homepage: "https://seekingalpha.com"
  },
  morningstar: {
    id: "morningstar",
    name: "Morningstar",
    group: "internationaleconomics",
    type: "rss",
    url: "http://feeds.morningstar.com/morningstar/markets",
    homepage: "https://www.morningstar.com"
  },
  businessinsider: {
    id: "businessinsider",
    name: "Business Insider",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.businessinsider.com/rss",
    homepage: "https://www.businessinsider.com"
  },

  // ===== INTERNATIONAL TECH =====
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
    name: "Wired",
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
    url: "https://feeds.arstechnica.com/arstechnica/features",
    homepage: "https://arstechnica.com"
  },
  engadget: {
    id: "engadget",
    name: "Engadget",
    group: "internationaltech",
    type: "rss",
    url: "https://www.engadget.com/rss.xml",
    homepage: "https://www.engadget.com"
  },
  venturebeat: {
    id: "venturebeat",
    name: "VentureBeat",
    group: "internationaltech",
    type: "rss",
    url: "https://venturebeat.com/feed/",
    homepage: "https://venturebeat.com"
  },
  techradar: {
    id: "techradar",
    name: "TechRadar",
    group: "internationaltech",
    type: "rss",
    url: "https://www.techradar.com/rss",
    homepage: "https://www.techradar.com"
  },
  gizmodo: {
    id: "gizmodo",
    name: "Gizmodo",
    group: "internationaltech",
    type: "rss",
    url: "https://gizmodo.com/rss",
    homepage: "https://gizmodo.com"
  },
  mashable: {
    id: "mashable",
    name: "Mashable",
    group: "internationaltech",
    type: "rss",
    url: "https://mashable.com/feeds/rss/all",
    homepage: "https://mashable.com"
  },
  thenextweb: {
    id: "thenextweb",
    name: "The Next Web",
    group: "internationaltech",
    type: "rss",
    url: "https://thenextweb.com/feed",
    homepage: "https://thenextweb.com"
  },
  appleinsider: {
    id: "appleinsider",
    name: "AppleInsider",
    group: "internationaltech",
    type: "rss",
    url: "https://appleinsider.com/rss/news/",
    homepage: "https://appleinsider.com"
  },
  androidpolice: {
    id: "androidpolice",
    name: "Android Police",
    group: "internationaltech",
    type: "rss",
    url: "https://www.androidpolice.com/feed/",
    homepage: "https://www.androidpolice.com"
  },
  xda: {
    id: "xda",
    name: "XDA Developers",
    group: "internationaltech",
    type: "rss",
    url: "https://www.xda-developers.com/feed/",
    homepage: "https://www.xda-developers.com"
  },
  theregister: {
    id: "theregister",
    name: "The Register",
    group: "internationaltech",
    type: "rss",
    url: "https://www.theregister.com/headlines.atom",
    homepage: "https://www.theregister.com"
  },
  zdnet: {
    id: "zdnet",
    name: "ZDNet",
    group: "internationaltech",
    type: "rss",
    url: "https://www.zdnet.com/news/rss.xml",
    homepage: "https://www.zdnet.com"
  },

  // ===== STARTUP & TECH =====
  startupsavant: {
    id: "startupsavant",
    name: "Startup Savant",
    group: "startuptech",
    type: "rss",
    url: "https://startupsavant.com/feed",
    homepage: "https://startupsavant.com"
  },
  sifted: {
    id: "sifted",
    name: "Sifted",
    group: "startuptech",
    type: "rss",
    url: "https://sifted.eu/feed",
    homepage: "https://sifted.eu"
  },
  thenextweb_st: {
    id: "thenextweb_st",
    name: "The Next Web",
    group: "startuptech",
    type: "rss",
    url: "https://thenextweb.com/feed",
    homepage: "https://thenextweb.com"
  },
  hackernews: {
    id: "hackernews",
    name: "Hacker News",
    group: "startuptech",
    type: "rss",
    url: "https://news.ycombinator.com/rss",
    homepage: "https://news.ycombinator.com"
  },
  theregister_st: {
    id: "theregister_st",
    name: "The Register",
    group: "startuptech",
    type: "rss",
    url: "https://www.theregister.com/headlines.atom",
    homepage: "https://www.theregister.com"
  },
  geekwire_st: {
    id: "geekwire_st",
    name: "GeekWire",
    group: "startuptech",
    type: "rss",
    url: "https://www.geekwire.com/feed/",
    homepage: "https://www.geekwire.com"
  },
  zdnet_st: {
    id: "zdnet_st",
    name: "ZDNet",
    group: "startuptech",
    type: "rss",
    url: "https://www.zdnet.com/news/rss.xml",
    homepage: "https://www.zdnet.com"
  },
  businessinsider_tech: {
    id: "businessinsider_tech",
    name: "Business Insider Tech",
    group: "startuptech",
    type: "rss",
    url: "https://www.businessinsider.com/tech/rss",
    homepage: "https://www.businessinsider.com"
  },
  reuters_tech: {
    id: "reuters_tech",
    name: "Reuters Technology",
    group: "startuptech",
    type: "rss",
    url: "https://www.reutersagency.com/feed/?best-topics=tech&post_type=best",
    homepage: "https://www.reuters.com/technology/"
  },

  // ===== DEVELOPER NEWS =====
  developertech: {
    id: "developertech",
    name: "Developer Tech",
    group: "developernews",
    type: "rss",
    url: "https://www.developer-tech.com/feed/",
    homepage: "https://www.developer-tech.com"
  },
  appdevelopermagazine: {
    id: "appdevelopermagazine",
    name: "App Developer Magazine",
    group: "developernews",
    type: "rss",
    url: "https://appdevelopermagazine.com/RSS",
    homepage: "https://appdevelopermagazine.com"
  },
  infoq: {
    id: "infoq",
    name: "InfoQ",
    group: "developernews",
    type: "rss",
    url: "https://feed.infoq.com/",
    homepage: "https://www.infoq.com"
  },
  sdtimes: {
    id: "sdtimes",
    name: "SD Times",
    group: "developernews",
    type: "rss",
    url: "https://sdtimes.com/feed/",
    homepage: "https://sdtimes.com"
  },
  businessofapps: {
    id: "businessofapps",
    name: "Business of Apps",
    group: "developernews",
    type: "rss",
    url: "https://www.businessofapps.com/feed/",
    homepage: "https://www.businessofapps.com"
  },
  infoworld: {
    id: "infoworld",
    name: "InfoWorld",
    group: "developernews",
    type: "rss",
    url: "https://www.infoworld.com/news/index.rss",
    homepage: "https://www.infoworld.com"
  },
  stackoverflow_blog: {
    id: "stackoverflow_blog",
    name: "Stack Overflow Blog",
    group: "developernews",
    type: "rss",
    url: "https://stackoverflow.blog/feed/",
    homepage: "https://stackoverflow.blog"
  },
  github_blog: {
    id: "github_blog",
    name: "GitHub Blog",
    group: "developernews",
    type: "rss",
    url: "https://github.blog/feed/",
    homepage: "https://github.blog"
  },
  creativebloq: {
    id: "creativebloq",
    name: "Creative Bloq",
    group: "developernews",
    type: "rss",
    url: "https://www.creativebloq.com/feeds/all",
    homepage: "https://www.creativebloq.com"
  },

  // ===== GAME NEWS =====
  gamedeveloper: {
    id: "gamedeveloper",
    name: "Game Developer",
    group: "gamenews",
    type: "rss",
    url: "https://www.gamedeveloper.com/rss.xml",
    homepage: "https://www.gamedeveloper.com"
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    group: "gamenews",
    type: "rss",
    url: "https://www.polygon.com/rss/index.xml",
    homepage: "https://www.polygon.com"
  },
  kotaku: {
    id: "kotaku",
    name: "Kotaku",
    group: "gamenews",
    type: "rss",
    url: "https://kotaku.com/rss",
    homepage: "https://kotaku.com"
  },
  ign: {
    id: "ign",
    name: "IGN",
    group: "gamenews",
    type: "rss",
    url: "https://feeds.ign.com/ign/all",
    homepage: "https://www.ign.com"
  },
  gamespot: {
    id: "gamespot",
    name: "GameSpot",
    group: "gamenews",
    type: "rss",
    url: "https://www.gamespot.com/feeds/news/",
    homepage: "https://www.gamespot.com"
  },
  eurogamer: {
    id: "eurogamer",
    name: "Eurogamer",
    group: "gamenews",
    type: "rss",
    url: "https://www.eurogamer.net/feed",
    homepage: "https://www.eurogamer.net"
  },
  pcgamer: {
    id: "pcgamer",
    name: "PC Gamer",
    group: "gamenews",
    type: "rss",
    url: "https://www.pcgamer.com/rss/",
    homepage: "https://www.pcgamer.com"
  },
  gamesradar: {
    id: "gamesradar",
    name: "GamesRadar+",
    group: "gamenews",
    type: "rss",
    url: "https://www.gamesradar.com/rss/",
    homepage: "https://www.gamesradar.com"
  },
  pocketgamer: {
    id: "pocketgamer",
    name: "Pocket Gamer",
    group: "gamenews",
    type: "rss",
    url: "https://www.pocketgamer.com/rss/",
    homepage: "https://www.pocketgamer.com"
  },
  eightylevels: {
    id: "eightylevels",
    name: "80 Level",
    group: "gamenews",
    type: "rss",
    url: "https://80.lv/feed/",
    homepage: "https://80.lv/articles"
  },

  // ===== DESIGN, UI/UX =====
  smashingmagazine: {
    id: "smashingmagazine",
    name: "Smashing Magazine",
    group: "designuiux",
    type: "rss",
    url: "https://www.smashingmagazine.com/feed",
    homepage: "https://www.smashingmagazine.com"
  },
  uxdesign: {
    id: "uxdesign",
    name: "UX Design",
    group: "designuiux",
    type: "rss",
    url: "https://uxdesign.cc/feed",
    homepage: "https://uxdesign.cc"
  },
  nngroup: {
    id: "nngroup",
    name: "Nielsen Norman Group",
    group: "designuiux",
    type: "rss",
    url: "https://www.nngroup.com/feed/rss/",
    homepage: "https://www.nngroup.com/articles/"
  },
  ixda: {
    id: "ixda",
    name: "Interaction Design Foundation",
    group: "designuiux",
    type: "rss",
    url: "https://www.interaction-design.org/rss.xml",
    homepage: "https://www.interaction-design.org/literature"
  },
  uxmatters: {
    id: "uxmatters",
    name: "UXmatters",
    group: "designuiux",
    type: "rss",
    url: "https://www.uxmatters.com/index.xml",
    homepage: "https://www.uxmatters.com"
  },
  alistapart: {
    id: "alistapart",
    name: "A List Apart",
    group: "designuiux",
    type: "rss",
    url: "https://alistapart.com/main/feed/",
    homepage: "https://alistapart.com"
  },
  uxplanet: {
    id: "uxplanet",
    name: "UX Planet",
    group: "designuiux",
    type: "rss",
    url: "https://uxplanet.org/feed",
    homepage: "https://uxplanet.org"
  },
  uxmag: {
    id: "uxmag",
    name: "UX Magazine",
    group: "designuiux",
    type: "rss",
    url: "https://uxmag.com/rss",
    homepage: "https://uxmag.com"
  },
  designmodo: {
    id: "designmodo",
    name: "Designmodo",
    group: "designuiux",
    type: "rss",
    url: "https://designmodo.com/feed/",
    homepage: "https://designmodo.com/articles/"
  },
  webdesignerdepot: {
    id: "webdesignerdepot",
    name: "Webdesigner Depot",
    group: "designuiux",
    type: "rss",
    url: "https://www.webdesignerdepot.com/feed/",
    homepage: "https://webdesignerdepot.com"
  },
  mockplus: {
    id: "mockplus",
    name: "Mockplus",
    group: "designuiux",
    type: "rss",
    url: "https://www.mockplus.com/blog/rss",
    homepage: "https://www.mockplus.com/blog"
  },
  uxpin: {
    id: "uxpin",
    name: "UXPin",
    group: "designuiux",
    type: "rss",
    url: "https://www.uxpin.com/studio/blog/feed/",
    homepage: "https://www.uxpin.com/studio/blog/"
  },
  designshack: {
    id: "designshack",
    name: "Design Shack",
    group: "designuiux",
    type: "rss",
    url: "https://designshack.net/feed/",
    homepage: "https://designshack.net"
  },
  material_blog: {
    id: "material_blog",
    name: "Material Design Blog",
    group: "designuiux",
    type: "html",
    url: "https://m3.material.io/blog",
    homepage: "https://m3.material.io/blog"
  },
  ixda_blog: {
    id: "ixda_blog",
    name: "IxDA Blog",
    group: "designuiux",
    type: "rss",
    url: "https://www.interaction-design.org/rss/blog.xml",
    homepage: "https://www.interaction-design.org/blog"
  }
};

// Priority levels for sources
export const PRIORITY = {
  high: [
    'vnexpress', 'tuoitre', 'dantri', 'vietnamnet', 'cafef',
    'hackernews', 'techcrunch', 'smashingmagazine', 'polygon',
    'bloomberg', 'wsj', 'ft'
  ],
  medium: [
    'thanhnien', 'laodong', 'cafebiz', 'vietstock',
    'infoq', 'gamedeveloper', 'uxdesign', 'ign',
    'theverge', 'wired', 'engadget'
  ],
  low: [
    'baophapluat', 'bnews', 'vnbusiness', 'brandsvietnam',
    'mockplus', 'designshack', 'pocketgamer',
    'morningstar', 'seekingalpha'
  ]
};

// Helper functions
export function getSourcesByGroup(groupId) {
  return Object.values(SOURCES).filter(s => s.group === groupId);
}

export function getSourceById(sourceId) {
  return SOURCES[sourceId];
}

export function getSortedSourceIds(group = null) {
  let ids = group 
    ? Object.keys(SOURCES).filter(id => SOURCES[id].group === group)
    : Object.keys(SOURCES);
    
  return ids.sort((a, b) => {
    const getPriority = (id) => {
      if (PRIORITY.high.includes(id)) return 0;
      if (PRIORITY.medium.includes(id)) return 1;
      if (PRIORITY.low.includes(id)) return 2;
      return 3;
    };
    return getPriority(a) - getPriority(b);
  });
}

export function listSources(groupId = null) {
  const sources = groupId ? getSourcesByGroup(groupId) : Object.values(SOURCES);
  return sources.map(({ id, name, homepage, url, type, group }) => ({ 
    id, name, homepage, url, type, group: group || 'vietnam'
  }));
}

export default {
  SOURCE_GROUPS,
  SOURCES,
  PRIORITY,
  getSourcesByGroup,
  getSourceById,
  getSortedSourceIds,
  listSources
};