const db = require("../db");
const check = require("check-types");
const config = require("../config");
const Promise = require("bluebird");

module.exports = {
  getTemplateByTypeAndPlatform: async (platform, type) => {
    if (!check.includes(config.enums.platform, platform))
      throw new Error("Incorrect platform param");
    if (!check.includes(config.enums.type, type))
      throw new Error("Incorrect type param");
    const query = "select * from template where platform=$1 and app_type=$2";

    let template;
    try {
      template = db.one(query, [platform, type]);
    } catch (err) {
      throw err;
    }
    return Promise.resolve(template);
  }
};
