"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/ts/main.ts
var import_electron10 = require("electron");
var import_electron_util7 = require("electron-util");
var import_path8 = __toESM(require("path"));
var import_electron_json_storage2 = __toESM(require("electron-json-storage"));
var remote2 = __toESM(require("@electron/remote/main"));

// electron/ts/lib/installNativeMessagingHost.ts
var import_fs = __toESM(require("fs"));
var import_os = require("os");
var import_electron = require("electron");
var import_path = __toESM(require("path"));
var import_util = __toESM(require("util"));
var import_electron_util = require("electron-util");
var APP_NAME = "com.anytype.desktop";
var MANIFEST_FILENAME = `${APP_NAME}.json`;
var EXTENSION_IDS = [
  "jbnammhjiplhpjfncnlejjjejghimdkf",
  "jkmhmgghdjjbafmkgjmplhemjjnkligf",
  "lcamkcmpcofgmbmloefimnelnjpcdpfn"
];
var GECKO_ID = "anytype@anytype.io";
var USER_PATH = import_electron.app.getPath("userData");
var EXE_PATH = import_electron.app.getPath("exe");
var getManifestPath = () => {
  const fn = `nativeMessagingHost${import_electron_util.is.windows ? ".exe" : ""}`;
  return import_path.default.join((0, import_electron_util.fixPathForAsarUnpack)(__dirname), "dist", fn);
};
var getHomeDir = () => {
  if (process.platform === "darwin") {
    return (0, import_os.userInfo)().homedir;
  } else {
    return (0, import_os.homedir)();
  }
  ;
};
var installNativeMessagingHost = () => {
  const { platform } = process;
  switch (platform) {
    case "win32":
      {
        installToWindows();
        break;
      }
      ;
    case "darwin":
      {
        installToMacOS();
        break;
      }
      ;
    case "linux":
      {
        installToLinux();
        break;
      }
      ;
    default:
      {
        console.log("[InstallNativeMessaging] Unsupported platform:", platform);
        break;
      }
      ;
  }
  ;
};
var buildManifestForBrowserKey = (key) => {
  const base = {
    name: APP_NAME,
    description: "Anytype desktop <-> web clipper bridge",
    type: "stdio",
    path: getManifestPath()
  };
  if (key === "Firefox") {
    base.allowed_extensions = [GECKO_ID];
  } else {
    base.allowed_origins = EXTENSION_IDS.map((id) => `chrome-extension://${id}/`);
  }
  ;
  return base;
};
var installToMacOS = () => {
  const dirs = getDarwinDirectory();
  for (const [key, value] of Object.entries(dirs)) {
    if (import_fs.default.existsSync(value)) {
      const dst = import_path.default.join(value, "NativeMessagingHosts", MANIFEST_FILENAME);
      writeManifest(dst, buildManifestForBrowserKey(key));
    } else {
      console.log("[InstallNativeMessaging] Manifest skipped:", key);
    }
    ;
  }
  ;
};
var getLinuxNativeMessagingDirName = (key) => {
  if (key === "Firefox") {
    return "native-messaging-hosts";
  } else {
    return "NativeMessagingHosts";
  }
  ;
};
var installToLinux = () => {
  const dirs = getLinuxDirectory();
  for (const [key, value] of Object.entries(dirs)) {
    if (import_fs.default.existsSync(value)) {
      const nmDir = getLinuxNativeMessagingDirName(key);
      const dst = import_path.default.join(value, nmDir, MANIFEST_FILENAME);
      writeManifest(dst, buildManifestForBrowserKey(key));
    } else {
      console.log("[InstallNativeMessaging] Manifest skipped:", key);
    }
    ;
  }
  ;
};
var installToWindows = () => {
  const dir = import_path.default.join(USER_PATH, "browsers");
  const chromeManifestPath = import_path.default.join(dir, "chrome.json");
  const firefoxManifestPath = import_path.default.join(dir, "firefox.json");
  writeManifest(chromeManifestPath, buildManifestForBrowserKey("Chrome"));
  writeManifest(firefoxManifestPath, buildManifestForBrowserKey("Firefox"));
  createWindowsRegistry(
    "HKCU\\SOFTWARE\\Google\\Chrome",
    `HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\${APP_NAME}`,
    chromeManifestPath
  );
  createWindowsRegistry(
    "HKCU\\SOFTWARE\\net.imput.helium",
    `HKCU\\SOFTWARE\\net.imput.helium\\NativeMessagingHosts\\${APP_NAME}`,
    chromeManifestPath
  );
  createWindowsRegistry(
    "HKCU\\SOFTWARE\\Mozilla",
    `HKCU\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\${APP_NAME}`,
    firefoxManifestPath
  );
};
var getRegeditInstance = () => {
  const regedit = require("regedit");
  regedit.setExternalVBSLocation(
    import_path.default.join(import_path.default.dirname(EXE_PATH), "resources/regedit/vbs")
  );
  return regedit;
};
var createWindowsRegistry = async (check, location, jsonFile) => {
  const regedit = getRegeditInstance();
  const list = import_util.default.promisify(regedit.list);
  const createKey = import_util.default.promisify(regedit.createKey);
  const putValue = import_util.default.promisify(regedit.putValue);
  console.log("[InstallNativeMessaging] Adding registry:", location);
  try {
    await list(check);
  } catch {
    console.log("[InstallNativeMessaging] Registry not found:", check);
    return;
  }
  ;
  try {
    await createKey(location);
    const obj = {};
    obj[location] = {
      default: {
        value: jsonFile,
        type: "REG_DEFAULT"
      }
    };
    return putValue(obj);
  } catch (error) {
    console.log("[InstallNativeMessaging] Registry create error:", error);
  }
  ;
};
var getLinuxDirectory = () => {
  const home = import_path.default.join(getHomeDir(), ".config");
  return {
    "Chrome": import_path.default.join(home, "google-chrome"),
    "Chromium": import_path.default.join(home, "chromium"),
    "Brave": import_path.default.join(home, "BraveSoftware", "Brave-Browser"),
    "BraveFlatpak": import_path.default.join(".var", "app", "com.brave.Browser", "config", "BraveSoftware", "Brave-Browser"),
    "Helium": import_path.default.join(home, "net.imput.helium"),
    "Firefox": import_path.default.join(getHomeDir(), ".mozilla")
  };
};
var getDarwinDirectory = () => {
  const home = import_path.default.join(getHomeDir(), "Library", "Application Support");
  return {
    "Firefox": import_path.default.join(home, "Mozilla"),
    "Chrome": import_path.default.join(home, "Google", "Chrome"),
    "Chrome Beta": import_path.default.join(home, "Google", "Chrome Beta"),
    "Chrome Dev": import_path.default.join(home, "Google", "Chrome Dev"),
    "Chrome Canary": import_path.default.join(home, "Google", "Chrome Canary"),
    "Chromium": import_path.default.join(home, "Chromium"),
    "Helium": import_path.default.join(home, "net.imput.helium"),
    "Microsoft Edge": import_path.default.join(home, "Microsoft Edge"),
    "Microsoft Edge Beta": import_path.default.join(home, "Microsoft Edge Beta"),
    "Microsoft Edge Dev": import_path.default.join(home, "Microsoft Edge Dev"),
    "Microsoft Edge Canary": import_path.default.join(home, "Microsoft Edge Canary"),
    "Vivaldi": import_path.default.join(home, "Vivaldi")
  };
};
var writeManifest = (dst, data) => {
  try {
    if (!import_fs.default.existsSync(import_path.default.dirname(dst))) {
      import_fs.default.mkdirSync(import_path.default.dirname(dst), { recursive: true });
    }
    ;
    import_fs.default.writeFileSync(dst, JSON.stringify(data, null, 2), {});
    console.log("[InstallNativeMessaging] Manifest written:", dst);
  } catch (err) {
    console.error(err);
  }
  ;
};

