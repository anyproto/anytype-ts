import * as React from 'react';
import { I, DataUtil, Relation } from 'ts/lib';
import { dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	columnId: number;
	index: number;
	idx: number;
	onDragStart?: (e: any, columnId: any, record: any) => void;
};

const Card = observer(class Card extends React.Component<Props, {}> {

	render () {
		const { rootId, block, columnId, idx, index, getView, getRecord, onCellClick, onRef, onDragStart } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const idPrefix = 'dataviewCell';
		const subId = dbStore.getSubId(rootId, block.id);
		const record = getRecord(index);
		const cn = [ 'card', DataUtil.layoutClass(record.id, record.layout) ];

		return (
			<div 
				className={cn.join(' ')} 
				draggable={true}
				onDragStart={(e: any) => { onDragStart(e, columnId, record); }}
			>
				{relations.map((relation: any, i: number) => {
					const id = Relation.cellId(idPrefix, relation.relationKey, index);
					return (
						<Cell 
							key={'board-cell-' + view.id + relation.relationKey} 
							{...this.props}
							subId={subId}
							ref={(ref: any) => { onRef(ref, id); }} 
							relationKey={relation.relationKey}
							index={index}
							viewType={view.type}
							idPrefix={idPrefix}
							arrayLimit={2}
							onClick={(e: any) => { onCellClick(e, relation.relationKey, index); }}
							showTooltip={true}
							tooltipX={I.MenuDirection.Left}
						/>
					);
				})}
			</div>
		);
	};

});

export default Card;