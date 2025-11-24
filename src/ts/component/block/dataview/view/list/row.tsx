import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, U, keyboard, Relation } from 'Lib';
import { Cell, DropTarget, Icon, SelectionTarget } from 'Component';

interface Props extends I.ViewComponent {
	style?: any;
};

const ListRow = observer(forwardRef<I.RowRef, Props>((props, ref) => {

	const {
		rootId, block, recordId, style, getRecord, getView, onRefCell, onContext, getIdPrefix, isInline, isCollection,
		onDragRecordStart, onSelectToggle, onEditModeClick, canCellEdit, onCellClick,
	} = props;
	const [ isEditing, setIsEditing ] = useState(false);
	const nodeRef = useRef(null);
	const view = getView();
	const idPrefix = getIdPrefix();
	const subId = S.Record.getSubId(rootId, block.id);
	const record = getRecord(recordId);
	const cn = [ 'row' ];
	const relations = view.getVisibleRelations();
	const nameIndex = relations.findIndex(it => it.relationKey == 'name');
	const selection = S.Common.getRef('selectionProvider');

	const left = [];
	const right = [];

	relations.forEach((el, idx) => {
		if (idx <= nameIndex) {
			left.push(el);
		} else {
			right.push(el);
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
			0: () => {
				keyboard.withCommand(e) ? U.Object.openEvent(e, record) : U.Object.openConfig(record); 
			},
			2: () => onContext(e, record.id)
		};

		const ids = selection?.get(I.SelectType.Record) || [];
		if ((keyboard.withCommand(e) && ids.length) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	const onCellClickHandler = (e: React.MouseEvent, vr: I.ViewRelation) => {
		const relation = S.Record.getRelationByKey(vr.relationKey);

		if (!relation) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		onCellClick(e, relation.relationKey, record.id);
	};

	const resize = () => {
		const node = $(nodeRef.current);
		const first = node.find('.cellContent:not(.isEmpty)').first();

		node.find('.cellContent').removeClass('first');
		if (first.length) {
			first.addClass('first');
		};
	};

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
				key={'list-cell-' + relation.relationKey}
			>
				<Cell
					elementId={id}
					ref={ref => onRefCell(ref, id)}
					{...props}
					getRecord={() => record}
					subId={subId}
					relationKey={relation.relationKey}
					viewType={I.ViewType.List}
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
						className={[ 'editMode', (isEditing ? 'enabled' : '') ].join(' ')}
						onClick={e => onEditModeClick(e, recordId)}
					/>
				) : ''}
			</div>
		);
	};

	let content = (
		<div className="sides">
			<div
				style={{ width: `${50 + left.length * 10}%` }}
				className={[ 'side', 'left', (left.length > 1 ? 's60' : '') ].join(' ')}
			>
				{left.map(mapper)}
			</div>
			<div className="side right">
				{right.map(mapper)}
			</div>
		</div>
	);

	if (!isInline) {
		content = (
			<>
				<Icon
					className="drag"
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

	useEffect(() => resize());

	useImperativeHandle(ref, () => ({
		setIsEditing,
	}));

	return (
		<div 
			id={`record-${record.id}`}
			ref={nodeRef} 
			className={cn.join(' ')} 
			style={style}
			onClick={e => onClick(e)}
			onContextMenu={e => onContext(e, record.id)}
		>
			{content}
		</div>
	);

}));

export default ListRow;