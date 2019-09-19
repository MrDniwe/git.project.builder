const Promise = require("bluebird");
const _ = require("lodash");
const check = require("check-types");
const { build } = require("../../models");
const camelize = require("camelize");

module.exports = async ctx => {
  let { appId } = ctx.params;
  appId = _.toInteger(appId);
  if (!check.integer(appId))
    ctx.throw(400, "Переданный appId не является integer");
  ctx.body = camelize(await build.list(appId));
};
