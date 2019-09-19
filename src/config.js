const path = require("path");
module.exports = {
  common: {
    rootPath: path.resolve(__dirname, ".."),
    repository: process.env.GITLAB_API_URL,
    repositoryToken: process.env.PERSONAL_TOKEN,
    repositoryUser: "BuilderBot",
    repositoryPassword: "KHcn&*ndsfJH",
    repositoryUserEmail: "devnull@develop.redirectme.net",
    projectApiUrl: "https://api.project.com/v2.0",
  },
  enums: {
    platform: ["ios", "android"],
    type: ["artist", "gallery"],
  },
  reg: {
    release: /release_v([\d\.]+)/i,
    branch: /(artist|gallery)+_(\d)+_v([\d\.]+)/i,
    version: /(\d)+\.(\d)+\.(\d)+/,
  },
  postgres: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "builder",
    user: process.env.DB_USERNAME || "builder",
    password: process.env.DB_PASSWORD || "builder",
  },
  auth: {
    webhookToken: process.env.WEBHOOK_TOKEN || "qazwsxedcrfv",
    mainToken: process.env.MAIN_TOKEN || "qazwsxedcrfv",
  },
  artifacts: {
    jobName: "auto_build",
    jobStatus: "success",
  },
  archive: {
    ios: [
      {
        src: "Info.json",
        dst: "Info.json",
        type: "json",
      },
      {
        src: "GoogleService-Info.plist",
        dst: "Targets/Project/GoogleService-Info.plist",
        type: "GoogleService",
      },
      {
        src: "AppIcon/AppIcon-20.png",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-20.png",
        type: "image",
        params: {
          width: 20,
          height: 20,
        },
      },
      {
        src: "AppIcon/AppIcon-29.png",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-29.png",
        type: "image",
        params: {
          width: 29,
          height: 29,
        },
      },
      {
        src: "AppIcon/AppIcon-40.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-40.png",
        params: {
          width: 40,
          height: 40,
        },
      },
      {
        src: "AppIcon/AppIcon-58.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-58.png",
        params: {
          width: 58,
          height: 58,
        },
      },
      {
        src: "AppIcon/AppIcon-60.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-60.png",
        params: {
          width: 60,
          height: 60,
        },
      },
      {
        src: "AppIcon/AppIcon-76.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-76.png",
        params: {
          width: 76,
          height: 76,
        },
      },
      {
        src: "AppIcon/AppIcon-80.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-80.png",
        params: {
          width: 80,
          height: 80,
        },
      },
      {
        src: "AppIcon/AppIcon-87.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-87.png",
        params: {
          width: 87,
          height: 87,
        },
      },
      {
        src: "AppIcon/AppIcon-120.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-120.png",
        params: {
          width: 120,
          height: 120,
        },
      },
      {
        src: "AppIcon/AppIcon-152.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-152.png",
        params: {
          width: 152,
          height: 152,
        },
      },
      {
        src: "AppIcon/AppIcon-167.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-167.png",
        params: {
          width: 167,
          height: 167,
        },
      },
      {
        src: "AppIcon/AppIcon-180.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-180.png",
        params: {
          width: 180,
          height: 180,
        },
      },
      {
        src: "AppIcon/AppIcon-1024.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/AppIcon.appiconset/AppIcon-1024.png",
        params: {
          width: 1024,
          height: 1024,
          restrictAlpha: true,
        },
      },
      {
        src: "LaunchImage/LaunchImage-640x960.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/LaunchImage.launchimage/LaunchImage-640x960.png",
        params: {
          width: 640,
          height: 960,
        },
      },
      {
        src: "LaunchImage/LaunchImage-640x1136.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/LaunchImage.launchimage/LaunchImage-640x1136.png",
        params: {
          width: 640,
          height: 1136,
        },
      },
      {
        src: "LaunchImage/LaunchImage-750x1334.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/LaunchImage.launchimage/LaunchImage-750x1334.png",
        params: {
          width: 750,
          height: 1334,
        },
      },
      {
        src: "LaunchImage/LaunchImage-1242x2208.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/LaunchImage.launchimage/LaunchImage-1242x2208.png",
        params: {
          width: 1242,
          height: 2208,
        },
      },
      {
        src: "LaunchImage/LaunchImage-1125x2436.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/LaunchImage.launchimage/LaunchImage-1125x2436.png",
        params: {
          width: 1125,
          height: 2436,
        },
      },
      {
        src: "LaunchImage/LaunchImage-768x1024.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/LaunchImage.launchimage/LaunchImage-768x1024.png",
        params: {
          width: 768,
          height: 1024,
        },
      },
      {
        src: "LaunchImage/LaunchImage-1536x2048.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/LaunchImage.launchimage/LaunchImage-1536x2048.png",
        params: {
          width: 1536,
          height: 2048,
        },
      },
      {
        src: "LaunchImage/LaunchImage-1024x768.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/LaunchImage.launchimage/LaunchImage-1024x768.png",
        params: {
          width: 1024,
          height: 768,
        },
      },
      {
        src: "LaunchImage/LaunchImage-2048x1536.png",
        type: "image",
        dst:
          "Targets/Project/Project.xcassets/LaunchImage.launchimage/LaunchImage-2048x1536.png",
        params: {
          width: 2048,
          height: 1536,
        },
      },
    ],
    android: [
      {
        src: "Info.json",
        dst: "Info.json",
        type: "json",
      },
      {
        src: "google-services.json",
        dst: "app/google-services.json",
        type: "json",
      },
      {
        src: "AppIcon/AppIcon-48.png",
        dst: "app/src/main/res/mipmap-mdpi/ic_launcher.png",
        type: "image",
        params: {
          width: 48,
        },
      },
      {
        src: "AppIcon/AppIcon-72.png",
        type: "image",
        dst: "app/src/main/res/mipmap-hdpi/ic_launcher.png",
        params: {
          width: 72,
        },
      },
      {
        src: "AppIcon/AppIcon-96.png",
        dst: "app/src/main/res/mipmap-xhdpi/ic_launcher.png",
        type: "image",
        params: {
          width: 96,
        },
      },
      {
        src: "AppIcon/AppIcon-144.png",
        dst: "app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
        type: "image",
        params: {
          width: 144,
        },
      },
      {
        src: "AppIcon/AppIcon-192.png",
        dst: "app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
        type: "image",
        params: {
          width: 192,
        },
      },
      {
        src: "LaunchImage/LaunchImage-360x640.png",
        dst: "app/src/main/res/mipmap-mdpi/ic_splash.png",
        type: "image",
        params: {
          width: 360,
          height: 640,
        },
      },
      {
        src: "LaunchImage/LaunchImage-540x960.png",
        dst: "app/src/main/res/mipmap-hdpi/ic_splash.png",
        type: "image",
        params: {
          width: 540,
          height: 960,
        },
      },
      {
        src: "LaunchImage/LaunchImage-720x1280.png",
        dst: "app/src/main/res/mipmap-xhdpi/ic_splash.png",
        type: "image",
        params: {
          width: 720,
          height: 1280,
        },
      },
      {
        src: "LaunchImage/LaunchImage-1080x1920.png",
        dst: "app/src/main/res/mipmap-xxhdpi/ic_splash.png",
        type: "image",
        params: {
          width: 1080,
          height: 1920,
        },
      },
      {
        src: "LaunchImage/LaunchImage-1440x2560.png",
        dst: "app/src/main/res/mipmap-xxxhdpi/ic_splash.png",
        type: "image",
        params: {
          width: 1440,
          height: 2560,
        },
      },
    ],
  },
  scheduler: {
    periodMs: 1000,
  },
};
