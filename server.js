const http = require('http');
const Koa = require('koa');
const { streamEvents } = require('http-event-stream');
const uuid = require('uuid');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin':'*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({...headers});
    try {
      return await next();
    } catch(e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods':'GET, POST, PUD, DELETE, PATCH',
    });
  }

  if (ctx.request.get('Access-Control-Request-Headers')) {
    ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
  }

  ctx.response.status = 204;
  
  router.get('/sse', async (ctx) => {
    streamEvents(ctx.req, ctx.res, {
      async fetch(lastEventId) {
        console.log(lastEventId);
        return [];
      },
      stream(sse) {
        sse.sendEvent({data:'hello world'});

        return () => {};
      }
    });

    ctx.respond = false;
  })
})

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port)