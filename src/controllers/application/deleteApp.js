const Promise = require("bluebird");
const _ = require("lodash");
const check = require("check-types");
const { application, build } = require("../../models");

module.exports = async ctx => {
  let { id } = ctx.params;
  id = _.toInteger(id);
  if (!check.integer(id)) ctx.throw(400, "Переданный id не является integer");
  await application.getApplication(id);
  if (await build.findLastBuildForApp(id))
    ctx.throw(400, "Нельзя удалить приложение, у которого уже есть сборки");
  await application.delete(id);
  ctx.body = `Приложение #${id} успешно удалено`;
};
