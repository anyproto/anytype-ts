import React, { forwardRef, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { I, S, J, U, keyboard, Relation, Dataview } from 'Lib';
import { IconObject, ObjectName } from 'Component';

interface Props extends I.ViewComponent, I.ViewRelation {
	rootId: string;
	block?: I.Block;
	index: number;
	onResizeStart(e: any, key: string): void;
};

const HeadCell = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, block, relationKey, onResizeStart, getView, readonly } = props;
	const allowed = !readonly && S.Block.checkFlags(rootId, block.id, [ I.RestrictionDataview.View ]);
	const { attributes, listeners, transform, transition, setNodeRef } = useSortable({ id: relationKey, disabled: !allowed });
	const relation = S.Record.getRelationByKey(relationKey);

	if (transform) {
		transform.scaleX = 1;
		transform.scaleY = 1;
	};

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};
	
	const onMouseDown = () => {
		$('.cell.isEditing').removeClass('isEditing');
		S.Menu.closeAll();
	};

	const onMouseEnter = () => {
		if (!keyboard.isDragging && !keyboard.isResizing) {
			$(`#block-${block.id} .cell-key-${relationKey}`).addClass('cellKeyHover');
		};
	};

	const onMouseLeave = () => {
		if (!keyboard.isDragging && !keyboard.isResizing) {
			$('.cellKeyHover').removeClass('cellKeyHover');
		};
	};

	const onEdit = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const relation = S.Record.getRelationByKey(relationKey);

		if (!relation || keyboard.isResizing) {
			return;
		};

		const blockEl =	`#block-${block.id}`;
		const rowHead = $(`${blockEl} #rowHead`);
		const isFixed = rowHead.hasClass('fixed');
		const headEl = isFixed ? `#rowHeadClone` : `#rowHead`;
		const element = `${blockEl} ${headEl} #${Relation.cellId('head', relationKey, '')}`;
		const obj = $(element);
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
				onOpen: () => obj.addClass('active'),
				onClose: () => obj.removeClass('active'),
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
					<IconObject object={relation} tooltipParam={{ text: relation.name }} />
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

}));

export default HeadCell;