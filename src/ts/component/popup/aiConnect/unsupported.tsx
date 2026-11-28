import React from 'react';
import * as I from 'Interface';
import AiAppIcon from 'Component/util/aiAppIcon';
import { unsupportedKey } from 'Lib/aiConnect/steps';
import { tr } from './text';

export interface AiConnectOffer {
	appId: I.AiAppId;
	name: string;
	installed: boolean;
	getUrl?: string;
};

export interface AiConnectUnsupportedProps {
	appId: I.AiAppId;
	appName: string;
	icon?: string;
	/** The cards this one points to, in the catalog's order */
	offers: AiConnectOffer[];
	onConnect: (appId: I.AiAppId) => void;
	onGet: (url: string) => void;
	onClose: () => void;
};

/** A card Anytype can't connect: why, and the app to use instead (§5.7) */
const AiConnectUnsupported = ({ appId, appName, icon, offers, onConnect, onGet, onClose }: AiConnectUnsupportedProps) => {
	const installed = offers.filter(it => it.installed);
	const first = offers[0];
	const get = (!installed.length && first?.getUrl) ? first : null;
	const hasPrimary = !!installed.length || !!get;
	const closeCn = [ 'button', (hasPrimary ? 'blank' : 'black') ];

	return (
		<div className="apiKeyEditor aiConnectUnsupported">
			<div className="aiConnectHead">
				<AiAppIcon appId={appId} name={appName} icon={icon} />
				<h2 className="title">{appName}</h2>
			</div>
			<p className="description">{translate(unsupportedKey(appId))}</p>
			<div className="apiKeyButtons">
				<button type="button" className={closeCn.join(' ')} data-primary={hasPrimary ? undefined : 'true'} onClick={onClose}>{translate('commonClose')}</button>
				{installed.slice(1).map(it => (
					<button key={it.appId} type="button" className="button blank" onClick={() => onConnect(it.appId)}>{tr('aiConnectTitle', it.name)}</button>
				))}
				{installed.length ? (
					<button type="button" className="button black" data-primary="true" onClick={() => onConnect(installed[0].appId)}>{tr('aiConnectTitle', installed[0].name)}</button>
				) : null}
				{get ? <button type="button" className="button black" data-primary="true" onClick={() => onGet(get.getUrl)}>{tr('aiConnectGetApp', get.name)}</button> : null}
			</div>
		</div>
	);
};

export default AiConnectUnsupported;
