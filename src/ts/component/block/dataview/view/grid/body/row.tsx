import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore } from 'ts/store';

import Cell from './cell';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
	cellPosition?: (cellId: string) => void;
	onRef?(ref: any, id: string): void;
};

const BodyRow = observer(class BodyRow extends React.Component<Props, {}> {

	render () {
		const { rootId, block, index, getView, getRecord, style, onContext } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { 
			return it.isVisible && dbStore.getRelation(rootId, block.id, it.relationKey); 
		});
		const record = getRecord(index);
		const cn = [ 'row' ];

		if ((record.layout == I.ObjectLayout.Task) && record.done) {
			cn.push('isDone');
		};
		if (record.isArchived) {
			cn.push('isArchived');
		};
		if (record.isDeleted) {
			cn.push('isDeleted');
		};
		
		return (
			<div 
				id={'row-' + index} 
				className={cn.join(' ')} 
				style={style} 
				onContextMenu={(e: any) => { onContext(e, record.id); }}
			>
				<div 
					id={'selectable-' + record.id} 
					className="selectable"
					data-id={record.id}
					data-type={I.SelectType.Record}
				>
					{relations.map((relation: any, i: number) => (
						<Cell 
							key={'grid-cell-' + relation.relationKey + record.id} 
							{...this.props}
							width={relation.width}
							index={index} 
							relationKey={relation.relationKey} 
						/>
					))}
					<div className="cell last" />
				</div>
			</div>
		);
	};

});

export default BodyRow;