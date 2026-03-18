FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src/ ./src/
# เพิ่ม User เพื่อความปลอดภัยตามมาตรฐาน
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3002
CMD ["node", "src/index.js"]