# Release catalogue v1

The live [`catalog/modules.json`](https://github.com/Sethani/StreamerCompanion-Modules/blob/main/catalog/modules.json) lives in the separate module distribution repository. This source folder documents the format; it does not maintain a competing live index. Each entry is generated from its source module manifest and includes identity, description, author/category, version, compatibility/dependencies, a versioned package URL and SHA-256.

The application reads that single Git file through the GitHub Contents API on explicit request. It does not enumerate releases or depend on which module was released most recently. The file is committed only after the selected module's release asset exists. One module publication updates one entry; every other package URL/hash is preserved. Packages use per-module tags such as `spotify-v2.0.1` in `Sethani/StreamerCompanion-Modules`. HTTPS redirects are limited to GitHub's release hosts; sizes and timeouts are enforced.

The last validated catalogue and check time are cached in private user data. A network or validation failure does not replace that cache or stop services. No check downloads a module automatically. Required dependencies are resolved in topological order; cycles, incompatible constraints, missing facilities, downgrade attempts and incompatible Companion versions are rejected before module changes.

Developer/test code can select another GitHub repository through the `CompanionHost` `catalogRepository` option and supply a test transport. The shipped entrypoint uses only `Sethani/StreamerCompanion-Modules`. Old combined-preview caches are ignored when the repository changes; installed code and private data remain untouched. Arbitrary catalogue URLs are not accepted from modules.
