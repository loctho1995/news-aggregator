// server/constants/sources.js - Complete version with ALL sources
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
  
  // VnExpress - Báo điện tử số 1 VN
  vnexpress: {
    id: "vnexpress",
    name: "VnExpress",
    group: "vietnam",
    type: "rss",
    url: "https://vnexpress.net/rss/tin-moi-nhat.rss",
    homepage: "https://vnexpress.net"
  },
  vnexpress_business: {
    id: "vnexpress_business",
    name: "VnExpress Kinh Doanh",
    group: "vietnam",
    type: "rss",
    url: "https://vnexpress.net/rss/kinh-doanh.rss",
    homepage: "https://vnexpress.net/kinh-doanh"
  },
  vnexpress_tech: {
    id: "vnexpress_tech",
    name: "VnExpress Số Hóa",
    group: "vietnam",
    type: "rss",
    url: "https://vnexpress.net/rss/so-hoa.rss",
    homepage: "https://vnexpress.net/so-hoa"
  },
  
  // Tuổi Trẻ
  tuoitre: {
    id: "tuoitre",
    name: "Tuổi Trẻ",
    group: "vietnam",
    type: "rss",
    url: "https://tuoitre.vn/rss/tin-moi-nhat.rss",
    homepage: "https://tuoitre.vn"
  },
  tuoitre_business: {
    id: "tuoitre_business",
    name: "Tuổi Trẻ Kinh Doanh",
    group: "vietnam",
    type: "rss",
    url: "https://tuoitre.vn/rss/kinh-doanh.rss",
    homepage: "https://tuoitre.vn/kinh-doanh.htm"
  },
  tuoitre_tech: {
    id: "tuoitre_tech",
    name: "Tuổi Trẻ Công Nghệ",
    group: "vietnam",
    type: "rss",
    url: "https://tuoitre.vn/rss/nhip-song-so.rss",
    homepage: "https://tuoitre.vn/nhip-song-so.htm"
  },
  
  // Thanh Niên
  thanhnien: {
    id: "thanhnien",
    name: "Thanh Niên",
    group: "vietnam",
    type: "rss",
    url: "https://thanhnien.vn/rss/home.rss",
    homepage: "https://thanhnien.vn"
  },
  thanhnien_economy: {
    id: "thanhnien_economy",
    name: "Thanh Niên Tài Chính",
    group: "vietnam",
    type: "rss",
    url: "https://thanhnien.vn/rss/tai-chinh.rss",
    homepage: "https://thanhnien.vn/tai-chinh-kinh-doanh.htm"
  },
  thanhnien_tech: {
    id: "thanhnien_tech",
    name: "Thanh Niên Công Nghệ",
    group: "vietnam",
    type: "rss",
    url: "https://thanhnien.vn/rss/cong-nghe.rss",
    homepage: "https://thanhnien.vn/cong-nghe-game.htm"
  },
  
  // Dân Trí
  dantri: {
    id: "dantri",
    name: "Dân Trí",
    group: "vietnam",
    type: "rss",
    url: "https://dantri.com.vn/rss/home.rss",
    homepage: "https://dantri.com.vn"
  },
  dantri_business: {
    id: "dantri_business",
    name: "Dân Trí Kinh Doanh",
    group: "vietnam",
    type: "rss",
    url: "https://dantri.com.vn/rss/kinh-doanh.rss",
    homepage: "https://dantri.com.vn/kinh-doanh.htm"
  },
  dantri_tech: {
    id: "dantri_tech",
    name: "Dân Trí Công Nghệ",
    group: "vietnam",
    type: "rss",
    url: "https://dantri.com.vn/rss/suc-manh-so.rss",
    homepage: "https://dantri.com.vn/suc-manh-so.htm"
  },
  
  // VietnamNet
  vietnamnet: {
    id: "vietnamnet",
    name: "VietnamNet",
    group: "vietnam",
    type: "rss",
    url: "https://vietnamnet.vn/rss/tin-moi-nhat.rss",
    homepage: "https://vietnamnet.vn"
  },
  vietnamnet_business: {
    id: "vietnamnet_business",
    name: "VietnamNet Kinh Doanh",
    group: "vietnam",
    type: "rss",
    url: "https://vietnamnet.vn/rss/kinh-doanh.rss",
    homepage: "https://vietnamnet.vn/kinh-doanh"
  },
  vietnamnet_tech: {
    id: "vietnamnet_tech",
    name: "VietnamNet Công Nghệ",
    group: "vietnam",
    type: "rss",
    url: "https://vietnamnet.vn/rss/cong-nghe.rss",
    homepage: "https://vietnamnet.vn/cong-nghe"
  },
  
  // Người Lao Động
  nld: {
    id: "nld",
    name: "Người Lao Động",
    group: "vietnam",
    type: "rss",
    url: "https://nld.com.vn/rss/tin-moi-nhat.rss",
    homepage: "https://nld.com.vn"
  },
  nld_business: {
    id: "nld_business",
    name: "NLD Kinh Tế",
    group: "vietnam",
    type: "rss",
    url: "https://nld.com.vn/rss/kinh-te.rss",
    homepage: "https://nld.com.vn/kinh-te.htm"
  },
  nld_tech: {
    id: "nld_tech",
    name: "NLD Công Nghệ",
    group: "vietnam",
    type: "rss",
    url: "https://nld.com.vn/rss/cong-nghe.rss",
    homepage: "https://nld.com.vn/cong-nghe.htm"
  },
  
  // Tiền Phong
  tienphong: {
    id: "tienphong",
    name: "Tiền Phong",
    group: "vietnam",
    type: "rss",
    url: "https://tienphong.vn/rss/home.rss",
    homepage: "https://tienphong.vn"
  },
  tienphong_business: {
    id: "tienphong_business",
    name: "Tiền Phong Kinh Tế",
    group: "vietnam",
    type: "rss",
    url: "https://tienphong.vn/rss/kinh-te-3.rss",
    homepage: "https://tienphong.vn/kinh-te/"
  },
  tienphong_tech: {
    id: "tienphong_tech",
    name: "Tiền Phong Công Nghệ",
    group: "vietnam",
    type: "rss",
    url: "https://tienphong.vn/rss/cong-nghe-45.rss",
    homepage: "https://tienphong.vn/cong-nghe/"
  },
  
  // Zing News
  zingnews: {
    id: "zingnews",
    name: "Zing News",
    group: "vietnam",
    type: "rss",
    url: "https://zingnews.vn/rss/tin-moi.rss",
    homepage: "https://zingnews.vn"
  },
  zingnews_business: {
    id: "zingnews_business",
    name: "Zing Kinh Doanh",
    group: "vietnam",
    type: "rss",
    url: "https://zingnews.vn/rss/kinh-doanh-tai-chinh.rss",
    homepage: "https://zingnews.vn/kinh-doanh-tai-chinh.html"
  },
  zingnews_tech: {
    id: "zingnews_tech",
    name: "Zing Công Nghệ",
    group: "vietnam",
    type: "rss",
    url: "https://zingnews.vn/rss/cong-nghe.rss",
    homepage: "https://zingnews.vn/cong-nghe.html"
  },
  
  // Báo Mới (Aggregator - HTML parse)
  baomoi: {
    id: "baomoi",
    name: "Báo Mới",
    group: "vietnam",
    type: "html",
    url: "https://baomoi.com",
    homepage: "https://baomoi.com"
  },
  
  // Thêm các báo khác
  
  // Lao Động
  laodong: {
    id: "laodong",
    name: "Báo Lao Động",
    group: "vietnam",
    type: "rss",
    url: "https://laodong.vn/rss/home.rss",
    homepage: "https://laodong.vn"
  },
  laodong_business: {
    id: "laodong_business",
    name: "Lao Động Kinh Tế",
    group: "vietnam",
    type: "rss",
    url: "https://laodong.vn/rss/kinh-te.rss",
    homepage: "https://laodong.vn/kinh-te/"
  },
  
  // VTC News
  vtcnews: {
    id: "vtcnews",
    name: "VTC News",
    group: "vietnam",
    type: "rss",
    url: "https://vtc.vn/rss/feed.rss",
    homepage: "https://vtc.vn"
  },
  
  // Sài Gòn Giải Phóng
  sggp: {
    id: "sggp",
    name: "Sài Gòn Giải Phóng",
    group: "vietnam",
    type: "rss",
    url: "https://www.sggp.org.vn/rss/chinhtri.rss",
    homepage: "https://www.sggp.org.vn"
  },
  
  // 24h
  news24h: {
    id: "news24h",
    name: "Báo 24h",
    group: "vietnam",
    type: "rss",
    url: "https://www.24h.com.vn/upload/rss/tintuctrongngay.rss",
    homepage: "https://www.24h.com.vn"
  },
  
  // Pháp Luật TP.HCM
  phapluathochiminh: {
    id: "phapluathochiminh",
    name: "Pháp Luật TP.HCM",
    group: "vietnam",
    type: "rss",
    url: "https://plo.vn/rss/home.rss",
    homepage: "https://plo.vn"
  },
  
  // VOV (Đài tiếng nói VN)
  vov: {
    id: "vov",
    name: "VOV",
    group: "vietnam",
    type: "rss",
    url: "https://vov.vn/rss/home.rss",
    homepage: "https://vov.vn"
  },
  
  // CafeF - Kinh tế tài chính
  cafef: {
    id: "cafef",
    name: "CafeF",
    group: "vietnam",
    type: "rss",
    url: "https://cafef.vn/trang-chu.rss",
    homepage: "https://cafef.vn"
  },
  cafef_stock: {
    id: "cafef_stock",
    name: "CafeF Chứng Khoán",
    group: "vietnam",
    type: "rss",
    url: "https://cafef.vn/thi-truong-chung-khoan.rss",
    homepage: "https://cafef.vn/thi-truong-chung-khoan.chn"
  },
  cafef_business: {
    id: "cafef_business",
    name: "CafeF Doanh Nghiệp",
    group: "vietnam",
    type: "rss",
    url: "https://cafef.vn/doanh-nghiep.rss",
    homepage: "https://cafef.vn/doanh-nghiep.chn"
  },
  
  // CafeBiz
  cafebiz: {
    id: "cafebiz",
    name: "CafeBiz",
    group: "vietnam",
    type: "rss",
    url: "https://cafebiz.vn/trang-chu.rss",
    homepage: "https://cafebiz.vn"
  },
  
  // VnEconomy
  vneconomy: {
    id: "vneconomy",
    name: "VnEconomy",
    group: "vietnam",
    type: "rss",
    url: "https://vneconomy.vn/rss/home.rss",
    homepage: "https://vneconomy.vn"
  },
  
  // VietStock
  vietstock: {
    id: "vietstock",
    name: "VietStock",
    group: "vietnam",
    type: "rss",
    url: "https://vietstock.vn/RSS/CauChuyenThiTruong.rss",
    homepage: "https://vietstock.vn"
  },
  
  // GenK - Công nghệ
  genk: {
    id: "genk",
    name: "GenK",
    group: "vietnam",
    type: "rss",
    url: "https://genk.vn/rss/home.rss",
    homepage: "https://genk.vn"
  },
  genk_mobile: {
    id: "genk_mobile",
    name: "GenK Mobile",
    group: "vietnam",
    type: "rss",
    url: "https://genk.vn/rss/mobile.rss",
    homepage: "https://genk.vn/mobile.chn"
  },
  genk_internet: {
    id: "genk_internet",
    name: "GenK Internet",
    group: "vietnam",
    type: "rss",
    url: "https://genk.vn/rss/internet.rss",
    homepage: "https://genk.vn/internet.chn"
  },
  
  // TechZ
  techz: {
    id: "techz",
    name: "TechZ",
    group: "vietnam",
    type: "rss",
    url: "https://www.techz.vn/rss.html",
    homepage: "https://www.techz.vn"
  },
  
  // ICTNews
  ictnews: {
    id: "ictnews",
    name: "ICTNews",
    group: "vietnam",
    type: "rss",
    url: "https://ictnews.vietnamnet.vn/rss/thoi-su.rss",
    homepage: "https://ictnews.vietnamnet.vn"
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
  reuters_business: {
    id: "reuters_business",
    name: "Reuters Business",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.reuters.com/reuters/businessNews",
    homepage: "https://www.reuters.com/business/"
  },
  wsj: {
    id: "wsj",
    name: "Wall Street Journal",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml",
    homepage: "https://www.wsj.com"
  },
  ft: {
    id: "ft",
    name: "Financial Times",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.ft.com/rss/home",
    homepage: "https://www.ft.com"
  },
  economist: {
    id: "economist",
    name: "The Economist",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.economist.com/finance-and-economics/rss.xml",
    homepage: "https://www.economist.com"
  },
  marketwatch: {
    id: "marketwatch",
    name: "MarketWatch",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.marketwatch.com/marketwatch/topstories",
    homepage: "https://www.marketwatch.com"
  },
  cnbc: {
    id: "cnbc",
    name: "CNBC",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    homepage: "https://www.cnbc.com"
  },
  forbes: {
    id: "forbes",
    name: "Forbes",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.forbes.com/real-time/feed2/",
    homepage: "https://www.forbes.com"
  },
  businessweek: {
    id: "businessweek",
    name: "Bloomberg Businessweek",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.bloomberg.com/businessweek/news.rss",
    homepage: "https://www.bloomberg.com/businessweek"
  },
  fortune: {
    id: "fortune",
    name: "Fortune",
    group: "internationaleconomics",
    type: "rss",
    url: "https://fortune.com/feed/",
    homepage: "https://fortune.com"
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
  verge: {
    id: "verge",
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
    url: "https://feeds.arstechnica.com/arstechnica/index",
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
  theinformation: {
    id: "theinformation",
    name: "The Information",
    group: "internationaltech",
    type: "rss",
    url: "https://www.theinformation.com/feed",
    homepage: "https://www.theinformation.com"
  },
  techmeme: {
    id: "techmeme",
    name: "Techmeme",
    group: "internationaltech",
    type: "rss",
    url: "https://www.techmeme.com/feed.xml",
    homepage: "https://www.techmeme.com"
  },
  venturebeat: {
    id: "venturebeat",
    name: "VentureBeat",
    group: "internationaltech",
    type: "rss",
    url: "https://venturebeat.com/feed/",
    homepage: "https://venturebeat.com"
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