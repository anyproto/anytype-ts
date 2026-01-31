import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { observer } from 'mobx-react';
import { I, S, U, Relation, keyboard } from 'Lib';
import { Cell, SelectionTarget, ObjectCover, Icon } from 'Component';

interface Props extends I.ViewComponent {
	id: string;
	groupId: string;
	onDragStartCard?: (e: any, groupId: any, record: any) => void;
};

const BoardCard = observer(forwardRef<I.RowRef, Props>((props, ref) => {

	const {
		rootId, block, groupId, id, isPopup, isInline, getView, onContext, onRefCell, getIdPrefix, getVisibleRelations, getCoverObject, onEditModeClick, canCellEdit,
		onDragStartCard, onCellClick,
	} = props;
	const nodeRef = useRef(null);
	const [ isEditing, setIsEditing ] = useState(false);
	const { config } = S.Common;
	const view = getView();
	const { coverFit, hideIcon } = view;
	const relations = getVisibleRelations();
	const idPrefix = getIdPrefix();
	const subId = S.Record.getGroupSubId(rootId, block.id, groupId);
	const record = S.Detail.get(subId, id, relations.map(it => it.relationKey));
	const cn = [ 'card', U.Data.layoutClass(record.id, record.layout) ];
	const { done } = record;
	const cover = getCoverObject(id);
	const relationName: any = S.Record.getRelationByKey('name') || {};
	const canEdit = canCellEdit(relationName, record);

	if (coverFit) {
		cn.push('coverFit');
	};

	if (cover) {
		cn.push('withCover');
	};

	const onClick = (e: any) => {
		e.preventDefault();

		const selection = S.Common.getRef('selectionProvider');
		const subId = S.Record.getGroupSubId(rootId, block.id, groupId);
		const record = S.Detail.get(subId, id);
		const cb = {
			0: () => U.Object.openConfig(e, record),
			1: () => U.Object.openConfig(e, record),
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
		const subId = S.Record.getGroupSubId(rootId, block.id, groupId);
		const record = S.Detail.get(subId, id);
		const relation = S.Record.getRelationByKey(vr.relationKey);

		if (!relation) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		onCellClick?.(e, relation.relationKey, record.id, record);
	};

	const onDragStartCardHandler = (e: any) => {
		if (keyboard.isFocused || isEditing) {
			e.preventDefault();
			return;
		};

		const subId = S.Record.getGroupSubId(rootId, block.id, groupId);
		const relations = getVisibleRelations();
		const record = S.Detail.get(subId, id, relations.map(it => it.relationKey));

		onDragStartCard?.(e, groupId, record);
	};

	const resize = () => {
		const node = $(nodeRef.current);
		const last = node.find('.cellContent:not(.isEmpty)').last();

		node.find('.cellContent').removeClass('last');
		if (last.length) {
			last.addClass('last');
		};
	};

	let content = (
		<div className="cardContent">
			<ObjectCover object={cover} isPopup={isPopup} />

			<div className="inner">
				{relations.map((relation: any, i: number) => {
					const id = Relation.cellId(idPrefix, relation.relationKey, record.id);
					const isName = relation.relationKey == 'name';
					const iconSize = relation.relationKey == 'name' ? 20 : 16;

					return (
						<Cell
							elementId={id}
							key={`board-cell-${view.id + relation.relationKey}`}
							{...props}
							getRecord={() => record}
							recordId={record.id}
							groupId={groupId}
							subId={subId}
							ref={ref => onRefCell(ref, Relation.cellId(idPrefix, relation.relationKey, record.id))}
							relationKey={relation.relationKey}
							viewType={view.type}
							idPrefix={idPrefix}
							arrayLimit={2}
							tooltipParam={{ text: relation.name, typeX: I.MenuDirection.Left }}
							onClick={e => onCellClickHandler(e, relation)}
							iconSize={iconSize}
							size={iconSize}
							withName={true}
							noInplace={!isName}
							editModeOn={isEditing}
						/>
					);
				})}
			</div>
		</div>
	);

	if (!isInline) {
		content = (
			<SelectionTarget id={record.id} type={I.SelectType.Record}>
				{content}
			</SelectionTarget>
		);
	};

	useEffect(() => {
		resize();
	});

	useImperativeHandle(ref, () => ({
		setIsEditing,
	}));

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				ref={nodeRef} 
				id={`record-${record.id}`}
				className={cn.join(' ')} 
				draggable={true}
				onDragStart={onDragStartCardHandler}
				onClick={e => onClick(e)}
				onContextMenu={e => onContext(e, record.id, subId)}
				{...U.Common.dataProps({ id: record.id })}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
				{canEdit && config.experimental ? (
					<Icon
						className={[ 'edit', isEditing ? 'enabled' : '' ].join(' ')}
						onClick={e => onEditModeClick(e, record.id)}
					/>
				) : ''}

				{content}
			</motion.div>
		</AnimatePresence>
	);

}));

export default BoardCard;