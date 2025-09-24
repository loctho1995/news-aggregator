# Dockerfile (đặt ở root repo)
FROM nginx:alpine

# Copy toàn bộ file tĩnh (index.html, /assets, v.v.) vào web root
COPY . /usr/share/nginx/html

# Mở cổng 80
EXPOSE 80

# Chạy Nginx ở foreground
CMD ["nginx", "-g", "daemon off;"]
