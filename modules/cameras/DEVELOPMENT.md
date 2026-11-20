# cameras developer notes

## Implementation and migration reference

Version 2.0.2 moves the established main/secondary camera controls and OBS inventory off the personal Node server. It controls existing OBS scenes through Streamer.bot's existing default OBS connection; no service, new port, OBS credential copy or browser overlay is required. The five installed action identities and `portable.cameras.state` are preserved. Source mappings are private settings; public defaults are empty and unconfigured.

Configure keeps its original mode/selection/changedSlot arguments. Configure Mappings takes JSON mappings (mainScene, secondaryScene, monitor, laptop, selfPng, guestPng, frame, background) without applying visibility. Refresh/Health only read OBS. Existing Assign Reactive accepts id and applies Camera 2. The optional requestId is echoed as lastRequestId after state persistence. Existing configuration fields are preserved; inventory and mapping fields are additive.

Before local cutover, back up both systems and disable the legacy Node camera owner's configured/mainConfigured/secondaryConfigured flags while keeping its other settings for rollback. Do not run two camera routers against the same scenes. Do not restore the stale Node roster over live Streamer.bot data. Keep private mappings, URLs and OBS state out of exports. First-party source: Sethani, MIT.

