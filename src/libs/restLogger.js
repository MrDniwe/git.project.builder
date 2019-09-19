module.exports = async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.logger.trace(`${ctx.method} ${ctx.url} - ${ms}ms`);
  ctx.logger.trace(ctx);
};
