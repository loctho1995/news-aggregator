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
  ft: {
    id: "ft",
    name: "Financial Times",
    group: "internationaleconomics",
    type: "rss",
    url: "https://www.ft.com/world?format=rss",
    homepage: "https://www.ft.com",
  },
  bloomberg: {
    id: "bloomberg",
    name: "Bloomberg",
    group: "internationaleconomics",
    type: "rss",
    url: "https://feeds.bloomberg.com/markets/news.rss",
    homepage: "https://www.bloomberg.com",
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