const _ = require("lodash");
const fs = require("fs");
const messages = {
  fileUploadExpected:
    "Методу POST /upload не был передан файл с архивом контента"
};

module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (ctx.req && ctx.req.file) fs.unlinkSync(ctx.req.file.path);
    ctx.logger.error(err.stack);
    ctx.status = err.status || 500;
    ctx.body = {
      message: messages[err.message] || err.message,
      details: err.details || undefined
    };
    ctx.app.emit("error", err, ctx);
  }
};
