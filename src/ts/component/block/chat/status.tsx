import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';
import { Icon } from 'Component';
import { translate, U } from 'Lib';
import Renderer from 'Lib/renderer';
import { chatStatus } from 'Lib/chatStatus';
import { ActivityItem, ChatStatusScope, LiveStatus, STATUS_TTL } from 'Lib/chatStatus/model';
import { JsonValue, jsonField, jsonMetadata, jsonStringify, jsonText } from 'Lib/chatStatus/json';
import { ChatStatus } from 'Store/chatStatus';

const label = (text: string | null) => text || translate('blockChatStatusTyping');
const fresh = (item: ActivityItem, now: number) => item.fresh && (now - item.lastSeenAt <= STATUS_TTL);
const running = (item: ActivityItem, now: number) => (item.lifecycle == 'in_progress') && fresh(item, now);
const publisher = (scope: ChatStatusScope, identity: string) => {
	const participant = U.Space.getParticipant(U.Space.getParticipantId(scope.spaceId, identity));
	return participant && !participant._empty_ ? participant.name : translate('blockChatStatusParticipant');
};

type DisclosureHandler = (scope: ChatStatusScope, kind: 'item' | 'group', id: string, expanded: boolean) => void;
const setDisclosure: DisclosureHandler = (scope, kind, id, expanded) => chatStatus.expand(scope, kind, id, expanded);

/** Keep the clicked header at its viewport position when its disclosure changes height. */
function useDisclosurePosition (expanded: boolean) {
	const button = useRef<HTMLButtonElement>(null);
	const anchor = useRef<{ container: HTMLElement; top: number }>();
	const capture = () => {
		let container = button.current?.parentElement;
		while (container && !/(auto|scroll)/.test(getComputedStyle(container).overflowY)) container = container.parentElement;
		container = container || document.scrollingElement as HTMLElement;
		if (container && button.current) anchor.current = { container, top: button.current.getBoundingClientRect().top };
	};
	useLayoutEffect(() => {
		if (anchor.current && button.current) {
			anchor.current.container.scrollTop += button.current.getBoundingClientRect().top - anchor.current.top;
			anchor.current = undefined;
		};
	}, [ expanded ]);
	return { button, capture };
}

function JsonCopy ({ value, source, children, className = '', copyLabel }: { value: JsonValue; source?: string; children: React.ReactNode; className?: string; copyLabel: string }) {
	const [ open, setOpen ] = useState(false);
	const [ feedback, setFeedback ] = useState('');
	const [ position, setPosition ] = useState({ left: 8, top: 8 });
	const button = useRef<HTMLButtonElement>(null);
	const panel = useRef<HTMLDivElement>(null);
	const hideTimer = useRef<ReturnType<typeof setTimeout>>();
	const feedbackTimer = useRef<ReturnType<typeof setTimeout>>();
	const skipFocus = useRef(false);
	const id = useId();
	const json = useMemo(() => source ?? jsonStringify(value, true), [ source, value ]);
	const show = () => { clearTimeout(hideTimer.current); setOpen(true); };
	const hide = () => { hideTimer.current = setTimeout(() => setOpen(false), 150); };
	useLayoutEffect(() => {
		if (!open) return;
		const update = () => {
			const rect = button.current?.getBoundingClientRect();
			if (!rect) return;
			const height = Math.min(panel.current?.offsetHeight || 240, window.innerHeight - 16);
			const width = Math.min(480, window.innerWidth - 16);
			setPosition({
				left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
				top: rect.bottom + height + 8 <= window.innerHeight ? rect.bottom + 6 : Math.max(8, rect.top - height - 6),
			});
		};
		const escape = (event: KeyboardEvent) => {
			if (event.key == 'Escape') {
				event.stopPropagation();
				setOpen(false);
				if (document.activeElement != button.current) {
					skipFocus.current = true;
					button.current?.focus();
				};
			};
		};
		update();
		window.addEventListener('resize', update);
		window.addEventListener('scroll', update, true);
		window.addEventListener('keydown', escape, true);
		return () => {
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update, true);
			window.removeEventListener('keydown', escape, true);
		};
	}, [ open, json ]);
	useEffect(() => () => { clearTimeout(hideTimer.current); clearTimeout(feedbackTimer.current); }, []);
	const copy = async () => {
		try {
			if (!window.isWebVersion && window.Electron?.Api) await Renderer.send('clipboardWrite', json);
			else await navigator.clipboard.writeText(json);
			setFeedback(translate('blockChatStatusCopied'));
		} catch {
			setFeedback(translate('blockChatStatusCopyFailed'));
		};
		clearTimeout(feedbackTimer.current);
		feedbackTimer.current = setTimeout(() => setFeedback(''), 2500);
	};
	return (
		<span className="chatStatusCopy">
			<button ref={button} type="button" className={className} aria-label={copyLabel} aria-describedby={open ? id : undefined}
				onClick={copy} onMouseEnter={show} onMouseLeave={hide} onFocus={() => { if (!skipFocus.current) show(); skipFocus.current = false; }}
				onBlur={event => { if (!panel.current?.contains(event.relatedTarget as Node)) hide(); }}>
				{children}
			</button>
			<span className="copyFeedback" role="status">{feedback}</span>
			{open && createPortal(
				<div ref={panel} id={id} role="tooltip" className="chatStatusInspector" style={position}
					onMouseEnter={show} onMouseLeave={hide} onFocus={show}
					onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node) && (event.relatedTarget != button.current)) hide(); }}>
					<pre tabIndex={0}>{json}</pre>
				</div>, document.body,
			)}
		</span>
	);
}

