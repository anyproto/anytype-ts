import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToHorizontalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { I, S } from 'Lib';
import { Icon } from 'Component';
import Cell from './cell';

interface Props extends I.ViewComponent {
	onCellAdd(e: any): void;
	onSortStart(): void;
	onSortEnd(result: any): void;
	onResizeStart(e: any, key: string): void;
	getColumnWidths?: (relationId: string, width: number) => any;
};

const HeadRow = observer(forwardRef<{}, Props>((props, ref) => {

	const { rootId, block, readonly, onCellAdd, onSortStart, onSortEnd, onResizeStart, getColumnWidths, getVisibleRelations } = props;
	const widths = getColumnWidths('', 0);
	const relations = getVisibleRelations();
	const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');
	const allowed = S.Block.checkFlags(rootId, block.id, [ I.RestrictionDataview.Relation ]);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={onSortStart}
			onDragEnd={onSortEnd}
			modifiers={[ restrictToHorizontalAxis, restrictToFirstScrollableAncestor ]}
		>
			<SortableContext
				items={relations.map(it => it.relationKey)}
				strategy={horizontalListSortingStrategy}
			>
				<div 
					id="rowHead"
					className="rowHead"
					style={{ gridTemplateColumns: str }}
				>
					{relations.map((relation: any, i: number) => (
						<Cell 
							key={`grid-head-${relation.relationKey}`} 
							{...props}
							{...relation}
							index={i} 
							onResizeStart={onResizeStart} 
						/>
					))}

					<div className="cellHead last">
						{!readonly && allowed ? <Icon id="cell-add" className="plus" onClick={onCellAdd} /> : ''}
					</div>
				</div>
			</SortableContext>
		</DndContext>
	);

}));

export default HeadRow;