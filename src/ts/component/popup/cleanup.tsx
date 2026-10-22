import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Title, Label, Button, Checkbox, Icon, IconObject, ObjectName } from 'Component';
import { TreeNode } from 'Lib/util/data';
import * as I from 'Interface';

const KEYS = [ 'name', 'description', 'iconEmoji', 'iconImage', 'iconOption', 'layout', 'type', 'createdInContext' ];

interface FlatRow {
	node: TreeNode;
	depth: number;
};

const PopupCleanup = forwardRef<{}, I.Popup>((props, ref) => {

	const { param, getId, close, position } = props;
	const { data } = param;
	const objectIds: string[] = data.objectIds || [];
	const subId = [ getId(), 'data' ].join('-');
	const idsKey = objectIds.join(',');

	const [ selectedIds, setSelectedIds ] = useState<string[]>([]);
	const [ expandedIds, setExpandedIds ] = useState<string[]>([]);
	const [ dummy, setDummy ] = useState(0);
	const seenRef = useRef<Set<string>>(new Set());

	const forceUpdate = () => setDummy(i => i + 1);

	const keydownHandler = useRef<(e: any) => void>(null);
	// onConfirm closes over selectedIds, which changes after mount; the keydown
	// handler is bound once, so route Enter through a ref to the latest onConfirm.
	const onConfirmRef = useRef<() => void>(null);

	const rebind = () => {
		unbind();
		keydownHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	// Build the tree from the loaded candidate records, nested by createdInContext.
	// Orphans whose parent is the (excluded) acted-on object surface as roots.
	const allIds = S.Record.getRecordIds(subId, '');
	const forest = U.Data.treeFromRecords(allIds, id => S.Detail.get(subId, id, [ 'createdInContext' ]).createdInContext);
	const visibleIds = forest.flatMap(n => U.Data.flattenIds(n));
	const isAllSelected = (visibleIds.length > 0) && visibleIds.every(id => selectedIds.includes(id));

	const onKeyDown = (e: any) => {
		keyboard.shortcut('enter', e, () => {
			e.stopPropagation();
			onConfirmRef.current?.();
		});
	};

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

	const onConfirm = () => {
		if (!selectedIds.length) {
			return;
		};

		// skipCascade=true: pure archive of exactly the chosen ids — the whole transitive
		// subtree was already offered here, so no second round of orphan detection.
		Action.archive(selectedIds, analytics.route.archive, null, true);
		close();
	};

	onConfirmRef.current = onConfirm;

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
		const object = S.Detail.get(subId, node.id, KEYS);
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

		return (
			<div key={node.id} className={cn.join(' ')}>
				<Checkbox value={isChecked} onChange={onCheck} />

				<div className="info" style={{ paddingLeft: depth * 20 }}>
					<div className="iconWrap">
						<IconObject object={object} size={20} />
						{canExpand ? (
							<Icon
								name="arrow/selectBig"
								className={arrowCn.join(' ')}
								onClick={() => toggleExpand(node.id)}
							/>
						) : ''}
					</div>

					<ObjectName object={object} />

					{canExpand ? (
						<span className="stackBadge">{translate('binStackCount').replace('%d', String(childCount))}</span>
					) : ''}
				</div>
			</div>
		);
	};

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	useEffect(() => {
		return () => {
			U.Subscription.destroyList([ subId ]);
		};
	}, []);

	useEffect(() => {
		U.Subscription.subscribeIds({
			subId,
			ids: objectIds,
			keys: KEYS,
			noDeps: true,
		}, () => {
			// Default-select candidates as their records load — only ids that actually
			// resolved, so the user never archives something not shown in the tree (and
			// newly merged ids from a second message get selected once loaded too).
			const loaded = S.Record.getRecordIds(subId, '');
			const fresh = loaded.filter(id => !seenRef.current.has(id));

			if (fresh.length) {
				fresh.forEach(id => seenRef.current.add(id));
				setSelectedIds(prev => U.Common.arrayUnique([ ...prev, ...fresh ]));
			};

			forceUpdate();
			position();
		});
	}, [ idsKey ]);

	// The tree height changes on expand/collapse and after data loads — recenter.
	useEffect(() => position(), [ expandedIds, dummy ]);

	const rows = flattenVisible(forest, 0, []);
	const cnConfirm = [];
	if (!selectedIds.length) {
		cnConfirm.push('disabled');
	};

	return (
		<>
			<div className="textWrapper">
				<Title text={translate('popupCleanupTitle')} />
				<Label text={translate('popupCleanupText')} />
			</div>

			<div className="items">
				{visibleIds.length ? (
					<div className="head">
						<Checkbox value={isAllSelected} onChange={onSelectAll} />
						<Label text={translate(isAllSelected ? 'commonDeselectAll' : 'commonSelectAll')} onClick={onSelectAll} />
					</div>
				) : ''}

				<div className="list">
					{rows.map(renderRow)}
				</div>
			</div>

			<div className="buttons">
				<Button text={translate('commonMoveToBin')} color="red" className={cnConfirm.join(' ')} size={36} onClick={onConfirm} />
				<Button text={translate('commonCancel')} color="blank" size={36} onClick={() => close()} />
			</div>
		</>
	);

});

export default PopupCleanup;
