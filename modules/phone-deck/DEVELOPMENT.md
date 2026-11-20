# phone-deck developer notes

## Implementation and migration reference

Version 2.0.4 uses the existing OBS WebSocket's state events instead of scanning every input after every event or two-second UI tick. Structural changes coalesce into affected-inventory reads. Lightweight status reconciliation runs about every six seconds, with a full inventory reconciliation about every thirty seconds to recover missed events. Explicit refresh and button actions retain fresh target checks and readback. Reconnects never replay actions or clear pairing/layout data. The initial-load, offline and stalled-socket recovery from 2.0.3 is retained.

Reviewed legacy mappings retain card identities/layout/targets. Guided launch stays guided; legacy countdown Start resumes paused timers and leaves running timers alone. Combined widgets show independent Video/Wheel status and available launch progress. Writing cards remain parked. There is no public legacy Import settings option.
