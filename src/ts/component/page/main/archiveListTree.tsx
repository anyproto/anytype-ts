import React, { useState, useEffect, MouseEvent } from 'react';
import { IconObject, ObjectName, Checkbox, Icon } from 'Component';
import { TreeNode } from 'Lib/util/data';
import * as I from 'Interface';

interface Props {
	subId: string;
	canWrite: boolean;
	isShared: boolean;
	selectedIds: string[];
	filterText: string;
	sortId: string;
	sortType: I.SortType;
	onSelectChange: (ids: string[], e: MouseEvent) => void;
	onSelectAll: () => void;
	onSort: (id: string, type: I.SortType) => void;
	isAllSelected: boolean;
}

const ArchiveListTree = ({ subId, canWrite, isShared, selectedIds, filterText, sortId, sortType, onSelectChange, onSelectAll, onSort, isAllSelected }: Props) => {

	const [ expandedIds, setExpandedIds ] = useState<string[]>([]);
	const { dateFormat } = S.Common;

	useEffect(() => {
		U.Subscription.subscribe({
			subId,
			spaceId: S.Common.space,
			keys: [ 'name', 'iconEmoji', 'iconImage', 'iconOption', 'layout', 'type', 'lastModifiedDate', 'creator', 'createdInContext' ],
			filters: [ { relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true } ],
			sorts: [ { relationKey: 'lastModifiedDate', type: I.SortType.Desc } ],
			limit: J.Constant.limit.listObject,
			ignoreArchived: false,
		});

		return () => {
			U.Subscription.destroyList([ subId ]);
		};
	}, []);

	// cellCheck is not a grid column — it overlaps the row via absolute positioning (archive.scss)
	const widths = [ 'minmax(0, 1fr)', '20%' ];
	if (isShared) {
		widths.push('20%');
	};
	const css: React.CSSProperties = { display: 'grid', gridTemplateColumns: widths.join(' ') };

	const allIds = S.Record.getRecordIds(subId, '');
	const forest = U.Data.treeFromRecords(allIds, id => S.Detail.get(subId, id, [ 'createdInContext' ]).createdInContext);

	const matchesFilter = (node: TreeNode, text: string): boolean => {
		if (!text) {
			return true;
		};
		const obj = S.Detail.get(subId, node.id, [ 'name' ]);
		if ((obj.name || '').toLowerCase().includes(text.toLowerCase())) {
			return true;
		};
		return node.children.some(c => matchesFilter(c, text));
	};

	const handleSort = (key: string) => {
		if (sortId === key) {
			onSort(key, sortType === I.SortType.Asc ? I.SortType.Desc : I.SortType.Asc);
		} else {
			onSort(key, I.SortType.Asc);
		};
	};

	const getSortValue = (id: string, key: string): any => {
		const obj = S.Detail.get(subId, id, [ key ]);
		const v = obj[key];

		if (key === 'creator') {
			const creatorObj = S.Detail.get(subId, v, [ 'name' ]);
			return (creatorObj.name || '').toLowerCase();
		};
		if (key === 'name') {
			return (v || '').toLowerCase();
		};
		return v || 0;
	};

	// Sorting applies to root nodes only. Children retain their natural order
	// (parent-context grouping) regardless of the selected sort column — intentional.
	const visibleRoots = forest
		.filter(n => matchesFilter(n, filterText))
		.sort((a, b) => {
			const va = getSortValue(a.id, sortId);
			const vb = getSortValue(b.id, sortId);
			let cmp = 0;
			if (va < vb) cmp = -1;
			else
			if (va > vb) cmp = 1;
			return sortType === I.SortType.Asc ? cmp : -cmp;
		});

	const columns = [
		{ key: 'name', label: translate('commonName') },
		{ key: 'lastModifiedDate', label: translate('commonDeleted') },
		...(isShared ? [ { key: 'creator', label: translate('commonCreatedBy') } ] : []),
	];

	const isExpanded = (id: string) => expandedIds.includes(id);

	const toggleExpand = (id: string) => {
		setExpandedIds(prev =>
			prev.includes(id) ? prev.filter(x => x !== id) : [ ...prev, id ]
		);
	};

	const renderRow = (node: TreeNode, depth: number): React.ReactNode => {
		const obj = S.Detail.get(subId, node.id, [
			'name', 'iconEmoji', 'iconImage', 'iconOption', 'layout', 'type',
			'lastModifiedDate', 'creator',
		]);
		const subtreeIds = U.Data.flattenIds(node);
		const childCount = subtreeIds.length - 1;
		const isChecked = subtreeIds.every(id => selectedIds.includes(id));
		const expanded = isExpanded(node.id);
		const deleted = obj.lastModifiedDate ? U.Date.dateWithFormat(dateFormat, obj.lastModifiedDate) : '';
		const creatorObj = isShared ? S.Detail.get(subId, obj.creator, []) : null;
		const canExpand = childCount > 0;

		const cn = [ 'row' ];
		if (depth > 0) {
			cn.push('isChild');
		};

		const handleRowClick = () => {
			if (canExpand) {
				toggleExpand(node.id);
			};
		};

		const handleOpen = (e: MouseEvent) => {
			e.stopPropagation();
			U.Object.openEvent(e, obj);
		};

		const handleCheck = (e: MouseEvent) => {
			e.stopPropagation();
			onSelectChange(subtreeIds, e);
		};

		const arrowCn = [ 'expandArrow' ];
		if (expanded) {
			arrowCn.push('isExpanded');
		};

		const nameIndent = depth > 0 ? { paddingLeft: `${depth * 14}px` } : undefined;

		return (
			<React.Fragment key={node.id}>
				<div className={cn.join(' ')} style={css} onClick={handleRowClick}>
					{canWrite && (
						<div className={[ 'cell', 'cellCheck', (isChecked ? 'isChecked' : '') ].join(' ')}>
							<Checkbox value={isChecked} onChange={handleCheck} />
						</div>
					)}

					<div className="cell">
						<div className="cellContent isName">
							<div className="flex" style={nameIndent}>
								<IconObject object={obj} onClick={handleOpen} />
								<span onClick={handleOpen} onAuxClick={handleOpen}><ObjectName object={obj} /></span>
								{canExpand && (
									<span className="stackBadge">{translate('binStackCount').replace('%d', String(childCount))}</span>
								)}
								{canExpand && (
									<Icon name="arrow/select" className={arrowCn.join(' ')} />
								)}
							</div>
						</div>
					</div>

					<div className="cell c-lastModifiedDate">
						<div className="cellContent">{deleted}</div>
					</div>

					{isShared && (
						<div className="cell c-creator">
							{(creatorObj && !creatorObj._empty_) && (
								<div className="cellContent">
									<div className="flex">
										<IconObject object={creatorObj} size={18} />
										<ObjectName object={creatorObj} />
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{canExpand && expanded && node.children.map(child => renderRow(child, depth + 1))}
			</React.Fragment>
		);
	};

	return (
		<div className="listObject archiveTree">
			<div className="table">
				<div className="row isHead" style={css}>
					{canWrite && (
						<div className={[ 'cell', 'cellCheck', (isAllSelected ? 'isChecked' : '') ].join(' ')}>
							<Checkbox value={isAllSelected} onChange={() => onSelectAll()} />
						</div>
					)}
					{columns.map(col => {
						const isSorted = sortId === col.key;
						const cn = [ 'cell', 'isHead', ...(isSorted ? [ 'isSorted' ] : []) ];
						const arrow = isSorted ? <Icon name="common/sortArrow" className={`sortArrow c${sortType}`} /> : null;
						return (
							<div key={col.key} className={cn.join(' ')} onClick={() => handleSort(col.key)}>
								<div className="name">{col.label}{arrow}</div>
							</div>
						);
					})}
				</div>

				{!visibleRoots.length ? (
					<div className="row" style={css}><div className="cell empty">{translate('pageMainArchiveEmpty')}</div></div>
				) : (
					visibleRoots.map(node => renderRow(node, 0))
				)}
			</div>
		</div>
	);

};

export default ArchiveListTree;
