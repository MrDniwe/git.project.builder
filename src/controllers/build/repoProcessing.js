const Promise = require("bluebird");
const fs = require("fs");
const copyFile = Promise.promisify(fs.copyFile);
const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);
const readDir = Promise.promisify(fs.readdir);
const mkDir = Promise.promisify(fs.mkdir);
const stat = Promise.promisify(fs.stat);
const unlink = Promise.promisify(fs.unlink);
const jszip = require("jszip");
const path = require("path");
const config = require("../../config");
const _ = require("lodash");
const plist = require("plist");
const del = require("del");
const rimraf = Promise.promisify(require("rimraf"));
const iosBundlePattern = /\"CFBundleName\"\s*=\s*\"[^\"]*"/i;
const iosLprojPattern = /([\w\-]+)\.lproj/i;
const langMapping = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE"
};
const androidLangMapping = {
  zh: "zh-Hans"
};
const xml = require("xml-js");
const helpers = require("../../libs/helpers");

module.exports = async (branchPath, contentPath, app, source) => {
  // зачищаем и создаем папки если надо
  if (app.platform === "ios") {
    await rimraf(
      path.resolve(
        branchPath,
        "Targets/Arcsinus/Arcsinus.xcassets/AppIcon.appiconset"
      )
    );
    await mkDir(
      path.resolve(
        branchPath,
        "Targets/Arcsinus/Arcsinus.xcassets/AppIcon.appiconset"
      )
    );
    await rimraf(
      path.resolve(
        branchPath,
        "Targets/Arcsinus/Arcsinus.xcassets/LaunchImage.launchimage"
      )
    );
    await mkDir(
      path.resolve(
        branchPath,
        "Targets/Arcsinus/Arcsinus.xcassets/LaunchImage.launchimage"
      )
    );
    await del([
      path.resolve(
        branchPath,
        "fastlane/metadata/**"
      ),
      `!${path.resolve(
        branchPath,
        "fastlane/metadata"
      )}`,
      `!${path.resolve(
        branchPath,
        "fastlane/metadata/default/**"
      )}`,
      `!${path.resolve(
        branchPath,
        "fastlane/metadata/default"
      )}`,
      `!${path.resolve(
        branchPath,
        "fastlane/metadata/default/*"
      )}`
    ]);
  }
  // готовим объект zip
  let zip = await jszip.loadAsync(
    await readFile(path.resolve(config.common.rootPath, contentPath))
  );
  //стримим файлы, у которых есть dst
  let filesWithDst = _.filter(config.archive[app.platform], item => item.dst);
  await Promise.each(
    filesWithDst,
    async item =>
      new Promise((resolve, reject) =>
        zip
          .file(item.src)
          .nodeStream()
          .pipe(
            fs
              .createWriteStream(path.resolve(branchPath, item.dst))
              .on("error", reject)
              .on("finish", resolve)
          )
      )
  );
  if (app.platform === "ios") {
    //ios: пишем JSON
    await Promise.all([
      copyFile(
        path.resolve(config.common.rootPath, "src/content/ios/iconset.json"),
        path.resolve(
          branchPath,
          "Targets/Arcsinus/Arcsinus.xcassets/AppIcon.appiconset/Contents.json"
        )
      ),
      copyFile(
        path.resolve(
          config.common.rootPath,
          "src/content/ios/launchimage.json"
        ),
        path.resolve(
          branchPath,
          "Targets/Arcsinus/Arcsinus.xcassets/LaunchImage.launchimage/Contents.json"
        )
      )
    ]);
    //ios: обновляем Info.plist
    const appPlist = plist.parse(
      await readFile(
        path.resolve(branchPath, "Targets/Arcsinus/Info.plist"),
        "utf8"
      )
    );

    const infoJson = require(path.resolve(branchPath, "Info.json"));
    await unlink(path.resolve(branchPath, "Info.json"));
    appPlist.ArthiveKit.mode = app.type;
    appPlist.ArthiveKit.Template.id = app.subject;
    appPlist.CFBundleShortVersionString = source.version;
    appPlist.CFBundleIdentifier = app.bundle;
    appPlist.ArthiveKit.Template.color1 = infoJson.appearance.primaryColor;
    appPlist.ArthiveKit.Template.color2 = infoJson.appearance.accentColor;
    appPlist.ArthiveKit.Template.isBlurNavBar =
      infoJson.appearance.navbarBlurEnabled;
    appPlist.ArthiveKit.Template.isBlurTabBar =
      infoJson.appearance.tabbarBlurEnabled;
    appPlist.ArthiveKit.Template.isDarkNavBar =
      infoJson.appearance.navbarDarkTheme;
    appPlist.ArthiveKit.Template.isDarkTabBar =
      infoJson.appearance.tabbarDarkTheme;
    appPlist.ArthiveKit.clientKey = infoJson.clientKey;
    appPlist.ArthiveKit.clientId = infoJson.clientId;
    appPlist.CFBundleName = infoJson.name.ru;

    //генерим и прописываем хитрый facebook
    const facebookSuffix = helpers.facebookSuffixGenerator(app.subject, app.type);
    appPlist.FacebookUrlSchemeSuffix = facebookSuffix;
    const fbBundleUrlIndex = appPlist["CFBundleURLTypes"].findIndex(urlType=> urlType["CFBundleURLName"]==="facebook");
    if (fbBundleUrlIndex>=0) {
      appPlist["CFBundleURLTypes"][fbBundleUrlIndex] = Object.assign(appPlist["CFBundleURLTypes"][fbBundleUrlIndex], {
        CFBundleURLSchemes: [`fb${appPlist["FacebookAppID"]}${facebookSuffix}`]
      });
    }

    await writeFile(
      path.resolve(branchPath, "Targets/Arcsinus/Info.plist"),
      plist.build(appPlist),
      "utf8"
    );
    //ios: правим {lang}.lproj/InfoPlist.strings
    let targets = await readDir(path.resolve(branchPath, "Targets/Arcsinus/"));
    targets = targets
      .filter(target => iosLprojPattern.test(target))
      .filter(target => !/Base.lproj/i.test(target));
    await Promise.each(targets, async target => {
      let foundInInfo = target.match(iosLprojPattern);
      if (foundInInfo && foundInInfo[1]) {
        let targetContent = await readFile(
          path.resolve(
            branchPath,
            "Targets/Arcsinus/",
            target,
            "InfoPlist.strings"
          ),
          "utf8"
        );
        targetContent = targetContent.replace(
          iosBundlePattern,
          `"CFBundleName" = "${infoJson.name[foundInInfo[1]] ||
            infoJson.name.ru}"`
        );
        await writeFile(
          path.resolve(
            branchPath,
            "Targets/Arcsinus/",
            target,
            "InfoPlist.strings"
          ),
          targetContent,
          "utf8"
        );
      }
    });

    //ios: правим метаданные lang
    let keys = _.keys(infoJson.name);
    try {
      await stat(path.resolve(
        branchPath,
        "fastlane/metadata"
      ));
    } catch (err) {
      await mkDir(path.resolve(
        branchPath,
        "fastlane/metadata"
      ));
    }
    await Promise.each(keys, async key => {
      let currentPath = path.resolve(
        branchPath,
        "fastlane/metadata/",
        langMapping[key] || key
      );
      try {
        await stat(currentPath);
      } catch (err) {
        await mkDir(currentPath);
      }
      await Promise.all([
        writeFile(
          path.resolve(currentPath, "description.txt"),
          infoJson.metadata.description[key],
          "utf8"
        ),
        writeFile(
          path.resolve(currentPath, "name.txt"),
          infoJson.metadata.name[key],
          "utf8"
        ),
        writeFile(
          path.resolve(currentPath, "release_notes.txt"),
          infoJson.metadata.releaseNotes[key],
          "utf8"
        ),
        writeFile(
          path.resolve(currentPath, "promotional_text.txt"),
          infoJson.metadata.promotionalText[key],
          "utf8"
        ),
        writeFile(
          path.resolve(currentPath, "keywords.txt"),
          infoJson.metadata.keywords[key],
          "utf8"
        )
      ]);
    });
  }
  if (app.platform === "android") {
    const infoJson = require(path.resolve(branchPath, "Info.json"));

    //settings xml
    let settingsXml = await readFile(
      path.resolve(branchPath, "app/settings.xml"),
      "utf8"
    );
    const settings = xml.xml2js(settingsXml, {
      nativeType: true,
      ignoreComment: true
    });
    settings.elements = _.map(settings.elements, setElem => {
      if (setElem.name === "properties") {
        setElem.elements = _.map(setElem.elements, elem => {
          if (!(elem && elem.attributes)) return elem;
          let { key } = elem.attributes;
          if (key === "package_name") elem.elements[0].text = app.bundle;
          if (key === "version") elem.elements[0].text = source.version;
          if (key === "owner_id") elem.elements[0].text = app.subject;
          if (key === "owner_prefix") elem.elements[0].text = `${app.type}_id`;
          if (key === "client_id") elem.elements[0].text = infoJson.clientId;
          if (key === "client_key") elem.elements[0].text = infoJson.clientKey;
          if (key === "color_primary")
            elem.elements[0].text = infoJson.appearance.primaryColor;
          if (key === "color_accent")
            elem.elements[0].text = infoJson.appearance.accentColor;
          if (key === "color_status_bar")
            elem.elements[0].text = infoJson.appearance.statusBarColor;
          if (key === "light_theme")
            elem.elements[0].text = infoJson.appearance.lightTheme;
          return elem;
        });
      }
      return setElem;
    });
    let parsedBack = xml.js2xml(settings);
    await writeFile(
      path.resolve(branchPath, "app/settings.xml"),
      parsedBack,
      "utf8"
    );

    //языковые папки
    const valuesPath = path.resolve(branchPath, "app/src/main/res/");
    let targets = await readDir(valuesPath);
    targets = _.filter(
      targets,
      target => /^values$/i.test(target) || /values-([\w]{0,2})$/i.test(target)
    );
    await Promise.map(targets, async target => {
      let isStrings;
      try {
        isStrings = await stat(path.resolve(valuesPath, target, "strings.xml"));
      } catch (err) {}
      if (!isStrings) return;
      let match = target.match(/values-([\w]{0,2})$/i);
      let lang = (match && match[1]) || "ru";
      // console.log(target, lang);
      let stringsXml = await readFile(
        path.resolve(valuesPath, target, "strings.xml"),
        "utf8"
      );
      const strings = xml.xml2js(stringsXml, {
        nativeType: true,
        ignoreComment: true
      });
      strings.elements = _.map(strings.elements, setElem => {
        if (setElem.name === "resources") {
          setElem.elements = _.map(setElem.elements, elem => {
            if (
              elem.name === "string" &&
              elem.attributes &&
              elem.attributes.name === "app_name"
            )
              elem.elements[0].text =
                infoJson.name[androidLangMapping[lang] || lang] ||
                infoJson.name["ru"];
            return elem;
          });
          let isAppName = _.find(
            setElem.elements,
            elem =>
              elem.name === "string" &&
              elem.attributes &&
              elem.attributes.name === "app_name"
          );
          if (!isAppName) {
            setElem.elements.push({
              type: "element",
              name: "string",
              attributes: { name: "app_name" },
              elements: [
                {
                  type: "text",
                  text:
                    infoJson.name[androidLangMapping[lang] || lang] ||
                    infoJson.name["ru"]
                }
              ]
            });
          }
        }
        return setElem;
      });
      let parsedBack = xml.js2xml(strings);
      await writeFile(
        path.resolve(valuesPath, target, "strings.xml"),
        parsedBack,
        "utf8"
      );
    });
  }
};
