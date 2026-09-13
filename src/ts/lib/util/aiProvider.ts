import * as I from 'Interface';

/**
 * Suggested models for any local provider. Deliberately one shared list rather
 * than per-provider tags: the same model is packaged under different ids by
 * Ollama, LM Studio and the rest, so `key` is matched loosely and mainly serves
 * to tell the user what is worth installing.
 */
const LOCAL_RECOMMENDED: I.AiRecommendedModel[] = [
	{ key: 'gemma4:e4b', name: 'Gemma 4 E4B' },
	{ key: 'gemma4:e2b', name: 'Gemma 4 E2B' },
	{ key: 'bonsai-27b', name: 'Bonsai 27B (1-bit)' },
	{ key: 'ternary-bonsai', name: 'Ternary Bonsai 27B' },
	{ key: 'qwen3.8:27b', name: 'Qwen3.8 27B', noteKey: 'popupSettingsImportAiModelMoreMemory' },
];

// Ids differ in packaging between local runtimes (`gemma4:e4b` vs
// `google/gemma-4-E4B-GGUF`), so compare on alphanumerics alone
const normalize = (v: string): string => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * The provider dropdown lists more services than the middleware has enum values
 * for. `Rpc_AI_Provider` knows only OLLAMA/OPENAI/LMSTUDIO/LLAMACPP, so every
 * other OpenAI-compatible service rides on OPENAI with its own base URL — the
 * same shape the built-in Anytype proxy already uses.
 *
 * Anthropic is deliberately absent: its OpenAI-compatibility layer documents
 * `response_format` as ignored, and the middleware's planner always sends
 * `response_format: {type: json_schema, strict: true}`
 * (core/ai/llmclient/client.go). Listing it would validate green and then fail
 * every import — it needs a native provider middleware-side first.
 */
const ITEMS: I.AiProviderItem[] = [

	// Local — the endpoint never leaves the machine, which is what the shield marks.
	{ id: 'ollama', name: 'Ollama', provider: I.AiProvider.Ollama, endpoint: 'http://localhost:11434/v1', isLocal: true },
	{ id: 'lmstudio', name: 'LM Studio', provider: I.AiProvider.LMStudio, endpoint: 'http://localhost:1234/v1', isLocal: true },
	{ id: 'llamacpp', name: 'llama.cpp', provider: I.AiProvider.LlamaCpp, endpoint: 'http://localhost:8080/v1', isLocal: true },
	{ id: 'localai', name: 'LocalAI', provider: I.AiProvider.OpenAi, endpoint: 'http://localhost:8080/v1', isLocal: true },

	// Cloud — all OpenAI-compatible, distinguished only by base URL.
	{ id: 'openai', name: 'OpenAI', provider: I.AiProvider.OpenAi, endpoint: 'https://api.openai.com/v1', needsToken: true, recommended: [ { key: 'gpt-5.6-luna', name: 'gpt-5.6-luna' }, { key: 'gpt-5.6-terra', name: 'gpt-5.6-terra' }, { key: 'gpt-6-astra', name: 'gpt-6-astra' } ] },
	{ id: 'openrouter', name: 'OpenRouter', provider: I.AiProvider.OpenAi, endpoint: 'https://openrouter.ai/api/v1', needsToken: true },
	{ id: 'groq', name: 'Groq', provider: I.AiProvider.OpenAi, endpoint: 'https://api.groq.com/openai/v1', needsToken: true },
	{ id: 'mistral', name: 'Mistral', provider: I.AiProvider.OpenAi, endpoint: 'https://api.mistral.ai/v1', needsToken: true },
	{ id: 'deepseek', name: 'DeepSeek', provider: I.AiProvider.OpenAi, endpoint: 'https://api.deepseek.com/v1', needsToken: true },
	{ id: 'together', name: 'Together AI', provider: I.AiProvider.OpenAi, endpoint: 'https://api.together.xyz/v1', needsToken: true },

	{ id: 'custom', name: '', provider: I.AiProvider.OpenAi, endpoint: '', isCustom: true },
];

/**
 * The built-in proxy. Kept out of the configurable list because its endpoint and
 * model are injected at build time and it exposes no settings of its own.
 */
const ANYTYPE: I.AiProviderItem = {
	id: 'anytype',
	name: '',
	provider: I.AiProvider.OpenAi,
	endpoint: '',
	isAnytype: true,
};

/**
 * Before the dropdown, the saved value was the wire enum itself. Several entries
 * now share a wire enum, so it can no longer identify a choice.
 */
const LEGACY: Record<number, string> = {
	[I.AiProvider.Ollama]: 'ollama',
	[I.AiProvider.OpenAi]: 'openai',
	[I.AiProvider.LMStudio]: 'lmstudio',
	[I.AiProvider.LlamaCpp]: 'llamacpp',
	[I.AiProvider.Anytype]: 'anytype',
};

class UtilAiProvider {

	/**
	 * Configurable providers, in menu order. Excludes the built-in proxy.
	 */
	getList (): I.AiProviderItem[] {
		return ITEMS;
	};

