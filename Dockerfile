FROM node:18-alpine

# 앱 디렉토리 설정
WORKDIR /app

# 패키지 복사 및 설치
COPY package*.json ./
RUN npm install --production

# 소스 복사
COPY . .

# 포트 명시 (Cloud Run 등에서 필요)
EXPOSE 3001

# 앱 실행
CMD ["node", "index.js"]
