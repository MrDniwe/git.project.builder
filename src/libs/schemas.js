const joi = require("joi");
const _ = require("lodash");

const iosInfo = obj => {
  return joi.object().keys({
    clientId: joi.number().required(),
    clientKey: joi.string().length(32).required(),
    appearance: {
      navbarDarkTheme: joi.boolean().required(),
      navbarBlurEnabled: joi.boolean().required(),
      tabbarDarkTheme: joi.boolean().required(),
      tabbarBlurEnabled: joi.boolean().required(),
      primaryColor: joi.string().regex(/#[0-9a-f]{6,6}/i),
      accentColor: joi.string().regex(/#[0-9a-f]{6,6}/i)
    },
    name: _.mapValues(obj.name, () => joi.string().max(30).required()),
    metadata: {
      name: _.mapValues(obj.metadata.name, () =>
        joi.string().max(30).required()
      ),
      description: _.mapValues(obj.metadata.name, () =>
        joi.string().max(4000).min(10).required()
      ),
      keywords: _.mapValues(obj.metadata.name, () =>
        joi.string().max(100).required()
      ),
      releaseNotes: _.mapValues(obj.metadata.name, () =>
        joi.string().max(4000).required()
      ),
      promotionalText: _.mapValues(obj.metadata.name, () =>
        joi.string().max(170).required()
      )
    }
  });
};

const androidInfo = obj => {
  return joi.object().keys({
    clientId: joi.number().required(),
    clientKey: joi.string().length(32).required(),
    appearance: {
      lightTheme: joi.boolean().required(),
      primaryColor: joi.string().regex(/#[0-9a-f]{6,6}/i),
      accentColor: joi.string().regex(/#[0-9a-f]{6,6}/i),
      statusBarColor: joi.string().regex(/#[0-9a-f]{6,6}/i)
    },
    name: _.mapValues(obj.name, () => joi.string().max(30).required())
  });
};

module.exports = {
  ios: {
    "Info.json": iosInfo
  },
  android: {
    "Info.json": androidInfo
  }
};
