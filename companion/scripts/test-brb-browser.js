require('./test-help-browser').main('electron-brb-smoke.js').catch(error=>{console.error(error);process.exitCode=1});