// electron/ts/safeStorage.ts
var import_electron2 = require("electron");
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var SafeStorage = class {
  filePath;
  tmpPath;
  bakPath;
  data;
  constructor(filePath) {
    this.filePath = filePath;
    this.tmpPath = filePath + ".tmp";
    this.bakPath = filePath + ".bak";
    this.data = this._load();
  }
  _load() {
    if (import_fs2.default.existsSync(this.tmpPath)) {
      const tmp = this._readJson(this.tmpPath);
      if (tmp !== null) {
        console.log("[SafeStorage] Recovered from interrupted write:", this.tmpPath);
        try {
          import_fs2.default.renameSync(this.tmpPath, this.filePath);
          return tmp;
        } catch (e) {
          console.error("[SafeStorage] Failed to recover from temp file:", e.message);
        }
        ;
      } else {
        try {
          import_fs2.default.unlinkSync(this.tmpPath);
        } catch (e) {
        }
        ;
      }
      ;
    }
    ;
    const main = this._readJson(this.filePath);
    if (main !== null) {
      return main;
    }
    ;
    const backup = this._readJson(this.bakPath);
    if (backup !== null) {
      console.log("[SafeStorage] Recovered from backup:", this.bakPath);
      try {
        this._writeAtomic(backup);
      } catch (e) {
        console.error("[SafeStorage] Failed to restore backup to main file:", e.message);
      }
      ;
      return backup;
    }
    ;
    return {};
  }
  _readJson(fp) {
    try {
      const raw = import_fs2.default.readFileSync(fp, "utf8");
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
    ;
  }
  _save() {
    try {
      this._writeAtomic(this.data);
    } catch (e) {
      console.error("[SafeStorage] Failed to save:", e.message);
    }
    ;
  }
  _writeAtomic(data) {
    const json = JSON.stringify(data, null, "	");
    const fd = import_fs2.default.openSync(this.tmpPath, "w");
    import_fs2.default.writeSync(fd, json, 0, "utf8");
    import_fs2.default.fsyncSync(fd);
    import_fs2.default.closeSync(fd);
    if (import_fs2.default.existsSync(this.filePath)) {
      try {
        import_fs2.default.copyFileSync(this.filePath, this.bakPath);
      } catch (e) {
        console.error("[SafeStorage] Failed to create backup:", e.message);
      }
      ;
    }
    ;
    import_fs2.default.renameSync(this.tmpPath, this.filePath);
  }
  get(key) {
    if (key === void 0) {
      return { ...this.data };
    }
    ;
    return this.data[key];
  }
  set(key, value) {
    if (typeof key === "object" && value === void 0) {
      Object.assign(this.data, key);
    } else {
      this.data[key] = value;
    }
    ;
    this._save();
  }
  delete(key) {
    delete this.data[key];
    this._save();
  }
  clear() {
    this.data = {};
    this._save();
  }
  get store() {
    return { ...this.data };
  }
};
var instance = null;
function getSafeStorage() {
  if (!instance) {
    const suffix = import_electron2.app.isPackaged ? "" : "dev";
    const name = ["localStorage", suffix].join("-") + ".json";
    const filePath = import_path2.default.join(import_electron2.app.getPath("userData"), name);
    instance = new SafeStorage(filePath);
  }
  ;
  return instance;
}

// electron/ts/main.ts
var import_electron_devtools_installer = require("@tomjs/electron-devtools-installer");

// electron/ts/api.ts
var import_electron9 = require("electron");
var import_electron_util6 = require("electron-util");
var import_fs6 = __toESM(require("fs"));
var import_path7 = __toESM(require("path"));
var import_keytar = __toESM(require("keytar"));
var import_electron_dl = require("electron-dl");
var import_child_process2 = require("child_process");
var import_check_disk_space = __toESM(require("check-disk-space"));

// electron/ts/menu.ts
var import_electron7 = require("electron");
var import_electron_util5 = require("electron-util");
var import_fs4 = __toESM(require("fs"));
var import_path5 = __toESM(require("path"));

// electron/ts/config.ts
var import_electron4 = require("electron");
var import_electron_json_storage = __toESM(require("electron-json-storage"));

// electron/ts/util.ts
var import_electron3 = require("electron");
var import_electron_util2 = require("electron-util");
var import_electron_log = __toESM(require("electron-log"));
var import_path3 = __toESM(require("path"));
var import_fs3 = __toESM(require("fs"));
var import_sanitize_filename = __toESM(require("sanitize-filename"));

// electron/json/constant.json
var constant_default = {
  enabledLangs: [
    "be-BY",
    "cs-CZ",
    "da-DK",
    "de-DE",
    "en-US",
    "es-ES",
    "fa-IR",
    "fr-FR",
    "hi-IN",
    "id-ID",
    "it-IT",
    "lt-LT",
    "ja-JP",
    "ko-KR",
    "nl-NL",
    "no-NO",
    "pl-PL",
    "pt-BR",
    "ro-RO",
    "ru-RU",
    "tr-TR",
    "uk-UA",
    "vi-VN",
    "zh-CN",
    "zh-TW"
  ]
};

// electron/ts/util.ts
var protocol = "anytype";
import_electron_log.default.initialize();
import_electron_log.default.transports.console.level = "error";
import_electron_log.default.transports.file.resolvePathFn = () => import_path3.default.join(import_electron3.app.getPath("userData"), "logs", "log.log");
var Util = class {
  appPath = "";
  setAppPath(value) {
    this.appPath = value;
  }
  mkDir(value) {
    if (value) {
      try {
        import_fs3.default.mkdirSync(value);
      } catch (e) {
      }
      ;
    }
    ;
  }
  getLogger() {
    return import_electron_log.default;
  }
  getPort() {
    return process.env.SERVER_PORT || "8080";
  }
  log(method, ...args) {
    if (!import_electron_log.default[method]) {
      method = "info";
    }
    ;
    import_electron_log.default[method](...args);
    console.log(...args);
  }
  dateForFile() {
    return (/* @__PURE__ */ new Date()).toISOString().replace(/:/g, "_").replace(/\..+/, "");
  }
  // MacOs 12.2 (M1): always returns false regardless current color theme
  isDarkTheme() {
    return import_electron3.nativeTheme.shouldUseDarkColors || import_electron3.nativeTheme.shouldUseHighContrastColors || import_electron3.nativeTheme.shouldUseInvertedColorScheme;
  }
  getRouteFromUrl(url) {
    return String(url || "").replace(`${protocol}://`, "/");
  }
  getTheme() {
    const theme = config_default.config.theme;
    switch (theme) {
      default:
        return theme;
      case "system":
        return this.isDarkTheme() ? "dark" : "";
    }
    ;
  }
  getBgColor(theme) {
    theme = String(theme || "");
    const bg = {
      "": "#fff",
      dark: "#171717"
    };
    return bg[theme];
  }
  electronPath() {
    return import_path3.default.join(this.appPath, "electron");
  }
  imagePath() {
    return import_path3.default.join(this.electronPath(), "img");
  }
  userPath() {
    return import_electron3.app.getPath("userData");
  }
  logPath() {
    const dir = import_path3.default.join(this.userPath(), "logs");
    this.createPath(dir);
    return dir;
  }
  createPath(dir) {
    try {
      import_fs3.default.mkdirSync(dir);
    } catch (e) {
    }
    ;
  }
  dataPath() {
    const { channel } = config_default.config;
    const envPath = process.env.DATA_PATH;
    const dataPath = [];
    if (envPath) {
      this.mkDir(envPath);
      dataPath.push(envPath);
    } else {
      dataPath.push(this.userPath());
      if (!import_electron_util2.is.development && ["alpha", "beta"].includes(channel)) {
        dataPath.push(channel);
      }
      ;
      dataPath.push("data");
    }
    ;
    return import_path3.default.join.apply(null, dataPath);
  }
  send(win, ...args) {
    if (!win || win.isDestroyed() || !win.webContents) {
      return;
    }
    ;
    win.webContents.send(...args);
    this.sendToActiveTab(win, ...args);
  }
  sendToTab(win, tabId, ...args) {
    if (!win || win.isDestroyed() || !win.views) {
      return;
    }
    ;
    const view = win.views.find((v) => v.id == tabId);
    if (view && view.webContents) {
      view.webContents.send(...args);
    }
    ;
  }
  getView(win, id) {
    return win?.views?.find((v) => v.id == id);
  }
  getActiveView(win) {
    return this.getView(win, win?.activeTabId);
  }
  setNativeThemeSource() {
    const { theme } = config_default.config;
    switch (theme) {
      case "system":
      case "dark":
        {
          import_electron3.nativeTheme.themeSource = theme;
          break;
        }
        ;
      default:
        {
          import_electron3.nativeTheme.themeSource = "light";
          break;
        }
        ;
    }
    ;
  }
  sendToActiveTab(win, ...args) {
    const view = this.getActiveView(win);
    if (view && view.webContents) {
      view.webContents.send(...args);
    }
    ;
  }
  sendToAllTabs(win, ...args) {
    if (!win || win.isDestroyed() || !win.views) {
      return;
    }
    ;
    for (const view of win.views) {
      if (view && view.webContents) {
        view.webContents.send(...args);
      }
      ;
    }
    ;
  }
  printHtml(win, exportPath, name, options) {
    const fn = `${name.replace(/\.html$/, "")}_files`;
    const filesPath = import_path3.default.join(exportPath, fn);
    const exportName = import_path3.default.join(exportPath, this.fileName(name));
    const view = this.getActiveView(win);
    const webContents = view?.webContents || win.webContents;
    try {
      import_fs3.default.mkdirSync(filesPath);
    } catch (e) {
    }
    ;
    webContents.savePage(exportName, "HTMLComplete").then(() => {
      let content = import_fs3.default.readFileSync(exportName, "utf8");
      try {
        content = content.replace(/'(file:\/\/[^']+)'/g, function(s, p, o) {
          const a = p.split("app.asar/dist/");
          let name2 = a[1].split("/");
          name2 = name2[name2.length - 1];
          const src = p.replace("file://", "").replace(/\?.*/, "").replace(/\/app.asar\//g, "/app.asar.unpacked/");
          const dst = import_path3.default.join(filesPath, name2).replace(/\?.*/, "");
          import_fs3.default.copyFileSync(src, dst);
          return `'./${fn}/${name2}'`;
        });
      } catch (e) {
        this.log("info", e);
      }
      ;
      content = content.replace(/<script[^>]+><\/script>/g, "");
      try {
        const css = ["export"];
        const js = ["export", "jquery"];
        const ap = import_electron3.app.getAppPath();
        let replaceJs = "";
        let replaceCss = "";
        const replaceMeta = `
					<meta name='viewport' content='width=device-width, initial-scale=1.0' />
				`;
        js.forEach((it) => {
          import_fs3.default.copyFileSync(`${ap}/dist/js/${it}.js`, import_path3.default.join(filesPath, it + ".js"));
          replaceJs += `<script src='./${fn}/${it}.js' type='text/javascript'></script>`;
        });
        css.forEach((it) => {
          import_fs3.default.copyFileSync(`${ap}/dist/css/${it}.css`, import_path3.default.join(filesPath, it + ".css"));
          replaceCss += `<link rel='stylesheet' href='./${fn}/${it}.css' type='text/css' />`;
        });
        content = content.replace("<!-- %REPLACE-JS% -->", replaceJs);
        content = content.replace("</head>", replaceCss + "</head>");
        content = content.replace("<head>", "<head>" + replaceMeta);
      } catch (e) {
        this.log("info", e);
      }
      ;
      import_fs3.default.writeFileSync(exportName, content);
      try {
        import_fs3.default.unlinkSync(import_path3.default.join(filesPath, "js/main.js"));
        import_fs3.default.unlinkSync(import_path3.default.join(filesPath, "js/run.js"));
      } catch (e) {
        this.log("info", e);
      }
      ;
      import_electron3.shell.openPath(exportPath).catch((err) => {
        this.log("info", err);
      });
      this.send(win, "commandGlobal", "saveAsHTMLSuccess");
    }).catch((err) => {
      this.send(win, "commandGlobal", "saveAsHTMLSuccess");
      this.log("info", err);
    });
  }
  printPdf(win, exportPath, name, options) {
    const view = this.getActiveView(win);
    const webContents = view?.webContents || win.webContents;
    webContents.printToPDF(options).then((data) => {
      import_fs3.default.writeFile(import_path3.default.join(exportPath, this.fileName(name)), data, (error) => {
        if (!error) {
          import_electron3.shell.openPath(exportPath).catch((err) => this.log("info", err));
        } else {
          this.log("info", error);
        }
        ;
        this.send(win, "commandGlobal", "saveAsHTMLSuccess");
      });
    }).catch((err) => {
      this.send(win, "commandGlobal", "saveAsHTMLSuccess");
      this.log("info", err);
    });
  }
  fileName(name) {
    return (0, import_sanitize_filename.default)(String(name || "untitled").trim());
  }
  getLang() {
    return config_default.config.interfaceLang || "en-US";
  }
  enabledLangs() {
    return constant_default.enabledLangs || [];
  }
  translate(key) {
    const lang = this.getLang();
    const langDir = import_path3.default.join(__dirname, "dist", "lib", "json", "lang");
    const defaultData = JSON.parse(import_fs3.default.readFileSync(import_path3.default.join(langDir, "en-US.json"), "utf8"));
    let data = {};
    try {
      data = JSON.parse(import_fs3.default.readFileSync(import_path3.default.join(langDir, `${lang}.json`), "utf8"));
    } catch (e) {
    }
    ;
    return data[key] || defaultData[key] || `\u26A0\uFE0F${key}\u26A0\uFE0F`;
  }
  defaultUserDataPath() {
    return import_path3.default.join(import_electron3.app.getPath("appData"), import_electron3.app.getName());
  }
  registerLinuxProtocolHandler() {
    if (!import_electron_util2.is.linux) {
      return;
    }
    ;
    const { execFile: execFile2 } = require("child_process");
    const home = process.env.HOME || "";
    const dataHome = process.env.XDG_DATA_HOME || import_path3.default.join(home, ".local", "share");
    const applicationsDir = import_path3.default.join(dataHome, "applications");
    const desktopFilePath = import_path3.default.join(applicationsDir, "anytype.desktop");
    const execPath = process.env.APPIMAGE || process.execPath;
    const content = [
      "[Desktop Entry]",
      "Name=Anytype",
      "Comment=Project management and knowledge workspace",
      `Exec="${execPath}" --ozone-platform-hint=auto %u`,
      "Terminal=false",
      "Type=Application",
      "Icon=anytype",
      "Categories=Utility;Office;Calendar;ProjectManagement;",
      "StartupWMClass=anytype",
      "Keywords=project management;",
      "MimeType=x-scheme-handler/anytype;"
    ].join("\n");
    const xwaylandContent = [
      "[Desktop Entry]",
      "Name=Anytype (XWayland)",
      "Comment=Project management and knowledge workspace (XWayland mode)",
      `Exec="${execPath}" --ozone-platform=x11 %u`,
      "Terminal=false",
      "Type=Application",
      "Icon=anytype",
      "Categories=Utility;Office;Calendar;ProjectManagement;",
      "StartupWMClass=anytype",
      "Keywords=project management;",
      "MimeType=x-scheme-handler/anytype;",
      "NoDisplay=true"
    ].join("\n");
    const xwaylandFilePath = import_path3.default.join(applicationsDir, "anytype-xwayland.desktop");
    try {
      import_fs3.default.mkdirSync(applicationsDir, { recursive: true });
      if (!import_fs3.default.existsSync(desktopFilePath)) {
        import_fs3.default.writeFileSync(desktopFilePath, content, "utf-8");
        execFile2("xdg-mime", ["default", "anytype.desktop", "x-scheme-handler/anytype"], (err) => {
          if (err) {
            this.log("info", `xdg-mime default failed: ${err.message}`);
          }
          ;
        });
      }
      ;
      if (!import_fs3.default.existsSync(xwaylandFilePath)) {
        import_fs3.default.writeFileSync(xwaylandFilePath, xwaylandContent, "utf-8");
      }
      ;
    } catch (e) {
      this.log("info", `registerLinuxProtocolHandler failed: ${e.message}`);
    }
    ;
  }
  isWayland() {
    return import_electron_util2.is.linux && process.env.XDG_SESSION_TYPE === "wayland";
  }
  isKDE() {
    const desktop = (process.env.XDG_CURRENT_DESKTOP || "").toLowerCase();
    return desktop.split(":").includes("kde");
  }
  getCss() {
    const cssPath = import_path3.default.join(this.userPath(), "custom.css");
    const css = import_fs3.default.existsSync(cssPath) ? import_fs3.default.readFileSync(cssPath, "utf8") : "";
    return String(css || "");
  }
};
var util_default = new Util();

// electron/ts/config.ts
var version = import_electron4.app.getVersion();
var ChannelSettings = [
  { id: "alpha", lang: "electronChannelAlpha" },
  { id: "beta", lang: "electronChannelBeta" },
  { id: "latest", lang: "electronChannelLatest" }
];
var CONFIG_NAME = "devconfig";
var LATEST = "latest";
var BETA = "beta";
var ALPHA = "alpha";
var ConfigManager = class {
  config = {};
  init(callBack) {
    import_electron_json_storage.default.get(CONFIG_NAME, (error, data) => {
      this.config = data || {};
      if (void 0 === this.config.showMenuBar) {
        this.config.showMenuBar = true;
      }
      ;
      if (void 0 === this.config.alwaysShowTabs) {
        this.config.alwaysShowTabs = false;
      }
      ;
      if (void 0 === this.config.hardwareAcceleration) {
        this.config.hardwareAcceleration = true;
      }
      ;
      this.checkChannel();
      this.checkTheme();
      console.log("[ConfigManager].init:", this.config);
      if (error) {
        console.error(error);
      }
      ;
      callBack?.();
    });
  }
  set(obj, callBack) {
    this.config = Object.assign(this.config, obj);
    this.checkChannel();
    this.checkTheme();
    console.log("[ConfigManager].set:", this.config);
    import_electron_json_storage.default.set(CONFIG_NAME, this.config, (error) => {
      callBack?.(error);
    });
  }
  checkTheme() {
    this.config.theme = void 0 !== this.config.theme ? this.config.theme : "system";
  }
  checkChannel() {
    const channelIds = this.getChannels().map((it) => it.id);
    this.config.channel = String(this.config.channel || this.getDefaultChannel());
    if (!channelIds.includes(this.config.channel)) {
      this.config.channel = LATEST;
    }
    ;
  }
  getDefaultChannel() {
    let c = LATEST;
    if (version.match("alpha")) {
      c = ALPHA;
    }
    ;
    if (version.match("beta")) {
      c = BETA;
    }
    ;
    return c;
  }
  getChannels() {
    let channels = ChannelSettings.map((it) => {
      return { id: it.id, label: util_default.translate(it.lang), type: "radio", checked: this.config.channel == it.id };
    });
    if (!this.config.sudo && !version.match("alpha")) {
      channels = channels.filter((it) => it.id != "alpha");
    }
    ;
    return channels;
  }
};
var config_default = new ConfigManager();

// electron/ts/update.ts
var import_electron5 = require("electron");
var import_electron_util3 = require("electron-util");
var import_electron_updater = require("electron-updater");
var TIMEOUT_UPDATE = 600 * 1e3;
var UpdateManager = class {
  win = null;
  isUpdating = false;
  isDownloading = false;
  isRelaunching = false;
  autoUpdate = false;
  timeout = null;
  setWindow(win) {
    this.win = win;
  }
  init() {
    const { channel } = config_default.config;
    console.log("[UpdateManager].init, channel: ", channel);
    import_electron_updater.autoUpdater.logger = util_default.getLogger();
    import_electron_updater.autoUpdater.logger.transports.file.level = "debug";
    import_electron_updater.autoUpdater.autoDownload = false;
    import_electron_updater.autoUpdater.autoInstallOnAppQuit = false;
    import_electron_updater.autoUpdater.channel = channel;
    this.setTimeout();
    import_electron_updater.autoUpdater.on("checking-for-update", () => {
      util_default.log("info", "Checking for update");
    });
    import_electron_updater.autoUpdater.on("update-available", (info) => {
      this.clearTimeout();
      util_default.log("info", `Update available: ${JSON.stringify(info, null, 3)}`);
      this.download();
    });
    import_electron_updater.autoUpdater.on("update-not-available", (info) => {
      util_default.log("info", `Update not available: ${JSON.stringify(info, null, 3)}`);
      util_default.send(this.win, "update-not-available", this.autoUpdate);
    });
    import_electron_updater.autoUpdater.on("error", (err) => {
      util_default.log(`Error: ${err}`);
      util_default.send(this.win, "update-error", err, this.autoUpdate, this.isDownloading);
      this.isDownloading = false;
    });
    import_electron_updater.autoUpdater.on("download-progress", (progress) => {
      this.isUpdating = true;
      const msg = [
        `Download speed: ${progress.bytesPerSecond}`,
        "-",
        `Downloaded: ${progress.percent}%`,
        `(${progress.transferred}/${progress.total})`
      ];
      util_default.log("info", msg.join(" "));
      util_default.send(this.win, "download-progress", progress);
    });
    import_electron_updater.autoUpdater.on("update-downloaded", (info) => {
      this.isUpdating = false;
      this.isDownloading = false;
      util_default.log("info", `Update downloaded: ${JSON.stringify(info, null, 3)}`);
      util_default.send(this.win, "update-downloaded", info);
    });
  }
  isAllowed() {
    const { config } = config_default;
    if (config.updateDisabled) {
      console.log("[UpdateManager].isAllowed, updateDisabled");
      return false;
    }
    ;
    const [osMajor, osMinor, osPatch] = String(process.getSystemVersion() || "").split(".");
    const [appMajor, appMinor, appPatch] = String(import_electron5.app.getVersion() || "").split(".");
    console.log("[UpdateManager].isAllowed, osVersion: ", [osMajor, osMinor, osPatch], "appVersion", [appMajor, appMinor, appPatch]);
    if (import_electron_util3.is.windows && Number(osMajor) <= 8) {
      console.log("[UpdateManager].isAllowed, Windows version <= 8");
      return false;
    }
    ;
    if (import_electron_util3.is.macos && Number(osMajor) <= 10) {
      console.log("[UpdateManager].isAllowed, MacOS version <= 10");
      return false;
    }
    ;
    if (!/-(alpha|beta)/.test(appPatch) && isNaN(appPatch)) {
      console.log("[UpdateManager].isAllowed, App version is not valid");
      return false;
    }
    ;
    return true;
  }
  setChannel(channel) {
    import_electron_updater.autoUpdater.channel = channel;
    this.checkUpdate(false);
  }
  checkUpdate(auto) {
    if (!this.isAllowed() || this.isUpdating) {
      return;
    }
    ;
    import_electron_updater.autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      util_default.log("info", `checkForUpdatesAndNotify error: ${err}`);
    });
    this.setTimeout();
    this.autoUpdate = auto;
  }
  download() {
    this.isDownloading = true;
    util_default.send(this.win, "download-started");
    import_electron_updater.autoUpdater.downloadUpdate();
  }
  relaunch() {
    util_default.log("info", "Relaunch");
    import_electron5.app.isQuiting = true;
    this.isRelaunching = true;
    import_electron_updater.autoUpdater.quitAndInstall(false, true);
    setTimeout(() => {
      util_default.log("error", "Relaunch: quitAndInstall did not exit the app, forcing exit");
      import_electron5.app.exit(0);
    }, 5e3);
  }
  cancel() {
    this.isUpdating = false;
    this.isDownloading = false;
    this.clearTimeout();
  }
  setTimeout() {
    const { config } = config_default;
    const t = Number(config.updateTimeout) || TIMEOUT_UPDATE;
    this.clearTimeout();
    this.timeout = setTimeout(() => this.checkUpdate(true), t);
  }
  clearTimeout() {
    clearTimeout(this.timeout);
  }
};
var update_default = new UpdateManager();

