# Release catalogue v1

`modules.json` is generated from `modules/*/module.json`, not maintained as a second manual module registry. Each entry includes identity, one-sentence description, author/category, version, Companion range, Streamer.bot action requirements, required/optional module dependencies, required/optional capabilities, provided capabilities and a versioned package URL with SHA-256.

The application checks the repository's GitHub Releases API on explicit request, including prereleases in this experimental channel. It reads the newest published release with a `modules.json` asset. Package and catalogue URLs must be versioned release-download URLs in the configured repository. HTTPS redirects are limited to GitHub's release hosts; sizes and timeouts are enforced.

The last validated catalogue and check time are cached in private user data. A network or validation failure does not replace that cache or stop services. No check downloads a module automatically. Required dependencies are resolved in topological order; cycles, incompatible constraints, missing facilities, downgrade attempts and incompatible Companion versions are rejected before module changes.

Developer/test code can select another GitHub repository through the `CompanionHost` `catalogRepository` option and supply a test transport. The shipped entrypoint uses only `Sethani/StreamerCompanion`. Arbitrary catalogue URLs are not accepted from modules.
