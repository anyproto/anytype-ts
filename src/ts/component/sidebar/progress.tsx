import React, { FC, memo, useRef, useEffect, useState, useCallback } from 'react';
import Icon from 'Component/util/icon';
import Label from 'Component/util/label';
import Download from 'Lib/download';
import * as I from 'Interface';

const AUTO_EXPAND = true;
const SKIP_STATE = [ I.ProgressState.Done, I.ProgressState.Canceled ];

// A download that only wrote a file keeps its place, offering to reveal it. One
// that opened or revealed the file already did something with it, and disappears
// like every other finished row
const isFinishedDownload = (item: I.Progress): boolean => {
	return Boolean(item.isLocal) && Boolean(item.keepWhenDone) && (item.state == I.ProgressState.Done);
};

const getIconName = (type: I.ProgressType): string => {
	switch (type) {
		case I.ProgressType.Update:		return 'popup/header/update';
		case I.ProgressType.Import:		return 'menu/action/import';
		case I.ProgressType.Export:		return 'menu/action/export';
		default:						return 'menu/action/download';
	};
};

interface ItemStatusProps {
	type: I.ProgressType;
	current: number;
	total: number;
	error?: string;
};

const ItemStatus: FC<ItemStatusProps> = memo(({ type, current, total, error }) => {
	if (error) {
		return <span className="error">{error}</span>;
	};

	const percent = total > 0 ? Math.min(100, Math.ceil(current / total * 100)) : 0;
	const status = translate(U.String.toCamelCase(`progress-status-${type}`));

	return <span>{percent}% <span className="dot" /> {status}</span>;
});

/**
 * Ticks on its own: the analysis phase can run for a minute with no counter moving,
 * so elapsed time is the only not-stuck signal there.
 */
const Elapsed: FC<{ since: number }> = memo(({ since }) => {
	const [ , setTick ] = useState(0);

	useEffect(() => {
		const interval = window.setInterval(() => setTick(v => v + 1), 1000);
		return () => window.clearInterval(interval);
	}, []);

	const seconds = since ? Math.floor((Date.now() - since) / 1000) : 0;
	return <>{U.Date.duration(seconds)}</>;
});

const formatCount = (done: number, total: number, key: string): string => {
	const d = U.Common.formatNumber(done);

	return total > 0
		? U.String.sprintf(translate(`importStat${key}Of`), d, U.Common.formatNumber(total))
		: U.String.sprintf(translate(`importStat${key}`), d);
};

/**
 * Per-phase status line. There is no blended percentage by design: the fetching phase is
 * rate-limit bound while creating runs orders of magnitude faster, so one bar would crawl
 * and then leap. Counters re-base at the phase boundary.
 */
const StatisticStatus: FC<{ statistic: I.ImportStatistic }> = memo(({ statistic }) => {
	const { phase, state, totalsKnown, pagesDone, pagesTotal, filesDone, filesTotal } = statistic;
	const { resumesInMs, attempt, attemptsMax, errorMessage, estimatedRemainingMs, phaseStartedAt } = statistic;

	if (state == I.ImportRunState.Error) {
		return <span className="error">{errorMessage || translate('commonError')}</span>;
	};

	// Rate limiting is normal operation, not a failure: phrase it calmly
	if (state == I.ImportRunState.Throttled) {
		return <span>{U.String.sprintf(translate('importStateThrottled'), U.Date.duration(Math.ceil(resumesInMs / 1000)) || '0s')}</span>;
	};

	if (state == I.ImportRunState.Retrying) {
		return <span>{U.String.sprintf(translate('importStateRetrying'), attempt, attemptsMax)}</span>;
	};

	const parts: React.ReactNode[] = [];

	switch (phase) {
		case I.ImportPhase.Scanning: {
			// The crawl has no total until the cursor chain ends: count up, never fake a bar
			parts.push(U.String.sprintf(translate('importStatFound'), U.Common.formatNumber(pagesDone)));
			break;
		};

		case I.ImportPhase.Analyzing: {
			parts.push(<Elapsed key="elapsed" since={phaseStartedAt} />);
			break;
		};

		case I.ImportPhase.Fetching: {
			parts.push(formatCount(pagesDone, totalsKnown ? pagesTotal : 0, 'Pages'));

			if (filesDone || filesTotal) {
				parts.push(formatCount(filesDone, filesTotal, 'Files'));
			};
			break;
		};

		case I.ImportPhase.Creating: {
			parts.push(formatCount(pagesDone, totalsKnown ? pagesTotal : 0, 'Objects'));
			break;
		};
	};

	if (estimatedRemainingMs > 0) {
		parts.push(U.String.sprintf(translate('importStatLeft'), U.Date.duration(Math.ceil(estimatedRemainingMs / 1000))));
	};

	return (
		<span>
			{parts.map((part, i) => (
				<React.Fragment key={i}>
					{i ? <span className="dot" /> : ''}
					<span className="part">{part}</span>
				</React.Fragment>
			))}
		</span>
	);
});