// electron/ts/window.ts
var import_electron6 = require("electron");
var import_electron_util4 = require("electron-util");
var import_path4 = __toESM(require("path"));
var import_electron_window_state = __toESM(require("electron-window-state"));
var remote = __toESM(require("@electron/remote/main"));
var import_crypto = require("crypto");
var port = util_default.getPort();
var TABS_STORAGE_KEY = "savedTabs";
var DEFAULT_WIDTH = 1024;
var DEFAULT_HEIGHT = 768;
var MIN_WIDTH = 640;
var MIN_HEIGHT = 480;
var NEW_WINDOW_SHIFT = 30;
var TAB_BAR_HEIGHT = 52;
var MENU_BAR_HEIGHT = 28;
var WindowManager = class {
  list = /* @__PURE__ */ new Set();
  create(options, param) {
    const { showMenuBar } = config_default.config;
    const theme = util_default.getTheme();
    const bgColor = util_default.getBgColor(theme);
    param = Object.assign({
      backgroundColor: bgColor,
      show: false,
      titleBarStyle: "hidden-inset"
    }, param);
    param.webPreferences = Object.assign(this.getPreferencesForNewWindow(), param.webPreferences || {});
    const bw = new import_electron6.BrowserWindow(param);
    remote.enable(bw.webContents);
    const win = Object.assign(bw, options);
    win.windowId = win.id;
    this.list.add(win);
    win.on("closed", () => {
      this.list.delete(win);
    });
    win.on("focus", () => {
      update_default.setWindow(win);
      menu_default.setWindow(win);
      setImmediate(() => {
        if (win.isDestroyed() || !win.isFocused()) {
          return;
        }
        ;
        const activeView = util_default.getActiveView(win);
        if (activeView && activeView.webContents && !activeView.webContents.isDestroyed()) {
          activeView.webContents.focus();
        }
        ;
      });
    });
    win.on("enter-full-screen", () => {
      win.setMenuBarVisibility(false);
      win.setAutoHideMenuBar(true);
      util_default.send(win, "enter-full-screen");
    });
    win.on("leave-full-screen", () => {
      const { showMenuBar: showMenuBar2 } = config_default.config;
      win.setMenuBarVisibility(showMenuBar2);
      win.setAutoHideMenuBar(!showMenuBar2);
      util_default.send(win, "leave-full-screen");
    });
    win.on("swipe", (e, direction) => util_default.send(win, "commandGlobal", "mouseNavigation", direction));
    win.webContents.setWindowOpenHandler(({ url }) => {
      api_default.openUrl(win, url);
      return { action: "deny" };
    });
    win.setMenuBarVisibility(showMenuBar);
    win.setAutoHideMenuBar(!showMenuBar);
    return win;
  }
  createMain(options) {
    const { isChild, initialBounds, initialTabData } = options;
    const image = import_electron6.nativeImage.createFromPath(import_path4.default.join(util_default.imagePath(), "icons", "512x512.png"));
    let state = {};
    let param = {
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT
    };
    if (import_electron_util4.is.macos) {
      import_electron6.app.dock.setIcon(image);
      param.frame = false;
      param.titleBarStyle = "hidden";
      param.icon = import_path4.default.join(util_default.imagePath(), "icon.icns");
      param.trafficLightPosition = { x: 12, y: 19 };
    } else if (import_electron_util4.is.windows) {
      param.frame = false;
      param.titleBarStyle = "hidden";
      param.icon = import_path4.default.join(util_default.imagePath(), "icons", "256x256.ico");
    } else if (import_electron_util4.is.linux) {
      param.icon = image;
    }
    ;
    if (!isChild) {
      try {
        state = (0, import_electron_window_state.default)({
          defaultWidth: DEFAULT_WIDTH,
          defaultHeight: DEFAULT_HEIGHT,
          maximize: true,
          fullScreen: true
        });
        param = Object.assign(param, {
          x: state.x,
          y: state.y,
          width: state.width,
          height: state.height
        });
      } catch (e) {
        console.error("[WindowManager] Failed to restore window state:", e);
      }
      ;
    } else if (initialBounds) {
      param = Object.assign(param, {
        x: initialBounds.x,
        y: initialBounds.y,
        width: initialBounds.width || DEFAULT_WIDTH,
        height: initialBounds.height || DEFAULT_HEIGHT
      });
    } else {
      const { width, height } = this.getScreenSize();
      param = Object.assign(param, this.getWindowPosition(param, width, height));
    }
    ;
    const win = this.create(options, param);
    if (!isChild) {
      state.manage(win);
    }
    ;
    win.loadURL(this.getUrlForNewWindow());
    win.once("ready-to-show", () => {
      if (!isChild && state.isMaximized) {
        win.maximize();
      }
      ;
      if (!isChild && state.isFullScreen) {
        win.setFullScreen(true);
      }
      ;
      win.show();
    });
    win.on("enter-full-screen", () => menu_default.initMenu());
    win.on("leave-full-screen", () => menu_default.initMenu());
    const updateViewBounds = () => {
      const bounds = this.getBounds(win);
      if (!bounds) {
        return;
      }
      ;
      const activeView = util_default.getActiveView(win);
      if (activeView) {
        const tabBarHeight = this.getTabBarHeight(win);
        activeView.setBounds({ x: 0, y: tabBarHeight, width: bounds.width, height: bounds.height - tabBarHeight });
      }
      ;
    };
    win.on("resize", updateViewBounds);
    win.on("maximize", updateViewBounds);
    win.on("unmaximize", updateViewBounds);
    win.on("restore", updateViewBounds);
    if (initialTabData) {
      this.createTab(win, initialTabData, { setActive: true });
    } else {
      const savedState = this.loadTabs();
      if (savedState && savedState.tabs && savedState.tabs.length > 0) {
        const activeIndex = savedState.activeIndex || 0;
        for (let i = 0; i < savedState.tabs.length; i++) {
          const tabData = savedState.tabs[i];
          const isActiveTab = i === activeIndex;
          this.createTab(win, tabData.data || {}, {
            deferLoad: !isActiveTab,
            setActive: false
          });
        }
        ;
        if (win.views && win.views[activeIndex]) {
          this.setActiveTab(win, win.views[activeIndex].id);
        }
        ;
        this.clearSavedTabs();
      } else {
        this.createTab(win, {}, { setActive: true });
      }
      ;
    }
    ;
    return win;
  }
  createChallenge(options) {
    console.log("[WindowManager] createChallenge called", options);
    for (const win2 of this.list) {
      if (win2 && win2.isChallenge && win2.challenge == options.challenge && !win2.isDestroyed()) {
        console.log("[WindowManager] Challenge window already exists");
        return win2;
      }
      ;
    }
    ;
    console.log("[WindowManager] Creating new challenge window");
    const { width, height } = this.getScreenSize();
    const win = this.create({ ...options, isChallenge: true }, {
      backgroundColor: "",
      width: 424,
      height: 232,
      x: Math.floor(width / 2 - 212),
      y: Math.floor(height - 282),
      titleBarStyle: "hidden",
      alwaysOnTop: true,
      focusable: true,
      skipTaskbar: true
    });
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.loadURL(`file://${import_path4.default.join(util_default.appPath, "dist", "challenge", "index.html")}`);
    win.setMenu(null);
    win.showInactive();
    win.webContents.once("did-finish-load", () => {
      win.webContents.send("challenge", options);
    });
    setTimeout(() => this.closeChallenge(options), 3e4);
    return win;
  }
  getScreenSize() {
    const ret = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
    try {
      const { screen } = require("electron");
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;
      ret.width = width;
      ret.height = height;
    } catch (e) {
    }
    ;
    return ret;
  }
  closeChallenge(options) {
    for (const win of this.list) {
      if (win && win.isChallenge && win.challenge == options.challenge && !win.isDestroyed()) {
        win.close();
      }
      ;
    }
    ;
  }
  command(win, cmd, param) {
    param = param || {};
    switch (cmd) {
      case "menu":
        menu_default.menu.popup({ x: 16, y: 38 });
        break;
      case "printHtml":
      case "printPdf":
        const ext = cmd.replace(/print/, "").toLowerCase();
        import_electron6.dialog.showSaveDialog(win, {
          buttonLabel: "Export",
          defaultPath: `${import_electron6.app.getPath("documents")}/${param.name}.${ext}`,
          properties: ["createDirectory", "showOverwriteConfirmation"]
        }).then((result) => {
          const fp = result.filePath;
          if (!fp) {
            util_default.send(win, "commandGlobal", "saveAsHTMLSuccess");
          } else {
            util_default[cmd](win, import_path4.default.dirname(fp), import_path4.default.basename(fp), param.options);
          }
          ;
        }).catch(() => {
          util_default.send(win, "commandGlobal", "saveAsHTMLSuccess");
        });
        break;
    }
    ;
  }
  createTab(win, param, options) {
    const id = (0, import_crypto.randomUUID)();
    const { deferLoad, setActive } = options || {};
    const wcv = new import_electron6.WebContentsView({
      webPreferences: {
        ...this.getPreferencesForNewWindow(),
        additionalArguments: [`--tab-id=${id}`, `--win-id=${win.id}`]
      }
    });
    win.views = win.views || [];
    const view = Object.assign(wcv, { id, data: { ...param }, isLoaded: false });
    win.views.push(view);
    win.activeTabId = win.activeTabId || id;
    view.webContents.setWindowOpenHandler(({ url }) => {
      api_default.openUrl(win, url);
      return { action: "deny" };
    });
    view.webContents.on("context-menu", (e, param2) => {
      util_default.sendToTab(win, view.id, "spellcheck", param2.misspelledWord, param2.dictionarySuggestions, param2.x, param2.y, param2.selectionRect);
    });
    if (import_electron_util4.is.windows || import_electron_util4.is.linux) {
      let altKeyPressed = false;
      let altKeyUsedWithOther = false;
      view.webContents.on("before-input-event", (e, input) => {
        const { showMenuBar } = config_default.config;
        if (showMenuBar) {
          return;
        }
        ;
        if (input.type === "keyDown") {
          if (input.key === "Alt") {
            altKeyPressed = true;
            altKeyUsedWithOther = false;
          } else if (altKeyPressed) {
            altKeyUsedWithOther = true;
          }
          ;
        } else if (input.type === "keyUp" && input.key === "Alt") {
          if (altKeyPressed && !altKeyUsedWithOther) {
            util_default.send(win, "alt-key-toggle");
          }
          ;
          altKeyPressed = false;
          altKeyUsedWithOther = false;
        }
        ;
      });
    }
    ;
    view.webContents.on("did-finish-load", () => {
      view.isLoaded = true;
      const hasPinnedTab = win.views && win.views.some((it) => it.data && it.data.isPinned);
      const isSingleTab = win.views && win.views.length == 1 && !hasPinnedTab;
      util_default.sendToTab(win, view.id, "set-single-tab", isSingleTab);
      const zoom = Number(config_default.config.zoom) || 0;
      if (zoom) {
        view.webContents.setZoomLevel(zoom);
      }
      ;
      this.updateTabBarVisibility(win);
    });
    view.webContents.on("render-process-gone", (e, details) => {
      util_default.log("info", `[Window] render-process-gone: ${details.reason}`);
      if (details.reason !== "clean-exit") {
        setTimeout(() => {
          if (view.webContents && !view.webContents.isDestroyed()) {
            view.webContents.reload();
          }
          ;
        }, 500);
      }
      ;
    });
    remote.enable(view.webContents);
    if (!deferLoad) {
      view.webContents.loadURL(this.getUrlForNewTab());
    }
    ;
    util_default.send(win, "create-tab", { id: view.id, data: view.data });
    if (setActive !== false) {
      this.setActiveTab(win, id);
    }
    ;
    this.updateTabBarVisibility(win);
    return view;
  }
  getBounds(win) {
    if (!win || win.isDestroyed()) {
      return null;
    }
    ;
    return win.getContentBounds();
  }
  setActiveTab(win, id) {
    id = String(id || "");
    if (!id || !win.views) {
      return;
    }
    ;
    const view = win.views.find((it) => it.id == id);
    if (!view) {
      return;
    }
    ;
    const currentActive = util_default.getActiveView(win);
    if (currentActive) {
      win.contentView.removeChildView(currentActive);
    }
    ;
    const bounds = this.getBounds(win);
    const tabBarHeight = this.getTabBarHeight(win);
    view.setBounds({ x: 0, y: tabBarHeight, width: bounds.width, height: bounds.height - tabBarHeight });
    win.activeTabId = id;
    win.contentView.addChildView(view);
    if (!view.isLoaded && view.webContents && !view.webContents.isDestroyed() && !view.webContents.isLoading()) {
      view.webContents.loadURL(this.getUrlForNewTab());
    }
    ;
    view.webContents.focus();
    win.webContents.send("set-active-tab", id);
    util_default.sendToAllTabs(win, "set-active-tab", id);
  }
  updateTab(win, id, data) {
    id = String(id || "");
    if (!id || !win.views) {
      return;
    }
    ;
    const view = win.views.find((it) => it.id == id);
    if (!view) {
      return;
    }
    ;
    view.data = Object.assign(view.data || {}, data);
    util_default.send(win, "update-tab", { id: view.id, data: view.data });
  }
  removeTab(win, id, updateActive) {
    id = String(id || "");
    if (!id || !win.views || win.views.length <= 1) {
      return;
    }
    ;
    const view = win.views.find((it) => it.id == id);
    const index = win.views.findIndex((it) => it.id == id);
    if (win.activeTabId == id) {
      win.contentView.removeChildView(view);
    }
    ;
    win.views.splice(index, 1);
    util_default.send(win, "remove-tab", id);
    this.updateTabBarVisibility(win);
    if (updateActive && win.activeTabId == id) {
      const newIndex = index < win.views.length ? index : index - 1;
      this.setActiveTab(win, win.views[newIndex]?.id);
    }
    ;
    if (view && view.webContents && !view.webContents.isDestroyed()) {
      const timeout = 5e3;
      let handler = null;
      const cleanup = () => {
        if (handler) {
          import_electron6.ipcMain.removeListener("tab-session-closed", handler);
        }
        ;
        if (view.webContents && !view.webContents.isDestroyed()) {
          view.webContents.close();
        }
        ;
      };
      const timeoutId = setTimeout(() => {
        util_default.log("warn", `[WindowManager].removeTab: Timeout waiting for tab ${id} to close session`);
        cleanup();
      }, timeout);
      handler = (event, readyTabId) => {
        if (readyTabId === id) {
          clearTimeout(timeoutId);
          cleanup();
        }
        ;
      };
      import_electron6.ipcMain.on("tab-session-closed", handler);
      util_default.sendToTab(win, view.id, "close-session");
    }
    ;
  }
  closeActiveTab(win) {
    const activeView = win.views.find((it) => it.id == win.activeTabId);
    if (activeView && activeView.data && activeView.data.isPinned) {
      api_default.close(win);
      return;
    }
    ;
    if (win.views.length > 1) {
      this.removeTab(win, win.activeTabId, true);
    } else {
      api_default.close(win);
    }
    ;
  }
  closeOtherWindows(win) {
    this.list.forEach((it) => {
      if (it !== win && !it.isDestroyed()) {
        it.close();
      }
      ;
    });
  }
  closeOtherTabs(win, id, forced) {
    id = String(id || "");
    if (!id || !win.views) {
      return;
    }
    ;
    const views = win.views.filter((it) => {
      if (it.id == id) {
        return false;
      }
      ;
      if (!forced && it.data && it.data.isPinned) {
        return false;
      }
      ;
      return true;
    });
    views.forEach((view) => {
      this.removeTab(win, view.id, false);
    });
    this.setActiveTab(win, id);
  }
  findTabByRoute(win, route) {
    if (!win || !win.views || !route) {
      return null;
    }
    ;
    return win.views.find((it) => it.data && it.data.route === route) || null;
  }
  openRouteInTab(win, route, data) {
    if (!win || !win.views || !route) {
      return;
    }
    ;
    const existing = this.findTabByRoute(win, route);
    if (existing) {
      this.setActiveTab(win, existing.id);
    } else {
      this.createTab(win, { ...data, route }, { setActive: true });
    }
    ;
  }
  openSpaceInTab(win, spaceId, spaceType) {
    if (!win || !win.views || !spaceId) {
      return;
    }
    ;
    const existing = win.views.find((it) => it.data && it.data.spaceId === spaceId);
    if (existing) {
      this.setActiveTab(win, existing.id);
    } else {
      this.createTab(win, { spaceId, spaceType }, { setActive: true });
    }
    ;
  }
  pinTab(win, id) {
    id = String(id || "");
    if (!id || !win.views) {
      return;
    }
    ;
    const view = win.views.find((it) => it.id == id);
    if (!view) {
      return;
    }
    ;
    view.data = view.data || {};
    view.data.isPinned = true;
    const index = win.views.indexOf(view);
    win.views.splice(index, 1);
    const lastPinnedIndex = win.views.reduce((acc, v, i) => v.data && v.data.isPinned ? i : acc, -1);
    win.views.splice(lastPinnedIndex + 1, 0, view);
    util_default.sendToTab(win, id, "set-pinned", true);
    this.sendUpdateTabs(win);
    this.updateTabBarVisibility(win);
  }
  unpinTab(win, id) {
    id = String(id || "");
    if (!id || !win.views) {
      return;
    }
    ;
    const view = win.views.find((it) => it.id == id);
    if (!view) {
      return;
    }
    ;
    view.data = view.data || {};
    view.data.isPinned = false;
    const index = win.views.indexOf(view);
    win.views.splice(index, 1);
    const lastPinnedIndex = win.views.reduce((acc, v, i) => v.data && v.data.isPinned ? i : acc, -1);
    win.views.splice(lastPinnedIndex + 1, 0, view);
    util_default.sendToTab(win, id, "set-pinned", false);
    this.sendUpdateTabs(win);
    this.updateTabBarVisibility(win);
  }
  sendUpdateTabs(win) {
    const alwaysShow = config_default.config.alwaysShowTabs;
    const hasPinnedTab = win.views && win.views.some((it) => it.data && it.data.isPinned);
    const isVisible = alwaysShow || hasPinnedTab || win.views && win.views.length > 1;
    util_default.send(
      win,
      "update-tabs",
      win.views.map((it) => ({ id: it.id, data: it.data })),
      win.activeTabId,
      isVisible
    );
  }
  reorderTabs(win, tabIds) {
    if (!win.views || !tabIds || !tabIds.length) {
      return;
    }
    ;
    const newViews = [];
    tabIds.forEach((id) => {
      const view = win.views.find((v) => v.id == id);
      if (view) {
        newViews.push(view);
      }
      ;
    });
    let seenUnpinned = false;
    let isValid = true;
    for (const view of newViews) {
      const isPinned = view.data && view.data.isPinned;
      if (isPinned && seenUnpinned) {
        isValid = false;
        break;
      }
      ;
      if (!isPinned) {
        seenUnpinned = true;
      }
      ;
    }
    ;
    if (!isValid) {
      this.sendUpdateTabs(win);
      return;
    }
    ;
    win.views = newViews;
    this.sendUpdateTabs(win);
    this.updateTabBarVisibility(win);
  }
  nextTab(win) {
    if (!win.views || win.views.length <= 1) {
      return;
    }
    ;
    const index = win.views.findIndex((it) => it.id == win.activeTabId);
    const nextIndex = (index + 1) % win.views.length;
    this.setActiveTab(win, win.views[nextIndex].id);
  }
  prevTab(win) {
    if (!win.views || win.views.length <= 1) {
      return;
    }
    ;
    const index = win.views.findIndex((it) => it.id == win.activeTabId);
    const prevIndex = (index - 1 + win.views.length) % win.views.length;
    this.setActiveTab(win, win.views[prevIndex].id);
  }
  getPreferencesForNewWindow() {
    return {
      preload: (0, import_electron_util4.fixPathForAsarUnpack)(import_path4.default.join(util_default.electronPath(), "js", "preload.cjs")),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
      sandbox: false,
      additionalArguments: []
    };
  }
  getUrlForNewWindow() {
    return import_electron_util4.is.development ? `http://localhost:${port}/tabs.html` : "file://" + import_path4.default.join(util_default.appPath, "dist", "tabs.html");
  }
  getUrlForNewTab() {
    return this.getUrlForNewWindow().replace("tabs.html", "index.html");
  }
  getWindowPosition(param, displayWidth, displayHeight) {
    const currentWindow = import_electron6.BrowserWindow.getFocusedWindow();
    let x = Math.round(displayWidth / 2 - param.width / 2);
    let y = Math.round(displayHeight / 2 - param.height / 2 + 20);
    if (currentWindow) {
      const [xPos, yPos] = currentWindow.getPosition();
      x = xPos + NEW_WINDOW_SHIFT;
      y = yPos + NEW_WINDOW_SHIFT;
      const xLimit = x + param.width > displayWidth;
      const yLimit = y + param.height > displayHeight;
      if (xLimit || yLimit) {
        x = 0;
        y = 0;
      }
      ;
    }
    ;
    return { x, y };
  }
  getTabBarHeight(win) {
    if (api_default.hasPinSet && !api_default.isPinChecked) {
      return 0;
    }
    ;
    const alwaysShow = config_default.config.alwaysShowTabs;
    const configShowMenuBar = config_default.config.showMenuBar;
    const hasMultipleTabs = win.views && win.views.length > 1;
    const hasPinnedTab = win.views && win.views.some((it) => it.data && it.data.isPinned);
    const shouldShowTabs = alwaysShow || hasPinnedTab || hasMultipleTabs;
    const showMenuBar = win.tempMenuBarVisible !== void 0 ? win.tempMenuBarVisible : configShowMenuBar;
    let height = 0;
    if (import_electron_util4.is.windows && showMenuBar) {
      height += MENU_BAR_HEIGHT;
    }
    ;
    if (shouldShowTabs) {
      height += TAB_BAR_HEIGHT;
    }
    ;
    return height;
  }
  updateTabBarVisibility(win) {
    if (!win || win.isDestroyed()) {
      return;
    }
    ;
    const alwaysShow = config_default.config.alwaysShowTabs;
    const hasMultipleTabs = win.views && win.views.length > 1;
    const hasPinnedTab = win.views && win.views.some((it) => it.data && it.data.isPinned);
    const isPinCheckRequired = api_default.hasPinSet && !api_default.isPinChecked;
    const isVisible = !isPinCheckRequired && (alwaysShow || hasPinnedTab || hasMultipleTabs);
    const isSingleTab = win.views && win.views.length == 1 && !hasPinnedTab;
    util_default.send(win, "update-tab-bar-visibility", isVisible);
    util_default.sendToAllTabs(win, "set-single-tab", isSingleTab);
    const view = util_default.getActiveView(win);
    if (view && !view.webContents?.isDestroyed()) {
      const bounds = this.getBounds(win);
      const tabBarHeight = this.getTabBarHeight(win);
      view.setBounds({
        x: 0,
        y: tabBarHeight,
        width: bounds.width,
        height: bounds.height - tabBarHeight
      });
    }
    ;
  }
  sendToAll(...args) {
    this.list.forEach((it) => util_default.send(it, ...args));
  }
  sendToAllTabs(...args) {
    this.list.forEach((it) => util_default.sendToAllTabs(it, ...args));
  }
  reloadAll() {
    this.sendToAllTabs("reload");
  }
  getFirstWindow() {
    return this.list.values().next().value;
  }
  /**
   * Saves the current tabs state to storage for restoration on next app start
   * @param {BrowserWindow} win - The window to save tabs from
   */
  saveTabs(win) {
    if (!win || !win.views || win.isDestroyed()) {
      return;
    }
    ;
    const store2 = getSafeStorage();
    const tabsData = win.views.map((view) => ({
      data: view.data || {}
    }));
    const activeIndex = win.views.findIndex((view) => view.id === win.activeTabId);
    const state = {
      tabs: tabsData,
      activeIndex: activeIndex >= 0 ? activeIndex : 0
    };
    store2.set(TABS_STORAGE_KEY, state);
    util_default.log("info", `[WindowManager].saveTabs: Saved ${tabsData.length} tabs, active index: ${state.activeIndex}`);
  }
  /**
   * Loads saved tabs state from storage
   * @returns {Object|null} The saved tabs state or null if not found
   */
  loadTabs() {
    const store2 = getSafeStorage();
    const state = store2.get(TABS_STORAGE_KEY);
    if (state && state.tabs && state.tabs.length > 0) {
      util_default.log("info", `[WindowManager].loadTabs: Found ${state.tabs.length} saved tabs`);
      return state;
    }
    ;
    return null;
  }
  /**
   * Clears saved tabs from storage
   */
  clearSavedTabs() {
    const store2 = getSafeStorage();
    store2.delete(TABS_STORAGE_KEY);
    util_default.log("info", "[WindowManager].clearSavedTabs: Cleared saved tabs");
  }
};
var window_default = new WindowManager();

