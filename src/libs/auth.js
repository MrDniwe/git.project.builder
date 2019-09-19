const config = require("../config");

module.exports = {
  webhook: async (ctx, next) => {
    if (!(ctx.request.headers["x-gitlab-token"] === config.auth.webhookToken))
      ctx.throw(403, "Неверный токен для входящего webhook");
    await next();
  },
  main: async (ctx, next) => {
    if (!(ctx.request.headers["x-access-token"] === config.auth.mainToken))
      ctx.throw(403, "Неверный токен безопасности");
    await next();
  }
};
