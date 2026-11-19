# DDM console (JavaScript SDKs): build the static site with Node, serve it with nginx.
#   docker build -t ddm-sdk-console .
#   docker run --rm -p 5181:80 ddm-sdk-console      -> http://localhost:5181

# ---- build ----
FROM node:20.18.1-alpine3.20 AS build
WORKDIR /app
# puppeteer-core (used only by the browser checks in tests/) never downloads a browser
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

# ---- serve ----
FROM nginx:1.27.3-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