// electron/ts/menu.ts
var Separator = { type: "separator" };
var DEFAULT_SHORTCUTS = {
  createObject: ["CmdOrCtrl", "N"],
  undo: ["CmdOrCtrl", "Z"],
  redo: ["CmdOrCtrl", "Shift", "Z"],
  selectAll: ["CmdOrCtrl", "A"],
  searchText: ["CmdOrCtrl", "F"],
  print: ["CmdOrCtrl", "P"],
  newWindow: ["CmdOrCtrl", "Shift", "N"],
  zoomIn: ["CmdOrCtrl", "="],
  zoomOut: ["CmdOrCtrl", "-"],
  zoomReset: ["CmdOrCtrl", "0"],
  toggleFullScreen: ["CmdOrCtrl", "Shift", "F"],
  shortcut: ["Ctrl", "Space"],
  close: ["CmdOrCtrl", "Q"],
  createSpace: [],
  newTab: ["CmdOrCtrl", "T"],
  closeTab: ["CmdOrCtrl", "W"],
  nextTab: ["CmdOrCtrl", "Alt", "Right"],
  prevTab: ["CmdOrCtrl", "Alt", "Left"]
};
var MenuManager = class {
  win = null;
  menu = null;
  tray = null;
  shortcuts = {};
  setWindow(win) {
    this.win = win;
  }
  initShortcuts() {
    this.shortcuts = getSafeStorage().get("shortcuts") || {};
  }
  getAccelerator(id) {
    let keys = this.shortcuts[id];
    if (void 0 === keys) {
      return (DEFAULT_SHORTCUTS[id] || []).join("+");
    }
    ;
    keys = keys || [];
    const arrowKeys = { arrowup: "Up", arrowdown: "Down", arrowleft: "Left", arrowright: "Right", up: "Up", down: "Down", left: "Left", right: "Right" };
    const ret = [];
    for (const key of keys) {
      const keyLower = key.toLowerCase();
      if (keyLower == "ctrl" || keyLower == "cmd") {
        ret.push("CmdOrCtrl");
      } else if (keyLower == "shift") {
        ret.push("Shift");
      } else if (keyLower == "alt") {
        ret.push("Alt");
      } else if (key == "+") {
        ret.push("Plus");
      } else if (arrowKeys[keyLower]) {
        ret.push(arrowKeys[keyLower]);
      } else {
        ret.push(key.toUpperCase());
      }
      ;
    }
    ;
    return ret.join("+");
  }
  getView() {
    return util_default.getActiveView(this.win);
  }
  initMenu() {
    this.initShortcuts();
    const { config } = config_default;
    const isAllowedUpdate = update_default.isAllowed();
    config.debug = config.debug || {};
    config.flagsMw = config.flagsMw || {};
    const menuParam = [
      {
        label: "Anytype",
        submenu: [
          { label: util_default.translate("electronMenuAbout"), click: () => util_default.send(this.win, "popup", "about", {}, true) },
          Separator,
          { role: "hide", label: util_default.translate("electronMenuHide") },
          { role: "hideOthers", label: util_default.translate("electronMenuHideOthers") },
          { role: "unhide", label: util_default.translate("electronMenuUnhide") },
          { type: "separator", visible: isAllowedUpdate },
          { label: util_default.translate("electronMenuCheckUpdates"), click: () => api_default.updateCheck(this.win), visible: isAllowedUpdate },
          Separator,
          { label: util_default.translate("commonSettings"), submenu: this.menuSettings() },
          Separator,
          { label: util_default.translate("electronMenuQuit"), accelerator: this.getAccelerator("close"), click: () => api_default.exit(this.win, "", false, false) }
        ]
      },
      {
        role: "fileMenu",
        label: util_default.translate("electronMenuFile"),
        submenu: [
          { label: util_default.translate("commonNewObject"), accelerator: this.getAccelerator("createObject"), click: () => util_default.send(this.win, "commandGlobal", "createObject") },
          { label: util_default.translate("commonNewSpace"), accelerator: this.getAccelerator("createSpace"), click: () => util_default.send(this.win, "commandGlobal", "createSpace") },
          Separator,
          { label: util_default.translate("electronMenuImport"), click: () => this.openSettings("importIndex") },
          { label: util_default.translate("electronMenuExport"), click: () => this.openSettings("exportIndex") },
          { label: util_default.translate("electronMenuSaveAs"), click: () => util_default.send(this.win, "commandGlobal", "save") },
          Separator,
          {
            label: util_default.translate("electronMenuOpen"),
            submenu: [
              { label: util_default.translate("electronMenuWorkDirectory"), click: () => import_electron7.shell.openPath(util_default.userPath()) },
              { label: util_default.translate("electronMenuDataDirectory"), click: () => import_electron7.shell.openPath(util_default.dataPath()) },
              { label: util_default.translate("electronMenuConfigDirectory"), click: () => import_electron7.shell.openPath(util_default.defaultUserDataPath()) },
              { label: util_default.translate("electronMenuLogsDirectory"), click: () => import_electron7.shell.openPath(util_default.logPath()) },
              {
                label: util_default.translate("electronMenuCustomCss"),
                click: () => {
                  const fp = import_path5.default.join(util_default.userPath(), "custom.css");
                  if (!import_fs4.default.existsSync(fp)) {
                    import_fs4.default.writeFileSync(fp, "");
                  }
                  ;
                  import_electron7.shell.openPath(fp);
                }
              }
            ]
          },
          Separator,
          {
            label: util_default.translate("electronMenuApplyCustomCss"),
            type: "checkbox",
            checked: !config.disableCss,
            click: () => {
              config.disableCss = !config.disableCss;
              api_default.setConfig(this.win, { disableCss: config.disableCss }, () => {
                window_default.reloadAll();
              });
            }
          },
          Separator,
          {
            label: util_default.translate("electronMenuCloseTab"),
            accelerator: this.getAccelerator("closeTab"),
            click: () => {
              window_default.closeActiveTab(this.win);
            }
          },
          {
            label: util_default.translate("electronMenuClose"),
            click: () => {
              api_default.close(this.win);
            }
          }
        ]
      },
      {
        label: util_default.translate("electronMenuEdit"),
        submenu: [
          {
            label: util_default.translate("electronMenuUndo"),
            accelerator: this.getAccelerator("undo"),
            click: () => {
              if (this.win) {
                this.getView().webContents.undo();
                util_default.send(this.win, "commandGlobal", "undo");
              }
              ;
            }
          },
          {
            label: util_default.translate("electronMenuRedo"),
            accelerator: this.getAccelerator("redo"),
            click: () => {
              if (this.win) {
                this.getView().webContents.redo();
                util_default.send(this.win, "commandGlobal", "redo");
              }
              ;
            }
          },
          Separator,
          { label: util_default.translate("electronMenuCopy"), role: "copy" },
          { label: util_default.translate("electronMenuCut"), role: "cut" },
          { label: util_default.translate("electronMenuPaste"), role: "paste" },
          {
            label: util_default.translate("electronMenuPastePlain"),
            accelerator: "CmdOrCtrl+Shift+V",
            click: () => {
              if (import_electron_util5.is.macos) {
                util_default.send(this.win, "commandEditor", "pastePlain");
              }
              ;
            }
          },
          Separator,
          {
            label: util_default.translate("electronMenuSelectAll"),
            accelerator: this.getAccelerator("selectAll"),
            click: () => {
              if (this.win) {
                this.getView().webContents.selectAll();
                util_default.send(this.win, "commandEditor", "selectAll");
              }
              ;
            }
          },
          { label: util_default.translate("electronMenuSearch"), accelerator: this.getAccelerator("searchText"), click: () => util_default.send(this.win, "commandGlobal", "search") },
          Separator,
          { label: util_default.translate("electronMenuPrint"), accelerator: this.getAccelerator("print"), click: () => util_default.send(this.win, "commandGlobal", "print") }
        ]
      },
      {
        role: "windowMenu",
        label: util_default.translate("electronMenuWindow"),
        submenu: [
          { label: util_default.translate("electronMenuNewWindow"), accelerator: this.getAccelerator("newWindow"), click: () => window_default.createMain({ isChild: true }) },
          {
            label: util_default.translate("electronMenuNewTab"),
            accelerator: this.getAccelerator("newTab"),
            click: () => {
              const activeView = util_default.getActiveView(this.win);
              const { isPinned, ...data } = activeView?.data || {};
              data.route = "/main/void/dashboard";
              api_default.openTab(this.win, data, { fireAnalytics: true });
            }
          },
          { label: util_default.translate("electronMenuPrevTab"), accelerator: this.getAccelerator("prevTab"), click: () => window_default.prevTab(this.win) },
          { label: util_default.translate("electronMenuNextTab"), accelerator: this.getAccelerator("nextTab"), click: () => window_default.nextTab(this.win) },
          Separator,
          { role: "minimize", label: util_default.translate("electronMenuMinimise") },
          { label: util_default.translate("electronMenuZoomIn"), accelerator: this.getAccelerator("zoomIn"), click: () => api_default.setZoom(this.win, this.getView().webContents.getZoomLevel() + 1) },
          { label: util_default.translate("electronMenuZoomOut"), accelerator: this.getAccelerator("zoomOut"), click: () => api_default.setZoom(this.win, this.getView().webContents.getZoomLevel() - 1) },
          { label: util_default.translate("electronMenuZoomDefault"), accelerator: this.getAccelerator("zoomReset"), click: () => api_default.setZoom(this.win, 0) },
          {
            label: util_default.translate("electronMenuFullScreen"),
            accelerator: this.getAccelerator("toggleFullScreen"),
            type: "checkbox",
            checked: this.win.isFullScreen(),
            click: () => api_default.toggleFullScreen(this.win)
          },
          {
            label: util_default.translate("electronMenuReload"),
            accelerator: "CmdOrCtrl+R",
            click: () => {
              this.win.reload();
              this.getView().webContents.reload();
            }
          }
        ]
      },
      {
        label: util_default.translate("electronMenuHelp"),
        submenu: [
          {
            label: `${util_default.translate("electronMenuReleaseNotes")} (${import_electron7.app.getVersion()})`,
            click: () => util_default.send(this.win, "popup", "help", { data: { document: "whatsNew" } })
          },
          {
            label: util_default.translate("electronMenuShortcuts"),
            accelerator: this.getAccelerator("shortcut"),
            click: () => util_default.send(this.win, "commandGlobal", "shortcut")
          },
          Separator,
          { label: util_default.translate("electronMenuGallery"), click: () => util_default.send(this.win, "commandGlobal", "gallery") },
          { label: util_default.translate("electronMenuCommunity"), click: () => util_default.send(this.win, "commandGlobal", "community") },
          { label: util_default.translate("electronMenuTutorial"), click: () => util_default.send(this.win, "commandGlobal", "tutorial") },
          { label: util_default.translate("electronMenuContact"), click: () => util_default.send(this.win, "commandGlobal", "contact") },
          { label: util_default.translate("electronMenuTech"), click: () => util_default.send(this.win, "commandGlobal", "tech") },
          Separator,
          { label: util_default.translate("electronMenuTerms"), click: () => util_default.send(this.win, "commandGlobal", "terms") },
          { label: util_default.translate("electronMenuPrivacy"), click: () => util_default.send(this.win, "commandGlobal", "privacy") }
        ]
      }
    ];
    const flags = {
      ui: util_default.translate("electronMenuFlagInterface"),
      hiddenObject: util_default.translate("electronMenuFlagHidden"),
      analytics: util_default.translate("electronMenuFlagAnalytics")
    };
    const flagsMw = {
      request: util_default.translate("electronMenuFlagMwRequest"),
      subscribe: util_default.translate("electronMenuFlagMwSubscribe"),
      event: util_default.translate("electronMenuFlagMwEvent"),
      sync: util_default.translate("electronMenuFlagMwSync"),
      file: util_default.translate("electronMenuFlagMwFile"),
      time: util_default.translate("electronMenuFlagMwTime"),
      json: util_default.translate("electronMenuFlagMwJson")
    };
    const flagMenu = [];
    const flagMwMenu = [];
    for (const i in flags) {
      flagMenu.push({
        label: flags[i],
        type: "checkbox",
        checked: config.debug[i],
        click: () => {
          config.debug[i] = !config.debug[i];
          api_default.setConfig(this.win, { debug: config.debug });
          if (["hiddenObject"].includes(i)) {
            this.win.reload();
            this.getView().webContents.reload();
          }
          ;
        }
      });
    }
    ;
    for (const i in flagsMw) {
      flagMwMenu.push({
        label: flagsMw[i],
        type: "checkbox",
        checked: config.flagsMw[i],
        click: () => {
          config.flagsMw[i] = !config.flagsMw[i];
          api_default.setConfig(this.win, config);
        }
      });
    }
    ;
    flagMenu.push(Separator);
    flagMenu.push({
      label: util_default.translate("electronMenuFlagMw"),
      submenu: flagMwMenu
    });
    menuParam.push({
      label: util_default.translate("electronMenuDebug"),
      submenu: [
        { label: util_default.translate("electronMenuFlags"), submenu: flagMenu },
        Separator,
        { label: util_default.translate("electronMenuDebugSpace"), click: () => util_default.send(this.win, "commandGlobal", "debugSpace") },
        { label: util_default.translate("electronMenuDebugObject"), click: (item, window, event) => {
          const unanonymized = event && event.altKey;
          if (unanonymized) {
            const { dialog: dialog5 } = require("electron");
            const result = dialog5.showMessageBoxSync(this.win, {
              type: "warning",
              buttons: ["Cancel", "OK"],
              defaultId: 0,
              title: "Debug without anonymization",
              message: "You are exporting this object and all its history of changes without anonymization.",
              detail: "This file will contain sensitive data. Only proceed if you understand the privacy implications."
            });
            if (!result) {
              return;
            }
            ;
          }
          ;
          util_default.send(this.win, "commandGlobal", "debugTree", { unanonymized });
        } },
        { label: util_default.translate("electronMenuDebugProcess"), click: () => util_default.send(this.win, "commandGlobal", "debugProcess") },
        { label: util_default.translate("electronMenuDebugStat"), click: () => util_default.send(this.win, "commandGlobal", "debugStat") },
        { label: util_default.translate("electronMenuDebugReconcile"), click: () => util_default.send(this.win, "commandGlobal", "debugReconcile") },
        { label: util_default.translate("electronMenuDebugNet"), click: () => util_default.send(this.win, "commandGlobal", "debugNet") },
        { label: util_default.translate("electronMenuDebugLog"), click: () => util_default.send(this.win, "commandGlobal", "debugLog") },
        { label: util_default.translate("electronMenuDebugProfiler"), click: () => util_default.send(this.win, "commandGlobal", "debugProfiler") },
        Separator,
        { label: util_default.translate("electronMenuDevTools"), accelerator: "Alt+CmdOrCtrl+I", click: () => this.getView()?.webContents.toggleDevTools() }
      ]
    });
    const channels = config_default.getChannels().map((it) => ({
      ...it,
      click: () => {
        if (!update_default.isUpdating) {
          util_default.send(this.win, "commandGlobal", "releaseChannel", it.id);
        }
        ;
      }
    }));
    if (channels.length > 1) {
      menuParam.push({ label: util_default.translate("electronMenuVersion"), submenu: channels });
    }
    ;
    const menuSudo = {
      label: "Sudo",
      submenu: [
        Separator,
        {
          label: "Experimental features",
          type: "checkbox",
          checked: config.experimental,
          click: () => {
            api_default.setConfig(this.win, { experimental: !config.experimental });
            this.win.reload();
            this.getView().webContents.reload();
          }
        },
        Separator,
        { label: "Export templates", click: () => util_default.send(this.win, "commandGlobal", "exportTemplates") },
        { label: "Export objects", click: () => util_default.send(this.win, "commandGlobal", "exportObjects") },
        { label: "Export localstore", click: () => util_default.send(this.win, "commandGlobal", "exportLocalstore") },
        Separator,
        { label: "Reset onboarding", click: () => util_default.send(this.win, "commandGlobal", "resetOnboarding") },
        { label: "Read all messages", click: () => util_default.send(this.win, "commandGlobal", "readAllMessages") },
        Separator,
        { label: "Relaunch", click: () => api_default.exit(this.win, "", true) }
      ]
    };
    if (config.sudo) {
      menuParam.push(menuSudo);
    }
    ;
    this.menu = import_electron7.Menu.buildFromTemplate(menuParam);
    import_electron7.Menu.setApplicationMenu(this.menu);
  }
  initDock() {
    if (!import_electron_util5.is.macos) {
      return;
    }
    ;
    import_electron7.app.dock.setMenu(import_electron7.Menu.buildFromTemplate([
      { label: util_default.translate("electronMenuNewWindow"), click: () => window_default.createMain({ isChild: true }) }
    ]));
  }
  initTray() {
    const { config } = config_default;
    const isAllowedUpdate = update_default.isAllowed();
    this.destroy();
    if (config.hideTray) {
      return;
    }
    ;
    const icon = this.getTrayIcon();
    this.tray = new import_electron7.Tray(icon);
    this.tray.setToolTip("Anytype");
    this.tray.setContextMenu(import_electron7.Menu.buildFromTemplate([
      { label: util_default.translate("electronMenuOpenApp"), click: () => this.winShow() },
      Separator,
      { label: util_default.translate("electronMenuNewWindow"), accelerator: this.getAccelerator("newWindow"), click: () => window_default.createMain({ isChild: true }) },
      Separator,
      { label: util_default.translate("electronMenuCheckUpdates"), click: () => {
        this.winShow();
        api_default.updateCheck(this.win);
      }, visible: isAllowedUpdate },
      { label: util_default.translate("commonSettings"), submenu: this.menuSettings() },
      Separator,
      { label: util_default.translate("electronMenuQuit"), click: () => {
        this.winHide();
        api_default.exit(this.win, "", false, false);
      } }
    ]));
    this.tray.on("double-click", () => {
      if (this.win && !this.win.isDestroyed()) {
        this.win.setAlwaysOnTop(true);
        this.winShow();
        this.win.setAlwaysOnTop(false);
      }
      ;
    });
  }
  winShow() {
    if (this.win && !this.win.isDestroyed()) {
      this.win.show();
    }
    ;
  }
  winHide() {
    if (this.win && !this.win.isDestroyed()) {
      this.win.hide();
    }
    ;
  }
  menuSettings() {
    const { config } = config_default;
    const Locale = JSON.parse(import_fs4.default.readFileSync(import_path5.default.join(__dirname, "dist", "lib", "json", "locale.json"), "utf8"));
    const lang = util_default.getLang();
    const langMenu = [];
    for (const key of util_default.enabledLangs()) {
      langMenu.push({
        label: Locale[key],
        type: "checkbox",
        checked: key == lang,
        click: () => util_default.send(this.win, "commandGlobal", "interfaceLang", key)
      });
    }
    ;
    return [
      {
        label: util_default.translate("electronMenuAccountSettings"),
        click: () => {
          this.winShow();
          this.openSettings("account");
        }
      },
      {
        label: util_default.translate("electronMenuSpaceSettings"),
        click: () => {
          this.winShow();
          this.openSettings("spaceIndex");
        }
      },
      Separator,
      {
        label: util_default.translate("electronMenuImport"),
        click: () => {
          this.winShow();
          this.openSettings("importIndex");
        }
      },
      {
        label: util_default.translate("electronMenuExport"),
        click: () => {
          this.winShow();
          this.openSettings("exportIndex");
        }
      },
      { label: util_default.translate("electronMenuLanguage"), submenu: langMenu },
      Separator,
      {
        label: util_default.translate("electronMenuShowTray"),
        type: "checkbox",
        checked: !config.hideTray,
        click: () => {
          api_default.setConfig(this.win, { hideTray: !config.hideTray });
          this.initTray();
        }
      },
      import_electron_util5.is.windows || import_electron_util5.is.linux ? {
        label: util_default.translate("electronMenuShowMenu"),
        type: "checkbox",
        checked: config.showMenuBar,
        click: () => {
          const { config: config2 } = config_default;
          api_default.setMenuBarVisibility(this.win, !config2.showMenuBar);
          this.initTray();
        }
      } : null,
      Separator,
      {
        label: util_default.translate("commonNewObject"),
        accelerator: this.getAccelerator("createObject"),
        click: () => {
          this.winShow();
          util_default.send(this.win, "commandGlobal", "createObject");
        }
      }
    ].filter((it) => it);
  }
  openSettings(page) {
    if (!api_default.hasPinSet || api_default.isPinChecked) {
      util_default.send(this.win, "route", `/main/settings/${page}`);
    }
    ;
  }
  updateTrayIcon() {
    if (this.tray && this.tray.setImage) {
      const icon = this.getTrayIcon();
      if (icon) {
        this.tray.setImage(icon);
      }
      ;
    }
    ;
  }
  getTrayIcon() {
    let icon = "";
    if (import_electron_util5.is.windows) {
      icon = import_path5.default.join("icons", "256x256.ico");
    } else if (import_electron_util5.is.linux) {
      const env = process.env.ORIGINAL_XDG_CURRENT_DESKTOP || "";
      const panelAlwaysDark = env.includes("GNOME") || env == "Unity";
      if (panelAlwaysDark) {
        icon = "iconTrayWhite.png";
      } else if (util_default.getTheme() == "dark") {
        icon = "iconTrayWhite.png";
      } else {
        icon = "iconTrayBlack.png";
      }
      ;
    } else if (import_electron_util5.is.macos) {
      icon = `iconTrayTemplate.png`;
    }
    ;
    return icon ? (0, import_electron_util5.fixPathForAsarUnpack)(import_path5.default.join(util_default.imagePath(), icon)) : "";
  }
  destroy() {
    if (this.tray && !this.tray.isDestroyed()) {
      this.tray.destroy();
      this.tray = null;
    }
    ;
  }
};
var menu_default = new MenuManager();

