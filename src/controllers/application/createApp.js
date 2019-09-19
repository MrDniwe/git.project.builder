const gitlab = require("../../libs/gitlab");
const _ = require("lodash");
const check = require("check-types");
const config = require("../../config");
const models = require("../../models");
const { orderMasterTags } = require("../../libs/helpers");
const camelize = require("camelize");
const axios = require("axios");

module.exports = async (ctx, next) => {
  //берем параметры из запроса
  let { bundleId, platform, type, subjectId } = ctx.request.body;
  subjectId = _.toInteger(subjectId);

  //проверяем их валидность
  if (!check.nonEmptyString(bundleId))
    ctx.throw(400, "Неверный параметр  bundleId");
  if (!check.includes(config.enums.platform, platform))
    ctx.throw(400, "Неверный параметр platform");
  if (!check.includes(config.enums.type, type))
    ctx.throw(400, "Неверный параметр type");
  if (!subjectId || !check.integer(subjectId)) ctx.throw(400, "Неверный параметр subjectId");

  // обращаемся в API Артхив для проверки существования такого

  if ( type==="artist" ) {
    // проверка если художник
    const arthiveResponse = await axios.get(config.common.arthiveApiUrl+"/artists.info", {
      params: {
        artist_ids: subjectId
      }
    });
    if (!arthiveResponse.data) ctx.throw(400, "Не получен ответ от API Артхив для проверки существования субъекта");
    if (arthiveResponse.data.errors && arthiveResponse.data.errors.length) ctx.throw(400, "Художник с таким ID не найден в API артхива");
  } else {
    // проверка если галерея
    const  arthiveResponse = await axios.get(config.common.arthiveApiUrl+"/galleries.info", {
      params: {
        gallery_ids: subjectId
      }
    });
    if (!arthiveResponse.data) ctx.throw(400, "Не получен ответ от API Артхив для проверки существования субъекта");
    if (arthiveResponse.data.errors && arthiveResponse.data.errors.length) {
      ctx.throw(400, "Галерея с таким ID не найдена в API артхива");
    }
    if (arthiveResponse.data.data && (!arthiveResponse.data.data.galleries || (arthiveResponse.data.data.galleries && !arthiveResponse.data.data.galleries.length))){
      ctx.throw(400, "Галерея с таким ID не найдена в API артхива");}
  }
  // конец проверки по артхиву


  //по переданнй платформе ищем имя нужного репозитория
  let template;
  try {
    template = await models.template.getTemplateByTypeAndPlatform(
      platform,
      type
    );
  } catch (err) {
    ctx.throw(400, err);
  }

  let { repository } = template;

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

  //обращаемся за созданием приложения
  let newApplication;
  try {
    newApplication = await models.application.createApplication({
      bundle_id: bundleId,
      subject_id: subjectId,
      template_id: template.id,
      platform: platform,
      available_version_number: orderedMasterTags[0].name.match(
        config.reg.release
      )[1]
    });
  } catch (err) {
    ctx.throw(400, err);
  }
  ctx.body = camelize(newApplication);
};