export interface ProgressItemProps {
	id: string;
	type: I.ProgressType;
	canCancel: boolean;
	isDone?: boolean;
	subtitle?: string;
	tooltip?: string;
	action?: { text: string; onClick: () => void };
	onDismiss?: (id: string) => void;
	isError: boolean;
	current?: number;
	total?: number;
	error?: string;
	statistic?: I.ImportStatistic;
	onCancel?: (id: string) => void;
};

export const ProgressItem: FC<ProgressItemProps> = memo(({ id, type, canCancel, isDone, isError, current, total, error, statistic, subtitle, tooltip, action, onCancel, onDismiss }: ProgressItemProps) => {
	const nodeRef = useRef<HTMLDivElement>(null);
	const cn = [ 'item' ];
	const iconName = getIconName(type);
	const label = statistic ? translate(`importPhase${statistic.phase}`) : translate(U.String.toCamelCase(`progress-${type}${isDone ? '-done' : ''}`));
	const warningCount = statistic?.warningCount || 0;
	const errorCount = statistic?.errorCount || 0;
	const hasIssues = Boolean(warningCount || errorCount);

	// currentItem is user content: rendered as text, never logged or sent to analytics
	const currentItem = subtitle || statistic?.currentItem || '';

	if (canCancel) {
		cn.push('canCancel');
	};

	if (isDone) {
		cn.push('isDone');
	};

	if (statistic) {
		cn.push('withStatistic');
	};

	const doCancel = () => {
		if (onCancel) {
			onCancel(id);
		} else {
			C.ProcessCancel(id);
		};
	};

	// A row that stands for several files keeps their detail behind a hover
	const handleMouseEnter = () => {
		if (tooltip) {
			Preview.tooltipShow({ text: tooltip, element: nodeRef.current });
		};
	};

	const handleMouseLeave = () => {
		if (tooltip) {
			Preview.tooltipHide(false);
		};
	};

	const handleAction = (e: React.MouseEvent) => {
		e.stopPropagation();
		action?.onClick();
	};

	const handleDismiss = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDismiss?.(id);
	};

	const handleCancel = (e: React.MouseEvent) => {
		e.stopPropagation();

		// Past the creating boundary cancelling deletes what already landed in the space,
		// so the effect is spelled out before it happens
		if (statistic && (statistic.cancelEffect == I.ImportCancelEffect.RemovesCreated)) {
			S.Popup.open('confirm', {
				data: {
					title: translate('popupConfirmImportCancelTitle'),
					text: U.String.sprintf(translate('popupConfirmImportCancelText'), U.Common.formatNumber(statistic.objectsCreated)),
					textConfirm: translate('popupConfirmImportCancelConfirm'),
					textCancel: translate('commonCancel'),
					colorConfirm: 'red',
					onConfirm: () => doCancel(),
				},
			});
			return;
		};

		doCancel();
	};

	return (
		<div ref={nodeRef} className={cn.join(' ')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
			<div className="iconWrap">
				<Icon name={iconName} className="progressType" />
			</div>

			<div className="info">
				<div className="name">{label}</div>
				<div className="status">
					{action ? <span className="action" onClick={handleAction}>{action.text}</span> : (statistic
						? <StatisticStatus statistic={statistic} />
						: <ItemStatus type={type} current={current || 0} total={total || 0} error={error} />)}
				</div>

				{currentItem ? <div className="subtitle">{currentItem}</div> : ''}

				{hasIssues ? (
					<div className="issues">
						{errorCount ? (
							<span className="part error">
								{U.String.sprintf(translate('importStatErrors'), U.Common.formatNumber(errorCount))}
							</span>
						) : ''}
						{errorCount && warningCount ? <span className="dot" /> : ''}
						{warningCount ? (
							<span className="part">{U.String.sprintf(translate('importStatWarnings'), U.Common.formatNumber(warningCount))}</span>
						) : ''}
					</div>
				) : ''}
			</div>

			<div className={[ 'spinnerWrap', (!isError && !isDone ? 'withSpinner' : '') ].join(' ')}>
				{canCancel ? <Icon name="common/clear" onClick={handleCancel} /> : ''}
				{!canCancel && onDismiss ? <Icon name="common/clear" onClick={handleDismiss} /> : ''}
			</div>
		</div>
	);
});

