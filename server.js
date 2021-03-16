const http = require("http");
const Koa = require("koa");
const uuid = require("uuid");
const Router = require("koa-router");
const WS = require('ws');

const app = new Koa();

const users = [
  {
    name: 'Mishka',
    id: 1
  },
  {
    name: 'Alex',
    id: 2
  },
  {
    name: 'Homelander',
    id: 3
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

router.get("/users", async (ctx, next) => {
  ctx.response.body = users;
});

router.post("/users", async (ctx, next) => {
  users.push({ ...ctx.request.body, id:uuid.v4() });
  ctx.response.status=204;
});

router.delete('/users/:id', async (ctx, next) => {
  const index = users.findIndex(({ id }) => id === ctx.params.id);

  if (index !== -1) {
    users.splice(index,1);
  }
  ctx.response.status = 204;

})

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port);
const wsServer = new WS.Server({server});

wsServer.on('connection', (ws, req) => {
  const errCallback = (err) => {
    if (err) {
      console.log('error');
    }
  }

  ws.on('message', msg => {
    console.log(msg);

    Array.from(wsServer.clients)
      .filter(o => o.readyState === WS.OPEN)
      .forEach(o => o.send('some message'));
  });

  ws.send('welcome', errCallback);
});
