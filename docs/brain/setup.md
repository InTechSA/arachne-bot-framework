# Setup

## IMPORTANT
### Known issues
> Hubot-RocketChat v2.x.x will crash due to incompatibilities with hubot 3 (atm).

[Install with NPM](#classical-installation)  
[Full Easy Install with Docker](#docker-full-install)  
[Install with Docker](#docker-install)

[Full list of environments variables for configuration](#environment)  
[Using an external Auth Service](#external-auth-service)

---

## Install
### Classical installation
- You must have a local installation of [NodeJS](https://nodejs.org) _(Tested for LTS 8 and v9.9.0)_ with npm.
- Clone this repository using `git clone https://github.com/InTechSA/arachne-bot-framework`.
- Move into the brain folder: `cd bot-architecture-poc/brain`.
- Install npm modules with `npm install`.
- Add the connect information to the database in `brain/database/secret.js`, exporting a valid `host` string for mongodb (atlas, or even local if you have mongodb running on your computer) **OR** set the mongodb connexion string as an environment variable `MONGO_URL` (see below).
- Run the brain with `npm start`, or with environment variables : `SET MONGO_URL="mongodb://localhost/botbrain" && SET PORT=8080 && node brain.js` _(Baware ! you must escape specific character, like `&`, in environment variables values !)_
- _Optional : run microservices at will using `npm install` and `npm start`._

> You can access the administration dashboard at [localhost:8080/dashboard](localhost:8080/dashboard). Setup admin user with [localhost:8080/dashboard/setup](localhost:8080/dashboard/setup), username is _Nakasar_ and password is _Password0_.

> Nota Bene: In order to use the nlp skill, you must add a `secret.js` file in the `brain/logic/skills/nlp` folder exporting a `recastai_token` with your recast ai token. (Or you may recode a new nlp skill exposing an `analyse` command). You also may set the `recastai_token` secret within the dashboard after running the brain.

> You can set the running port using `SET PORT=5012 && node brain.js` instead of `npm start`.

---

![Docker install](/src/imgs/docker.png)
### Docker full install
> Using the docker-compose file at the root of the project, you can run the brain, a mongo server, a rocketchat server and the adapter with a few commands, then start building skills.

- Clone this repository using `git clone https://github.com/InTechSA/arachne-bot-framework` then checkout a release branch (or keep master). Or download a release from github website.  
- Edit or create a .env file at the root of the project: `cd bot-architecture-poc` then `nano .env`. Let the BOT_TOKEN empty as you can't create one yet.  

```
###
# ADAPTER
###
BOT_URL=http://brain:8080
BOT_TOKEN=
HUBOT_NAME=superbot
ROCKETCHAT_USER=superbot
ROCKETCHAT_PASSWORD=password

###
# BRAIN
###
# Url of the brain.
MONGO_URL=mongodb://mongo:27017/brain
BRAIN_HOST=0.0.0.0
BRAIN_PORT=8080
```

- Run the containers with `docker-compose up -d`.
- The bot adapter should crash in loop. You have to connect to [http://localhost:3000](http://localhost:3000) and create a user named `superbot` with password `password`.
- Setup the dashboard admin account at [http://localhost:3012/dashboard/setup](http://localhost:3012/dashboard/setup)
- Login to the dashboard as admin: [http://localhost:3012/dashboard/login](http://localhost:3012/dashboard/login). Username is `Nakasar` and password is `Password0`.
- Go to the connectors pannel [http://localhost:3012/dashboard/connectors](http://localhost:3012/dashboard/connectors) and create a new connector. Copy its token.
- Edit the BOT_TOKEN variable in the .env file with the token you just copied.
- Stop all containers with `docker-compose stop` and run them again with `docker-compose up -d --build`.
- Here you are! You can create other account on rocketchat and have fun with the bot!

> Note Bene: To use the natural language, you must edit the skill named _nlp_ and add a secret with key `recastai_token` and the recast.ai token as value, or create a new skill with a command named "analyzed".

---

### Docker install
- Clone this repository using `git clone https://github.com/InTechSA/arachne-bot-framework`.
- Configure the `MONGO_URL` variable in the docker file with the appropriate connection string to your provider (eventually local mongodb) or set it when running container.
- Build the Brain image using the Dockerfile, then run it : _(in brain/)_ `docker build . -t nakasar/botbrain` then `docker run -d -p 49160:8080 nakasar/botbrain` _(don't forget to expose port 49160 to access dashboard and brain API!)_. You can set environment variables with the extended command instead: `docker run -d -e MONGO_URL='mongodb://localhost/botbrain' -p 49160:8080 nakasar/botbrain`.
- Run rocketchat server and rocket chat adapter with docker-compose (in `connectors` folder, run `docker-compose up -d`).

> You can access the administration dashboard at [127.0.0.1:49160/dashboard](127.0.0.1:49160/dashboard). Setup admin user with [127.0.0.1:49160/dashboard/setup](localhost:8080/dashboard/setup), username is _Nakasar_ and password is _Password0_.

> Note Bene: If you run docker inside a Virtual Machine, be sure to expose the following ports in your VM software : 3012 <-> 49160 (adapter), 3000 <-> 3000 (rocketchat server). Dashboard will be accessible from [127.0.0.1:3012/dashboard](127.0.0.1:3012/dashboard).

> Nota Bene: In order to use the nlp skill, you must add a `secret.js` file in the `brain/logic/skills/nlp` folder exporting a `recastai_token` with your recast ai token. (Or you may recode a new nlp skill exposing an `analyze` command). You also may set the `recastai_token` secret within the dashboard after running the brain.

> Nota Bene: If you are using the rocketchat server included, you must create a user named `superbot`, a random email, and password `password` for the bot. Then log out and create another account for you.

---

## ENVIRONMENT

| VARIABLE              | DEFAULT                           | DESCRIPTION                                           |
| --------------------- | --------------------------------- | ----------------------------------------------------- |
| PORT                  | 80                                | Port the brain will be listening on.                  |
| HOST                  | 0.0.0.0                           | The domain/host the brain will be listening on.       |
| MONGO_URL             | mongodb://localhost:27017/arachne | The address/connection sting with the brain database. |
| ADMIN_USER            | Nakasar                           | Username of the first admin user                      |
| USE_AUTH_SERVICE      | false                             | If true, the brain will use an external auth service. |
| AUTH_SERVICE_ROUTE    |                                   | Route to the auth service to use.                     |
| AUTH_SERVICE_METHOD   | POST                              | Method of the auth service route.                     |
| AUTH_SERVICE_USERNAME_FIELD   | username                  | Name of the username field.                           |
| AUTH_SERVICE_PASSWORD_FIELD   | password                  | Name of the password field.                           |

---

## External Auth Service
Using the following environments variables:

```
USE_AUTH_SERVICE=true
AUTH_SERVICE_ROUTE=https://myad-service.mysociety.com/authentication
AUTH_SERVICE_METHOD=POST
AUTH_SERVICE_PASSWORD_FIELD=password
AUTH_SERVICE_USERNAME_FIELD=username
ADMIN_USER=Nakasar
```

The ADMIN_USER should be able to connect using the external auth service with this username, so make sure it is correct!

```
set USE_AUTH_SERVICE=true && set AUTH_SERVICE_ROUTE=https://myad-service.mysociety.com/authentication && set AUTH_SERVICE_METHOD=POST && set AUTH_SERVICE_PASSWORD_FIELD=password && set AUTH_SERVICE_USERNAME_FIELD=username && set ADMIN_USER=Nakasar && npm start
```

Any authentification via the login portal with `Nakasar` and `Password0` will send this request:

```javascript
request({
    method: "POST",
    url: "https://myad-service.mysociety.com/authentication",
    data: { username: 'Nakasar', password: 'Password0'}
});
```

The login will be validated if the auth service returns a success.