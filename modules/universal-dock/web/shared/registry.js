(function (global) {
  "use strict";
  let pending;
  global.StreamingModuleRegistry = {
    async load() {
      if (!pending) pending = fetch("/api/public/modules", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("Companion module registry is unavailable.");
        return response.json();
      }).finally(() => { pending = null; });
      return pending;
    }
  };
})(window);
