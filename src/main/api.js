import {app, BrowserWindow} from 'electron';
import {getlocalDataFile, saveData, getData} from './common/utils';
import path from "path";

const puppeteer = require("puppeteer-core");
const pie = require("puppeteer-in-electron")

const appPath = path.join(getlocalDataFile());
const dbPath = path.join(appPath, './db.json');

let browser
pie.initialize(app).then(res => {
  pie.connect(app, puppeteer).then(b => {
    browser = b;
  })
})

export default {
  getPath(arg) {
    return app.getPath(arg.name);
  },
  hideMainWindow(arg, mainWindow) {
    mainWindow.hide();
  },
  showMainWindow(arg, mainWindow) {
    mainWindow.show();
  },
  onPluginEnter(arg) {
    return arg
  },
  setExpendHeight({height}, mainWindow) {
    mainWindow.setSize(788, height || 60);
  },
  db: {
    put({data}) {
      data._rev = '';
      let dbData = getData(dbPath) || [];
      let target = [];
      dbData.some((d, i) => {
        if (d._id === data._id) {
          target = [d, i]
          return true;
        }
        return false;
      });

      // 更新
      if (target[0]) {
        dbData[target[1]] = data;
      } else {
        dbData.push(data);
      }
      saveData(dbPath, dbData);
      return {
        id: data.id,
        ok: true,
        rev: '',
      }
    },
    get({key}) {
      const dbData = getData(dbPath) || [];

      return dbData.find(d => d._id === key) || {};
    },
    remove({key}) {
      key = typeof key === 'object' ? key.id : key;
      let dbData = getData(dbPath);
      let find = false;
      dbData.some((d, i) => {
        if (d._id === key) {
          dbData.splice(i, 1);
          find = true;
          return true;
        }
        return false;
      });
      if (find) {
        saveData(dbPath, dbData);
        return {
          id: key,
          ok: true,
          rev: '',
        }
      } else {
        return {
          id: key,
          ok: false,
          rev: '',
        }
      }
    },
    bulkDocs({docs}) {
      const dbData = getData(dbPath);
      dbData.forEach((d, i) => {
        const result = docs.find(data => data._id === d._id);
        if (result) {
          dbData[i] = result;
        }
      });
      saveData(dbPath, dbData);
      return docs.map(d => ({
        id: d.id,
        success: true,
        rev: '',
      }))
    },
    allDocs({key}) {
      const dbData = getData(dbPath);
      const result = dbData.filter(d => d._id === key);
      return result;
    }
  },

  ubrowser: {
    goto: async ({winId}) => {
      const win = BrowserWindow.fromId(winId);
      await win.loadURL(url);
    },
    async value({selector, value, winId}) {
      const win = BrowserWindow.fromId(winId);
      const page = await pie.getPage(browser, win);
      const nd = await page.$(selector);
      nd.type(value);
    },

    async click({selector, winId}) {
      const win = BrowserWindow.fromId(winId);
      const page = await pie.getPage(browser, win);
      const nd = await page.$(selector);
      nd.click();
    },

    async run(options) {
      const win = BrowserWindow.fromId(options.winId);
      win.setSize(options.width || 800, options.height || 600)
      win.once('ready-to-show', () => win.show());
    },
  }
}