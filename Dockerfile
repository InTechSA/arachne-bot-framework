FROM node:9.10.0-alpine

LABEL description "A Bot core brain for Bot Brain Architecture."
LABEL author "Kevin Nakasar Thizy"

# Create app directory
WORKDIR /usr/src/botbrain

# Install app dependencies
COPY package*.json ./

# Necessary for bcrypt.js (only on alpine linux based images, install from node:9.10.0 otherwise).
# see https://github.com/kelektiv/node.bcrypt.js/wiki/Installation-Instructions#alpine-linux-based-images
RUN apk --no-cache add --virtual builds-deps build-base python

RUN npm install

# Rebuild bcrypt.js (see https://github.com/kelektiv/node.bcrypt.js/wiki/Installation-Instructions#alpine-linux-based-images)
RUN npm rebuild bcrypt --build-from-source

# Bundle app source
COPY . .

ENV PORT='80'
ENV HOST='0.0.0.0'
ENV API_DOC_URL='https://arachne-bot.intech-lab.com'
ENV MONGO_URL='mongodb://localhost:27017/arachne'
ENV USE_AUTH_SERVICE='true'
ENV AUTH_SERVICE_ROUTE='https://si-ad-test.intech-lab.com/authentication'
ENV AUTH_SERVICE_METHOD='POST'
ENV AUTH_SERVICE_USERNAME_FIELD='username'
ENV AUTH_SERVICE_PASSWORD_FIELD='password'
ENV ADMIN_USER='kevin.thizy'

EXPOSE 80

CMD [ "npm", "start" ]
