import * as React from 'react';
import { SortableContainer } from 'react-sortable-hoc';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { I } from 'Lib';
import { Icon } from 'Component';
import { blockStore } from 'Store';
import Cell from './cell';

interface Props extends I.ViewComponent {
	onCellAdd(e: any): void;
	onSortStart(): void;
	onSortEnd(result: any): void;
	onResizeStart(e: any, key: string): void;
	getColumnWidths?: (relationId: string, width: number) => any;
};


const HeadRow = observer(class HeadRow extends React.Component<Props, object> {

	render () {
		const { rootId, block, readonly, getView, onCellAdd, onSortStart, onSortEnd, onResizeStart, getColumnWidths } = this.props;
		const view = getView();
		const widths = getColumnWidths('', 0);
		const relations = view.getVisibleRelations();
		const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');
		const allowed = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Relation ]);

		const Row = SortableContainer((item: any) => (
			<div 
				className="rowHead"
				style={{ gridTemplateColumns: str }}
			>
				{relations.map((relation: any, i: number) => (
					<Cell 
						key={'grid-head-' + relation.relationKey} 
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
				helperContainer={() => { return $(`#block-${block.id} .wrap`).get(0); }}
			/>
		);
	};

});

export default HeadRow;