	/**
	 * Looks up a saved providerId. Unknown ids fall back to the custom entry so a
	 * provider dropped from the registry leaves the user on a still-editable
	 * endpoint rather than a silently wrong one.
	 */
	get (id: string): I.AiProviderItem {
		if (id == ANYTYPE.id) {
			return ANYTYPE;
		};
		return ITEMS.find(it => it.id == id) || ITEMS.find(it => it.isCustom);
	};

	getDefaultId (isAnytypeAvailable: boolean): string {
		return isAnytypeAvailable ? ANYTYPE.id : 'ollama';
	};

	migrateLegacyProvider (provider: number): string {
		return LEGACY[provider] || '';
	};

	/**
	 * Turns a raw storage bucket into usable settings. Kept here rather than in
	 * UtilData so the migration is testable without build-time globals.
	 *
	 * `obj.provider` is the pre-dropdown shape: a wire enum standing in for the
	 * choice. An explicit providerId always wins over it.
	 */
	applyDefaults (obj: any, isAnytypeAvailable: boolean): I.ImportAiSettings {
		obj = obj || {};

		let providerId = String(obj.providerId || '') || this.migrateLegacyProvider(Number(obj.provider));

		// An id no longer in the registry has to be reset, not carried: Select falls
		// back to options[0] when nothing matches, and with sections in the list
		// that renders a section header as the chosen provider. A build without the
		// bundled proxy must not leave the user pointed at it either.
		const isKnown = (providerId == ANYTYPE.id) ? isAnytypeAvailable : ITEMS.some(it => it.id == providerId);

		if (!isKnown) {
			providerId = this.getDefaultId(isAnytypeAvailable);
		};

		return {
			enabled: Boolean(obj.enabled),
			providerId,
			endpoint: String(obj.endpoint || ''),
			model: String(obj.model || ''),
			token: String(obj.token || ''),
			includeContentSamples: Boolean(obj.includeContentSamples),
		};
	};

	/**
	 * Builds the wire ProviderConfig, or null when the config is not usable yet.
	 * Null is deliberate: a half-filled config produces a visible llmPlanFailed
	 * warning middleware-side, so it is better to send nothing.
	 *
	 * The endpoint comes from the registry for every provider but `custom` — a
	 * stored endpoint would otherwise outlive the provider it was typed for.
	 */
	resolveConfig (settings: I.ImportAiSettings): any {
		const config = this.resolveListConfig(settings);

		if (!config || !settings.model) {
			return null;
		};

		return { ...config, model: settings.model };
	};

	/**
	 * The same config minus the model, for ListModels — that call runs before a
	 * model is chosen, so requiring one would make the dropdown unfillable.
	 * Everything else it needs to succeed (endpoint, token) is still enforced.
	 */
	resolveListConfig (settings: I.ImportAiSettings): any {
		const item = this.get(settings.providerId);

		// The bundled proxy injects its own endpoint and model at build time
		if (item.isAnytype) {
			return null;
		};

		const endpoint = (item.isCustom ? String(settings.endpoint || '').trim() : item.endpoint);

		if (!endpoint || (item.needsToken && !settings.token)) {
			return null;
		};

		return {
			provider: item.provider,
			endpoint,
			model: '',
			token: settings.token,
			temperature: 0,
		};
	};

	/**
	 * Drops embedding models from a fetched catalog. They cannot serve a chat
	 * completion, so choosing one fails the plan step once the import is already
	 * running. The OpenAI-compatible /v1/models the middleware reads carries no
	 * capability field, so the id is the only signal available.
	 */
	filterChatModels (list: string[]): string[] {
		return (list || []).filter(it => !String(it || '').toLowerCase().includes('embed'));
	};

	/**
	 * Recommended models filtered down to what the provider actually serves, in
	 * curated order. A retired model drops out on its own. With nothing fetched
	 * yet the curated list stands in, so the menu is useful before the first
	 * successful ListModels call.
	 */
	getRecommended (id: string, fetched: string[]): I.AiRecommendedResult[] {
		const item = this.get(id);
		const list = item.isLocal ? LOCAL_RECOMMENDED : (item.recommended || []);

		if (!list.length) {
			return [];
		};

		const resolve = (it: I.AiRecommendedModel, id: string, isInstalled: boolean): I.AiRecommendedResult => {
			return { id, name: it.name, noteKey: it.noteKey, isInstalled };
		};

		// Nothing fetched yet — we cannot tell what is missing, so claim nothing is
		if (!fetched.length) {
			return list.map(it => resolve(it, it.key, true));
		};

		const ret: I.AiRecommendedResult[] = [];

		for (const it of list) {
			// Local ids vary by packaging, so match loosely. Cloud ids are canonical
			// and must match exactly, or a curated id would swallow a dated or
			// preview sibling that is really a different model.
			const match = item.isLocal
				? fetched.find(f => normalize(f).includes(normalize(it.key)))
				: fetched.find(f => f == it.key);

			if (match) {
				ret.push(resolve(it, match, true));
			} else
			if (item.isLocal) {
				// A local model the user does not have is the whole point of the hint
				ret.push(resolve(it, it.key, false));
			};
		};

		return ret;
	};

};

export default new UtilAiProvider();
