import * as React from 'react';
import { I } from 'Lib';
import { Icon } from 'Component';
import { blockStore, dbStore } from 'Store';
import { SortableContainer } from 'react-sortable-hoc';
import { observer } from 'mobx-react';

import Cell from './cell';

interface Props extends I.ViewComponent {
	onCellAdd(e: any): void;
	onSortStart(): void;
	onSortEnd(result: any): void;
	onResizeStart(e: any, key: string): void;
}

const $ = require('jquery');

const HeadRow = observer(class HeadRow extends React.Component<Props, {}> {

	render () {
		const { rootId, block, readonly, getView, onCellAdd, onSortStart, onSortEnd, onResizeStart } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { 
			return it.isVisible && dbStore.getRelation(rootId, block.id, it.relationKey); 
		});
		const columns = relations.map(it => it.width + 'px').concat([ 'auto' ]);
		const allowed = blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Relation ]);

		// Subscriptions
		relations.forEach((it: any) => {
			const { width } = it;
		});
		
		const Row = SortableContainer((item: any) => (
			<div 
				className="rowHead" 
				style={{ gridTemplateColumns: columns.join(' ') }}
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