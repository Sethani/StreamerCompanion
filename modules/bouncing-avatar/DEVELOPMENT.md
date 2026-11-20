# bouncing-avatar developer notes

## Implementation and migration reference

The original private renderer must be disabled during a backed-up cutover before enabling this one. Installing an unpublished local candidate is not production handoff or operator acceptance.

Version 1.0.1 lets local HTTP overlays and file-based OBS documents read the boolean-only health response. This supports the existing combined-overlay adapter. Settings, images, Phone Deck state and mutations retain exact same-origin checks; health access grants no configuration or installation permission.

