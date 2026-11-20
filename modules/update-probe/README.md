# Update Probe

A developer-only local version/health module for testing package installation, updates, service lifecycle and private-data preservation. It has no Streamer.bot actions, OBS overlay, chat, playback or phone contribution. Normal setup does not require it.

## Use in a disposable profile

Enable **Developer tools** in Companion settings to see developer modules/help. Install Update Probe from Catalogue, expand its Installed row and start it explicitly if needed. Its normal loopback port is 3140; use an isolated port/profile for automated checks so a test cannot conflict with a running installation.

**Open controls** / **Settings** shows the installed version. The /health endpoint reports readiness and version. Check the module's own automatic-start preference separately; package installation does not require launching a stream application. Stopping its service closes the listener.

Before an upgrade test, create a synthetic marker inside the disposable profile's private module-data/update-probe directory. Install a uniquely versioned candidate, verify the reported version/service lifecycle and confirm the marker remains unchanged. Keep fixtures and teardown scoped to that disposable directory. Do not replace real streaming data with test snapshots.

Module data lives outside the package and is retained across updates. The guide remains excluded from normal Help even if the module is installed. No special user confirmation is needed for isolated tests; real app restart or ownership-sensitive changes follow their own module rules.

First-party code: Sethani, MIT.
