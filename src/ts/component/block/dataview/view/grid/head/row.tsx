import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { SortableContainer } from 'react-sortable-hoc';
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

const HeadRow = observer(class HeadRow extends React.Component<Props> {

	render () {
		const { rootId, block, readonly, onCellAdd, onSortStart, onSortEnd, onResizeStart, getColumnWidths, getVisibleRelations } = this.props;
		const widths = getColumnWidths('', 0);
		const relations = getVisibleRelations();
		const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');
		const allowed = S.Block.checkFlags(rootId, block.id, [ I.RestrictionDataview.Relation ]);

		const Row = SortableContainer((item: any) => (
			<div 
				id="rowHead"
				className="rowHead"
				style={{ gridTemplateColumns: str }}
			>
				{relations.map((relation: any, i: number) => (
					<Cell 
						key={`grid-head-${relation.relationKey}`} 
						{...this.props}
						{...relation}
						index={i} 
						onResizeStart={onResizeStart} 
					/>
				))}
				<div className="cellHead last">
					{!readonly && allowed ? <Icon id="cell-add" className="plus" onClick={onCellAdd} /> : ''}
				</div>
			</div>
		));

		return (
			<Row 
				axis="x" 
				lockAxis="x"
				lockToContainerEdges={true}
				transitionDuration={150}
				distance={10}
				useDragHandle={true}
				onSortStart={onSortStart}
				onSortEnd={onSortEnd}
				helperClass="isDragging"
				helperContainer={() => $(`#block-${block.id} .wrap`).get(0)}
			/>
		);
	};

});

export default HeadRow;