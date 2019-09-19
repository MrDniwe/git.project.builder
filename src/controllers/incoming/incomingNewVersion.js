const gitlab = require("../../libs/gitlab");
const _ = require("lodash");
const check = require("check-types");
const config = require("../../config");
const R = require("ramda");
const models = require("../../models");
const { orderMasterTags } = require("../../libs/helpers");

module.exports = async (ctx, next) => {
  if (!(ctx.request.body && ctx.request.body.event_name === "tag_push"))
    ctx.throw(
      400,
      `Вебхук пришел не по адресу, ожидади tag_push, а получили ${ctx.request
        .body.event_name}`
    );
  if (!(ctx.request.body && _.isObject(ctx.request.body.project)))
    ctx.throw(400, `Пустой объект проекта передан через вебхук`);
  let repository = ctx.request.body.project.path_with_namespace;

  //запрашиваем из репозитория необходимые данные
  let tags;
  try {
    tags = await gitlab.getProjectTags(repository);
  } catch (err) {
    ctx.throw(400, err);
  }

  //сортируем теги и проверяем есть ли вообще последний
  let orderedMasterTags = orderMasterTags(tags);
  if (!check.object(orderedMasterTags[0]))
    ctx.throw(400, "Не найдены релизные теги");

  let newVersion = orderedMasterTags[0].name.match(config.reg.release)[1];

  try {
    await models.application.setNewVersionForRepository(newVersion, repository);
  } catch (err) {
    ctx.throw(400, err);
  }
  ctx.body = "Новая версия успешно добавлена";
};
