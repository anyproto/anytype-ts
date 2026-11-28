import React from 'react';
import * as I from 'Interface';
import { Title, Label, Loader, EmptyState, Filter } from 'Component';
import AiAppIcon from 'Component/util/aiAppIcon';
import type { Gallery, GalleryRow, RowAction } from 'Lib/aiConnect/gallery';

export interface AiAppsListProps {
	gallery: Gallery;
	isDesktop: boolean;
	apiState: I.AiApiState;
	scanOk: boolean;
	/** Main's list couldn't be read: the earlier data stays, with Scan again (V21) */
	loadFailed?: boolean;
	/** A key Anytype created couldn't be deleted yet (the Local API hint) */
	cleanupFailed?: boolean;
	loading: boolean;
	query: string;
	/** Changes when the page sets the search itself: the field shows it (its input keeps its own text otherwise) */
	filterKey?: number;
	/** The installed app's icon for a card, or '' */
	icon: (appId: I.AiAppId) => string;
	onQuery: (query: string) => void;
	onAction: (row: GalleryRow, action: RowAction) => void;
	/** The row's name: opens Manage when it has a connection */
	onManage: (row: GalleryRow) => void;
	onScanAgain: () => void;
	onApiSettings: () => void;
	onDevelopers: () => void;
};

const ACTION_TEXT: Record<RowAction, string> = {
	connect: 'aiAppsConnect',
	getApp: 'aiAppsGetApp',
	setUpManually: 'aiConnectSetUpManually',
	setUpRemote: 'aiAppsSetUpRemote',
	manage: 'aiAppsManage',
	continue: 'aiAppsContinue',
	retryCheck: 'aiAppsRetryCheck',
	fix: 'aiAppsFix',
	retry: 'commonRetry',
	forget: 'aiAppsForget',
	details: 'aiAppsDetails',
	setUp: 'aiAppsSetUp',
};

/**
 * Only Connect (an installed app) is the row's black button; Get app is a blank one; Set up manually and the
 * status verbs are text buttons (V31, W24)
 */
const actionClass = (id: RowAction): string[] => {
	switch (id) {
		case 'connect': {
			return [ 'button', 'black', 'size28', 'action' ];
		};
		case 'getApp': {
			return [ 'button', 'blank', 'size28', 'action' ];
		};
	};
	return [ 'linkButton', 'action' ];
};

const API_TEXT: Partial<Record<I.AiApiState, string>> = {
	disabled: 'aiAppsApiOff',
	failed: 'aiAppsApiFailed',
	unknown: 'aiAppsApiStarting',
};

