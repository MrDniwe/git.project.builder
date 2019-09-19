const _ = require("lodash");
module.exports = {
  filePresents: async req => {
    if (_.isObject(req.file)) return Promise.resolve();
    else
      return Promise.reject("Для данного метода обязатьельна загрузка файла");
  },
  mimetypeIsZip: async req => {
    if (req.file.mimetype === "application/zip") return Promise.resolve();
    else return Promise.reject("Файл должен быть типа .zip");
  }
};
