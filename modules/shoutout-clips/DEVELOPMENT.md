# shoutout-clips developer notes

## Implementation and migration reference

Target lookup, clip selection, chat routing, official shoutouts and session bookkeeping remain in the separate private orchestration adapter. Its optional warm-text service is still a legacy dependency until the Ollama migration. Missing AI must retain fallback chat and must not prevent clip playback.
