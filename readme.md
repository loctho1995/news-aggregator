# Hướng dẫn cài đặt VN News Aggregator với AI Tóm tắt

## Tổng quan
Ứng dụng tổng hợp tin tức Việt Nam với tính năng AI tóm tắt thông minh, dịch thuật tự động và giao diện hiện đại.

## Yêu cầu hệ thống
- Node.js 18+ 
- NPM hoặc Yarn
- 2GB RAM tối thiểu
- Kết nối Internet

## Phần 1: Tạo Project

### Bước 1: Tạo cấu trúc thư mục
```bash
mkdir vn-news-aggregator
cd vn-news-aggregator
mkdir src public
```

### Bước 2: Tạo package.json
```json
{
  "name": "vn-news-aggregator",
  "version": "1.3.0", 
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node server.js",
    "start": "NODE_ENV=production node server.js"
  },
  "dependencies": {
    "cheerio": "^1.0.0-rc.12",
    "dayjs": "^1.11.13", 
    "express": "^4.19.2",
    "pino": "^9.4.0",
    "cors": "^2.8.5",
    "rss-parser": "^3.13.0",
    "dotenv": "^16.3.1"
  }
}
```

### Bước 3: Cài đặt dependencies
```bash
npm install
```

## Phần 2: Tạo các file source code

### File 1: server.js (Root directory)
Copy toàn bộ nội dung từ artifact "server.js - Final Version" vào file này.

### File 2: src/sources.js
Copy nội dung từ document gốc vào file này.

### File 3: src/aggregator.js  
Copy nội dung từ document gốc vào file này.

### File 4: public/index.html
Copy toàn bộ nội dung từ artifact "index.html - Final Version" vào file này.

### File 5: public/app.js
Copy toàn bộ nội dung từ artifact "app.js - Final Version" vào file này.

## Phần 3: Cấu hình Environment Variables

### Tạo file .env (Root directory)
```bash
# API Keys cho AI Summary (tùy chọn)
OPENAI_API_KEY=
COHERE_API_KEY=
HUGGINGFACE_API_KEY=

# Cấu hình server
PORT=3000
LOG_LEVEL=info
```

### Tạo file .gitignore
```
node_modules/
.env
.DS_Store  
*.log
dist/
```

## Phần 4: Lấy API Keys (Tùy chọn)

### HuggingFace API Key (MIỄN PHÍ - Khuyên dùng)
1. Truy cập: https://huggingface.co
2. Đăng ký tài khoản
3. Vào Settings → Access Tokens
4. Tạo token mới với quyền "Read" 
5. Copy token có dạng `hf_abcd1234...`
6. Paste vào .env: `HUGGINGFACE_API_KEY=hf_abcd1234...`

**Ưu điểm:**
- Hoàn toàn miễn phí
- Không cần thẻ tín dụng  
- Rate limit: 1000 requests/giờ
- Chất lượng tốt

### Cohere API Key (MIỄN PHÍ có giới hạn)
1. Truy cập: https://dashboard.cohere.com
2. Đăng ký tài khoản
3. Vào API Keys → Create API Key
4. Copy key có dạng `co_abcd1234...`
5. Paste vào .env: `COHERE_API_KEY=co_abcd1234...`

**Ưu điểm:**
- 1000 requests miễn phí/tháng
- Chuyên về summarization
- Chất lượng rất tốt

### OpenAI API Key (TRẢ PHÍ)
**Lưu ý:** ChatGPT subscription ≠ OpenAI API

1. Truy cập: https://platform.openai.com (KHÔNG phải chat.openai.com)
2. Đăng nhập hoặc tạo tài khoản mới
3. Vào API Keys → Create new secret key  
4. Copy key có dạng `sk-proj-abcd1234...`
5. Paste vào .env: `OPENAI_API_KEY=sk-proj-abcd1234...`

**Chi phí:**
- $5 credit miễn phí cho tài khoản mới
- Sau đó: ~$0.002/1000 tokens
- 1 bài tóm tắt ≈ $0.01-0.05

