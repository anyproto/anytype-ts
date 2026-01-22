import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Cell, DropTarget, SelectionTarget, ObjectCover, Icon } from 'Component';
import { I, S, U, Relation, keyboard } from 'Lib';

interface Props extends I.ViewComponent {
	style?: any;
};

const GalleryCard = observer(forwardRef<I.RowRef, Props>((props, ref) => {

	const {
		rootId, block, recordId, isPopup, style, isInline, isCollection, getRecord, getView, onRefCell, onContext, getIdPrefix, getVisibleRelations, 
		getCoverObject, onEditModeClick, canCellEdit, onCellClick, onDragRecordStart,
	} = props;
	const [ isEditing, setIsEditing ] = useState(false);
	const nodeRef = useRef(null);
	const { config } = S.Common;
	const record = getRecord(recordId);
	const view = getView();
	const { cardSize, coverFit, hideIcon } = view;
	const relations = getVisibleRelations();
	const idPrefix = getIdPrefix();
	const cn = [ 'card', U.Data.layoutClass(record.id, record.layout), U.Data.cardSizeClass(cardSize) ];
	const subId = S.Record.getSubId(rootId, block.id);
	const cover = getCoverObject(recordId);
	const relationName: any = S.Record.getRelationByKey('name') || {};
	const canEdit = canCellEdit(relationName, record);
	const selection = S.Common.getRef('selectionProvider');

	if (coverFit) {
		cn.push('coverFit');
	};

	if (cover) {
		cn.push('withCover');
	};

	const resize = () => {
		const node = $(nodeRef.current);
		const last = node.find('.cellContent:not(.isEmpty)').last();

		node.find('.cellContent').removeClass('last');
		if (last.length) {
			last.addClass('last');
		};
	};

	const onDragStart = (e: any) => {
		if (keyboard.isFocused || isEditing) {
			e.preventDefault();
			return;
		};

		onDragRecordStart?.(e, record.id);
	};

	const onClick = (e: any) => {
		e.preventDefault();

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
		const relation = S.Record.getRelationByKey(vr.relationKey);
		if (!relation) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		onCellClick?.(e, relation.relationKey, record.id);
	};

	let content = (
		<div className="cardContent">
			<ObjectCover object={cover} isPopup={isPopup} />

			{canEdit && config.experimental ? (
				<Icon
					className={[ 'edit', (isEditing ? 'enabled' : '') ].join(' ')}
					onClick={e => onEditModeClick(e, recordId)}
				/>
			) : ''}

			<div className="inner">
				{relations.map((item: I.ViewRelation) => {
					const { relation } = item;
					const id = Relation.cellId(idPrefix, item.relationKey, record.id);
					const isName = relation.relationKey == 'name';
					const iconSize = isName ? 20 : 16;
					
					return (
						<Cell
							elementId={id}
							key={`list-cell-${view.id}${item.relationKey}`}
							{...props}
							getRecord={() => record}
							subId={subId}
							ref={ref => onRefCell(ref, id)}
							relationKey={item.relationKey}
							viewType={view.type}
							idPrefix={idPrefix}
							arrayLimit={2}
							tooltipParam={{ text: relation.name, typeX: I.MenuDirection.Left }}
							onClick={e => onCellClickHandler(e, relation)}
							iconSize={iconSize}
							size={iconSize}
							shortUrl={true}
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
				<DropTarget {...props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
					{content}
				</DropTarget>
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
				id={`record-${record.id}`}
				ref={nodeRef}
				className={cn.join(' ')} 
				style={style}
				draggable={!isInline}
				onClick={onClick}
				onContextMenu={(e: any) => onContext(e, record.id)}
				onDragStart={onDragStart}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
				{content}
			</motion.div>
		</AnimatePresence>
	);

}));

export default memo(GalleryCard);