// electron/ts/server.ts
var import_path6 = __toESM(require("path"));
var import_child_process = __toESM(require("child_process"));
var import_fs5 = __toESM(require("fs"));
var import_electron8 = require("electron");
var stdoutWebProxyPrefix = "gRPC Web proxy started at: ";
var winShutdownStdinMessage = "shutdown\n";
var maxStdErrChunksBuffer = 10;
var Server = class {
  cp = null;
  address = "";
  isRunning = false;
  stopTriggered = false;
  lastErrors = [];
  start(binPath2, workingDir) {
    console.log("[Server]: start", binPath2, workingDir);
    const logPath = util_default.logPath();
    const env = process.env;
    return new Promise((resolve, reject) => {
      this.stop().then(() => {
        this.isRunning = false;
        try {
          if (!process.stdout.isTTY) {
            env["GOLOG_FILE"] = import_path6.default.join(logPath, `anytype_${util_default.dateForFile()}.log`);
          }
          ;
          this.cp = import_child_process.default.spawn(binPath2, ["127.0.0.1:0", "127.0.0.1:0"], { windowsHide: false, env });
        } catch (err) {
          console.error("[Server] Process start error: ", err.toString());
          reject(err);
        }
        ;
        this.cp.on("error", (err) => {
          this.isRunning = false;
          console.error("[Server] Failed to start server: ", err.toString());
          reject(err);
        });
        this.cp.stdout.on("data", (data) => {
          const str = data.toString();
          if (!this.isRunning && str && str.indexOf(stdoutWebProxyPrefix) >= 0) {
            const regex = new RegExp(stdoutWebProxyPrefix + "([^\n^s]+)");
            this.address = "http://" + regex.exec(str)[1];
            this.isRunning = true;
            resolve(true);
          }
          ;
          console.log(str);
        });
        this.cp.stderr.on("data", (data) => {
          const chunk = data.toString();
          if (chunk.length > 8e3) {
            maxStdErrChunksBuffer = 2048;
          }
          ;
          if (!this.lastErrors) {
            this.lastErrors = [];
          } else if (this.lastErrors.length >= maxStdErrChunksBuffer) {
            this.lastErrors.shift();
          }
          ;
          this.lastErrors.push(chunk);
          console.log(chunk);
        });
        this.cp.on("exit", () => {
          if (this.stopTriggered) {
            return;
          }
          ;
          this.isRunning = false;
          const log = import_path6.default.join(logPath, `crash_${util_default.dateForFile()}.log`);
          try {
            import_fs5.default.writeFileSync(log, this.lastErrors.join("\n"), "utf-8");
          } catch (e) {
            console.log("[Server]: Failed to save log file", log);
          }
          ;
          import_electron8.dialog.showErrorBox("Anytype helper crashed", "You will be redirected to the crash log file. You can send it to Anytype developers by creating issue at https://community.anytype.io");
          import_electron8.shell.showItemInFolder(log);
          import_electron8.app.exit(0);
        });
      });
    });
  }
  stop(signal) {
    signal = String(signal || "SIGTERM");
    return new Promise((resolve, reject) => {
      if (this.cp && this.isRunning) {
        this.cp.on("exit", () => {
          resolve(true);
          this.isRunning = false;
          this.cp = null;
        });
        this.stopTriggered = true;
        if (process.platform === "win32") {
          this.cp.stdin.write(winShutdownStdinMessage);
        } else {
          this.cp.kill(signal);
        }
        ;
      } else {
        resolve(true);
      }
      ;
    });
  }
  getAddress() {
    return this.address;
  }
  setAddress(address) {
    this.address = address;
  }
};
var server_default = new Server();

