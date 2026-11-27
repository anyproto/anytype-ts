/**
 * Connect to AI apps: the texts the popup and the gallery build from keys, arguments and records.
 * Every string goes through translate(); English lives in src/json/text.json.
 */
import * as I from 'Interface';
import { getCatalogItem } from 'Lib/aiConnect/catalog';
import { errorKey } from 'Lib/aiConnect/steps';

/** translate() with its %s filled in order */
export const tr = (key: string, ...args: any[]): string => U.String.sprintf(translate(key), ...args.map(it => String(it ?? '')));

/** A card's display name (brand names are not translated) */
export const cardName = (appId: I.AiAppId): string => {
	const item = getCatalogItem(appId);

	if (!item) {
		return '';
	};
	return item.name || translate(item.nameKey);
};

/** A connection's name in Anytype's own lists: an Other-app one keeps the user's name */
export const connectionName = (connection: I.AiConnection): string => {
	if (!connection) {
		return '';
	};
	return (connection.appId == 'other') ? (connection.name || cardName('other')) : cardName(connection.appId);
};

/** "All spaces", a single space's name, or "3 spaces" */
export const spaceSummary = (grant: I.LinkAppGrant, spaces: I.LinkApprovalSpace[]): string => {
	if (!grant || grant.allSpaces) {
		return translate('aiConnectAllSpaces');
	};

	const ids = grant.spaceIds || [];

	if (!ids.length) {
		return translate('aiConnectChooseSpaces');
	};
	if (ids.length == 1) {
		return spaces.find(it => it.id == ids[0])?.name || tr('aiConnectSpaceCount', 1);
	};
	return tr('aiConnectSpaceCount', ids.length);
};

/** "Read and edit · All spaces" */
export const accessSummary = (grant: I.LinkAppGrant, spaces: I.LinkApprovalSpace[]): string => {
	const perm = translate((grant?.perm == I.LocalApiPermission.ReadWrite) ? 'aiConnectAccessReadWrite' : 'aiConnectAccessRead');
	return `${perm} · ${spaceSummary(grant, spaces)}`;
};

/**
 * The tool-set choices (§5.3): Full and Essential. The app's default tier is preselected (Full for apps with large
 * models, Essential for local-model hosts). A connection still on the older 'large' tier keeps it as a third entry.
 */
export const tierOptions = (current?: I.AiTier): { id: I.AiTier; name: string }[] => {
	const ret: { id: I.AiTier; name: string }[] = [
		{ id: 'full', name: translate('aiConnectTierFull') },
		{ id: 'small', name: translate('aiConnectTierEssentials') },
	];

	if (current == 'large') {
		ret.push({ id: 'large', name: translate('aiConnectTierLarge') });
	};
	return ret;
};

export const tierLabel = (tier: I.AiTier): string => {
	return tierOptions(tier).find(it => it.id == tier)?.name || translate('aiConnectTierFull');
};

/** Full over stdio also offers the bundled proxy's local file tools (R2-28): said under the selector */
export const tierNote = (tier: I.AiTier, route: I.AiRoute): string => {
	return ((tier == 'full') && (route == 'stdio')) ? translate('aiConnectTierFullStdioHint') : '';
};

/** Categories that have their own `aiConnectError<Category>` text */
const CATEGORIES: I.AiErrorCategory[] = [
	'unparseable', 'unsupportedForm', 'permission', 'outsideHome', 'changed', 'conflict', 'stale', 'cliFailed', 'cliTooOld', 'notFound',
	'timeout', 'apiOff', 'keyNotFound', 'unsupportedPackage', 'unauthorized', 'unreachable', 'unsaved', 'unknown', 'storeDenied', 'installFailed',
];

/**
 * The message for an error: `app` is the card name, `target` the file shown in the plan (texts about a file
 * name the file, the others the app).
 */
export const errorText = (error: I.AiError, app: string, target?: string): string => {
	if (!error) {
		return '';
	};

	const { stage, category } = error;

	if ((stage == 'key') && (category == 'unknown')) {
		return translate('aiConnectErrorKey');
	};
	if ((stage == 'verify') && (category == 'conflict')) {
		return tr('aiConnectErrorVerifyConflict', app);
	};
	if ((stage == 'restart') && (category == 'changed')) {
		return tr('aiConnectErrorRestartChanged', app);
	};
	if ((stage == 'restart') && (category == 'timeout')) {
		return tr('aiConnectErrorRestartTimeout', app);
	};
	if (error.removedOld) {
		return tr('aiConnectErrorRemovedOld', app);
	};
	// Anytype's own connector (anytype-mcp): missing from this build or not the one it was built with
	if ((stage == 'verify') && (category == 'notFound')) {
		return translate('aiConnectErrorConnectorMissing');
	};
	// The connector gave no receipt: the key may or may not be saved, and the next check settles it
	if ((stage == 'write') && (category == 'timeout')) {
		return translate('aiConnectErrorStoreUnconfirmed');
	};

	const key = CATEGORIES.includes(category) ? errorKey(category) : 'aiConnectErrorUnknown';
	const byFile = [ 'unparseable', 'permission' ].includes(category);

	return tr(key, (byFile && target) ? target : app);
};

/** What a failed delivery left behind, as extra lines under the error */
export const errorExtras = (error: I.AiError, app: string): string[] => {
	const ret: string[] = [];

	if (error?.left == 'entry') {
		ret.push(tr('aiConnectErrorLeftEntry', app));
	};
	if (error?.openFailed) {
		ret.push(tr('aiConnectErrorReopen', app));
	};
	return ret;
};

/** A plan's sentence and notes may name the app once or twice; extra arguments are ignored */
export const keyText = (key: string, ...args: any[]): string => key ? tr(key, ...args) : '';

/** The manual view's reason line: the plan's note always (with its steps, H9), else why there are no steps */
export const manualReason = (plan: I.AiPlan, steps: I.AiStep[], app: string): string => {
	if (!plan) {
		return '';
	};
	return (plan.note || !(steps || []).length) ? planReason(plan, app) : '';
};

/**
 * Why a plan can't be applied, as one line: its note (the sandbox, a skill of the user's own, the Linux
 * package), else its error. A Claude Desktop config entry and stored key both owned by someone else have a
 * text of their own (one Replace can't stand for two objects).
 */
export const planReason = (plan: I.AiPlan, app: string): string => {
	if (!plan) {
		return '';
	};
	if (plan.note) {
		return tr(plan.note, app);
	};
	if (!plan.error) {
		return '';
	};
	if ((plan.appId == 'claude-desktop') && (plan.error.stage == 'validate') && (plan.error.category == 'conflict')) {
		return translate('aiConnectErrorConflictBoth');
	};
	return errorText(plan.error, app, plan.displayTarget);
};
