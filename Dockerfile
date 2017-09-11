FROM node:6

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install -q

# Bundle app source
COPY . /usr/src/app
ENV NODE_ENV production
RUN npm start

FROM nginx:latest
COPY --from=0 /usr/src/app/dist/ /usr/share/nginx/html/