// electron/ts/api.ts
var KEYTAR_SERVICE = "Anytype";
var Api = class {
  isPinChecked = false;
  hasPinSet = false;
  lastActivityTime = Date.now();
  notificationCallbacks = /* @__PURE__ */ new Map();
  shownNotificationIds = /* @__PURE__ */ new Set();
  pinTimer = null;
  pinTimeValue = 0;
  // Commands that should only be processed from the active tab.
  // Each tab has its own gRPC session/stream, so events like PayloadBroadcast
  // and notifications arrive in every tab independently. Without this guard,
  // the active tab would receive duplicate IPC messages (once per tab).
  activeTabOnly = /* @__PURE__ */ new Set(["payloadBroadcast", "notification"]);
  getInitData(win, tabId) {
    let route = win.route || "";
    win.route = "";
    if (!route && tabId && win.views && win.views.length > 0) {
      const tab2 = win.views.find((it) => it.id == tabId);
      route = tab2?.data?.route || "";
    }
    ;
    const tab = tabId ? (win.views || []).find((it) => it.id == tabId) : null;
    return {
      id: win.id,
      dataPath: util_default.dataPath(),
      config: config_default.config,
      isDark: util_default.isDarkTheme(),
      isChild: win.isChild,
      route,
      spaceId: tab?.data?.spaceId || "",
      isPinChecked: this.isPinChecked,
      isPinned: tab?.data?.isPinned || false,
      languages: win.webContents.session.availableSpellCheckerLanguages,
      css: util_default.getCss(),
      activeTabId: win.activeTabId,
      isSingleTab: win.views && win.views.length == 1 && !win.views.some((it) => it.data && it.data.isPinned)
    };
  }
  logout(win) {
    window_default.sendToAllTabs("logout");
  }
  pinCheck(win) {
    window_default.sendToAllTabs("pin-check");
    window_default.list.forEach((w) => window_default.updateTabBarVisibility(w));
  }
  pinSet(win) {
    window_default.sendToAllTabs("pin-set");
  }
  pinRemove(win) {
    window_default.sendToAllTabs("pin-remove");
  }
  paste(win) {
    if (!win || win.isDestroyed()) {
      return;
    }
    ;
    const view = util_default.getActiveView(win);
    if (view && view.webContents && !view.webContents.isDestroyed()) {
      view.webContents.paste();
    }
    ;
  }
  setConfig(win, config, callBack) {
    config_default.set(config, () => {
      util_default.send(win, "config", config_default.config);
      if ("alwaysShowTabs" in config) {
        window_default.updateTabBarVisibility(win);
      }
      ;
      callBack?.();
    });
  }
  setPinChecked(win, isPinChecked, pinTimeout, hasPinSet) {
    this.isPinChecked = isPinChecked;
    if (hasPinSet !== void 0) {
      this.hasPinSet = hasPinSet;
    }
    ;
    if (isPinChecked) {
      this.lastActivityTime = Date.now();
      if (pinTimeout) {
        this.startPinTimer(win, pinTimeout);
      }
      ;
      window_default.sendToAllTabs("pin-unlocked");
    } else {
      this.stopPinTimer();
    }
    ;
    window_default.list.forEach((w) => window_default.updateTabBarVisibility(w));
  }
  setHasPinSet(win, hasPinSet) {
    this.hasPinSet = hasPinSet;
    window_default.list.forEach((w) => window_default.updateTabBarVisibility(w));
  }
  checkPinTimeout(win, pinTimeout) {
    if (!this.isPinChecked || !pinTimeout) {
      return;
    }
    ;
    const elapsed = Date.now() - this.lastActivityTime;
    if (elapsed >= pinTimeout) {
      this.isPinChecked = false;
      this.pinCheck(win);
    }
    ;
  }
  /**
   * Starts or restarts the centralized pin timeout timer.
   * Called when pin is enabled or user activity is detected.
   * @param {BrowserWindow} win - The window (not used, for API consistency)
   * @param {number} pinTimeout - Timeout in milliseconds
   */
  startPinTimer(win, pinTimeout) {
    if (!pinTimeout || !this.isPinChecked) {
      return;
    }
    ;
    this.pinTimeValue = pinTimeout;
    this.lastActivityTime = Date.now();
    this.stopPinTimer();
    this.pinTimer = setTimeout(() => {
      if (!this.isPinChecked) {
        return;
      }
      ;
      this.isPinChecked = false;
      this.pinCheck();
    }, pinTimeout);
  }
  /**
   * Resets the pin timer due to user activity.
   * Called from any renderer when user activity is detected.
   */
  resetPinTimer(win) {
    if (!this.isPinChecked || !this.pinTimeValue) {
      return;
    }
    ;
    this.lastActivityTime = Date.now();
    this.stopPinTimer();
    this.pinTimer = setTimeout(() => {
      if (!this.isPinChecked) {
        return;
      }
      ;
      this.isPinChecked = false;
      this.pinCheck();
    }, this.pinTimeValue);
  }
  /**
   * Stops the pin timer.
   * Called when pin is disabled or user logs out.
   */
  stopPinTimer(win) {
    if (this.pinTimer) {
      clearTimeout(this.pinTimer);
      this.pinTimer = null;
    }
    ;
  }
  setTheme(win, theme) {
    this.setConfig(win, { theme });
    util_default.setNativeThemeSource();
    const resolvedTheme = util_default.getTheme();
    this.setBackground(win, resolvedTheme);
    window_default.sendToAll("set-theme", theme);
    window_default.sendToAllTabs("set-theme", theme);
  }
  setBackground(win, theme) {
    const useTransparent = util_default.isWayland() && !util_default.isKDE();
    const bgColor = useTransparent ? "#00000000" : util_default.getBgColor(theme);
    import_electron9.BrowserWindow.getAllWindows().forEach((win2) => win2 && !win2.isDestroyed() && win2.setBackgroundColor(bgColor));
  }
  setZoom(win, zoom) {
    zoom = Number(zoom) || 0;
    zoom = Math.max(-5, Math.min(5, zoom));
    const view = util_default.getActiveView(win);
    if (view && view.webContents) {
      view.webContents.setZoomLevel(zoom);
      util_default.sendToActiveTab(win, "zoom");
    }
    ;
    this.setConfig(win, { zoom });
  }
  setHideTray(win, show) {
    config_default.set({ hideTray: !show }, () => {
      util_default.send(win, "config", config_default.config);
      this.initMenu(win);
    });
  }
  setMenuBarVisibility(win, show) {
    config_default.set({ showMenuBar: show }, () => {
      util_default.send(win, "config", config_default.config);
      util_default.send(win, "set-menu-bar-visibility", show);
      delete win.tempMenuBarVisible;
      window_default.updateTabBarVisibility(win);
      win.setMenuBarVisibility(show);
      win.setAutoHideMenuBar(!show);
    });
  }
  // Temporary menu bar visibility for Alt key toggle (doesn't persist to config)
  setMenuBarTemporaryVisibility(win, show) {
    const { config } = config_default;
    if (config.showMenuBar) {
      return;
    }
    ;
    if (show) {
      win.tempMenuBarVisible = true;
    } else {
      delete win.tempMenuBarVisible;
    }
    ;
    window_default.updateTabBarVisibility(win);
  }
  setHideSidebar(win, v) {
    window_default.sendToAllTabs("set-hide-sidebar", v);
  }
  setAlwaysShowTabs(win, show) {
    this.setConfig(win, { alwaysShowTabs: show }, () => {
      window_default.updateTabBarVisibility(win);
    });
  }
  setHardwareAcceleration(win, enabled) {
    const store2 = getSafeStorage();
    store2.set("hardwareAcceleration", enabled);
    this.setConfig(win, { hardwareAcceleration: enabled }, () => this.exit(win, "", true, false));
  }
  spellcheckAdd(win, s) {
    win.webContents.session.addWordToSpellCheckerDictionary(s);
  }
  keytarSet(win, key, value) {
    if (key && value) {
      import_keytar.default.setPassword(KEYTAR_SERVICE, key, value);
    }
    ;
  }
  async keytarGet(win, key) {
    const maxRetries = import_electron_util6.is.windows ? 3 : 1;
    const retryDelay = 500;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let value = null;
      let shouldRetry = false;
      try {
        value = await import_keytar.default.getPassword(KEYTAR_SERVICE, key);
        shouldRetry = value === null;
      } catch (err) {
        shouldRetry = true;
      }
      ;
      if (!shouldRetry || attempt >= maxRetries) {
        return value;
      }
      ;
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
    ;
    return null;
  }
  keytarDelete(win, key) {
    import_keytar.default.deletePassword(KEYTAR_SERVICE, key);
  }
  updateCheck(win) {
    if (this.isPinChecked || !this.account) {
      update_default.checkUpdate(false);
    }
    ;
  }
  updateDownload(win) {
    update_default.download();
  }
  updateConfirm(win) {
    this.exit(win, "", true, true);
  }
  updateCancel(win) {
    update_default.cancel();
  }
  async download(win, url, options) {
    await (0, import_electron_dl.download)(win, url, options);
  }
  winCommand(win, cmd, param) {
    window_default.command(win, cmd, param);
  }
  openWindow(win, route, token) {
    window_default.createMain({ route, token, isChild: true });
  }
  openWindows(win, routes, token) {
    if (!routes || !routes.length) {
      return;
    }
    ;
    for (const route of routes) {
      window_default.createMain({ route, token, isChild: true });
    }
    ;
  }
  openTab(win, data, options) {
    if (this.hasPinSet && !this.isPinChecked) {
      return false;
    }
    ;
    const { isPinned, ...rest } = data || {};
    const route = rest.route || "";
    if (route) {
      const existing = window_default.findTabByRoute(win, route);
      if (existing && existing.data && existing.data.isPinned) {
        window_default.setActiveTab(win, existing.id);
        return true;
      }
      ;
    }
    ;
    if (options?.fireAnalytics) {
      util_default.sendToActiveTab(win, "analyticsEvent", "AddTab", { route: "Navigation" });
    }
    ;
    window_default.createTab(win, rest, options);
    return false;
  }
  switchToTabByRoute(win, route) {
    const existing = window_default.findTabByRoute(win, route);
    if (existing && existing.data && existing.data.isPinned) {
      window_default.setActiveTab(win, existing.id);
      return true;
    }
    ;
    return false;
  }
  openTabs(win, tabs) {
    if (!tabs || !tabs.length) {
      return;
    }
    ;
    for (const tab of tabs) {
      const route = tab.data?.route || "";
      if (route && window_default.findTabByRoute(win, route)) {
        continue;
      }
      ;
      window_default.createTab(win, tab.data, { setActive: false });
    }
    ;
  }
  openUrl(win, url) {
    import_electron9.shell.openExternal(url);
  }
  openPath(win, fp) {
    if (!fp || !import_fs6.default.existsSync(fp)) {
      util_default.log("error", "[Api].openPath: Invalid path:", fp);
      return;
    }
    ;
    fp = import_path7.default.normalize(fp);
    if (import_electron_util6.is.macos) {
      (0, import_child_process2.execFile)("open", [fp], (err) => {
        if (err) {
          util_default.log("error", "[Api].openPath error:", err);
        }
        ;
      });
    } else if (import_electron_util6.is.windows) {
      (0, import_child_process2.exec)(`start "" "${fp}"`, { shell: "cmd.exe" }, (err) => {
        if (err) {
          util_default.log("error", "[Api].openPath error:", err);
        }
        ;
      });
    } else if (import_electron_util6.is.linux) {
      (0, import_child_process2.execFile)("xdg-open", [fp], (err) => {
        if (err) {
          util_default.log("error", "[Api].openPath error:", err);
        }
        ;
      });
    }
    ;
  }
  shutdown(win, relaunch, isUpdate) {
    util_default.log("info", "[Api].shutdown, relaunch: " + relaunch + ", isUpdate: " + isUpdate);
    try {
      import_electron9.session.defaultSession.flushStorageData();
    } catch (e) {
      console.error("[Api].shutdown: Failed to flush storage data:", e.message);
    }
    ;
    if (relaunch) {
      if (isUpdate) {
        update_default.relaunch();
      } else {
        import_electron9.app.relaunch();
        import_electron9.app.exit(0);
      }
      ;
    } else {
      import_electron9.app.exit(0);
    }
    ;
  }
  exit(win, signal, relaunch, isUpdate) {
    if (import_electron9.app.isQuiting) {
      return;
    }
    ;
    import_electron9.app.isQuiting = true;
    window_default.saveTabs(win);
    if (win && !win.isDestroyed()) {
      win.hide();
    }
    ;
    util_default.log("info", "[Api].exit, relaunch: " + relaunch + ", isUpdate: " + isUpdate);
    this.closeAllTabSessions(win).then(() => {
      util_default.send(win, "shutdownStart");
      server_default.stop(signal).then(() => this.shutdown(win, relaunch, isUpdate));
    });
  }
  /**
   * Closes sessions for all tabs in the window
   * @param {BrowserWindow} win - The window
   * @returns {Promise} Resolves when all sessions are closed
   */
  closeAllTabSessions(win) {
    if (!win || win.isDestroyed() || !win.views || win.views.length === 0) {
      return Promise.resolve([]);
    }
    ;
    const timeout = 5e3;
    const promises = win.views.map((view) => {
      return new Promise((resolve) => {
        if (!view.webContents || view.webContents.isDestroyed()) {
          resolve();
          return;
        }
        ;
        let handler = null;
        const cleanup = () => {
          if (handler) {
            import_electron9.ipcMain.removeListener("tab-session-closed", handler);
          }
          ;
          resolve();
        };
        const timeoutId = setTimeout(() => {
          util_default.log("warn", `[Api].closeAllTabSessions: Timeout waiting for tab ${view.id} to close session`);
          cleanup();
        }, timeout);
        handler = (event, readyTabId) => {
          if (readyTabId === view.id) {
            clearTimeout(timeoutId);
            cleanup();
          }
          ;
        };
        import_electron9.ipcMain.on("tab-session-closed", handler);
        util_default.sendToTab(win, view.id, "close-session");
      });
    });
    return Promise.all(promises);
  }
  setChannel(win, id) {
    update_default.setChannel(id);
    this.setConfig(win, { channel: id }, () => {
      this.initMenu(win);
    });
  }
  setInterfaceLang(win, lang) {
    config_default.set({ interfaceLang: lang }, () => {
      window_default.reloadAll();
      this.initMenu(win);
    });
  }
  initMenu(win) {
    menu_default.initMenu();
    menu_default.initTray();
  }
  setSpellingLang(win, languages) {
    languages = languages || [];
    win.webContents.session.setSpellCheckerLanguages(languages);
    win.webContents.session.setSpellCheckerEnabled(languages.length ? true : false);
    this.setConfig(win, { languages });
  }
  setBadge(win, t) {
    if (import_electron_util6.is.macos) {
      import_electron9.app.dock.setBadge(t);
    }
    ;
  }
  setUserDataPath(win, p) {
    this.setConfig(win, { userDataPath: p });
    import_electron9.app.setPath("userData", p);
    window_default.sendToAllTabs("data-path", util_default.dataPath());
  }
  showChallenge(win, param) {
    window_default.createChallenge(param);
  }
  hideChallenge(win, param) {
    window_default.closeChallenge(param);
  }
  reload(win, route) {
    const view = util_default.getActiveView(win);
    if (view && view.webContents && !view.webContents.isDestroyed()) {
      if (route) {
        view.data = { ...view.data, route };
      }
      ;
      view.webContents.reload();
    }
    ;
  }
  moveNetworkConfig(win, src) {
    if (!import_path7.default.extname(src).match(/yml|yaml/i)) {
      return { error: `Invalid file extension: ${import_path7.default.extname(src)}. Required YAML` };
    }
    ;
    const dst = import_path7.default.join(util_default.userPath(), "config.yaml");
    try {
      import_fs6.default.copyFileSync(src, dst);
      return { path: dst };
    } catch (e) {
      return { error: e.message };
    }
    ;
  }
  shortcutExport(win, dst, data) {
    try {
      import_fs6.default.writeFileSync(import_path7.default.join(dst, "shortcut.json"), JSON.stringify(data, null, "	"), "utf8");
    } catch (err) {
    }
    ;
  }
  shortcutImport(win, src) {
    let data = {};
    if (import_fs6.default.existsSync(src)) {
      try {
        data = JSON.parse(import_fs6.default.readFileSync(src, "utf8"));
      } catch (err) {
      }
      ;
    }
    ;
    return data;
  }
  focusWindow(win) {
    if (!win || win.isDestroyed()) {
      return;
    }
    ;
    win.show();
    win.focus();
    win.setAlwaysOnTop(true);
    win.setAlwaysOnTop(false);
  }
  async checkDiskSpace(win) {
    return await (0, import_check_disk_space.default)(import_electron9.app.getPath("userData"));
  }
  async linuxDistro(win) {
    const load = require("linux-distro");
    return await load().catch((err) => {
      util_default.log("error", `[Api].linuxDistro: ${err.message}`);
      return { name: "Unknown", version: "Unknown" };
    });
  }
  menu(win) {
    menu_default.menu.popup({ x: 12, y: 44 });
  }
  minimize(win) {
    win.minimize();
  }
  maximize(win) {
    win.isMaximized() ? win.unmaximize() : win.maximize();
  }
  close(win) {
    win.close();
  }
  toggleFullScreen(win) {
    win.setFullScreen(!win.isFullScreen());
  }
  getTabs(win) {
    const alwaysShow = config_default.config.alwaysShowTabs;
    const hasMultipleTabs = win.views && win.views.length > 1;
    return {
      tabs: (win.views || []).map((it) => ({ id: it.id, data: it.data })),
      id: win.activeTabId || win.views?.[0]?.id,
      isVisible: alwaysShow || hasMultipleTabs
    };
  }
  setActiveTab(win, id) {
    window_default.setActiveTab(win, id);
  }
  getTab(win, id) {
    const view = (win.views || []).find((it) => it.id == id);
    return view ? { id: view.id, data: view.data } : null;
  }
  updateTab(win, id, data) {
    window_default.updateTab(win, id, data);
  }
  removeTab(win, id, updateActive) {
    window_default.removeTab(win, id, updateActive);
  }
  closeOtherWindows(win) {
    window_default.closeOtherWindows(win);
  }
  closeOtherTabs(win, id, forced) {
    window_default.closeOtherTabs(win, id, forced);
  }
  openRouteInTab(win, route, data) {
    window_default.openRouteInTab(win, route, data);
  }
  openSpaceInTab(win, spaceId, spaceType) {
    window_default.openSpaceInTab(win, spaceId, spaceType);
  }
  pinTab(win, id) {
    window_default.pinTab(win, id);
  }
  unpinTab(win, id) {
    window_default.unpinTab(win, id);
  }
  showTabContextMenu(win, param) {
    const { tabId, isPinned } = param || {};
    if (!tabId) {
      return;
    }
    ;
    const items = [];
    if (isPinned) {
      items.push({
        label: util_default.translate("electronMenuTabUnpin"),
        click: () => {
          window_default.unpinTab(win, tabId);
          util_default.sendToActiveTab(win, "analytics", "UnpinTab");
        }
      });
    } else {
      items.push({
        label: util_default.translate("electronMenuTabPin"),
        click: () => {
          window_default.pinTab(win, tabId);
          util_default.sendToActiveTab(win, "analytics", "PinTab");
        }
      });
    }
    ;
    const isLastPinned = isPinned && win.views.length <= 1;
    if (!isLastPinned) {
      items.push({ type: "separator" });
      items.push({
        label: util_default.translate("electronMenuTabClose"),
        click: () => window_default.removeTab(win, tabId, true)
      });
      items.push({
        label: util_default.translate("electronMenuTabCloseOtherTabs"),
        click: () => window_default.closeOtherTabs(win, tabId)
      });
    }
    ;
    const menu = import_electron9.Menu.buildFromTemplate(items);
    menu.popup({
      window: win,
      callback: () => {
        util_default.send(win, "tab-context-menu-closed");
      }
    });
  }
  reorderTabs(win, tabIds) {
    window_default.reorderTabs(win, tabIds);
  }
  tabShowTooltip(win, data) {
    util_default.sendToActiveTab(win, "tab-show-tooltip", data);
  }
  tabHideTooltip(win) {
    util_default.sendToActiveTab(win, "tab-hide-tooltip");
  }
  setTabsDimmer(win, show) {
    util_default.send(win, "set-tabs-dimmer", show);
  }
  getWindowBounds(win) {
    return window_default.getBounds(win);
  }
  getCursorScreenPoint(win) {
    const { screen } = require("electron");
    return screen.getCursorScreenPoint();
  }
  /**
   * Detaches a tab from its window, either creating a new window or moving to an existing one
   * @param {BrowserWindow} win - Source window
   * @param {Object} param - Parameters { tabId, mouseX, mouseY }
   */
  detachTab(win, param) {
    const { tabId, mouseX, mouseY } = param || {};
    if (!tabId || !win || !win.views) {
      return;
    }
    ;
    if (win.views.length <= 1) {
      return;
    }
    ;
    const tab = win.views.find((it) => it.id == tabId);
    if (!tab) {
      return;
    }
    ;
    const tabData = { ...tab.data };
    const targetWin = this.getWindowAtPoint(mouseX, mouseY, win);
    if (targetWin) {
      this.transferTabToWindow(win, targetWin, tabId, tabData);
    } else {
      this.createWindowFromTab(win, tabId, tabData, mouseX, mouseY);
    }
    ;
  }
  /**
   * Finds a window at the given screen coordinates, excluding a specific window
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @param {BrowserWindow} excludeWin - Window to exclude from search
   * @returns {BrowserWindow|null}
   */
  getWindowAtPoint(x, y, excludeWin) {
    for (const win of window_default.list) {
      if (win === excludeWin || win.isDestroyed() || win.isChallenge) {
        continue;
      }
      ;
      const bounds = window_default.getBounds(win);
      if (!bounds) {
        continue;
      }
      ;
      if (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
        return win;
      }
      ;
    }
    ;
    return null;
  }
  /**
   * Transfers a tab from source window to target window
   * @param {BrowserWindow} sourceWin - Source window
   * @param {BrowserWindow} targetWin - Target window
   * @param {string} tabId - Tab ID to transfer
   * @param {Object} tabData - Tab data
   */
  transferTabToWindow(sourceWin, targetWin, tabId, tabData) {
    window_default.createTab(targetWin, tabData, { setActive: true });
    setTimeout(() => {
      window_default.removeTab(sourceWin, tabId, true);
      if (targetWin && !targetWin.isDestroyed()) {
        targetWin.focus();
      }
      ;
    }, 100);
  }
  /**
   * Creates a new window from a detached tab
   * @param {BrowserWindow} sourceWin - Source window
   * @param {string} tabId - Tab ID to detach
   * @param {Object} tabData - Tab data
   * @param {number} mouseX - Mouse X screen coordinate
   * @param {number} mouseY - Mouse Y screen coordinate
   */
  createWindowFromTab(sourceWin, tabId, tabData, mouseX, mouseY) {
    const sourceBounds = window_default.getBounds(sourceWin);
    const width = sourceBounds?.width;
    const height = sourceBounds?.height;
    const newWin = window_default.createMain({
      isChild: true,
      initialBounds: { x: mouseX - 50, y: mouseY - 20, width, height },
      initialTabData: tabData
    });
    setTimeout(() => {
      window_default.removeTab(sourceWin, tabId, true);
      if (newWin && !newWin.isDestroyed()) {
        newWin.focus();
      }
      ;
    }, 100);
  }
  notification(win, param) {
    const { id, title, text, cmd, payload, silent = true } = param || {};
    if (!text) {
      return;
    }
    ;
    if (id && this.shownNotificationIds.has(id)) {
      return;
    }
    ;
    if (id) {
      this.shownNotificationIds.add(id);
      setTimeout(() => this.shownNotificationIds.delete(id), 3e4);
    }
    ;
    const notification = new import_electron9.Notification({
      title: String(title || ""),
      body: String(text || ""),
      silent
    });
    notification.on("click", () => {
      this.focusWindow(win);
      if (cmd) {
        util_default.sendToActiveTab(win, "notification-callback", cmd, payload);
      }
      ;
    });
    notification.show();
  }
  notificationSound(_win) {
    import_electron9.shell.beep();
  }
  payloadBroadcast(win, payload) {
    if (payload.type == "openObject") {
      this.focusWindow(win);
    }
    ;
    util_default.sendToActiveTab(win, "payload-broadcast", payload);
  }
};
var api_default = new Api();