const SidebarProgress: FC = () => {

	const list = S.Progress.getList(it => !SKIP_STATE.includes(it.state) || isFinishedDownload(it));
	const [ isExpanded, setIsExpanded ] = useState(false);
	const prevCount = useRef(0);

	const onHeadClick = useCallback(() => {
		setIsExpanded(v => !v);
	}, []);

	useEffect(() => {
		if ((list.length > 0) && (prevCount.current === 0) && AUTO_EXPAND) {
			setIsExpanded(true);
		};

		if (!list.length) {
			setIsExpanded(false);
		};

		prevCount.current = list.length;
	}, [ list.length ]);

	if (!list.length) {
		return null;
	};

	const headerText = U.String.sprintf(translate('progressProcessing'), list.length);

	return (
		<div className={[ 'sidebarProgress', (isExpanded ? 'isExpanded' : '') ].join(' ')}>
			<div className="head" onClick={onHeadClick}>
				<Label text={headerText} />
				<Icon name="arrow/button" size={8} className="arrow" />
			</div>

			{isExpanded ? (
				<div className="items">
					{list.map(item => {
						const isError = item.state == I.ProgressState.Error;
						const isDone = isFinishedDownload(item);
						const canCancel = item.canCancel && !isError && !isDone;

						// Client-owned rows cancel through their own manager: the
						// middleware has no process behind a gateway download
						const isLocal = Boolean(item.isLocal);
						const parts = isLocal ? Download.getParts(item.id) : [];
						const action = isDone ? { text: Download.revealLabel(), onClick: () => Download.reveal(item.id) } : undefined;
						const onDismiss = isDone ? (id: string) => {
							Download.drop(id);
							S.Progress.delete(id);
						} : undefined;

						return (
							<ProgressItem
								key={item.id}
								id={item.id}
								type={item.type}
								canCancel={canCancel}
								isDone={isDone}
								isError={isError}
								current={item.current}
								total={item.total}
								error={item.error}
								statistic={item.statistic}
								subtitle={isLocal ? Download.activeName(item.id) : ''}
								tooltip={(parts.length > 1) ? Download.tooltip(item.id) : ''}
								action={action}
								onCancel={isLocal ? (id: string) => Download.cancel(id) : undefined}
								onDismiss={onDismiss}
							/>
						);
					})}
				</div>
			) : ''}
		</div>
	);

};

export default SidebarProgress;
