FROM node:8.9.0
RUN apt-get update
RUN apt-get install curl apt-transport-https -y
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install yarn g++ -y
ENV NODE_ENV staging
COPY . /var/server/
WORKDIR /var/server/
RUN yarn --production
EXPOSE 3000
ENTRYPOINT ["node", "src/index.js"]
