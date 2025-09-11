// server/constants/sources.js - Complete version with ALL sources
export const SOURCE_GROUPS = {
  

  security: {
    id: "security",
    name: "Bảo mật",
    description: "Tin tức an ninh mạng, lỗ hổng, cảnh báo"
  },
vietnam: {
    id: "vietnam",
    name: "Tin tức Việt Nam",
    description: "Tổng hợp báo chí trong nước"
  },
  vietnameconomic: {
    id: "vietnameconomic",
    name: "Kinh tế Việt Nam",
    description: "Tin tức kinh tế, tài chính, chứng khoán VN"
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
  

  krebsonsecurity_com: {
    id: "krebsonsecurity_com",
    name: "Krebsonsecurity Com",
    group: "security",
    type: "html",
    url: "https://krebsonsecurity.com/",
    homepage: "https://krebsonsecurity.com"
  },

  thehackernews_com: {
    id: "thehackernews_com",
    name: "Thehackernews Com",
    group: "security",
    type: "html",
    url: "https://thehackernews.com/",
    homepage: "https://thehackernews.com"
  },

  bleepingcomputer_com_news_security: {
    id: "bleepingcomputer_com_news_security",
    name: "Bleepingcomputer Com News Security",
    group: "security",
    type: "html",
    url: "https://www.bleepingcomputer.com/news/security/",
    homepage: "https://www.bleepingcomputer.com/news/security"
  },

  darkreading_com: {
    id: "darkreading_com",
    name: "Darkreading Com",
    group: "security",
    type: "html",
    url: "https://www.darkreading.com/",
    homepage: "https://www.darkreading.com"
  },

  securityweek_com: {
    id: "securityweek_com",
    name: "Securityweek Com",
    group: "security",
    type: "html",
    url: "https://www.securityweek.com/",
    homepage: "https://www.securityweek.com"
  },

  therecord_media: {
    id: "therecord_media",
    name: "Therecord Media",
    group: "security",
    type: "html",
    url: "https://therecord.media/",
    homepage: "https://therecord.media"
  },

  cyberscoop_com: {
    id: "cyberscoop_com",
    name: "Cyberscoop Com",
    group: "security",
    type: "html",
    url: "https://www.cyberscoop.com/",
    homepage: "https://www.cyberscoop.com"
  },

  cybersecuritydive_com: {
    id: "cybersecuritydive_com",
    name: "Cybersecuritydive Com",
    group: "security",
    type: "html",
    url: "https://www.cybersecuritydive.com/",
    homepage: "https://www.cybersecuritydive.com"
  },

  scmagazine_com: {
    id: "scmagazine_com",
    name: "Scmagazine Com",
    group: "security",
    type: "html",
    url: "https://www.scmagazine.com/",
    homepage: "https://www.scmagazine.com"
  },

  theregister_com_security: {
    id: "theregister_com_security",
    name: "Theregister Com Security",
    group: "security",
    type: "html",
    url: "https://www.theregister.com/security/",
    homepage: "https://www.theregister.com/security"
  },

  wired_com_category_security: {
    id: "wired_com_category_security",
    name: "Wired Com Category Security",
    group: "security",
    type: "html",
    url: "https://www.wired.com/category/security/",
    homepage: "https://www.wired.com/category/security"
  },

  arstechnica_com_security: {
    id: "arstechnica_com_security",
    name: "Arstechnica Com Security",
    group: "security",
    type: "html",
    url: "https://arstechnica.com/security/",
    homepage: "https://arstechnica.com/security"
  },

  databreaches_net: {
    id: "databreaches_net",
    name: "Databreaches Net",
    group: "security",
    type: "html",
    url: "https://www.databreaches.net/",
    homepage: "https://www.databreaches.net"
  },

  isc_sans_edu_diary_html: {
    id: "isc_sans_edu_diary_html",
    name: "Isc Sans Edu Diary Html",
    group: "security",
    type: "html",
    url: "https://isc.sans.edu/diary.html",
    homepage: "https://isc.sans.edu/diary.html"
  },

  cisa_gov_news_events_cybersecurity_advisories: {
    id: "cisa_gov_news_events_cybersecurity_advisories",
    name: "Cisa Gov News Events Cybersecurity Advisories",
    group: "security",
    type: "html",
    url: "https://www.cisa.gov/news-events/cybersecurity-advisories",
    homepage: "https://www.cisa.gov/news-events/cybersecurity-advisories"
  },

  ncsc_gov_uk_news: {
    id: "ncsc_gov_uk_news",
    name: "Ncsc Gov Uk News",
    group: "security",
    type: "html",
    url: "https://www.ncsc.gov.uk/news",
    homepage: "https://www.ncsc.gov.uk/news"
  },

  enisa_europa_eu_news: {
    id: "enisa_europa_eu_news",
    name: "Enisa Europa Eu News",
    group: "security",
    type: "html",
    url: "https://www.enisa.europa.eu/news",
    homepage: "https://www.enisa.europa.eu/news"
  },

  kb_cert_org_vuls: {
    id: "kb_cert_org_vuls",
    name: "Kb Cert Org Vuls",
    group: "security",
    type: "html",
    url: "https://www.kb.cert.org/vuls/",
    homepage: "https://www.kb.cert.org/vuls"
  },

  csa_gov_sg_alerts_advisories: {
    id: "csa_gov_sg_alerts_advisories",
    name: "Csa Gov Sg Alerts Advisories",
    group: "security",
    type: "html",
    url: "https://www.csa.gov.sg/alerts-advisories",
    homepage: "https://www.csa.gov.sg/alerts-advisories"
  },

  blogs_jpcert_or_jp_en: {
    id: "blogs_jpcert_or_jp_en",
    name: "Blogs Jpcert Or Jp En",
    group: "security",
    type: "html",
    url: "https://blogs.jpcert.or.jp/en/",
    homepage: "https://blogs.jpcert.or.jp/en"
  },

  blog_google_threat_analysis_group: {
    id: "blog_google_threat_analysis_group",
    name: "Blog Google Threat Analysis Group",
    group: "security",
    type: "html",
    url: "https://blog.google/threat-analysis-group/",
    homepage: "https://blog.google/threat-analysis-group"
  },

  unit42_paloaltonetworks_com: {
    id: "unit42_paloaltonetworks_com",
    name: "Unit42 Paloaltonetworks Com",
    group: "security",
    type: "html",
    url: "https://unit42.paloaltonetworks.com/",
    homepage: "https://unit42.paloaltonetworks.com"
  },

  blog_talosintelligence_com: {
    id: "blog_talosintelligence_com",
    name: "Blog Talosintelligence Com",
    group: "security",
    type: "html",
    url: "https://blog.talosintelligence.com/",
    homepage: "https://blog.talosintelligence.com"
  },

  msrc_microsoft_com_blog: {
    id: "msrc_microsoft_com_blog",
    name: "Msrc Microsoft Com Blog",
    group: "security",
    type: "html",
    url: "https://msrc.microsoft.com/blog/",
    homepage: "https://msrc.microsoft.com/blog"
  },

  mandiant_com_resources_blog: {
    id: "mandiant_com_resources_blog",
    name: "Mandiant Com Resources Blog",
    group: "security",
    type: "html",
    url: "https://www.mandiant.com/resources/blog",
    homepage: "https://www.mandiant.com/resources/blog"
  },

  crowdstrike_com_blog: {
    id: "crowdstrike_com_blog",
    name: "Crowdstrike Com Blog",
    group: "security",
    type: "html",
    url: "https://www.crowdstrike.com/blog/",
    homepage: "https://www.crowdstrike.com/blog"
  },

  news_sophos_com_en_us_category_threat_research: {
    id: "news_sophos_com_en_us_category_threat_research",
    name: "News Sophos Com En Us Category Threat Research",
    group: "security",
    type: "html",
    url: "https://news.sophos.com/en-us/category/threat-research/",
    homepage: "https://news.sophos.com/en-us/category/threat-research"
  },

  securelist_com: {
    id: "securelist_com",
    name: "Securelist Com",
    group: "security",
    type: "html",
    url: "https://securelist.com/",
    homepage: "https://securelist.com"
  },

  welivesecurity_com: {
    id: "welivesecurity_com",
    name: "Welivesecurity Com",
    group: "security",
    type: "html",
    url: "https://www.welivesecurity.com/",
    homepage: "https://www.welivesecurity.com"
  },

  bitdefender_com_blog_labs: {
    id: "bitdefender_com_blog_labs",
    name: "Bitdefender Com Blog Labs",
    group: "security",
    type: "html",
    url: "https://www.bitdefender.com/blog/labs/",
    homepage: "https://www.bitdefender.com/blog/labs"
  },

  research_checkpoint_com: {
    id: "research_checkpoint_com",
    name: "Research Checkpoint Com",
    group: "security",
    type: "html",
    url: "https://research.checkpoint.com/",
    homepage: "https://research.checkpoint.com"
  },

  recordedfuture_com_research: {
    id: "recordedfuture_com_research",
    name: "Recordedfuture Com Research",
    group: "security",
    type: "html",
    url: "https://www.recordedfuture.com/research",
    homepage: "https://www.recordedfuture.com/research"
  },

  rapid7_com_blog: {
    id: "rapid7_com_blog",
    name: "Rapid7 Com Blog",
    group: "security",
    type: "html",
    url: "https://www.rapid7.com/blog/",
    homepage: "https://www.rapid7.com/blog"
  },

  snyk_io_blog: {
    id: "snyk_io_blog",
    name: "Snyk Io Blog",
    group: "security",
    type: "html",
    url: "https://snyk.io/blog/",
    homepage: "https://snyk.io/blog"
  },
// ===== VIETNAM ECONOMIC NEWS =====
  
  // Báo Công Thương
  congthuong: {
    id: "congthuong",
    name: "Báo Công Thương",
    group: "vietnameconomic",
    type: "rss",
    url: "https://congthuong.vn/rss/trang-chu.rss",
    homepage: "https://congthuong.vn"
  },
  congthuong_finance: {
    id: "congthuong_finance",
    name: "Công Thương - Tài chính",
    group: "vietnameconomic",
    type: "rss",
    url: "https://congthuong.vn/rss/tai-chinh.rss",
    homepage: "https://congthuong.vn/tai-chinh"
  },
  congthuong_business: {
    id: "congthuong_business",
    name: "Công Thương - Kinh doanh",
    group: "vietnameconomic",
    type: "rss",
    url: "https://congthuong.vn/rss/doanh-nghiep.rss",
    homepage: "https://congthuong.vn/doanh-nghiep"
  },
  
  // Tạp chí Tài chính
  tapchitaichinh: {
    id: "tapchitaichinh",
    name: "Tạp chí Tài chính",
    group: "vietnameconomic",
    type: "rss",
    url: "https://tapchitaichinh.vn/rss/tai-chinh-kinh-doanh.rss",
    homepage: "https://tapchitaichinh.vn"
  },
  tapchitaichinh_stock: {
    id: "tapchitaichinh_stock",
    name: "TCTC - Chứng khoán",
    group: "vietnameconomic",
    type: "rss",
    url: "https://tapchitaichinh.vn/rss/thi-truong-chung-khoan.rss",
    homepage: "https://tapchitaichinh.vn/thi-truong-chung-khoan"
  },
  
  // Thời báo Ngân hàng
  thoibaonganhang: {
    id: "thoibaonganhang",
    name: "Thời báo Ngân hàng",
    group: "vietnameconomic",
    type: "rss",
    url: "https://thoibaonganhang.vn/rss/home.rss",
    homepage: "https://thoibaonganhang.vn"
  },
  thoibaonganhang_banking: {
    id: "thoibaonganhang_banking",
    name: "TBNH - Ngân hàng",
    group: "vietnameconomic",
    type: "rss",
    url: "https://thoibaonganhang.vn/rss/ngan-hang.rss",
    homepage: "https://thoibaonganhang.vn/ngan-hang"
  },
  
  // Tạp chí Kinh tế Việt Nam
  tapchikinhte: {
    id: "tapchikinhte",
    name: "Tạp chí Kinh tế VN",
    group: "vietnameconomic",
    type: "html",
    url: "https://tapchikinhte.vn",
    homepage: "https://tapchikinhte.vn"
  },
  
  // Doanh nhân Sài Gòn
  doanhnhansaigon: {
    id: "doanhnhansaigon",
    name: "Doanh nhân Sài Gòn",
    group: "vietnameconomic",
    type: "rss",
    url: "https://doanhnhansaigon.vn/rss/home.rss",
    homepage: "https://doanhnhansaigon.vn"
  },
  doanhnhansaigon_business: {
    id: "doanhnhansaigon_business",
    name: "DNSG - Doanh nghiệp",
    group: "vietnameconomic",
    type: "rss",
    url: "https://doanhnhansaigon.vn/rss/doanh-nghiep.rss",
    homepage: "https://doanhnhansaigon.vn/doanh-nghiep"
  },
  
  // EnterNews
  enternews: {
    id: "enternews",
    name: "EnterNews",
    group: "vietnameconomic",
    type: "rss",
    url: "https://enternews.vn/rss/trang-chu.rss",
    homepage: "https://enternews.vn"
  },
  enternews_startup: {
    id: "enternews_startup",
    name: "EnterNews - Startup",
    group: "vietnameconomic",
    type: "rss",
    url: "https://enternews.vn/rss/startup.rss",
    homepage: "https://enternews.vn/startup"
  },
  
  // VietnamBiz
  vietnambiz: {
    id: "vietnambiz",
    name: "VietnamBiz",
    group: "vietnameconomic",
    type: "rss",
    url: "https://vietnambiz.vn/rss/home.rss",
    homepage: "https://vietnambiz.vn"
  },
  vietnambiz_market: {
    id: "vietnambiz_market",
    name: "VietnamBiz - Thị trường",
    group: "vietnameconomic",
    type: "rss",
    url: "https://vietnambiz.vn/rss/thi-truong.rss",
    homepage: "https://vietnambiz.vn/thi-truong.htm"
  },
  vietnambiz_finance: {
    id: "vietnambiz_finance",
    name: "VietnamBiz - Tài chính",
    group: "vietnameconomic",
    type: "rss",
    url: "https://vietnambiz.vn/rss/tai-chinh.rss",
    homepage: "https://vietnambiz.vn/tai-chinh.htm"
  },
  
  // Kinh tế Chứng khoán
  kinhtechungkhoan: {
    id: "kinhtechungkhoan",
    name: "Kinh tế Chứng khoán",
    group: "vietnameconomic",
    type: "html",
    url: "https://kinhtechungkhoan.vn",
    homepage: "https://kinhtechungkhoan.vn"
  },
  
  // Tạp chí Kinh tế Quốc tế
  tapchikinhtequocte: {
    id: "tapchikinhtequocte",
    name: "TC Kinh tế Quốc tế",
    group: "vietnameconomic",
    type: "html",
    url: "https://tapchikinhtequocte.vn",
    homepage: "https://tapchikinhtequocte.vn"
  },
  
  // Index.vn
  indexvn: {
    id: "indexvn",
    name: "Index.vn",
    group: "vietnameconomic",
    type: "html",
    url: "https://index.vn",
    homepage: "https://index.vn"
  },
  
  // VnEconomy (moved to vietnameconomic group)
  vneconomy_eco: {
    id: "vneconomy_eco",
    name: "VnEconomy",
    group: "vietnameconomic",
    type: "rss",
    url: "https://vneconomy.vn/rss/home.rss",
    homepage: "https://vneconomy.vn"
  },
  vneconomy_business: {
    id: "vneconomy_business",
    name: "VnEconomy - Doanh nghiệp",
    group: "vietnameconomic",
    type: "rss",
    url: "https://vneconomy.vn/rss/doanh-nghiep.rss",
    homepage: "https://vneconomy.vn/doanh-nghiep.htm"
  },
  vneconomy_stock: {
    id: "vneconomy_stock",
    name: "VnEconomy - Chứng khoán",
    group: "vietnameconomic",
    type: "rss",
    url: "https://vneconomy.vn/rss/chung-khoan.rss",
    homepage: "https://vneconomy.vn/chung-khoan.htm"
  },
  
  // CafeF (added to vietnameconomic)
  cafef_eco: {
    id: "cafef_eco",
    name: "CafeF",
    group: "vietnameconomic",
    type: "rss",
    url: "https://cafef.vn/trang-chu.rss",
    homepage: "https://cafef.vn"
  },
  cafef_market: {
    id: "cafef_market",
    name: "CafeF - Thị trường CK",
    group: "vietnameconomic",
    type: "rss",
    url: "https://cafef.vn/thi-truong-chung-khoan.rss",
    homepage: "https://cafef.vn/thi-truong-chung-khoan.chn"
  },
  cafef_realestate: {
    id: "cafef_realestate",
    name: "CafeF - Bất động sản",
    group: "vietnameconomic",
    type: "rss",
    url: "https://cafef.vn/bat-dong-san.rss",
    homepage: "https://cafef.vn/bat-dong-san.chn"
  },
  cafef_banking: {
    id: "cafef_banking",
    name: "CafeF - Ngân hàng",
    group: "vietnameconomic",
    type: "rss",
    url: "https://cafef.vn/tai-chinh-ngan-hang.rss",
    homepage: "https://cafef.vn/tai-chinh-ngan-hang.chn"
  },
  
  // CafeBiz (added to vietnameconomic)
  cafebiz_eco: {
    id: "cafebiz_eco",
    name: "CafeBiz",
    group: "vietnameconomic",
    type: "rss",
    url: "https://cafebiz.vn/trang-chu.rss",
    homepage: "https://cafebiz.vn"
  },
  cafebiz_startup: {
    id: "cafebiz_startup",
    name: "CafeBiz - Startup",
    group: "vietnameconomic",
    type: "rss",
    url: "https://cafebiz.vn/startup.rss",
    homepage: "https://cafebiz.vn/startup.chn"
  },
  cafebiz_leader: {
    id: "cafebiz_leader",
    name: "CafeBiz - Leadership",
    group: "vietnameconomic",
    type: "rss",
    url: "https://cafebiz.vn/cau-chuyen-kinh-doanh.rss",
    homepage: "https://cafebiz.vn/cau-chuyen-kinh-doanh.chn"
  },
  
  // The Saigon Times
  saigontimes: {
    id: "saigontimes",
    name: "The Saigon Times",
    group: "vietnameconomic",
    type: "rss",
    url: "https://thesaigontimes.vn/rss/home.rss",
    homepage: "https://thesaigontimes.vn"
  },
  saigontimes_business: {
    id: "saigontimes_business",
    name: "Saigon Times - Kinh doanh",
    group: "vietnameconomic",
    type: "rss",
    url: "https://thesaigontimes.vn/rss/kinh-doanh.rss",
    homepage: "https://thesaigontimes.vn/kinh-doanh"
  },
  saigontimes_finance: {
    id: "saigontimes_finance",
    name: "Saigon Times - Tài chính",
    group: "vietnameconomic",
    type: "rss",
    url: "https://thesaigontimes.vn/rss/tai-chinh.rss",
    homepage: "https://thesaigontimes.vn/tai-chinh"
  },
  
  // Thời báo Tài chính Việt Nam
  thoibaotaichinh: {
    id: "thoibaotaichinh",
    name: "TB Tài chính VN",
    group: "vietnameconomic",
    type: "rss",
    url: "https://thoibaotaichinhvietnam.vn/rss/home.rss",
    homepage: "https://thoibaotaichinhvietnam.vn"
  },
  thoibaotaichinh_banking: {
    id: "thoibaotaichinh_banking",
    name: "TBTC - Ngân hàng",
    group: "vietnameconomic",
    type: "rss",
    url: "https://thoibaotaichinhvietnam.vn/rss/ngan-hang.rss",
    homepage: "https://thoibaotaichinhvietnam.vn/pages/tien-te-bao-hiem/ngan-hang.aspx"
  },
  thoibaotaichinh_stock: {
    id: "thoibaotaichinh_stock",
    name: "TBTC - Chứng khoán",
    group: "vietnameconomic",
    type: "rss",
    url: "https://thoibaotaichinhvietnam.vn/rss/chung-khoan.rss",
    homepage: "https://thoibaotaichinhvietnam.vn/pages/chung-khoan.aspx"
  },
  
  // Kinh tế và Dự báo
  kinhtevadubao: {
    id: "kinhtevadubao",
    name: "Kinh tế & Dự báo",
    group: "vietnameconomic",
    type: "rss",
    url: "http://kinhtevadubao.vn/rss/home.rss",
    homepage: "http://kinhtevadubao.vn"
  },
  kinhtevadubao_macro: {
    id: "kinhtevadubao_macro",
    name: "KT&DB - Kinh tế vĩ mô",
    group: "vietnameconomic",
    type: "rss",
    url: "http://kinhtevadubao.vn/rss/kinh-te-vi-mo.rss",
    homepage: "http://kinhtevadubao.vn/kinh-te-vi-mo.html"
  },
  kinhtevadubao_finance: {
    id: "kinhtevadubao_finance",
    name: "KT&DB - Tài chính",
    group: "vietnameconomic",
    type: "rss",
    url: "http://kinhtevadubao.vn/rss/tai-chinh.rss",
    homepage: "http://kinhtevadubao.vn/tai-chinh.html"
  },
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