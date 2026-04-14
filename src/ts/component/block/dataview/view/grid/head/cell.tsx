import React, { forwardRef, MouseEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon, ObjectName } from 'Component';
import * as I from 'Interface';

interface Props extends I.ViewComponent, I.ViewRelation {
	rootId: string;
	block?: I.Block;
	index: number;
	onResizeStart(e: any, key: string): void;
};

const HeadCell = forwardRef<{}, Props>((props, ref) => {

	const { rootId, block, relationKey, onResizeStart, getView, readonly } = props;
	const allowed = !readonly && S.Block.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
	const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: relationKey, disabled: !allowed });
	const relation = S.Record.getRelationByKey(relationKey);

	if (!relation) {
		return null;
	};

	if (transform) {
		transform.scaleX = 1;
		transform.scaleY = 1;
	};

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};
	
	const onMouseDown = () => {
		const blockEl = U.Dom.get(`block-${block.id}`);
		U.Dom.selectAll('.cell.isEditing', blockEl).forEach(el => U.Dom.removeClass(el, 'isEditing'));
		S.Menu.closeAll();
	};

	const onMouseEnter = () => {
		if (!keyboard.isDragging && !keyboard.isResizing) {
			const blockEl = U.Dom.get(`block-${block.id}`);
			U.Dom.selectAll(`.cell-key-${U.Common.esc(relationKey)}`, blockEl).forEach(el => U.Dom.addClass(el, 'cellKeyHover'));
		};
	};

	const onMouseLeave = () => {
		if (!keyboard.isDragging && !keyboard.isResizing) {
			const blockEl = U.Dom.get(`block-${block.id}`);
			U.Dom.selectAll('.cellKeyHover', blockEl).forEach(el => U.Dom.removeClass(el, 'cellKeyHover'));
		};
	};

	const onEdit = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const relation = S.Record.getRelationByKey(relationKey);

		if (!relation || keyboard.isResizing) {
			return;
		};

		const blockEl =	`#block-${U.Common.esc(block.id)}`;
		const blockNode = U.Dom.get(`block-${block.id}`);
		const rowHead = U.Dom.select('#rowHead', blockNode);
		const isFixed = U.Dom.hasClass(rowHead, 'fixed');
		const headEl = isFixed ? `#rowHeadClone` : `#rowHead`;
		const cellId = U.Common.esc(Relation.cellId('head', relationKey, ''));
		const element = `${blockEl} ${headEl} #${cellId}`;
		const obj = U.Dom.select(`${headEl} #${cellId}`, blockNode);
		const object = S.Detail.get(rootId, rootId);
		const isType = U.Object.isTypeLayout(object.layout);
		const view = getView();

		let unlinkCommand = null;
		if (isType) {
			unlinkCommand = (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
				U.Object.typeRelationUnlink(object.id, relation.id, onChange);
			};
		};

		window.setTimeout(() => {
			S.Menu.open('dataviewRelationEdit', {
				element,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				onOpen: () => U.Dom.addClass(obj, 'active'),
				onClose: () => U.Dom.removeClass(obj, 'active'),
				className: isFixed ? 'fixed' : '',
				classNameWrap: 'fromBlock',
				subIds: J.Menu.relationEdit,
				data: {
					...props,
					blockId: block.id,
					relationId: relation.id,
					extendedOptions: true,
					unlinkCommand,
					addCommand: (rootId: string, blockId: string, relation: any) => {
						Dataview.addTypeOrDataviewRelation(rootId, blockId, relation, object, view, relation._index_);
					},
				}
			});
		}, S.Menu.getTimeout());
	};

	const view = getView();
	const viewRelation = view?.getRelation(relationKey);
	const cn = [ 'cellHead', `cell-key-${relationKey}`, Relation.className(relation?.format), `align${viewRelation?.align}` ];

	if (allowed) {
		cn.push('canDrag');
	};

	return (
		<div 
			id={Relation.cellId('head', relationKey, '')} 
			className={cn.join(' ')}
			onClick={onEdit}
			onContextMenu={onEdit}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			ref={setNodeRef}
			style={style}
		>
			<div className="cellContent">
				<div 
					className="flex" 
					onMouseDown={onMouseDown} 
					{...attributes}
					{...listeners}
				>
					<Icon name={Relation.registryName(relation.relationKey, relation.format)} />
					<ObjectName object={relation} />
				</div>

				{allowed ? (
					<div 
						className="resize"
						onMouseDown={e => onResizeStart(e, relationKey)} 
					/>
				) : ''}
			</div>
		</div>
	);

});

export default HeadCell;