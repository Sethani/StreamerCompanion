require('./test-help-browser').main('electron-integrations-smoke.js').catch(error => { console.error(error); process.exitCode = 1; });
