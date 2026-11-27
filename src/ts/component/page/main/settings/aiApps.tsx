import React, { forwardRef, useEffect, useRef, useState } from 'react';
import * as I from 'Interface';
import { CATALOG, getCatalogItem } from 'Lib/aiConnect/catalog';
import { isErrorMsg, probeMessage } from 'Lib/aiConnect/controller';
import { GalleryVisit, revealClearsQuery, routeTarget } from 'Lib/aiConnect/entry';
import * as flow from 'Lib/aiConnect/flow';
import { buildGallery, type GalleryRow, type RowAction } from 'Lib/aiConnect/gallery';
import { aiAppsMarkSeen } from 'Lib/apiKey';
import type { AiConnectPopupData } from 'Component/popup/aiConnect';
import { connectionName, errorText, tr } from 'Component/popup/aiConnect/text';
import AiAppsList from './aiAppsList';

/** Opens the connect popup (Connect, Manage, Continue, manual setup, Details) */
export const openAiConnect = (data: AiConnectPopupData): void => {
	S.Popup.open('aiConnect', { preventCloseByClick: true, data });
};

const nameOf = (item: I.AiAppCatalogItem): string => item.name || translate(item.nameKey);

/** Settings ▸ AI apps (§5.1): loads and checks on open, opens a route's target (§5.8); every row action goes through here */
const PageMainSettingsAiApps = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {
	const { isPopup } = props;
	const [ query, setQuery ] = useState('');
	const [ filterKey, setFilterKey ] = useState(0);
	const [ reveal, setReveal ] = useState('');
	// The search now, for the visit's callbacks (created once)
	const queryRef = useRef(query);

	queryRef.current = query;
	const opened = useRef(false);
	// A link's target opens once this visit's list is loaded (Lib/aiConnect/entry)
	const visit = useRef<GalleryVisit>(null);
	// A target arrives only in the window's route (the deep link, Help, the nudge, the API Keys backlink)
	const target = routeTarget(isPopup ? {} : keyboard.getMatch(false).params);
	const desktop = flow.isDesktop();
	const apiState = flow.apiState();
	const { detectionMap, connectionList, scanOk, isLoading, isLoaded, loadFailed, cleanupFailed } = S.AiConnect;

	const gallery = buildGallery({
		catalog: CATALOG,
		detections: detectionMap,
		connections: connectionList,
		scanOk: scanOk,
		isDesktop: desktop,
		loaded: isLoaded,
		apiListening: (apiState == 'listening'),
		query,
		nameOf,
	});

	if (!visit.current) {
		visit.current = new GalleryVisit({
			open: openAiConnect,
			// An app that isn't installed: its row is brought into view, with Get app and Set up manually (A12)
			show: appId => {
				// A search that hides the row is cleared, in the field too; one that shows it stays
				if (revealClearsQuery(appId, queryRef.current, nameOf)) {
					setQuery('');
					setFilterKey(k => k + 1);
				};
				setReveal(appId);
			},
		});
	};

	useEffect(() => {
		// Clears the "New" badge on this entry in the settings sidebar
		aiAppsMarkSeen();
		return () => visit.current?.dispose();
	}, []);

	// The row of an app a link named that isn't installed
	useEffect(() => {
		if (reveal) {
			U.Dom.get(`aiAppRow-${reveal}`)?.scrollIntoView({ block: 'center' });
		};
	}, [ reveal, filterKey ]);

	// On open, and again for each new target while open (a second link switches the sheet)
	useEffect(() => {
		const first = !opened.current;

		opened.current = true;
		visit.current.arrive(first, target);
	}, [ target.app, target.connection, target.route ]);

	const onAction = async (row: GalleryRow, action: RowAction) => {
		const c = row.connection;
		const item = getCatalogItem(row.appId);

		switch (action) {
			case 'connect':
			case 'details': {
				openAiConnect({ appId: row.appId });
				break;
			};
			case 'getApp': {
				if (item?.getUrl) {
					Action.openUrl(item.getUrl);
				};
				break;
			};
			case 'setUpRemote': {
				openAiConnect({ appId: row.appId, view: 'remote' });
				break;
			};
			case 'setUpManually':
			case 'setUp': {
				openAiConnect({ appId: row.appId, view: 'manual' });
				break;
			};
			case 'manage':
			case 'fix': {
				openAiConnect({ appId: c.appId, connectionId: c.id, view: 'manage' });
				break;
			};
			case 'continue': {
				openAiConnect({ appId: c.appId, connectionId: c.id, view: 'finish' });
				break;
			};
			case 'retryCheck': {
				// Probe only; its own result either way: the check passed, the key lookup failed, or the probe failed (W15)
				const msg = probeMessage(await flow.retryProbe(c));

				Preview.toastShow({ text: isErrorMsg(msg) ? errorText(msg.error, connectionName(c)) : tr(msg.key, ...(msg.args || [])) });
				break;
			};
			case 'retry': {
				await flow.retryRevoke();
				if (!S.AiConnect.getById(c.id)) {
					Preview.toastShow({ text: tr('aiConnectDisconnected', connectionName(c)) });
				};
				break;
			};
			case 'forget': {
				const res = await flow.forget(c);

				if (('revoked' in res) && res.revoked) {
					Preview.toastShow({ text: tr('aiConnectDisconnected', connectionName(c)) });
				};
				break;
			};
		};
	};

	const onManage = (row: GalleryRow) => {
		if (row.connection) {
			openAiConnect({ appId: row.connection.appId, connectionId: row.connection.id, view: 'manage' });
		};
	};

	return (
		<AiAppsList
			gallery={gallery}
			isDesktop={desktop}
			apiState={apiState}
			scanOk={scanOk}
			loadFailed={desktop && loadFailed}
			cleanupFailed={desktop && cleanupFailed}
			loading={desktop && isLoading && !isLoaded}
			query={query}
			icon={appId => S.AiConnect.icon(appId)}
			filterKey={filterKey}
			onQuery={setQuery}
			onAction={onAction}
			onManage={onManage}
			onScanAgain={() => visit.current.refresh('scan', true)}
			onApiSettings={() => Action.openSettings('api', '')}
			onDevelopers={() => Action.openSettings('api', '')}
		/>
	);
});

export default PageMainSettingsAiApps;
