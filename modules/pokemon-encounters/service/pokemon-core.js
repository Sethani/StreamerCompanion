const aliases = {
  "nidoran♀": "nidoran-f", "nidoran female": "nidoran-f", "nidoran f": "nidoran-f", "nidoran (f)": "nidoran-f",
  "nidoran♂": "nidoran-m", "nidoran male": "nidoran-m", "nidoran m": "nidoran-m", "nidoran (m)": "nidoran-m",
  "mr. mime": "mr-mime", "mime jr.": "mime-jr", "farfetch'd": "farfetchd", "sirfetch'd": "sirfetchd",
  "type: null": "type-null", "ho-oh": "ho-oh", "porygon-z": "porygon-z", "flabébé": "flabebe"
};

function cleanMessage(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
const ballAliases = {
  "": "poke-ball", "pokeball": "poke-ball", "poke ball": "poke-ball", "poke-ball": "poke-ball",
  "greatball": "great-ball", "great ball": "great-ball", "ultraball": "ultra-ball", "ultra ball": "ultra-ball",
  "masterball": "master-ball", "master ball": "master-ball", "premierball": "premier-ball", "premier ball": "premier-ball",
  "luxuryball": "luxury-ball", "luxury ball": "luxury-ball", "healball": "heal-ball", "heal ball": "heal-ball",
  "netball": "net-ball", "net ball": "net-ball", "nestball": "nest-ball", "nest ball": "nest-ball",
  "diveball": "dive-ball", "dive ball": "dive-ball", "duskball": "dusk-ball", "dusk ball": "dusk-ball",
  "quickball": "quick-ball", "quick ball": "quick-ball", "timerball": "timer-ball", "timer ball": "timer-ball",
  "repeatball": "repeat-ball", "repeat ball": "repeat-ball", "levelball": "level-ball", "level ball": "level-ball",
  "lureball": "lure-ball", "lure ball": "lure-ball", "moonball": "moon-ball", "moon ball": "moon-ball",
  "friendball": "friend-ball", "friend ball": "friend-ball", "loveball": "love-ball", "love ball": "love-ball",
  "heavyball": "heavy-ball", "heavy ball": "heavy-ball", "fastball": "fast-ball", "fast ball": "fast-ball",
  "sportball": "sport-ball", "sport ball": "sport-ball", "safariball": "safari-ball", "safari ball": "safari-ball",
  "beastball": "beast-ball", "beast ball": "beast-ball", "dreamball": "dream-ball", "dream ball": "dream-ball",
  "cherishball": "cherish-ball", "cherish ball": "cherish-ball", "parkball": "park-ball", "park ball": "park-ball"
};
function parseCatchCommand(value) {
  const match = cleanMessage(value).match(/^!pokecatch(?:\s+(.+?))?\s*$/i);
  if (!match) return null;
  const requested = cleanMessage(match[1] || "").toLowerCase().replace(/[_-]+/g, " ").replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
  const ball = ballAliases[requested];
  return ball ? { ball, requested: requested || "poke ball" } : { ball: "poke-ball", requested, fallback: true };
}
function parsePokemonLabel(value) {
  const original = cleanMessage(value);
  let name = original;
  const genderMatch = name.match(/\s*[([]\s*(female|male|f|m|♀|♂)\s*[)\]]\s*$/i);
  let gender = "";
  if (genderMatch) {
    gender = /^(female|f|♀)$/i.test(genderMatch[1]) ? "female" : "male";
    name = name.slice(0, genderMatch.index).trim();
    if (/^nidoran$/i.test(name)) name = gender === "female" ? "Nidoran (f)" : "Nidoran (m)";
  }
  const shiny = /(^|\s|[([])shiny([)\]]|\s|$)/i.test(name);
  name = name.replace(/^\s*shiny\s+/i, "").replace(/\s*[([]\s*shiny\s*[)\]]\s*$/i, "").trim();
  const regionMatch = name.match(/\s*[([]\s*(alolan|galarian|hisuian|paldean)\s*[)\]]\s*$/i);
  const regionNames = { alolan: "alola", galarian: "galar", hisuian: "hisui", paldean: "paldea" };
  let region = "";
  if (regionMatch) {
    region = regionNames[regionMatch[1].toLowerCase()];
    name = name.slice(0, regionMatch.index).trim();
  }
  const inherentNidoran = /^nidoran\s*(?:\(|\[)?\s*([fm♀♂])\s*(?:\)|\])?$/i.exec(name);
  if (inherentNidoran) {
    gender = /^(f|♀)$/i.test(inherentNidoran[1]) ? "female" : "male";
    name = gender === "female" ? "Nidoran (f)" : "Nidoran (m)";
  }
  return { original, name, lookupName: region ? `${name}-${region}` : name, gender, shiny, region };
}
function slugFor(name) {
  const clean = parsePokemonLabel(name).lookupName.toLowerCase();
  return aliases[clean] || clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.'’:]/g, "").replace(/♀/g, "-f").replace(/♂/g, "-m").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isMysteryPokemon(name) {
  return /^(?:unidentified|unknown|mystery)(?:\s+pokemon|\s+pok[eé]mon|\s+.+)?$/i.test(cleanMessage(name));
}

function parseCommunityMessage(sender, message, currentEncounter = null, nowMs = Date.now()) {
  if (String(sender || "").trim().toLowerCase().replace(/^@/, "") !== "pokemoncommunitygame") return { type: "ignored", reason: "sender" };
  const text = cleanMessage(message);
  const spawn = text.match(/\ba wild\s+(.+?)\s+appears\b/i);
  if (spawn && /!pokecatch\b/i.test(text)) {
    const seconds = Math.max(10, Math.min(600, Number(text.match(/winners? revealed in\s+(\d+)s/i)?.[1]) || 90));
    const name = cleanMessage(spawn[1]).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}.'’:\-♀♂ ()\[\]]+$/gu, "");
    return { type: "spawn", name, slug: slugFor(name), mystery: isMysteryPokemon(name), durationSeconds: seconds, expiresAtMs: nowMs + seconds * 1000, text };
  }
  if (currentEncounter) {
    const resolution = /\b(caught|fled|escaped|got away|no one caught|winners? revealed|encounter (?:is )?over)\b/i.test(text);
    if (resolution) return { type: "clear", reason: "resolution", text };
  }
  return { type: "ignored", reason: "unmatched", text };
}

module.exports = { cleanMessage, parseCatchCommand, parsePokemonLabel, slugFor, isMysteryPokemon, parseCommunityMessage };
