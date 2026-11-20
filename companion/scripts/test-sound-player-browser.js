require('./test-help-browser').main('electron-sound-player-smoke.js').catch(error => { console.error(error); process.exitCode = 1; });