const StatusItem = observer(({ scope, item, now, onDisclosure }: { scope: ChatStatusScope; item: ActivityItem; now: number; onDisclosure: DisclosureHandler }) => {
	const id = useId();
	const disclosure = useDisclosurePosition(item.expanded);
	const metadata = useMemo(() => jsonMetadata(item.data), [ item.data ]);
	const metadataJson = useMemo(() => jsonStringify(metadata, true), [ metadata ]);
	const fields: [string, JsonValue][] = metadata.kind == 'object' ? metadata.entries : [ [ 'data', metadata ] ];
	const chips = fields.filter(([ key ]) => (item.kind != 'tool') || ![ 'tool_call_id', 'tool_name', 'status' ].includes(key));
	const result = jsonField(item.data, 'result');
	const hasResult = result !== undefined;
	const name = jsonText(jsonField(item.data, 'tool_name')) || translate('blockChatStatusTool');
	const phaseLabel = item.lifecycle ? translate({
		in_progress: 'blockChatStatusRunning', complete: 'blockChatStatusComplete', error: 'blockChatStatusError',
	}[item.lifecycle]) : '';
	const preview = (value: JsonValue) => {
		if (value.kind == 'object') return U.String.sprintf(translate('blockChatStatusObject'), value.entries.length);
		if (value.kind == 'array') return U.String.sprintf(translate('blockChatStatusArray'), value.values.length);
		return value.kind == 'string' ? value.value : jsonStringify(value);
	};
	return (
		<article className="chatStatusItem" data-call-id={item.toolCallId}>
			<button ref={disclosure.button} type="button" className="statusItemToggle" aria-expanded={item.expanded} aria-controls={id}
				onClick={() => { disclosure.capture(); onDisclosure(scope, 'item', item.id, !item.expanded); }}>
				<span className="statusChevron" aria-hidden="true">{item.expanded ? '▾' : '▸'}</span>
				<span className="statusItemLabels">
					<span className="statusText">{label(item.text)}</span>
					<span className="statusContext">{publisher(scope, item.publisherIdentity)}{item.kind == 'tool' ? ` · ${name}` : ''}</span>
				</span>
				{item.lifecycle && <span className={`statusBadge ${item.lifecycle}`}>
					<span className={running(item, now) ? 'statusSpinner' : 'statusSymbol'} aria-hidden="true">
						{item.lifecycle == 'complete' ? '✓' : item.lifecycle == 'error' ? '!' : '·'}
					</span>{phaseLabel}
				</span>}
			</button>
			{(item.lifecycle == 'in_progress') && !fresh(item, now) && <div className="statusStale">{translate('blockChatStatusStale')}</div>}
			{!!chips.length && <div className="statusChips">
				{chips.map(([ key, value ]) => <JsonCopy key={key} value={metadata} source={metadataJson} className="statusChip"
					copyLabel={U.String.sprintf(translate('blockChatStatusCopyMetadata'), key)}>{key}: {preview(value)}</JsonCopy>)}
			</div>}
			{item.expanded && <div id={id} className="statusDetails">
				<div className="statusResultHeading">
					<span>{translate('blockChatStatusResult')}</span>
					{hasResult && <JsonCopy value={result} className="statusCopyAction" copyLabel={translate('blockChatStatusCopyResult')}>
						<Icon name="menu/action/copy" size={14} />{translate('blockChatStatusCopyResult')}
					</JsonCopy>}
				</div>
				{hasResult ? <pre className="statusResult" tabIndex={0}>{jsonStringify(result, true)}</pre> : <div className="statusNoResult">{translate('blockChatStatusNoResult')}</div>}
				<div className="statusDetailFooter">
					<span>{item.toolCallId}{(item.kind == 'tool') && !item.lifecycle ? ` · ${translate('blockChatStatusUnknown')}` : ''}</span>
					<JsonCopy value={item.data} className="statusCopyAction" copyLabel={translate('blockChatStatusCopyData')}>
						<Icon name="menu/action/copy" size={14} />{translate('blockChatStatusCopyData')}
					</JsonCopy>
				</div>
			</div>}
		</article>
	);
});

