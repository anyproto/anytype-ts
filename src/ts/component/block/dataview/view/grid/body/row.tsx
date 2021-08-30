import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { dbStore } from 'ts/store';

import Cell from './cell';

interface Props extends I.ViewComponent {
	index: number;
	readonly: boolean;
	style?: any;
	cellPosition?: (cellId: string) => void;
	getRecord(index: number): any;
	onRef?(ref: any, id: string): void;
	onCellClick?(e: any, key: string, index: number): void;
}

const BodyRow = observer(class BodyRow extends React.Component<Props, {}> {

	render () {
		const { rootId, block, index, getView, getRecord, style } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { 
			return it.isVisible && dbStore.getRelation(rootId, block.id, it.relationKey); 
		});
		const record = getRecord(index);
		const cn = [ 'row' ];

		if ((record.layout == I.ObjectLayout.Task) && record.done) {
			cn.push('isDone');
		};
		
		return (
			<div id={'row-' + index} className={cn.join(' ')} style={style}>
				{relations.map((relation: any, i: number) => (
					<Cell 
						key={'grid-cell-' + relation.relationKey} 
						{...this.props} 
						width={relation.width}
						index={index} 
						relationKey={relation.relationKey} 
					/>
				))}
				<div className="cell last" />
			</div>
		);
	};

});

export default BodyRow;