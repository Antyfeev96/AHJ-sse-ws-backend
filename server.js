const http = require("http");
const Koa = require("koa");
const { v4: uuidv4 } = require('uuid');
const Router = require("koa-router");
const WS = require('ws');

const app = new Koa();

const users = [
  {
    name: 'Mishka',
    id: uuidv4()
  },
  {
    name: 'Alex',
    id: uuidv4()
  },
  {
    name: 'Homelander',
    id: uuidv4()
  }
];

const messages = [
  {
    name: 'Mishka',
    text: 'Hello there!!!'
  },
  {
    name: 'Alex',
    text: 'Hello' 
  },
  {
    name: 'Homelander',
    text: 'I can do whatever I want!'
  }
];

app.use(async (ctx, next) => {
  const origin = ctx.request.get("Origin");
  if (!origin) {
    return await next();
  }

  const headers = { "Access-Control-Allow-Origin": "*" };

  if (ctx.request.method !== "OPTIONS") {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get("Access-Control-Request-Method")) {
    ctx.response.set({
      ...headers,
      "Access-Control-Allow-Methods": "GET, POST, PUD, DELETE, PATCH",
    });
  }

  if (ctx.request.get("Access-Control-Request-Headers")) {
    ctx.response.set(
      "Access-Control-Allow-Headers",
      ctx.request.get("Access-Control-Request-Headers")
    );
  }

  ctx.response.status = 204;

  ctx.respond = false;
});

const router = new Router();

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port);
const wsServer = new WS.Server({server});

wsServer.on('connection', (ws, req) => {
  const errCallback = (err) => {
    if (err) {
      console.log(err);
    }
  }

  ws.on('message', msg => {
    const request = JSON.parse(msg);
    if (request.type === 'addUser') {
      if (users.find(user => user.name === request.name)) {
        ws.send('Никнейм занят', errCallback('Никнейм занят'));
      } else {
        users.push({
          name: request.name,
          id: uuidv4()
        })
        Array.from(wsServer.clients)
          .filter(o => o.readyState === WS.OPEN)
          .forEach(o => {
            o.send(JSON.stringify(users));
            o.send(JSON.stringify(messages));
          })
      }
      return;
    }

    if (request.type === 'sendMessage') {
      messages.push({
        name: request.name,
        text: request.text
      });
      console.log(messages);
      Array.from(wsServer.clients)
        .filter(o => o.readyState === WS.OPEN)
        .forEach(o => o.send(JSON.stringify(messages)));
    }
  });
});
