const R = require("ramda");
const moment = require("moment");
const config = require("../config");
const _ = require("lodash");
const sharp = require("sharp");
const Promise = require("bluebird");
const schemas = require("../libs/schemas");
const joi = require("joi");
const plist = require("plist");
const fs = require("fs");
const isUtf8 = require("is-utf8");

const masterTagsOnly = R.filter(
  tag => tag.name && config.reg.release.test(tag.name)
);

const orderTagsByDate = R.sort((a, b)=> a.date < b.date ? -1 : 1);

const momentizeCreatedDate = R.map(tag => {
  tag.date = moment(tag.commit.created_at);
  return tag;
});

const subjectPattern = (type, subjectId) =>
  new RegExp(`${type}_${subjectId}_v([\\d\\.]+)`);

const subjectBranchFilter = (type, subjectId) => {
  let pattern = subjectPattern(type, subjectId);
  return R.filter(branch => pattern.test(branch.name));
};

const orderSubjectsBranches = (type, subjectId, branches) =>
  R.pipe(
    subjectBranchFilter(type, subjectId),
    momentizeCreatedDate,
    orderTagsByDate,
    R.reverse
  )(branches);

const lastBuildVersion = builds => {
  if (!(builds && builds.length)) return null;
  const matched = builds[builds.length - 1].name.match(config.reg.branch);
  if (!matched.length) return null;
  return matched[3];
};

const orderMasterTags = R.pipe(
  masterTagsOnly,
  momentizeCreatedDate,
  orderTagsByDate,
  R.reverse
);

const checkFilesList = async (platform, files) => {
  const fileList = _.map(config.archive[platform], "src");
  let missingFiles = _.difference(fileList, _.keys(files));
  let notExpectedFiles = _.difference(_.keys(files), fileList);
  if (missingFiles.length) {
    let fileListErr = new Error(
      "В переданном архиве не хватает некоторых файлов"
    );
    fileListErr.details = { missingFiles, notExpectedFiles };
    throw fileListErr;
  }
};

const getStringFromArchiveFile = async (archive, path) => {
  return new Promise((resolve, reject) => {
    try {
      const zipFileStream = archive.file(path).nodeStream();
      let data = "";
      zipFileStream.on("data", chunk => (data += chunk));
      zipFileStream.on("end", () => {
        resolve(data);
      });
    } catch (err) {
      reject(err);
    }
  });
};

const getBufferFromArchiveFile = async (archive, path) => {
  return new Promise((resolve, reject) => {
    try {
      const zipFileStream = archive.file(path).nodeStream();
      let data = [];
      zipFileStream.on("data", chunk=> data.push(chunk));
      zipFileStream.on("end", () => {
        resolve(Buffer.concat(data));
      });
    } catch (err) {
      reject(err);
    }
  });
};

const getMetadataFromZippedImage = async (archive, path) => {
  return new Promise((resolve, reject) => {
    const appIconFileStream = archive.file(path).nodeStream();
    let bufChunked = [];
    let buf;
    appIconFileStream.on("data", chunk => bufChunked.push(chunk));
    appIconFileStream.on("end", () => {
      buf = Buffer.concat(bufChunked);
      sharp(buf).metadata().then(resolve).catch(reject);
    });
  });
};

const checkImageDetails = async (zip, image) => {
  if (image.params && (image.params.width || image.params.height)) {
    let errors = [];
    try {
      let metadata = await getMetadataFromZippedImage(zip, image.src);
      if (image.params.restrictAlpha && metadata.hasAlpha)
        errors.push({
          description: "У изображения должен отсутствовать альфа-канал",
          param: "hasAlpha",
          file: image.src,
          expected: false,
          got: metadata.hasAlpha
        });
      if (image.params.width && metadata.width !== image.params.width)
        errors.push({
          description: "Ширина не соответствует ожидаемой",
          param: "width",
          file: image.src,
          expected: image.params.width,
          got: metadata.width
        });
      if (image.params.height && metadata.height !== image.params.height)
        errors.push({
          description: "Высота не соответствует ожидаемой",
          param: "height",
          file: image.src,
          expected: image.params.height,
          got: metadata.height
        });
    } catch (err) {
      throw err;
    }
    return errors;
  }
};

const validateImages = async (zip, platform) => {
  const images = _.filter(
    config.archive[platform],
    item => item.type === "image"
  );
  let imageCheckResult = await Promise.map(images, image =>
    checkImageDetails(zip, image)
  );
  imageCheckResult = _.compact(_.flatten(imageCheckResult));
  // console.log(imageCheckResult);
  if (imageCheckResult.length) {
    let validationError = new Error(
      "Возникли ошибки в процессе валидации изображений в архиве"
    );
    validationError.details = imageCheckResult;
    throw validationError;
  }
};

const validateJsonBySchema = async (zip, platform, fileName) => {
  const infoJson = JSON.parse(await getStringFromArchiveFile(zip, fileName));
  const schema = schemas[platform][fileName](infoJson);
  let validation = joi.validate(infoJson, schema, { abortEarly: false });
  if (validation.error) {
    const validationError = new Error("Ошибка валидации JSON");
    validationError.details = validation.error.details;
    throw validationError;
  }
};

const validateGoogleService = async (zip, bundle) => {
  const googleServicePlistObjDesc = _.find(config.archive.ios,
    item => item.type === "GoogleService");
  if (!googleServicePlistObjDesc) throw new Error("В конфиге не найдено описание для файла GoogleService");
  const plistString = await getStringFromArchiveFile(zip, googleServicePlistObjDesc.src);
  const plistParsed = plist.parse(plistString);
  if (plistParsed["BUNDLE_ID"]!==bundle) throw new Error(`Ошибка валидации bundleId в GoogleService-Info.plist: в файле указано '${plistParsed["BUNDLE_ID"]}', ожидали '${bundle}'`);
};


const facebookSuffixGenerator = (id, type)=> {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  let suff = "";
  while (id>0) {
    suff = suff+ alphabet[ id % 10 ];
    id = Math.floor(id/10);
  }
  return `${type==="artist" ? "art" : "gal"}${suff}`;
};

const fileIsUtf8 = (path) => {
  const content = fs.readFileSync(path);
  return isUtf8(content);
};

const validateUTF8InfoJsonInArchive = async (zip) => {
  const content = await getBufferFromArchiveFile(zip, "Info.json");
  return isUtf8(content);
};

module.exports = {
  masterTagsOnly,
  orderTagsByDate,
  momentizeCreatedDate,
  orderMasterTags,
  orderSubjectsBranches,
  lastBuildVersion,
  checkFilesList,
  getMetadataFromZippedImage,
  checkImageDetails,
  validateImages,
  getStringFromArchiveFile,
  validateJsonBySchema,
  validateGoogleService,
  facebookSuffixGenerator,
  fileIsUtf8,
  validateUTF8InfoJsonInArchive
};