## Phần 5: Chạy ứng dụng

### Development mode
```bash
npm run dev
```

### Production mode  
```bash
npm start
```

Truy cập: http://localhost:3000

## Phần 6: Tính năng chính

### 1. Tổng hợp tin tức
- 20+ nguồn tin Việt Nam
- 7+ nguồn tin kinh tế quốc tế
- Real-time streaming
- Filter theo nguồn, nhóm, thời gian

### 2. AI Tóm tắt thông minh  
- 4 engine AI: OpenAI, Cohere, HuggingFace, Local
- Tự động dịch từ tiếng Anh
- Fallback system đảm bảo luôn hoạt động
- Hiển thị stats: độ nén, độ chính xác

### 3. Text-to-Speech
- Đọc to tóm tắt
- Điều chỉnh tốc độ đọc
- Hỗ trợ tiếng Việt và tiếng Anh

### 4. Giao diện người dùng
- Dark theme hiện đại
- Responsive design  
- Modal xem chi tiết
- Webview tích hợp
- Quản lý đã đọc/chưa đọc

## Phần 7: Deploy lên Production

### Cách 1: Railway (Khuyên dùng - Đơn giản)
1. Push code lên GitHub (không push .env)
2. Kết nối Railway với repo
3. Set environment variables trên dashboard Railway
4. Deploy tự động

### Cách 2: VPS với PM2
```bash
# Trên server
git clone your-repo
cd vn-news-aggregator
npm install

# Tạo .env production
nano .env
# Điền API keys thật

# Chạy với PM2
npm install -g pm2
pm2 start server.js --name news-app
pm2 startup
pm2 save
```

### Cách 3: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t news-app .
docker run -d \
  -e OPENAI_API_KEY="your-key" \
  -p 3000:3000 \
  news-app
```

## Phần 8: Troubleshooting

### Lỗi thường gặp

**1. Module not found**
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

**2. Port đã sử dụng**  
```bash
# Đổi port trong .env
PORT=3001
```

**3. AI Summary không hoạt động**
- Kiểm tra API keys trong .env
- Xem console logs
- App vẫn chạy với Local AI fallback

**4. Trang không tải được**
- Kiểm tra CORS settings
- Xem Network tab trong Developer Tools
- Một số trang chặn iframe

### Debug tips
```bash
# Bật debug logs
LOG_LEVEL=debug npm run dev

# Kiểm tra environment variables
node -e "console.log(process.env)"
```

## Phần 9: Tùy chỉnh

### Thêm nguồn tin mới
Chỉnh sửa `src/sources.js`:
```javascript
export const SOURCES = {
  // Thêm source mới
  newsource: {
    id: "newsource",
    name: "New Source",
    group: "vietnam", 
    type: "rss",
    url: "https://newssite.com/rss",
    homepage: "https://newssite.com"
  }
};
```

### Thay đổi giao diện
Chỉnh sửa `public/app.js` và `public/index.html` với Tailwind CSS classes.

### Cấu hình cache
Trong `server.js` điều chỉnh:
```javascript
const TTL_MS = 30 * 60 * 1000; // 30 phút
```

## Phần 10: Monitoring & Maintenance

### Logs
```bash
# Xem logs PM2
pm2 logs news-app

# Xem logs Docker  
docker logs container-name
```

### Health check
Endpoint: `GET /api/healthz`

### Backup
- Source code: Git repository
- Không cần backup database (dùng cache in-memory)

## Liên hệ & Support

**Lưu ý quan trọng:**
- App hoạt động tốt ngay cả không có API keys
- Chỉ cần HuggingFace key (miễn phí) là đủ chất lượng tốt
- OpenAI API khác với ChatGPT subscription
- Luôn giữ .env file an toàn, không chia sẻ

**Performance:**
- Mỗi lần tải: 30-50 bài
- Cache 30 phút  
- Streaming real-time updates
- Responsive trên mobile

Chúc bạn triển khai thành công!