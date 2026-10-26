FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG API_URL=http://localhost:8000/api
RUN sed -i "s#apiUrl: '.*'#apiUrl: '${API_URL}'#" src/environments/environment.ts \
 && npx ng build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/inlinepadel/browser /usr/share/nginx/html
EXPOSE 80
