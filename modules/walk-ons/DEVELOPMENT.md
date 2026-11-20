# walk-ons developer notes

## Implementation and migration reference

Reimport the included Streamer.bot export even if Companion already shows Ready. Version 2.1.0 incorrectly expected a child action's changed argument to return to its caller: audio could play while the caller rejected it, leaving the person eligible for every later message. Version 2.1.1 uses a unique request acknowledged in persisted sound state and retains that acknowledgement through playback completion. Roster and playback state updates are serialized. Existing action IDs, roster, private audio, command permissions and startup/going-live/explicit reset behavior are retained. Test continues without consuming eligibility; rejected or busy playback remains eligible.


## Sound Player 3.0.0 handoff

Walk Ons retains the four legacy sound action IDs as forwarders. Its roster engine delegates audio to Sound Player - Play Assigned and checks the matching persisted request ID. Video assignments also check their exact videoRequestId against the Video 2.3.0 owner. No child argument dictionary is a return channel. Sound Player owns the library, one pool draw, master gain and request claims. The owner-side migration map points unchanged inline assignments at stable opaque pools without writing the roster/ledger. New saved pool assignments use poolId. Inline choices remain supported and can be edited. Do not import an old bundled audio engine alongside the new owner.
