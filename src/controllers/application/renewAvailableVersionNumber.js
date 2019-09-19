const gitlab = require("../../libs/gitlab");
const _ = require("lodash");
const check = require("check-types");
const config = require("../../config");
const models = require("../../models");
const { orderMasterTags } = require("../../libs/helpers");
const Promise = require("bluebird");

module.exports = async appId => {
  let repository;
  try {
    repository = await models.application.getRepositoryForApp(appId);
  } catch (err) {
    return Promise.reject(err);
  }
  //запрашиваем из репозитория необходимые данные
  let tags;
  try {
    tags = await gitlab.getProjectTags(repository);
  } catch (err) {
    return Promise.reject(err);
  }

  //сортируем теги и проверяем есть ли вообще последний
  let orderedMasterTags = orderMasterTags(tags);
  if (!check.object(orderedMasterTags[0]))
    return Promise.reject("Не найдены релизные теги");

  let newVersion = orderedMasterTags[0].name.match(config.reg.release)[1];

  try {
    await models.application.setNewVersionForRepository(newVersion, repository);
  } catch (err) {
    return Promise.reject(err);
  }
  return Promise.resolve(newVersion);
};
