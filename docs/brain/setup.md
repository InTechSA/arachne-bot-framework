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
- You must have a local installation of [NodeJS](https://nodejs.org) _(Tested for LTS 8, v9.9.0 and v10.0.0)_ with npm.
- Clone this repository using `git clone https://github.com/InTechSA/arachne-bot-framework`.
- Move into the brain folder: `cd bot-architecture-poc/brain`.
- Install npm modules with `npm install`.
- Add the connect information to the database in `brain/database/secret.js`, exporting a valid `host` string for mongodb (atlas, or even local if you have mongodb running on your computer) **OR** set the mongodb connexion string as an environment variable `MONGO_URL` (recommended see below).
- Run the brain with `npm start`, or with environment variables : `SET MONGO_URL="mongodb://localhost/botbrain" && SET PORT=8080 && node brain.js` _(Baware ! you must escape specific character, like `&`, in environment variables values !)_

> You can access the administration dashboard at [localhost:8080/dashboard](localhost:8080/dashboard). Setup admin user with [localhost:8080/setup](localhost:8080/setup), username is _Nakasar_ and password is _Password0_.

> Nota Bene: In order to use the natural language, you will have to create a skill exposing an `analyze` command). You may use any NLU service like wit.ai or recast.ai.

> You can set the running port using `SET PORT=5012 && node brain.js` instead of `npm start`.

---

![Docker install](/src/imgs/docker.png)
### Docker full install
> You may want to start a local chat server to test the bot on. You will need this repository, and an adapter projet (you can create one on your own or use one from the arachne team). To start all services at once, consider creating a docker-file using networks.

### Docker install
- Clone this repository using `git clone https://github.com/InTechSA/arachne-bot-framework`.
- Configure the `MONGO_URL` variable in the docker file with the appropriate connection string to your provider (eventually local mongodb) or set it when running container.
- Build the Brain image using the Dockerfile, then run it : `docker build . -t nakasar/botbrain` then `docker run -d -p 49160:8080 nakasar/botbrain` _(don't forget to expose port 49160 to access dashboard and brain API!)_. You can set environment variables with the extended command instead: `docker run -d -e MONGO_URL='mongodb://localhost/botbrain' -p 49160:8080 nakasar/botbrain`.
- Run rocketchat server and rocket chat adapter with docker-compose (in `connectors` folder, run `docker-compose up -d`).

> You can access the administration dashboard at [127.0.0.1:49160/dashboard](127.0.0.1:49160/dashboard). Setup admin user with [127.0.0.1:49160/setup](localhost:8080/setup), username is _Nakasar_ and password is _Password0_.

> Note Bene: If you run docker inside a Virtual Machine, be sure to expose the following ports in your VM software : 3012 <-> 49160 (adapter), 3000 <-> 3000 (rocketchat server). Dashboard will be accessible from [127.0.0.1:3012/dashboard](127.0.0.1:3012/dashboard).

> Nota Bene: In order to use the natural language, you will have to create a skill exposing an `analyze` command). You may use any NLU service like wit.ai or recast.ai.

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
| AUTH_SERVICE_KEY      |                                   | Public key or secret to check auth token from service |
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
AUTH_SERVICE_KEY=-----BEGIN PUBLIC KEY-----\r\nazdazdazdazda...azdadazd\r\ndpLaz45d...azd5da\r\n-----END PUBLIC KEY-----
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