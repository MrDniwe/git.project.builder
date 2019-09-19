const Promise = require("bluebird");
const _ = require("lodash");
const check = require("check-types");
const { build } = require("../../models");
const camelize = require("camelize");

module.exports = async ctx => {
  let { appId, buildId } = ctx.params;
  appId = _.toInteger(appId);
  buildId = _.toInteger(buildId);
  if (!check.integer(appId))
    ctx.throw(400, "Переданный appId не является integer");
  if (!check.integer(buildId))
    ctx.throw(400, "Переданный buildId не является integer");
  try {
    ctx.body = camelize(await build.getByIdFormatted(buildId));
  } catch (err) {
    ctx.throw(404, "Сборка с указанными параметрами не найдена");
  }
};
