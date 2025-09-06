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
  },
  // NEW GROUPS
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
  // [KEEP ALL EXISTING SOURCES AS IS - NOT REPEATED HERE]
  
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