// electron/json/cors.json
var cors_default = {
  "default-src": [
    "'self'",
    "'unsafe-eval'",
    "blob:",
    "http://localhost:*"
  ],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "file://*",
    "http://127.0.0.1:*",
    "https://127.0.0.1:*",
    "http://localhost:*",
    "https://localhost:*",
    "https://*.sndcdn.com",
    "https://scontent.cdninstagram.com",
    "https://*.any.coop",
    "https://*.ytimg.com",
    "https://anytype-static.fra1.cdn.digitaloceanspaces.com",
    "https://*.bcbits.com",
    "https://*.unsplash.com",
    "https://*.apple.com",
    "https://*.mzstatic.com",
    "https://*.spotifycdn.com",
    "https://*.ggpht.com",
    "https://*.openstreetmap.org",
    "https://*.openstreetmap.fr",
    "https://*.jawg.io",
    "https://*.cdninstagram.com",
    "https://*.duckduckgo.com",
    "https://*.wikimedia.org",
    "https://*.redditstatic.com",
    "https://*.redd.it",
    "https://*.redditmedia.com",
    "https://*.gstatic.com",
    "https://*.twimg.com",
    "https://*.twitter.com",
    "https://*.fbcdn.net",
    "https://*.googleapis.com"
  ],
  "media-src": [
    "'self'",
    "data:",
    "blob:",
    "file://*",
    "http://127.0.0.1:*",
    "https://127.0.0.1:*",
    "http://localhost:*",
    "https://localhost:*",
    "http://localhost:*",
    "https://*.googlevideo.com",
    "https://scontent.cdninstagram.com",
    "https://media.sketchfab.com",
    "https://*.spotify.com",
    "https://*.spotifycdn.com",
    "https://*.apple.com",
    "https://*.mzstatic.com",
    "https://*.any.coop",
    "https://anytype-static.fra1.cdn.digitaloceanspaces.com",
    "https://bandcamp.com",
    "https://*.bcbits.com",
    "https://*.unsplash.com",
    "https://*.spotifycdn.com",
    "https://*.openstreetmap.org",
    "https://*.cdninstagram.com",
    "https://*.duckduckgo.com",
    "https://*.wikimedia.org",
    "https://*.scdn.co",
    "https://*.redditstatic.com",
    "https://*.redd.it",
    "https://*.redditmedia.com",
    "https://*.gstatic.com",
    "https://*.googleapis.com"
  ],
  "style-src": [
    "'unsafe-inline'",
    "http://localhost:*",
    "data:",
    "file://*",
    "https://*.youtube.com",
    "https://*.youtube-nocookie.com",
    "https://*.spotify.com",
    "https://*.spotifycdn.com",
    "https://*.apple.com",
    "https://*.vimeocdn.com",
    "https://*.gstatic.com",
    "https://*.googleapis.com",
    "https://mirostatic.com",
    "https://miro.com",
    "https://*.google.com",
    "https://*.figma.com/",
    "https://*.openstreetmap.org",
    "https://www.redditstatic.com",
    "https://*.fbcdn.net",
    "https://static.cdninstagram.com",
    "https://telegram.org",
    "https://github.githubassets.com",
    "https://cpwebassets.codepen.io",
    "https://cdnjs.cloudflare.com",
    "https://*.bilibili.com",
    "https://s1.hdslb.com",
    "https://static.sketchfab.com",
    "https://*.diagrams.net",
    "https://*.bstarstatic.com",
    "https://bandcamp.com",
    "https://*.bcbits.com",
    "http://*.openstreetmap.fr/",
    "chrome-extension://fohdnlaeecihjiendkfhifhlgldpeopm/"
  ],
  "font-src": [
    "data:",
    "file://*",
    "http://localhost:*",
    "https://*.youtube.com",
    "https://*.youtube-nocookie.com",
    "https://*.spotify.com",
    "https://*.spotifycdn.com",
    "https://*.apple.com",
    "https://encore.scdn.co/",
    "https://*.vimeocdn.com",
    "https://*.gstatic.com",
    "https://mirostatic.com",
    "https://miro.com",
    "https://*.figma.com",
    "https://*.twimg.com",
    "https://*.fbcdn.net",
    "https://static.cdninstagram.com",
    "https://telegram.org",
    "https://static.sketchfab.com",
    "https://*.bstarstatic.com",
    "https://unpkg.com/@excalidraw/",
    "https://*.openstreetmap.fr"
  ],
  "connect-src": [
    "file://*",
    "data:",
    "http://localhost:*",
    "http://127.0.0.1:*",
    "ws://localhost:*",
    "https://*.anytype.io",
    "wss://*.anytype.io",
    "wss://stage1-anytype-spark.anytype.io",
    "https://api.amplitude.com",
    "devtools://devtools",
    "https://*.youtube.com",
    "https://*.youtube-nocookie.com",
    "https://*.spotify.com",
    "https://*.spotifycdn.com",
    "https://*.vimeocdn.com",
    "https://*.vimeo.com",
    "https://*.apple.com",
    "https://*.googlevideo.com",
    "https://*.akamaized.net",
    "https://*.soundcloud.com",
    "https://*.sndcdn.com",
    "https://*.google.com",
    "https://*.googleapis.com",
    "https://*.doubleclick.net",
    "https://miro.com",
    "https://*.miro.com",
    "https://*.cookielaw.org",
    "https://*.sentry.io",
    "https://*.split.io",
    "https://*.onetrust.com",
    "https://mirostatic.com",
    "wss://miro.com",
    "https://*.figma.com",
    "wss://*.figma.com",
    "https://*.twitter.com",
    "https://*.twimg.com",
    "https://*.reddit.com",
    "https://www.instagram.com",
    "https://t.me",
    "https://gist.github.com",
    "https://codepen.io",
    "https://www.facebook.com",
    "https://*.fbcdn.net",
    "https://*.bilibili.com",
    "https://*.bilibili.tv",
    "https://*.bilivideo.cn:*",
    "https://*.bilivideo.com",
    "https://*.hdslb.com",
    "wss://*.bilibili.com:*",
    "wss://*.biliapi.net",
    "https://sketchfab.com",
    "https://media.sketchfab.com",
    "https://*.diagrams.net",
    "https://sentry.io",
    "https://*.any.coop",
    "https://*.amplitude.com",
    "https://kroki.io",
    "https://*.vimeo.com",
    "https://*.statsigapi.net",
    "https://*.bstarstatic.com",
    "https://bandcamp.com",
    "https://*.bcbits.com",
    "https://*.google-analytics.com",
    "http://*.openstreetmap.fr",
    "https://*.gstatic.com",
    "https://*.jsdelivr.net",
    "https://*.withgoogle.com"
  ],
  "script-src-elem": [
    "file://*",
    "'unsafe-inline'",
    "http://localhost:*",
    "https://sentry.io",
    "devtools://devtools",
    "https://*.youtube.com",
    "https://*.youtube-nocookie.com",
    "https://*.spotify.com",
    "https://*.spotifycdn.com",
    "https://*.apple.com",
    "https://*.vimeocdn.com",
    "https://*.gstatic.com",
    "https://*.sndcdn.com",
    "https://*.google.com",
    "https://*.googleapis.com",
    "https://*.doubleclick.net",
    "https://*.cookielaw.org",
    "https://mirostatic.com",
    "https://*.figma.com/",
    "https://cdn.jsdelivr.net",
    "https://platform.twitter.com",
    "https://*.openstreetmap.org",
    "https://embed.reddit.com",
    "https://www.redditstatic.com",
    "https://*.fbcdn.net",
    "https://www.instagram.com",
    "https://static.cdninstagram.com",
    "https://telegram.org",
    "https://oauth.tg.dev",
    "https://gist.github.com",
    "https://cpwebassets.codepen.io",
    "https://codepen.io",
    "https://cdnjs.cloudflare.com",
    "https://*.hdslb.com",
    "https://static.sketchfab.com",
    "https://*.codepenassets.com",
    "https://*.bstarstatic.com",
    "https://*.googletagmanager.com",
    "https://*.facebook.net",
    "https://*.diagrams.net",
    "chrome-extension://fohdnlaeecihjiendkfhifhlgldpeopm/",
    "https://unpkg.com/@excalidraw/",
    "https://bandcamp.com",
    "https://*.bcbits.com",
    "http://*.openstreetmap.fr/",
    "https://*.sentry-cdn.com/"
  ],
  "frame-src": [
    "chrome-extension://react-developer-tools",
    "file://*",
    "http://localhost:*/embed/iframe.html",
    "https://*.youtube.com",
    "https://*.youtube-nocookie.com",
    "https://*.spotify.com",
    "https://*.spotifycdn.com",
    "https://*.apple.com",
    "https://*.vimeo.com",
    "https://w.soundcloud.com",
    "https://*.google.com",
    "https://miro.com",
    "https://*.miro.com",
    "https://*.figma.com",
    "https://*.github.com",
    "https://*.bilibili.com",
    "https://*.bilibili.tv",
    "https://platform.twitter.com",
    "https://*.openstreetmap.org",
    "https://embed.reddit.com",
    "https://www.facebook.com",
    "https://www.instagram.com",
    "https://t.me",
    "https://codepen.io",
    "https://cdpn.io",
    "https://kroki.io",
    "https://sketchfab.com",
    "https://*.diagrams.net",
    "https://bandcamp.com",
    "https://*.bcbits.com",
    "https://www.googletagmanager.com/",
    "http://*.openstreetmap.fr/",
    "chrome-extension://fohdnlaeecihjiendkfhifhlgldpeopm/"
  ],
  "worker-src": [
    "'self'",
    "'unsafe-eval'",
    "blob:",
    "http://localhost:*"
  ],
  "manifest-src": [
    "'self'",
    "http://localhost:*",
    "https://*.redditstatic.com"
  ]
};

