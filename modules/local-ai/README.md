# Local AI

Optionally add locally generated wording to raid and shoutout messages through Ollama. Existing deterministic fallback text remains available when AI is off or fails. This service never sends chat, performs an official shoutout or plays a clip; callers must explicitly use its result.

## Set up

1. Install and run Ollama separately and install the model you want there. This module never starts Ollama or downloads a model.
2. Install Local AI from **Catalogue**. Expand its **Installed** row, **Start** its service and open **Settings** or **Open controls**. It appears under System in [Universal Dock](../universal-dock/README.md).
3. Enter **Ollama address**, normally `http://127.0.0.1:11434`, and your **Installed model** name. Choose **Save**, then **Check connection** to read the saved address's model list. Select an installed model if needed and Save again.
4. Check **Enable AI flavour** and Save when ready. Fresh installs are disabled with no model. A missing saved model stays selected instead of being silently replaced.

Only loopback HTTP addresses are accepted, with no credentials, path, query or fragment. The local management service uses port **3145**. No overlay or Streamer.bot action import is required for Local AI itself.

## Check and try it

**Check connection** reads available models without generating text or loading/downloading a model. Save draft connection changes first: checks use the saved address.

Under **Try a sample**, **Preview shoutout** and **Preview raid** use synthetic facts and show a result locally. They may use your enabled AI backend, but never send Twitch chat or play a clip. Polling and reconnect checks do not generate text.

**Warm model** explicitly sends one empty non-streaming generation request to load the selected model. It requires enabled AI and a saved model. Under **Advanced**, **Warm model on service startup** is optional and defaults off; enabling it also allows warm-up when the module service restarts during an update.

## Advanced settings and fallback

**Generation timeout (seconds)** accepts 1–300 seconds. **Keep model loaded** accepts a duration such as 30m, 0 to unload after a request, or -1 to keep it loaded. Save applies these settings. Responses and inputs are bounded, requests time out, redirects are rejected and at most two inference operations run concurrently.

When disabled, busy, unavailable or given an invalid model/result, the caller gets deterministic fallback without an automatic generation retry. Disabling or changing settings cancels obsolete requests so old AI results cannot appear after a configuration change. A healthy module service and a working Ollama backend are separate status checks; optional AI failure does not make another module missing.

## Phone Deck, recovery and privacy

[Phone Deck](../phone-deck/README.md) optionally offers **Local AI status** under System. Add it in the deck editor; no cards appear automatically. It is read-only, with no phone generation or model-management control.

If Ollama is unavailable, check that its process is running at the saved address and the selected model is installed, then Check connection. If another editor saved first, your draft and previous saved configuration are retained; use **Discard and reload**, review the current values and reapply edits.

Back up private `module-data/local-ai` with your setup. Configuration/model names stay private. Prompts, generated messages, viewer identities and history are not saved or logged. Ollama software and model weights are not bundled or licensed by this package.