export const StatusGroup = observer(({ scope, groupId, now, onDisclosure = setDisclosure }: {
	scope: ChatStatusScope; groupId: string; now: number; onDisclosure?: DisclosureHandler;
}) => {
	const view = ChatStatus.get(scope);
	const group = view.groups.get(groupId);
	const id = useId();
	const disclosure = useDisclosurePosition(!!group?.expanded);
	const previousPhases = useRef(new Map<string, string>());
	const [ announcement, setAnnouncement ] = useState('');
	const phaseSignature = (group?.itemIds || []).map(itemId => `${itemId}:${view.items.get(itemId)?.lifecycle || ''}`).join(',');
	useEffect(() => {
		const changed: string[] = [];
		(group?.itemIds || []).forEach(itemId => {
			const item = view.items.get(itemId);
			if (!item?.lifecycle) return;
			if (previousPhases.current.has(itemId) && (previousPhases.current.get(itemId) != item.lifecycle)) {
				const phase = translate({ in_progress: 'blockChatStatusRunning', complete: 'blockChatStatusComplete', error: 'blockChatStatusError' }[item.lifecycle]);
				changed.push(`${jsonText(jsonField(item.data, 'tool_name')) || translate('blockChatStatusTool')}: ${phase}`);
			};
			previousPhases.current.set(itemId, item.lifecycle);
		});
		if (changed.length) setAnnouncement(changed.join('. '));
	}, [ phaseSignature ]);
	if (!group) return null;
	const items = group.itemIds.map(itemId => view.items.get(itemId)).filter(Boolean);
	if (!items.length) return null;
	const isTools = items.every(item => item.kind == 'tool');
	const countKey = isTools ? 'blockChatStatusCalls' : 'blockChatStatusActivities';
	const count = U.String.sprintf(translate(countKey + (items.length == 1 ? 'One' : 'Many')), items.length);
	const active = items.filter(item => running(item, now)).length;
	const failed = items.filter(item => item.lifecycle == 'error').length;
	const latest = items.reduce((a, b) => a.lastSeenAt > b.lastSeenAt ? a : b);
	return (
		<section className="chatStatusGroup" data-activity-id={groupId}>
			<span className="statusAnnouncement" role="status" aria-live="polite">{announcement}</span>
			<button ref={disclosure.button} type="button" className="statusGroupToggle" aria-expanded={group.expanded} aria-controls={id}
				onClick={() => { disclosure.capture(); onDisclosure(scope, 'group', group.id, !group.expanded); }}>
				<span className="statusChevron" aria-hidden="true">{group.expanded ? '▾' : '▸'}</span>
				<span className="statusGroupSummary">
					<span className="statusCounts">{count}
						{!!active && <span>{U.String.sprintf(translate('blockChatStatusRunningCount'), active)}</span>}
						{!!failed && <span className="statusFailedCount">{U.String.sprintf(translate('blockChatStatusFailedCount'), failed)}</span>}
					</span>
					<span className="statusLatest">{label(latest.text)}</span>
				</span>
			</button>
			<div id={id} hidden={!group.expanded}>
				{group.expanded && items.map(item => <StatusItem key={item.id} scope={scope} item={item} now={now} onDisclosure={onDisclosure} />)}
			</div>
		</section>
	);
});

export function StatusFooter ({ scope, live, now }: { scope: ChatStatusScope; live: LiveStatus[]; now: number }) {
	return <>{live.filter(item => !item.itemId && (now - item.lastSeenAt <= STATUS_TTL)).map(item => (
		<div className="typingIndicator" key={item.publisherIdentity}>
			<div className="label">{publisher(scope, item.publisherIdentity)} · {label(item.text)}</div>
			<div className="dots" aria-hidden="true"><span /><span /><span /></div>
		</div>
	))}</>;
}
