'use strict';
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';


// Create missing secret.js file if not present.
if (!fs.existsSync(path.join(__dirname, "/secret.js"))) {
  console.log("> [WARNING] brain/secret.js file does not exists. We'll create a new one for you with a random secret value!");
  let secret = Math.random().toString(16).substring(2);
  let content = `module.exports = { secret: "${secret}" };`;
  fs.writeFileSync(path.join(__dirname, "/secret.js"), content);
}

app.set('title', 'Bot Brain Interface');
app.set('views', './dashboard/views');
app.set('view engine', 'pug');

app.use(require('cors')());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Load and connect database module.
let db = require('./database/db');
db.connect();

// Init routes.
let router = require('./router.js')(io);
app.use(router);

http.listen(PORT, HOST, () => console.log(`\n\x1b[36m> [INFO] Bot brain listening on http://${HOST}:${PORT}!\x1b[0m`));
