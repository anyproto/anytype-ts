/**
 * Connect to AI apps: manual steps as shown and copied. Pure; no globals.
 *
 * Main builds every step with KEY_PLACEHOLDER where the key goes and never sees a key here. The renderer
 * replaces the placeholder: masked on screen, the real key only in what Copy puts on the clipboard.
 */
import type { AiAppId, AiDetection, AiNextStep, AiPlan, AiStep } from '../../interface/aiConnect';
import { KEY_PLACEHOLDER } from './catalog';

/** Fixed length, so the mask doesn't tell the key's length */
export const KEY_MASK = '••••••••••••';

/** The step's snippet contains the placeholder: it can't be used before a key exists */
export const stepNeedsKey = (step: AiStep): boolean => !!step.snippet && step.snippet.includes(KEY_PLACEHOLDER);

/** Some step needs a key the user pastes: the view shows the key row only then (Claude Desktop's key file never does) */
export const stepsNeedKey = (steps: AiStep[]): boolean => (steps || []).some(stepNeedsKey);

/**
 * The snippet with the key in place of the placeholder: masked for the screen, the real key for the
 * clipboard. Without a key the placeholder stays.
 */
export const fillStep = (step: AiStep, key: string, masked: boolean): string => {
	const snippet = String(step.snippet || '');

	if (!key) {
		return snippet;
	};
	return snippet.split(KEY_PLACEHOLDER).join(masked ? KEY_MASK : key);
};

/** Copy is offered for a snippet that is complete: one without the placeholder, or once the key exists */
export const canCopyStep = (step: AiStep, key: string): boolean => !!step.snippet && (!stepNeedsKey(step) || !!key);

/** The key as shown in the key row */
export const keyText = (key: string, visible: boolean): string => {
	if (!key) {
		return KEY_PLACEHOLDER;
	};
	return visible ? key : KEY_MASK;
};

/**
 * Arguments for a plan's sentence key (§5.3). Main sends only the key; the texts repeat the app name
 * where they need it, so the arguments follow each text's own order.
 */
export const sentenceArgs = (key: string, app: string, target: string, restart = app): string[] => {
	switch (key) {
		case 'aiConnectPlanConfigRestart': {
			// The app whose restart loads it: ChatGPT for the shared Codex file (W16)
			return [ app, target, restart ];
		};
		case 'aiConnectPlanConfigSession':
		case 'aiConnectPlanConfigReload':
		case 'aiConnectPlanConfigMcpReload': {
			return [ app, target ];
		};
		case 'aiConnectPlanPackage':
		case 'aiConnectPlanKeyfile':
		case 'aiConnectPlanSkill': {
			return [ app, app ];
		};
	};
	return [ app ];
};

/** Anytype can open the card's app: main found its macOS bundle or Windows executable (H18) */
export const canOpenApp = (det: AiDetection | null | undefined): boolean => !!det?.canOpen;

/** The text key of an unsupported card's explanation: `aiConnectUnsupported<Id>` */
export const unsupportedKey = (appId: AiAppId): string => {
	const suffix = String(appId || '').split('-').map(it => it.charAt(0).toUpperCase() + it.slice(1)).join('');
	return `aiConnectUnsupported${suffix}`;
};

/** The text key of an error category: `aiConnectError<Category>` */
export const errorKey = (category: string): string => {
	const c = String(category || 'unknown');
	return `aiConnectError${c.charAt(0).toUpperCase()}${c.slice(1)}`;
};

/** What the user does in the app after a manual setup, by the plan's next step (restart: quit and reopen it) */
const FINISHING: Partial<Record<AiNextStep, string>> = {
	restart: 'aiConnectStepRestartSelf',
	newSession: 'aiConnectStepNewSession',
	reloadServer: 'aiConnectStepReloadServer',
	toggle: 'aiConnectStepToggle',
};

/**
 * The plan's steps, ending with the instruction that makes the app load the new settings (V24) unless a
 * step already says it. `app` fills the instruction's %s.
 */
export const withFinishingStep = (plan: AiPlan | null, app: string): AiStep[] => {
	const steps = (plan?.steps || []).slice();
	const next = plan?.nextStep;

	if (!steps.length || !next || (next == 'none') || (next == 'confirmInApp')) {
		return steps;
	};
	if (steps.some(s => String(s.textKey).startsWith('aiConnectStep'))) {
		return steps;
	};

	const key = ((next == 'restart') ? '' : plan.instructions?.[next]) || FINISHING[next];

	return key ? [ ...steps, { textKey: key, args: [ app ] } ] : steps;
};
