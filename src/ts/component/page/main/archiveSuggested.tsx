import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle, MouseEvent } from 'react';
import { Icon, IconObject, ObjectName, Checkbox, Label } from 'Component';
import { TreeNode } from 'Lib/util/data';
import * as I from 'Interface';

// Per-level indent step, matching the Bin tree's nesting (archiveListTree).
const INDENT = 14;

// Mirrors the Bin table: .cellCheck is absolutely positioned in the -36px gutter, so it
// never occupies a grid track. Group rows omit it entirely and are therefore uncheckable.
const cssRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' };

// 'creator' backs the same shared-space rule the Bin enforces: only moderators, or the
// object's creator, may delete permanently. Passing any keys replaces the RPC's default
// set, so it has to be listed explicitly.
const KEYS = [ 'name', 'type', 'iconEmoji', 'iconImage', 'iconOption', 'fileExt', 'fileMimeType', 'creator' ];
const CONTEXT_KEYS = [ 'id', 'name', 'type', 'iconEmoji', 'iconImage', 'iconOption' ];

// A badge decorates the source object, so it may only state something true *of that
// object*: archived means it really is in the Bin. Unlinked says nothing about the
// object — it is alive and unchanged — so that reason is carried by the prefix instead,
// and deleted is conveyed by the ghost icon plus its stand-in name.
// Reuses the link block's "In Bin" label so the two surfaces stay in step.
const BADGE_BY_REASON: Record<number, string> = {
	[I.CleanupReason.ContextArchived]: 'blockLinkArchived',
};

interface Props {
	canWrite: boolean;
	// Whether the Suggestions tab is selected. The component stays mounted on either tab
	// so it can keep the count current (via onCountChange); it only renders its body when
	// active.
	isActive: boolean;
	onCountChange: (count: number) => void;
	// Selection lives here, but the action toolbar lives in the page header, so report
	// enough for the header to render and enable/disable its buttons.
	onSelectionChange: (count: number, canDelete: boolean) => void;
};

export interface ArchiveSuggestedRef {
	onDelete: () => void;
	onIgnore: () => void;
};

interface FlatRow {
	node: TreeNode;
	depth: number;
};

// One group per source object the orphans were created in. Only roots carry a
// context outside the orphan set (and a meaningful reason), so only roots group.
interface Group {
	contextId: string;
	reason: I.CleanupReason;
	roots: TreeNode[];
};

