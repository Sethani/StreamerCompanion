Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region src/config.ts
/** @internal */
const config = { cacheDuration: 900 * 1e3 };
/**
* Updates the Pluralmind config.
* Check out {@link PluralmindConfig} for available options.
*
* @group Advanced Functions
*/
const updateConfig = (updates) => {
	Object.assign(config, updates);
};
//#endregion
//#region src/types.ts
const MessageFragmentType = {
	/**
	* Basic text from a message. This can include emojis as well as emotes
	* from other services (like FFZ, BTTV, etc.), as long as they are still
	* in their text form.
	*/
	Text: "text",
	/**
	* A Twitch emote. The emote's name should be provided as
	* {@link MessageFragment.text}. It's expected that there won't be colons
	* around the name, since Twitch doesn't actually include those in their
	* messages.
	*/
	Emote: "emote",
	/**
	* A \@mention of another user. Don't worry about providing this type unless
	* you already have the data separated and available. The library will
	* still attempt to detect and ignore leading mentions in text fragments.
	*/
	Mention: "mention"
};
let ProxyType = /* @__PURE__ */ function(ProxyType) {
	/**
	* The proxy can be used as either a prefix or a suffix on the message.
	*/
	ProxyType[ProxyType["EitherSide"] = 0] = "EitherSide";
	/**
	* The proxy must be used at the start of the message.
	*/
	ProxyType[ProxyType["Prefix"] = 1] = "Prefix";
	/**
	* The proxy must be used at the end of the message.
	*/
	ProxyType[ProxyType["Suffix"] = 2] = "Suffix";
	return ProxyType;
}({});
//#endregion
//#region src/util.ts
const knownFragmentTypes = new Set(Object.values(MessageFragmentType));
const consumeFragmentsToMatchProxy = (fragments, proxy, type, member) => {
	let sourceFragments = fragments;
	let remainingProxy = proxy.text;
	if (member.require_space) remainingProxy = type === "prefix" ? `${proxy.text} ` : ` ${proxy.text}`;
	if (type === "suffix") {
		remainingProxy = reverse(remainingProxy);
		fragments = reverseFragments(fragments);
	}
	const startsWith = (text, prefix) => {
		if (member.case_sensitive) return text.startsWith(prefix);
		return text.toLowerCase().startsWith(prefix.toLowerCase());
	};
	let changedFragments = {};
	let foundFirstText = false;
	let matched = false;
	for (const [idx, fragment] of fragments.entries()) {
		if (!knownFragmentTypes.has(fragment.type)) return;
		if (typeof fragment.text !== "string") return;
		if (type === "prefix" && idx === 0 && fragment.type === MessageFragmentType.Mention) continue;
		if (!fragment.text.length) continue;
		let firstCharacterIdx = 0;
		if (!foundFirstText) {
			firstCharacterIdx = fragment.text.search(/\S/);
			if (firstCharacterIdx === -1) continue;
		}
		let trueText = fragment.text.slice(firstCharacterIdx);
		foundFirstText = true;
		if (type === "prefix" && idx === 0 && fragment.type === MessageFragmentType.Text) {
			const mentionMatch = trueText.match(/^@\w{4,25} /);
			if (mentionMatch) {
				firstCharacterIdx += mentionMatch[0].length;
				trueText = trueText.slice(mentionMatch[0].length);
			}
		}
		if (trueText.length >= remainingProxy.length) {
			if (!startsWith(trueText, remainingProxy)) return;
			if (trueText.length > remainingProxy.length && fragment.type === MessageFragmentType.Emote) return;
			changedFragments[idx] = fragment.type === MessageFragmentType.Emote ? null : {
				...fragment,
				text: fragment.text.slice(0, firstCharacterIdx) + trueText.slice(remainingProxy.length)
			};
			matched = true;
			break;
		} else {
			if (!startsWith(remainingProxy, trueText)) return;
			remainingProxy = remainingProxy.slice(trueText.length);
			changedFragments[idx] = fragment.type === MessageFragmentType.Emote ? null : {
				...fragment,
				text: fragment.text.slice(0, firstCharacterIdx)
			};
		}
	}
	if (!matched) return;
	if (type === "suffix") changedFragments = Object.fromEntries(Object.entries(changedFragments).map(([idx, fragment]) => {
		return [fragments.length - 1 - Number(idx), fragment?.text ? {
			...fragment,
			text: reverse(fragment.text)
		} : fragment];
	}));
	return {
		changedFragments,
		cleanFragments: sourceFragments.map((fragment, idx) => {
			if (changedFragments[idx] === void 0) return fragment;
			return changedFragments[idx];
		}).filter((f) => f !== null)
	};
};
const reverse = (text) => text.split("").reverse().join("");
const reverseFragments = (fragments) => {
	return fragments.map((fragment) => {
		if (fragment.text) return {
			...fragment,
			text: reverse(fragment.text)
		};
		return fragment;
	}).reverse();
};
//#endregion
//#region src/service.ts
const pendingFetches = {};
const systemCache = {};
/**
* Retrieves the previously cached system data, along with whether the data
* should be considered expired. Returns undefined if no cached data exists for
* the given id.
*
* @group Advanced Functions
*/
const getCachedSystem = (id) => {
	const cached = systemCache[id];
	if (!cached) return;
	return {
		system: cached.system,
		expired: Date.now() - cached.timestamp >= config.cacheDuration
	};
};
/**
* Loads information about a system from the Pluralmind API.
* When called with an ID that is already being loaded, that initial call's
* promise will be reused rather than starting another load.
* Note: You generally should not need to call this directly. It is recommended
* to use {@link getSystem} instead since that handles caching.
*
* @group Advanced Functions
*/
const loadSystem = (id) => {
	if (pendingFetches[id]) return pendingFetches[id];
	pendingFetches[id] = (async () => {
		try {
			const response = await fetch(`https://pluralmind.chat/api/v2/system/${id}`, {
				credentials: "omit",
				cache: "no-store"
			});
			if (response.ok) return await response.json();
			if (response.status === 404) return null;
			throw new Error(`Pluralmind API returned ${response.status} for system ${id}`);
		} finally {
			delete pendingFetches[id];
		}
	})();
	return pendingFetches[id];
};
/**
* Returns information about a system for a given Twitch ID or username, or
* null if no system is associated with the given ID.
* This attempts to use cached data first, but will load fresh data if no
* cached data exists, or the cached data is expired.
* Note: This function will never throw an exception. If an API request fails,
* it will fall back to cached data, or return null if no cached data exists.
*/
const getSystem = async (id) => {
	const cacheHit = getCachedSystem(id);
	if (cacheHit && !cacheHit.expired) return cacheHit.system;
	try {
		const system = await loadSystem(id);
		systemCache[id] = {
			system,
			timestamp: Date.now()
		};
		return system;
	} catch {
		return cacheHit?.system ?? null;
	}
};
/**
* Identifies if a configured proxy was used for this message.
* You generally shouldn't need to call this directly, and should use
* {@link getProxiedMessage} instead since it takes autoproxies into
* consideration.
*
* @group Advanced Functions
*/
const detectProxyInMessage = (system, fragments) => {
	const proxies = system.members.flatMap((member) => member.proxies.map((proxy) => ({
		proxy,
		member
	}))).sort((a, b) => {
		if (b.proxy.text.length !== a.proxy.text.length) return b.proxy.text.length - a.proxy.text.length;
		if (a.member.case_sensitive && !b.member.case_sensitive) return -1;
		if (!a.member.case_sensitive && b.member.case_sensitive) return 1;
		return 0;
	});
	for (const { proxy, member } of proxies) {
		let match = void 0;
		if ([1, 0].includes(proxy.type)) match = consumeFragmentsToMatchProxy(fragments, proxy, "prefix", member);
		if (!match && [2, 0].includes(proxy.type)) match = consumeFragmentsToMatchProxy(fragments, proxy, "suffix", member);
		if (match) return {
			...match,
			proxyUsed: proxy,
			member
		};
	}
};
/**
* Checks if a proxy applies to this message, and if so, returns information
* about the member and their preferences. Also includes clean versions of
* the message with the proxy removed, ready for display.
*/
const getProxiedMessage = (system, message) => {
	if (!system) return;
	let member = null;
	if (system.autoproxy_member_id) member = system.members.find((m) => m.id === system.autoproxy_member_id);
	const fragments = typeof message === "string" ? [{
		type: "text",
		text: message
	}] : [...message];
	const detection = detectProxyInMessage(system, fragments);
	if (detection) member = detection.member;
	if (!member) return;
	const targetFragments = detection?.cleanFragments ?? fragments;
	const body = targetFragments.map((f) => f.text ?? "").join("");
	return {
		member,
		system,
		color: member.color ?? system.color,
		pronouns: member.pronouns ?? system.pronouns,
		proxyUsed: detection?.proxyUsed,
		cleanFragments: targetFragments,
		changedFragments: detection?.changedFragments ?? {},
		body
	};
};
//#endregion
exports.MessageFragmentType = MessageFragmentType;
exports.ProxyType = ProxyType;
exports.config = config;
exports.detectProxyInMessage = detectProxyInMessage;
exports.getCachedSystem = getCachedSystem;
exports.getProxiedMessage = getProxiedMessage;
exports.getSystem = getSystem;
exports.loadSystem = loadSystem;
exports.updateConfig = updateConfig;

//# sourceMappingURL=index.cjs.map