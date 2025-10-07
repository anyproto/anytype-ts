const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('env', {
  SENTRY_DSN: process.env.SENTRY_DSN,
});
