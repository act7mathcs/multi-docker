
# We configure our nginx server using default.conf (in the nginx subfolder within the client folder). In our default.conf, we make sure nginx listens to port 3000 (the default React port) instead of 80 (the default nginx port).
FROM node:alpine as builder
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
# We create our production assets in the WORKDIR with npm run build.
RUN npm run build

FROM nginx
EXPOSE 3000
# Copy and override the default.conf file (containing the nginx configurations).
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
# Copy the build production assets into the /usr/share/nginx/html directory in the container.
COPY --from=builder /app/build /usr/share/nginx/html