/** Settings ▸ AI apps, drawn from the gallery model (§5.1); the page container owns every call */
const AiAppsList = (props: AiAppsListProps) => {
	const { gallery, isDesktop, apiState, scanOk, loadFailed, cleanupFailed, loading, query, filterKey, icon, onQuery, onAction, onManage, onScanAgain, onApiSettings, onDevelopers } = props;
	const t = (key: string, args?: string[]) => U.String.sprintf(translate(key), ...(args || []));

	// Called as functions, not components: a component made inside render would remount (and drop focus) on every render
	const renderRow = (row: GalleryRow) => {
		const status = row.status;
		const dotCn = [ 'localApiStatus', ((status?.dot == 'success') ? 'isSuccess' : 'isError') ];

		return (
			<div key={row.id} id={`aiAppRow-${row.appId}`} className="item aiAppRow">
				<AiAppIcon appId={row.appId} name={row.name} icon={icon(row.appId)} />
				<div className="info">
					{(row.connection && isDesktop) ? (
						<button type="button" className="linkButton name" title={row.name} onClick={() => onManage(row)}>{row.name}</button>
					) : <div className="name" title={row.name}>{row.name}</div>}
					{status ? (
						<div className="status">
							{status.dot ? <span className={dotCn.join(' ')} aria-hidden="true" /> : null}
							<span>{[ t(status.key, status.args), (status.suffix ? translate(status.suffix) : '') ].filter(it => it).join(' · ')}</span>
						</div>
					) : null}
					{row.alsoIn.length ? <div className="status">{t('aiAppsAlsoIn', [ row.alsoIn.join(', ') ])}</div> : null}
				</div>
				{row.actions.length ? (
					<div className="actions">
						{row.actions.map(action => {
							const cn = [ ...actionClass(action.id), (action.disabled ? 'disabled' : '') ];

							return (
								<button
									key={action.id}
									type="button"
									className={cn.join(' ')}
									disabled={action.disabled}
									aria-label={`${translate(ACTION_TEXT[action.id])} ${row.name}`}
									onClick={() => onAction(row, action.id)}
								>
									{translate(ACTION_TEXT[action.id])}
								</button>
							);
						})}
					</div>
				) : null}
			</div>
		);
	};

	const renderSection = (id: string, title: string, rows: GalleryRow[], children?: React.ReactNode) => {
		const cn = [ 'aiAppsSection', id ];

		return (
			<section className={cn.join(' ')} aria-label={title}>
				<div className="sectionHead">
					<Label className="section" text={title} />
					{children}
				</div>
				{rows.length ? <div className="actionItems">{rows.map(renderRow)}</div> : null}
			</section>
		);
	};

	const apiText = isDesktop ? API_TEXT[apiState] : '';

	return (
		<>
			<div className="titleWrapper">
				<Title text={translate('aiAppsTitle')} />
			</div>
			<Label className="apiKeyIntro" text={translate('aiAppsDescription')} />

			{!isDesktop ? (
				<div className="actionItems notice">
					<div className="item"><Label text={translate('aiAppsDesktopOnly')} /></div>
				</div>
			) : null}

			{apiText ? (
				<div className="actionItems notice">
					<div className="item">
						<Label text={translate(apiText)} />
						{(apiState != 'unknown') ? <button type="button" className="linkButton action" onClick={onApiSettings}>{translate('aiAppsApiOffButton')}</button> : null}
					</div>
				</div>
			) : null}

			{(isDesktop && loadFailed) ? (
				<div className="actionItems notice">
					<div className="item">
						<Label text={translate('aiAppsLoadFailed')} />
						<button type="button" className="linkButton action" onClick={onScanAgain}>{translate('aiAppsScanAgain')}</button>
					</div>
				</div>
			) : null}

			{(isDesktop && cleanupFailed) ? (
				<div className="actionItems notice">
					<div className="item">
						<Label text={translate('aiAppsCleanupHint')} />
						<button type="button" className="linkButton action" onClick={onApiSettings}>{translate('aiAppsApiOffButton')}</button>
					</div>
				</div>
			) : null}

			{(isDesktop && !scanOk && !loadFailed) ? (
				<div className="actionItems notice">
					<div className="item">
						<Label text={translate('aiAppsScanFailed')} />
						<button type="button" className="linkButton action" onClick={onScanAgain}>{translate('aiAppsScanAgain')}</button>
					</div>
				</div>
			) : null}

			{loading ? <Loader /> : (
				<>
					{gallery.connected.length ? renderSection('connected', translate('aiAppsSectionConnected'), gallery.connected) : null}

					{gallery.nothingDetected ? (
						<section className="aiAppsSection detected">
							<Label className="section" text={translate('aiAppsSectionDetected')} />
							<Label className="grey nothingDetected" text={translate('aiAppsNothingDetected')} />
						</section>
					) : (gallery.detected.length ? renderSection('detected', translate('aiAppsSectionDetected'), gallery.detected) : null)}

					{renderSection('other', translate('aiAppsSectionOther'), gallery.other, (
						<Filter key={filterKey} className="aiAppsFilter" value={query} placeholder={translate('aiAppsSearch')} onChange={onQuery} onClear={() => onQuery('')} />
					))}

					{gallery.searchEmpty ? <EmptyState text={translate('aiAppsSearchEmpty')} /> : null}
				</>
			)}

			<div className="aiAppsFooter">
				<button type="button" className="linkButton" onClick={onDevelopers}>{translate('aiAppsDevelopersLink')}</button>
			</div>
		</>
	);
};

export default AiAppsList;
