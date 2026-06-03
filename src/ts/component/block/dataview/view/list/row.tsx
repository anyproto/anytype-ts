import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cell, DropTarget, Icon, IconObject, SelectionTarget } from 'Component';
import * as I from 'Interface';

interface Props extends I.ViewComponent {
	style?: any;
};

const ListRow = forwardRef<I.RowRef, Props>((props, ref) => {

	const {
		rootId, block, recordId, style, getRecord, getView, onRefCell, onContext, getIdPrefix, isInline, isCollection,
		onDragRecordStart, onSelectToggle, onEditModeClick, canCellEdit, onCellClick,
	} = props;
	const [ isEditing, setIsEditing ] = useState(false);
	const nodeRef = useRef(null);
	const view = getView();

	const resize = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const cells = U.Dom.selectAll('.cellContent', node);
		const first = U.Dom.select('.cellContent:not(.isEmpty)', node);

		cells.forEach(el => U.Dom.removeClass(el, 'first'));
		if (first) {
			U.Dom.addClass(first, 'first');
		};
	};

	useEffect(() => resize());

	useImperativeHandle(ref, () => ({
		setIsEditing,
	}));

	if (!view) {
		return null;
	};

	const idPrefix = getIdPrefix();
	const subId = S.Record.getSubId(rootId, block.id);
	const record = getRecord(recordId);
	const cn = [ 'row' ];
	const relations = view.getVisibleRelations();
	const nameIndex = relations.findIndex(it => it.relationKey == 'name');
	const isRegular = view.listSize == I.ListSize.Regular;
	const selection = S.Common.getRef('selectionProvider');

	const left = [];
	const right = [];

	relations.forEach((el, idx) => {
		if (isRegular) {
			if (el.relationKey == 'name') {
				left.push(el);
			} else
			if (el.relationKey != 'description') {
				right.push(el);
			};
		} else {
			if (idx <= nameIndex) {
				left.push(el);
			} else {
				right.push(el);
			};
		};
	});

	// Subscriptions
	const { hideIcon } = view;
	const { done } = record;

	if (U.Object.isTaskLayout(record.layout) && done) {
		cn.push('isDone');
	};

	if (isEditing) {
		cn.push('editModeOn');
	};

	const onClick = (e: any) => {
		e.preventDefault();

		const cb = {
			0: () => U.Object.openConfig(e, record),
			1: () => U.Object.openConfig(e, record),
			2: () => onContext(e, record.id)
		};

		const ids = selection?.get(I.SelectType.Record) || [];
		if (((e.ctrlKey || e.metaKey) && (ids.length > 1)) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	const onCellClickHandler = (e: MouseEvent, vr: I.ViewRelation) => {
		const relation = S.Record.getRelationByKey(vr.relationKey);

		if (!relation) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		onCellClick(e, relation.relationKey, record.id);
	};

	// In Regular mode, override getView to always hide the icon inside the name Cell
	// since we render it separately at the row level
	const getViewForCell = isRegular
		? () => ({ ...view, hideIcon: true })
		: getView;

	const mapper = (vr: any, i: number) => {
		const relation = S.Record.getRelationByKey(vr.relationKey);
		const id = Relation.cellId(idPrefix, relation.relationKey, record.id);
		const isName = relation.relationKey == 'name';
		const ccn = ['cellWrapper'];
		const iconSize = relation.relationKey == 'name' ? 20 : 16;
		const canEdit = canCellEdit(relation, record);

		if (isName) {
			ccn.push('isName');
		} else {
			if (!Relation.checkRelationValue(relation, record[relation.relationKey])) {
				ccn.push('isEmpty');
			};
		};

		return (
			<div
				className={ccn.join(' ')}
				key={`list-cell-${relation.relationKey}`}
			>
				<Cell
					elementId={id}
					ref={ref => onRefCell(ref, id)}
					{...props}
					getRecord={() => record}
					getView={getViewForCell}
					subId={subId}
					relationKey={relation.relationKey}
					viewType={view.type}
					idPrefix={idPrefix}
					onClick={e => onCellClickHandler(e, relation)}
					isInline={true}
					tooltipParam={{ text: relation.name, typeX: I.MenuDirection.Left, offsetX: 14 }}
					arrayLimit={2}
					iconSize={iconSize}
					size={iconSize}
					withName={true}
					noInplace={!isName}
					editModeOn={isEditing}
				/>

				{isName && canEdit ? (
					<Icon
						name="common/edit"
						className={[ 'edit', (isEditing ? 'enabled' : '') ].join(' ')}
						onClick={e => onEditModeClick(e, recordId)}
					/>
				) : ''}
			</div>
		);
	};

	const lw = 50 + left.length * 5;

	let content = null;

	if (isRegular) {
		let rowIcon = null;

		if (!hideIcon) {
			rowIcon = (
				<IconObject
					id={`list-icon-${record.id}`}
					object={record}
					size={32}
					canEdit={!props.readonly && U.Object.isTaskLayout(record.layout)}
					noClick={true}
				/>
			);
		};

		content = (
			<div className="regularContent">
				{rowIcon}
				<div className="sides">
					<div className="line first">
						<div className="side left">
							{left.map(mapper)}
						</div>
						<div className="side right">
							{right.map(mapper)}
						</div>
					</div>
					{record.description ? (
						<div className="line second">
							<div className="description">{record.description}</div>
						</div>
					) : ''}
				</div>
			</div>
		);
	} else {
		content = (
			<div className="sides">
				<div
					className={[ 'side', 'left', (left.length > 1 ? 's60' : '') ].join(' ')}
					style={{ width: `${lw}%` }}
				>
					{left.map(mapper)}
				</div>
				<div className="side right">
					{right.map(mapper)}
				</div>
			</div>
		);
	};

	if (!isInline) {
		content = (
			<>
				<Icon
					name="control/dataview/dnd"
					className="drag"
					width={7}
					height={12}
					draggable={true}
					onClick={e => onSelectToggle(e, record.id)}
					onDragStart={e => onDragRecordStart(e, record.id)}
					onMouseEnter={() => keyboard.setSelectionClearDisabled(true)}
					onMouseLeave={() => keyboard.setSelectionClearDisabled(false)}
				/>
				<DropTarget {...props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
					<SelectionTarget id={record.id} type={I.SelectType.Record}>
						{content}
					</SelectionTarget>
				</DropTarget>
			</>
		);
	};

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				id={`record-${record.id}`}
				ref={nodeRef} 
				className={cn.join(' ')}
				style={style}
				onClick={e => onClick(e)}
				onContextMenu={e => onContext(e, record.id)}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
				{content}
			</motion.div>
		</AnimatePresence>
	);

});

export default ListRow;