// electron/ts/main.ts
process.stdout?.on?.("error", () => {
});
process.stderr?.on?.("error", () => {
});
var protocol2 = "anytype";
var binPath = (0, import_electron_util7.fixPathForAsarUnpack)(import_path8.default.join(__dirname, "dist", `anytypeHelper${import_electron_util7.is.windows ? ".exe" : ""}`));
var store = getSafeStorage();
var GRPC_DEVTOOLS_ID = "fohdnlaeecihjiendkfhifhlgldpeopm";
if (import_electron_util7.is.windows) {
  import_electron10.app.setAppUserModelId(import_electron10.app.name);
}
import_electron_json_storage2.default.setDataPath(import_electron10.app.getPath("userData"));
var csp = [];
var deeplinkingUrl = "";
var waitLibraryPromise = null;
var mainWindow = null;
var lastPowerEvent = "suspend";
var isReady = false;
for (const i in cors_default) {
  csp.push([i].concat(cors_default[i]).join(" "));
}
import_electron10.app.commandLine.appendSwitch("ignore-connections-limit", "localhost, 127.0.0.1");
import_electron10.app.commandLine.appendSwitch("gtk-version", "3");
import_electron10.app.commandLine.appendSwitch("js-flags", "--max-old-space-size=4096");
var disableGpu = process.argv.includes("--disable-gpu") || store.get("hardwareAcceleration") === false;
if (disableGpu) {
  import_electron10.app.disableHardwareAcceleration();
  import_electron10.app.commandLine.appendSwitch("disable-gpu");
  import_electron10.app.commandLine.appendSwitch("disable-gpu-compositing");
  console.log("[GPU] Hardware acceleration disabled");
}
if (!import_electron_util7.is.linux) {
  import_electron10.app.removeAsDefaultProtocolClient(protocol2);
  if (!process.defaultApp) {
    import_electron10.app.setAsDefaultProtocolClient(protocol2);
  }
  ;
}
if (!import_electron_util7.is.macos && process.argv.length >= 2) {
  if (process.defaultApp && !import_electron_util7.is.linux) {
    import_electron10.app.setAsDefaultProtocolClient(protocol2, process.execPath, [import_path8.default.resolve(process.argv[1])]);
  }
  ;
  deeplinkingUrl = process.argv.find((arg) => arg.startsWith(`${protocol2}://`));
}
import_electron10.powerMonitor.on("suspend", () => {
  if (lastPowerEvent == "suspend") {
    return;
  }
  ;
  const firstWindow = window_default.getFirstWindow();
  if (firstWindow) {
    util_default.send(firstWindow, "power-event", "suspend");
    lastPowerEvent = "suspend";
  }
  ;
});
import_electron10.powerMonitor.on("resume", () => {
  if (lastPowerEvent == "resume") {
    return;
  }
  ;
  lastPowerEvent = "resume";
  util_default.log("info", "[PowerMonitor] resume");
  const firstWindow = window_default.getFirstWindow();
  if (firstWindow) {
    util_default.send(firstWindow, "power-event", "resume");
  }
  ;
  setTimeout(() => {
    for (const win of window_default.list) {
      if (!win || win.isDestroyed() || !win.views) {
        continue;
      }
      ;
      for (const view of win.views) {
        if (view && view.webContents && !view.webContents.isDestroyed()) {
          view.webContents.reload();
        }
        ;
      }
      ;
    }
    ;
  }, 1500);
});
import_electron10.ipcMain.on("storeGet", (e, key) => {
  e.returnValue = store.get(key);
});
import_electron10.ipcMain.on("storeSet", (e, key, value) => {
  e.returnValue = store.set(key, value);
});
import_electron10.ipcMain.on("storeDelete", (e, key) => {
  e.returnValue = store.delete(key);
});
import_electron10.ipcMain.on("getTheme", (e) => {
  e.returnValue = util_default.getTheme();
});
import_electron10.ipcMain.on("getBgColor", (e) => {
  e.returnValue = util_default.getBgColor(util_default.getTheme());
});
import_electron10.ipcMain.on("getConfig", (e) => {
  e.returnValue = config_default.config || {};
});
if (!import_electron_util7.is.development && !import_electron10.app.requestSingleInstanceLock()) {
  api_default.exit(mainWindow, "", false, false);
  process.exit(0);
}
remote2.initialize();
util_default.setAppPath(import_path8.default.join(__dirname));
function waitForLibraryAndCreateWindows() {
  const { userDataPath } = config_default.config;
  util_default.setNativeThemeSource();
  let currentPath = import_electron10.app.getPath("userData");
  if (userDataPath && userDataPath != currentPath) {
    currentPath = userDataPath;
    import_electron10.app.setPath("userData", userDataPath);
  }
  ;
  if (process.env.ANYTYPE_USE_SIDE_SERVER) {
    server_default.setAddress(process.env.ANYTYPE_USE_SIDE_SERVER);
    waitLibraryPromise = Promise.resolve();
  } else {
    waitLibraryPromise = server_default.start(binPath, currentPath);
  }
  ;
  util_default.mkDir(util_default.logPath());
  waitLibraryPromise.then(() => {
    global.serverAddress = server_default.getAddress();
    createWindow();
    isReady = true;
  }, (err) => {
    import_electron10.dialog.showErrorBox("Error: failed to run server", err.toString());
  });
}
import_electron10.nativeTheme.on("updated", () => {
  const isDark = util_default.isDarkTheme();
  menu_default.updateTrayIcon();
  api_default.setBackground(null, util_default.getTheme());
  window_default.sendToAll("native-theme", isDark);
  window_default.sendToAllTabs("native-theme", isDark);
});
function createWindow() {
  mainWindow = window_default.createMain({ route: util_default.getRouteFromUrl(deeplinkingUrl), isChild: false });
  mainWindow.on("close", (e) => {
    util_default.log("info", "closeMain: " + import_electron10.app.isQuiting);
    if (import_electron10.app.isQuiting) {
      return;
    }
    ;
    e.preventDefault();
    const onClose = () => {
      const { config } = config_default;
      if (config.hideTray && window_default.list.size <= 1) {
        api_default.exit(mainWindow, "", false, false);
      } else {
        mainWindow.hide();
      }
      ;
    };
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
      mainWindow.once("leave-full-screen", () => onClose());
    } else {
      onClose();
    }
    ;
    return false;
  });
  update_default.setWindow(mainWindow);
  update_default.init();
  menu_default.setWindow(mainWindow);
  menu_default.initMenu();
  menu_default.initTray();
  menu_default.initDock();
  installNativeMessagingHost();
  util_default.registerLinuxProtocolHandler();
  import_electron10.ipcMain.handle("Api", (e, id, cmd, args) => {
    const win = import_electron10.BrowserWindow.fromId(id);
    if (!win) {
      console.error("[Api] window is not defined", cmd, id);
      return;
    }
    ;
    if (api_default.activeTabOnly?.has(cmd)) {
      const activeView = util_default.getActiveView(win);
      if (!activeView || e.sender.id !== activeView.webContents.id) {
        return;
      }
      ;
    }
    ;
    if (api_default[cmd]) {
      return api_default[cmd].apply(api_default, [win].concat(args || []));
    } else {
      console.error("[Api] method not defined:", cmd);
      return null;
    }
    ;
  });
}
import_electron10.app.on("ready", async () => {
  import_electron10.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp.join("; ")]
      }
    });
  });
  import_electron10.session.defaultSession.webRequest.onBeforeSendHeaders({
    urls: [
      "*://www.youtube.com/*",
      "*://www.youtube-nocookie.com/*"
    ]
  }, (details, callBack) => {
    const headers = details.requestHeaders;
    const currentOrigin = headers["Origin"];
    const isFileOrigin = !currentOrigin || currentOrigin === "null" || currentOrigin.startsWith("file://");
    if (isFileOrigin) {
      details.requestHeaders["Referer"] = "https://localhost/";
      details.requestHeaders["Origin"] = "https://localhost";
    }
    ;
    callBack({ requestHeaders: details.requestHeaders });
  });
  if (import_electron_util7.is.development) {
    try {
      await (0, import_electron_devtools_installer.installExtension)(GRPC_DEVTOOLS_ID, {
        loadExtensionOptions: {
          allowFileAccess: true
        }
      });
      console.log(`gRPC DevTools extension installed`);
    } catch (e) {
      console.error("Failed to install gRPC DevTools extension:", e.message);
    }
    ;
  }
  ;
  config_default.init(waitForLibraryAndCreateWindows);
});
import_electron10.app.on("second-instance", (event, argv) => {
  util_default.log("info", "second-instance");
  if (!mainWindow) {
    return;
  }
  ;
  if (!import_electron_util7.is.macos) {
    deeplinkingUrl = argv.find((arg) => arg.startsWith(`${protocol2}://`));
  }
  ;
  if (deeplinkingUrl) {
    util_default.send(mainWindow, "route", util_default.getRouteFromUrl(deeplinkingUrl));
  }
  ;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  ;
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
  ;
  mainWindow.focus();
  if (import_electron_util7.is.macos) {
    import_electron10.app.focus({ steal: true });
  }
  ;
});
import_electron10.app.on("before-quit", (e) => {
  util_default.log("info", "before-quit, isRelaunching: " + update_default.isRelaunching);
  if (update_default.isRelaunching) {
    return;
  }
  ;
  if (import_electron10.app.isQuiting) {
    import_electron10.app.exit(0);
  } else {
    e.preventDefault();
    api_default.exit(mainWindow, "", false, false);
  }
  ;
});
var handleSignal = (signal) => {
  util_default.log("info", `Received ${signal}`);
  if (import_electron10.app.isQuiting) {
    import_electron10.app.exit(0);
  } else {
    api_default.exit(mainWindow, signal, false, false);
  }
  ;
};
process.on("SIGINT", () => handleSignal("SIGINT"));
process.on("SIGTERM", () => handleSignal("SIGTERM"));
import_electron10.app.on("activate", () => {
  if (window_default.list.size && mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    if (import_electron_util7.is.macos) {
      import_electron10.app.focus({ steal: true });
    }
    ;
  } else if (isReady) {
    createWindow();
  }
  ;
});
import_electron10.app.on("open-url", (e, url) => {
  e.preventDefault();
  deeplinkingUrl = url;
  if (!mainWindow) {
    return;
  }
  ;
  util_default.send(mainWindow, "route", util_default.getRouteFromUrl(url));
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  ;
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
  ;
  mainWindow.focus();
  if (import_electron_util7.is.macos) {
    import_electron10.app.focus({ steal: true });
  }
  ;
});
