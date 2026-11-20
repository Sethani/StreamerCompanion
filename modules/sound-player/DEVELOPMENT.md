# Sound Player engineering

See `docs/sound-player-extraction-contract.md` in the source repository for the ownership and adoption gates. This module is an unreleased source candidate. Do not import alongside the old Walk Ons playback engine.

Canonical native state is `portable.walkonSound.state`, feature `walkonSound`. The package has distinct reserved action UUIDs. The renderer claims a new request through the native owner before starting audio. Persisted initial state is a baseline, never a playback instruction. Request identities and renderer ownership protect completion; there is no timeout takeover.

Phone Deck contributions project IDs/labels and bounded request results, never source paths. A completed acknowledgement means the native command was saved, not that audio reached OBS.

Imports contain only a safe startup initialization trigger and no audience triggers. Initialize marks interrupted playback hidden while preserving configuration and acknowledgements. Walk Ons Initialize is never a migration helper because it resets eligibility.
