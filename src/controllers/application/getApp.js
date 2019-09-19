const Promise = require("bluebird");
const _ = require("lodash");
const check = require("check-types");
const models = require("../../models");
const camelize = require("camelize");

module.exports = async (ctx, next) => {
  let { id } = ctx.params;
  id = _.toInteger(id);
  if (!check.integer(id)) ctx.throw(400, "Переданный id не является integer");

  let application, lastBuild;
  try {
    application = await models.application.getApplicationFormatted(id);
    application.lastBuild = await models.build.lastBuildFormatted(id);
  } catch (err) {
    return Promise.reject(err);
  }

  ctx.body = camelize(application);
};
