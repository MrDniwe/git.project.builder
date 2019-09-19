const { build } = require("../../models");

module.exports = async (ctx, next) => {
  if (
    !(
      ctx &&
      ctx.request &&
      ctx.request.body &&
      ctx.request.body.object_attributes
    )
  ) {
    ctx.throw(400, `У переданного хука отсутствуют необходимые атрибуты body`);
    return;
  }
  if (!ctx.request.body.object_kind === "pipeline") {
    ctx.throw(
      400,
      `Получен неожиданный статус хука, ожидали pipeline, получили ${ctx.request
        .body.object_kind}`
    );
  }
  const { id, sha, status } = ctx.request.body.object_attributes;
  await build.updatePipelineStatus(sha, id, status);
};