const ArchiveSuggested = forwardRef<ArchiveSuggestedRef, Props>(({ canWrite, isActive, onCountChange, onSelectionChange }, ref) => {

	const [ items, setItems ] = useState<I.CleanupSuggestion[]>([]);
	const [ contextMap, setContextMap ] = useState<Map<string, any>>(new Map());
	const [ selectedIds, setSelectedIds ] = useState<string[]>([]);
	const [ expandedIds, setExpandedIds ] = useState<string[]>([]);
	const space = S.Common.space;
	const requestRef = useRef(0);
	const contextRequestRef = useRef(0);
	const isShared = U.Space.getSpaceview().isShared;
	const canModerate = U.Space.canMyParticipantModerate();
	const participantId = U.Space.getCurrentParticipantId();

	// What is orphaned depends on what sits in the Bin, so track the archive
	// subscription: restore, delete, undo and remote sync all move through it.
	const archiveKey = S.Record.getRecordIds(J.Constant.subId.archive, '').join(',');

	const load = () => {
		const request = ++requestRef.current;

		C.ObjectCleanupSuggestions(space, KEYS, (message: any) => {
			// Reloads can overlap (e.g. archive + subscription update); ignore stale replies.
			if (message.error.code || (request != requestRef.current)) {
				return;
			};

			const list: I.CleanupSuggestion[] = message.items || [];
			const ids = new Set<string>(list.map(it => it.details.id));

			// Authoritative count for the space: drives the Bin widget flag and the tab badge.
			S.Common.hasCleanupSuggestionsSet(!!list.length);
			onCountChange(list.length);
			setItems(list);

			// Keep ticks and expanded rows that survived the refresh; drop what's gone.
			setSelectedIds(prev => prev.filter(it => ids.has(it)));
			setExpandedIds(prev => prev.filter(it => ids.has(it)));
		});
	};

	useEffect(() => {
		// Read-only participants can't act on suggestions, so don't surface the tab for them.
		if (!canWrite) {
			onCountChange(0);
			return;
		};

		load();
	}, [ space, archiveKey, canWrite ]);

	const detailsMap = new Map<string, any>(items.map(it => [ it.details.id, it.details ]));
	const reasonMap = new Map<string, I.CleanupReason>(items.map(it => [ it.details.id, it.reason ]));
	const ids = items.map(it => it.details.id);

	// Same forest the backend describes: join createdInContext to the parent's id.
	const forest = U.Data.treeFromRecords(ids, id => detailsMap.get(id)?.createdInContext);
	const visibleIds = forest.flatMap(n => U.Data.flattenIds(n));
	const isAllSelected = (visibleIds.length > 0) && visibleIds.every(id => selectedIds.includes(id));

	// Group roots by the object they were created in. Roots sharing a context share
	// its reason, so the first root's reason describes the whole group.
	const groups: Group[] = [];
	const groupMap = new Map<string, Group>();

	for (const node of forest) {
		const contextId = String(detailsMap.get(node.id)?.createdInContext || '');
		const reason = reasonMap.get(node.id) ?? I.CleanupReason.None;

		let group = groupMap.get(contextId);
		if (!group) {
			group = { contextId, reason, roots: [] };
			groupMap.set(contextId, group);
			groups.push(group);
		};

		group.roots.push(node);
	};

	// Source objects sit outside the orphan set, so their details aren't in the response.
	// Archived ones are in the Bin, but unlinked ones are still live objects and never
	// appear there — so resolve every context in one search rather than per source.
	// ignoreArchived=false is required or archived sources come back empty; deleted ones
	// are simply not returned and fall back to the placeholder header.
	const contextIds = groups.map(it => it.contextId).filter(it => it);
	const contextKey = contextIds.join(',');

	useEffect(() => {
		// Resolve source objects even while on the Bin tab: it rides along with the count
		// load, so switching to Suggestions shows real headers immediately rather than
		// flashing the "Deleted object" placeholder until this returns.
		if (!contextIds.length) {
			setContextMap(new Map());
			return;
		};

		const request = ++contextRequestRef.current;

		U.Subscription.search({
			filters: [ { relationKey: 'id', condition: I.FilterCondition.In, value: contextIds } ],
			keys: CONTEXT_KEYS,
			ignoreArchived: false,
			ignoreHidden: false,
			limit: contextIds.length,
		}, (message: any) => {
			if (message.error?.code || (request != contextRequestRef.current)) {
				return;
			};

			setContextMap(new Map((message.records || []).map(it => [ it.id, it ])));
		});
	}, [ contextKey ]);

	const toggleExpand = (id: string) => {
		setExpandedIds(prev => prev.includes(id) ? prev.filter(it => it != id) : [ ...prev, id ]);
	};

	const onSelect = (ids: string[]) => {
		setSelectedIds(prev => {
			const allPresent = ids.every(id => prev.includes(id));
			if (allPresent) {
				return prev.filter(id => !ids.includes(id));
			};
			return U.Common.arrayUnique([ ...prev, ...ids ]);
		});
	};

	const onSelectAll = () => {
		setSelectedIds(isAllSelected ? [] : visibleIds);
	};

	// Same rule as the Bin: in a shared space, a non-moderator may only permanently
	// delete objects they created. Action.delete only checks write permission, so the
	// creator check has to live here.
	const canDeleteSelection = (): boolean => {
		if (canModerate || !isShared) {
			return true;
		};

		return selectedIds.every(id => detailsMap.get(id)?.creator === participantId);
	};

	const onDelete = () => {
		if (!selectedIds.length || !canDeleteSelection()) {
			return;
		};

		// The user is already in the Bin, so offer the terminal action rather than
		// "Move to Bin", reusing the Bin's own confirmation popup. Deleted orphans never
		// enter the archive subscription, so the archiveKey watcher won't fire — the
		// reload has to be explicit, and Action.delete now runs it once the delete lands.
		Action.delete(selectedIds, analytics.route.archive, () => load());
	};

	const onIgnore = () => {
		if (!selectedIds.length) {
			return;
		};

		// Ignoring an object drops its descendants from the list too, so reload rather
		// than pruning locally. Reversible via ignored=false.
		C.ObjectCleanupSuggestionIgnore(selectedIds, true, (message: any) => {
			if (!message.error.code) {
				load();
			};
		});
	};

	// The header toolbar drives the actions and reflects the selection.
	useImperativeHandle(ref, () => ({ onDelete, onIgnore }));

	useEffect(() => {
		onSelectionChange(selectedIds.length, canDeleteSelection());
	}, [ selectedIds, items ]);

	// Same open affordance as the Bin table: icon and name open the object.
	const onOpen = (e: MouseEvent, object: any) => {
		e.stopPropagation();
		U.Object.openEvent(e, object);
	};

	const flattenVisible = (nodes: TreeNode[], depth: number, acc: FlatRow[]): FlatRow[] => {
		for (const node of nodes) {
			acc.push({ node, depth });
			if (node.children.length && expandedIds.includes(node.id)) {
				flattenVisible(node.children, depth + 1, acc);
			};
		};
		return acc;
	};

	const renderRow = (row: FlatRow) => {
		const { node, depth } = row;
		const object = detailsMap.get(node.id) || {};
		const subtreeIds = U.Data.flattenIds(node);
		const childCount = subtreeIds.length - 1;
		const isChecked = subtreeIds.every(id => selectedIds.includes(id));
		const isExpanded = expandedIds.includes(node.id);
		const canExpand = childCount > 0;

		const cn = [ 'row' ];
		if (depth > 0) {
			cn.push('isChild');
		};
		if (canExpand) {
			cn.push('canExpand');
		};
		if (isExpanded) {
			cn.push('isExpanded');
		};

		const arrowCn = [ 'expandArrow' ];
		if (isExpanded) {
			arrowCn.push('isExpanded');
		};

		const onCheck = () => {
			onSelect(subtreeIds);

			if (canExpand && !isChecked && !isExpanded) {
				toggleExpand(node.id);
			};
		};

		const checkCn = [ 'cell', 'cellCheck' ];
		if (isChecked) {
			checkCn.push('isChecked');
		};

		return (
			<div key={node.id} className={cn.join(' ')} style={cssRow}>
				<div className={checkCn.join(' ')}>
					<Checkbox value={isChecked} onChange={onCheck} />
				</div>

				<div className="cell">
					<div className="cellContent isName">
						{/* Roots sit one level in, under their source-object header; deeper nodes
							step by the same amount the Bin tree uses for nesting. */}
						<div className="flex" style={{ paddingLeft: `${(depth + 1) * INDENT}px` }}>
							<div className="iconWrap">
								<IconObject object={object} size={20} onClick={e => onOpen(e, object)} />
								{canExpand ? (
									<Icon
										name="arrow/selectBig"
										className={arrowCn.join(' ')}
										onClick={() => toggleExpand(node.id)}
									/>
								) : ''}
							</div>

							<span onClick={e => onOpen(e, object)} onAuxClick={e => onOpen(e, object)}>
								<ObjectName object={object} />
							</span>

							{canExpand ? (
								<span className="stackBadge">{translate('binStackCount').replace('%d', String(childCount))}</span>
							) : ''}
						</div>
					</div>
				</div>
			</div>
		);
	};

	// The source object heads its group and is never selectable — it is not a
	// candidate, it is the reason the candidates below it are orphaned. It therefore
	// renders as a row without a .cellCheck, which is what stops us reusing the Bin table.
	const renderGroupHead = (group: Group) => {
		const object = contextMap.get(group.contextId);
		const isMissing = (group.reason == I.CleanupReason.ContextDeleted) || !object || object._empty_;
		const badge = isMissing ? '' : BADGE_BY_REASON[group.reason];

		// "Link removed from X" only makes sense while X is still there to point at.
		const isUnlinked = !isMissing && (group.reason == I.CleanupReason.ContextUnlinked);
		const prefix = isUnlinked ? 'binCleanupLinkRemovedFrom' : 'binCleanupCreatedIn';

		return (
			<div className="row isGroup" style={cssRow}>
				<div className="cell">
					<div className="cellContent isName">
						<div className="flex">
							<span className="prefix">{translate(prefix)}</span>

							{isMissing ? (
								<>
									{/* IconObject renders the ghost icon off isDeleted; there is no
										object left to resolve, so a stub carries the flag. */}
									<IconObject object={{ id: group.contextId, isDeleted: true }} size={20} />
									<span className="name isMissing">{translate('binCleanupContextDeleted')}</span>
								</>
							) : (
								<>
									<IconObject object={object} size={20} onClick={e => onOpen(e, object)} />
									<span onClick={e => onOpen(e, object)} onAuxClick={e => onOpen(e, object)}>
										<ObjectName object={object} />
									</span>
									{badge ? <span className="stackBadge">{translate(badge)}</span> : ''}
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	};

	if (!canWrite || !isActive || !visibleIds.length) {
		return null;
	};

	const titleCheckCn = [ 'cell', 'cellCheck' ];
	if (isAllSelected) {
		titleCheckCn.push('isChecked');
	};

	return (
		<div className="listObject archiveTree archiveSuggested">
			<div className="table">
				<div className="row isTitle" style={cssRow}>
					<div className={titleCheckCn.join(' ')}>
						<Checkbox value={isAllSelected} onChange={onSelectAll} />
					</div>

					<div className="cell">
						<Label text={translate(isAllSelected ? 'commonDeselectAll' : 'commonSelectAll')} onClick={onSelectAll} />
					</div>
				</div>

				{groups.map(group => (
					<React.Fragment key={group.contextId || 'none'}>
						{renderGroupHead(group)}
						{flattenVisible(group.roots, 0, []).map(renderRow)}
					</React.Fragment>
				))}
			</div>
		</div>
	);

});

export default ArchiveSuggested;
