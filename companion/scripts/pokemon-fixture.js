const fs = require("node:fs"), path = require("node:path");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6wAAAAABJRU5ErkJggg==", "base64");
async function fixture(directory, runtimePath) {
  const { createService } = require(runtimePath || "../../modules/pokemon-encounters/service/pokemon-runtime");
  const requests = [];
  const service = createService({ port: 0, dataDirectory: path.join(directory, "data"), fetch: async (address) => {
    requests.push(address);
    if (address === "https://synthetic.invalid/art.png") return new Response(png);
    if (!String(address).startsWith("https://pokeapi.co/api/v2/pokemon/")) throw new Error("Unexpected fixture network request");
    const slug = String(address).split("/").at(-1);
    return new Response(JSON.stringify({ id: 13, name: slug, sprites: { other: { "official-artwork": { front_default: "https://synthetic.invalid/art.png", front_shiny: "https://synthetic.invalid/art.png" } } }, types: [{ slot: 1, type: { name: "bug", url: "https://pokeapi.co/api/v2/type/7/" } }, { slot: 2, type: { name: "poison", url: "https://pokeapi.co/api/v2/type/4/" } }] }));
  } });
  const port = await service.start();
  return { service, requests, base: "http://127.0.0.1:" + port, async close() { await service.stop(); } };
}
module.exports = { fixture, png };
