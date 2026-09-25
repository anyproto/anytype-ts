import { describe, it, expect } from 'vitest';
import UtilAiProvider from './aiProvider';
import * as I from 'Interface';

/**
 * The dropdown lists more providers than the middleware has enum values for:
 * `Rpc_AI_Provider` only knows OLLAMA/OPENAI/LMSTUDIO/LLAMACPP, so every other
 * OpenAI-compatible service rides on OPENAI with its own base URL — the same
 * trick the built-in Anytype provider already uses.
 *
 * These tests pin the two things that breaks silently if the registry drifts:
 * every entry must resolve to a real wire enum, and the id a user picked must
 * survive a round trip through storage.
 */
describe('UtilAiProvider registry', () => {

	it('resolves every listed provider to a wire enum the middleware accepts', () => {
		const wire = [ I.AiProvider.Ollama, I.AiProvider.OpenAi, I.AiProvider.LMStudio, I.AiProvider.LlamaCpp ];

		for (const item of UtilAiProvider.getList()) {
			expect(wire, `provider "${item.id}" maps to an unknown wire enum`).toContain(item.provider);
		};
	});

	it('gives every provider except custom a non-empty endpoint', () => {
		for (const item of UtilAiProvider.getList().filter(it => !it.isCustom)) {
			expect(item.endpoint, `provider "${item.id}" has no endpoint`).toMatch(/^https?:\/\//);
		};
	});

	it('marks localhost providers as local and remote ones as not', () => {
		for (const item of UtilAiProvider.getList().filter(it => !it.isCustom)) {
			const isLoopback = /^https?:\/\/(localhost|127\.0\.0\.1|\[?::1)/.test(item.endpoint);

			expect(Boolean(item.isLocal), `provider "${item.id}" isLocal disagrees with its endpoint`).toBe(isLoopback);
		};
	});

	it('has exactly one custom entry, and it carries no endpoint', () => {
		const custom = UtilAiProvider.getList().filter(it => it.isCustom);

		expect(custom).toHaveLength(1);
		expect(custom[0].endpoint).toEqual('');
	});

	it('uses unique ids so a saved providerId is unambiguous', () => {
		const ids = UtilAiProvider.getList().map(it => it.id);

		expect(new Set(ids).size).toEqual(ids.length);
	});

	it('returns the entry for a known id', () => {
		expect(UtilAiProvider.get('ollama').name).toEqual('Ollama');
	});

	it('falls back to the custom entry for an unknown id', () => {
		expect(UtilAiProvider.get('no-such-provider').isCustom).toBe(true);
	});

});

/**
 * Before the dropdown existed, the saved value WAS the wire enum number. Now
 * several entries share a wire enum (OpenAI, Groq, OpenRouter are all OPENAI),
 * so the enum can no longer identify the choice and `providerId` replaces it.
 * Anyone on an alpha build has the old shape in storage; without this mapping
 * their configured provider silently resets.
 */
describe('UtilAiProvider.migrateLegacyProvider', () => {

	it.each([
		[ I.AiProvider.Ollama, 'ollama' ],
		[ I.AiProvider.OpenAi, 'openai' ],
		[ I.AiProvider.LMStudio, 'lmstudio' ],
		[ I.AiProvider.LlamaCpp, 'llamacpp' ],
		[ I.AiProvider.Anytype, 'anytype' ],
	])('maps legacy provider %i to "%s"', (provider, expected) => {
		expect(UtilAiProvider.migrateLegacyProvider(provider)).toEqual(expected);
	});

	it('leaves an unrecognised legacy value on the default rather than guessing', () => {
		expect(UtilAiProvider.migrateLegacyProvider(999)).toEqual('');
	});

});

/**
 * Recommended models play two roles. For a CLOUD provider they are a filter over
 * what the service actually serves — you cannot install a cloud model, so one
 * that is not offered should vanish. For a LOCAL provider the opposite is true:
 * a model you do not have yet is exactly what you need to be told about, so it
 * stays in the list marked as missing.
 */
describe('UtilAiProvider.getRecommended - cloud', () => {

	it('keeps only recommended models the provider actually returned', () => {
		const result = UtilAiProvider.getRecommended('openai', [ 'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-6-astra' ]);

		expect(result.map(it => it.id)).toEqual([ 'gpt-5.6-luna', 'gpt-6-astra' ]);
	});

	it('preserves the curated order, not the provider order', () => {
		const result = UtilAiProvider.getRecommended('openai', [ 'gpt-6-astra', 'gpt-5.6-luna' ]);

		expect(result.map(it => it.id)).toEqual([ 'gpt-5.6-luna', 'gpt-6-astra' ]);
	});

	it('drops a retired cloud model instead of offering something unusable', () => {
		const result = UtilAiProvider.getRecommended('openai', [ 'gpt-5.6-luna' ]);

		expect(result.map(it => it.id)).toEqual([ 'gpt-5.6-luna' ]);
	});

	it('falls back to the full curated list before anything has been fetched', () => {
		const result = UtilAiProvider.getRecommended('openai', []);

		expect(result.length).toBeGreaterThan(0);
		expect(result.every(it => it.isInstalled)).toBe(true);
	});

});

describe('UtilAiProvider.getRecommended - local', () => {

	it('offers the same list for every local provider, not a per-provider one', () => {
		const names = (id: string) => UtilAiProvider.getRecommended(id, [ 'x' ]).map(it => it.name);

		expect(names('lmstudio')).toEqual(names('ollama'));
		expect(names('llamacpp')).toEqual(names('ollama'));
		expect(names('localai')).toEqual(names('ollama'));
	});

	it('keeps a model the user has not installed, so they know to get it', () => {
		const result = UtilAiProvider.getRecommended('ollama', [ 'gemma3:4b' ]);
		const missing = result.filter(it => !it.isInstalled);

		expect(missing.length).toBeGreaterThan(0);
	});

	it('marks a model as installed when the provider reported it', () => {
		const result = UtilAiProvider.getRecommended('ollama', [ 'gemma4:e4b' ]);
		const found = result.find(it => it.name == 'Gemma 4 E4B');

		expect(found.isInstalled).toBe(true);
	});

	it('matches loosely, so the same entry lights up across providers that name it differently', () => {
		const result = UtilAiProvider.getRecommended('lmstudio', [ 'google/gemma-4-E4B-GGUF' ]);
		const found = result.find(it => it.name == 'Gemma 4 E4B');

		expect(found.isInstalled).toBe(true);
	});

	it('reports the id the provider actually uses, not our matching key', () => {
		const result = UtilAiProvider.getRecommended('lmstudio', [ 'google/gemma-4-E4B-GGUF' ]);
		const found = result.find(it => it.name == 'Gemma 4 E4B');

		expect(found.id).toEqual('google/gemma-4-E4B-GGUF');
	});

	it('does not mark everything missing before the first fetch has landed', () => {
		const result = UtilAiProvider.getRecommended('ollama', []);

		expect(result.every(it => it.isInstalled)).toBe(true);
	});

	it('carries the memory caveat on the large model, as a translation key', () => {
		const result = UtilAiProvider.getRecommended('ollama', [ 'x' ]);

		expect(result.some(it => it.noteKey)).toBe(true);
	});

	it('never loosely matches a curated id onto a longer sibling', () => {
		// A dated or preview sibling is a different model; cloud ids are canonical,
		// so the match is exact and this must not resolve to gpt-5.6-luna
		const result = UtilAiProvider.getRecommended('openai', [ 'gpt-5.6-luna-preview' ]);

		expect(result).toEqual([]);
	});

	it('returns nothing for a provider with no curated list', () => {
		expect(UtilAiProvider.getRecommended('custom', [ 'whatever' ])).toEqual([]);
	});

});

/**
 * Storage holds whatever an older build wrote. applyDefaults is the single place
 * that turns a raw bucket into a usable settings object, so the migration and
 * the defaults are testable without dragging in build-time globals.
 */
describe('UtilAiProvider.applyDefaults', () => {

	it('carries a legacy numeric provider over to its registry id', () => {
		const settings = UtilAiProvider.applyDefaults({ enabled: true, provider: I.AiProvider.LMStudio, model: 'qwen3:8b' }, false);

		expect(settings.providerId).toEqual('lmstudio');
	});

	it('keeps a legacy OpenAI config intact rather than resetting it', () => {
		const settings = UtilAiProvider.applyDefaults({ enabled: true, provider: I.AiProvider.OpenAi, model: 'gpt-6-astra', token: 'sk-test' }, false);

		expect(settings.providerId).toEqual('openai');
		expect(settings.model).toEqual('gpt-6-astra');
		expect(settings.token).toEqual('sk-test');
	});

	it('prefers an explicit providerId over a stale legacy provider', () => {
		const settings = UtilAiProvider.applyDefaults({ provider: I.AiProvider.OpenAi, providerId: 'groq' }, false);

		expect(settings.providerId).toEqual('groq');
	});

	it('defaults to ollama when storage is empty and no proxy is built in', () => {
		expect(UtilAiProvider.applyDefaults({}, false).providerId).toEqual('ollama');
	});

	it('defaults to the built-in proxy when this build ships one', () => {
		expect(UtilAiProvider.applyDefaults({}, true).providerId).toEqual('anytype');
	});

	it('moves a stored anytype choice off the proxy when the build has none', () => {
		expect(UtilAiProvider.applyDefaults({ providerId: 'anytype' }, false).providerId).toEqual('ollama');
	});

	it('coerces missing fields instead of passing undefined through', () => {
		const settings = UtilAiProvider.applyDefaults({}, false);

		expect(settings.enabled).toBe(false);
		expect(settings.model).toEqual('');
		expect(settings.token).toEqual('');
		expect(settings.endpoint).toEqual('');
		expect(settings.includeContentSamples).toBe(false);
	});

});

/**
 * resolveConfig is what actually reaches the middleware. The endpoint must come
 * from the registry — never from storage — for everything but `custom`, or a
 * stale saved endpoint outlives the provider the user has since switched to.
 */
describe('UtilAiProvider.resolveConfig', () => {

	const settings = (patch: Partial<I.ImportAiSettings>): I.ImportAiSettings => ({
		enabled: true,
		providerId: 'ollama',
		endpoint: '',
		model: 'qwen3:8b',
		token: '',
		includeContentSamples: false,
		...patch,
	});

	it('sends the registry endpoint, not whatever storage happens to hold', () => {
		const config = UtilAiProvider.resolveConfig(settings({ providerId: 'groq', token: 'gsk-test', endpoint: 'http://stale.example/v1' }));

		expect(config.endpoint).toEqual('https://api.groq.com/openai/v1');
	});

	it('maps an OpenAI-compatible cloud provider onto the OpenAi wire enum', () => {
		const config = UtilAiProvider.resolveConfig(settings({ providerId: 'groq', token: 'gsk-test' }));

		expect(config.provider).toEqual(I.AiProvider.OpenAi);
	});

	it('keeps a local provider on its own wire enum', () => {
		const config = UtilAiProvider.resolveConfig(settings({ providerId: 'ollama' }));

		expect(config.provider).toEqual(I.AiProvider.Ollama);
		expect(config.endpoint).toEqual('http://localhost:11434/v1');
	});

	it('uses the stored endpoint for the custom provider', () => {
		const config = UtilAiProvider.resolveConfig(settings({ providerId: 'custom', endpoint: 'https://gateway.example/v1' }));

		expect(config.endpoint).toEqual('https://gateway.example/v1');
	});

	it('pins temperature to zero so the plan step stays deterministic', () => {
		expect(UtilAiProvider.resolveConfig(settings({})).temperature).toEqual(0);
	});

	it('refuses a custom provider with no endpoint rather than sending an empty one', () => {
		expect(UtilAiProvider.resolveConfig(settings({ providerId: 'custom', endpoint: '' }))).toBeNull();
	});

	it('refuses a token-requiring provider with no token', () => {
		expect(UtilAiProvider.resolveConfig(settings({ providerId: 'openai', model: 'gpt-6-astra', token: '' }))).toBeNull();
	});

	it('does not require a token for a local provider', () => {
		expect(UtilAiProvider.resolveConfig(settings({ providerId: 'ollama', token: '' }))).not.toBeNull();
	});

	it('refuses a config with no model, since the middleware reads that as feature-off', () => {
		expect(UtilAiProvider.resolveConfig(settings({ model: '' }))).toBeNull();
	});

});

/**
 * ListModels is what populates the model dropdown, and it runs BEFORE a model is
 * chosen — "config.model is ignored" per the RPC contract. So it must build a
 * config where resolveConfig would refuse one, while still holding the line on
 * the things the call genuinely needs: a reachable endpoint and a token.
 */
describe('UtilAiProvider.resolveListConfig', () => {

	const settings = (patch: Partial<I.ImportAiSettings>): I.ImportAiSettings => ({
		enabled: true,
		providerId: 'ollama',
		endpoint: '',
		model: '',
		token: '',
		includeContentSamples: false,
		...patch,
	});

	it('builds a config with no model chosen yet', () => {
		const config = UtilAiProvider.resolveListConfig(settings({ providerId: 'ollama' }));

		expect(config).not.toBeNull();
		expect(config.endpoint).toEqual('http://localhost:11434/v1');
	});

	it('still refuses a token-requiring provider with no token', () => {
		expect(UtilAiProvider.resolveListConfig(settings({ providerId: 'openai' }))).toBeNull();
	});

	it('still refuses a custom provider with no endpoint', () => {
		expect(UtilAiProvider.resolveListConfig(settings({ providerId: 'custom', endpoint: '' }))).toBeNull();
	});

	it('refuses the built-in proxy, which exposes no model picker', () => {
		expect(UtilAiProvider.resolveListConfig(settings({ providerId: 'anytype' }))).toBeNull();
	});

});

/**
 * The Select component falls back to options[0] when the value matches no
 * option — and with sections in the list, options[0] is a section HEADER. So an
 * unknown providerId must never survive applyDefaults, or the closed dropdown
 * renders "On this device" as if it were the chosen provider.
 */
describe('UtilAiProvider.applyDefaults normalisation', () => {

	it('resets a providerId that is not in the registry', () => {
		expect(UtilAiProvider.applyDefaults({ providerId: 'no-such-provider' }, false).providerId).toEqual('ollama');
	});

	it('keeps every id the registry actually lists', () => {
		for (const item of UtilAiProvider.getList()) {
			expect(UtilAiProvider.applyDefaults({ providerId: item.id }, false).providerId, `"${item.id}" was reset`).toEqual(item.id);
		};
	});

});

/**
 * Local runtimes list whatever the user pulled, embedding models included, and
 * the OpenAI-compatible /v1/models carries no capability field to filter on. An
 * embedding model cannot serve a chat completion, so picking one fails at plan
 * time - after the import has already started. Cheaper to keep them out of the
 * picker entirely.
 */
describe('UtilAiProvider.filterChatModels', () => {

	it('drops embedding models', () => {
		const result = UtilAiProvider.filterChatModels([ 'gemma3:4b', 'embeddinggemma:latest', 'nomic-embed-text:latest' ]);

		expect(result).toEqual([ 'gemma3:4b' ]);
	});

	it('drops them whatever the case', () => {
		expect(UtilAiProvider.filterChatModels([ 'text-EMBEDDING-3-small' ])).toEqual([]);
	});

	it('matches anywhere in the id, including a namespaced one', () => {
		expect(UtilAiProvider.filterChatModels([ 'nomic-ai/nomic-embed-text-v1.5-GGUF' ])).toEqual([]);
	});

	it('keeps a chat model whose name merely resembles one', () => {
		const list = [ 'gemma4:e4b', 'qwen3.8:27b', 'gpt-6-astra' ];

		expect(UtilAiProvider.filterChatModels(list)).toEqual(list);
	});

	it('handles an empty list', () => {
		expect(UtilAiProvider.filterChatModels([])).toEqual([]);
	});

});
