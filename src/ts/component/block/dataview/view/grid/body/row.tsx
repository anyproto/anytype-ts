import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

import Cell from './cell';

interface Props extends I.ViewComponent {
	index: number;
	readOnly: boolean;
	getRecord(index: number): any;
	onRowOver(index: number): void;
	onRef?(ref: any, id: string): void;
	onCellClick?(e: any, key: string, index: number): void;
};

@observer
class BodyRow extends React.Component<Props, {}> {

	render () {
		const { index, getView, onRowOver, getRecord } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const record = getRecord(index);
		const cn = [ 'row' ];

		if ((record.layout == I.ObjectLayout.Task) && record.done) {
			cn.push('isDone');
		};
		
		return (
			<tr id={'row-' + index} onMouseOver={(e: any) => { onRowOver(index); }} className={cn.join(' ')}>
				{relations.map((relation: any, i: number) => (
					<Cell 
						key={'grid-cell-' + relation.relationKey} 
						{...this.props} 
						index={index} 
						relationKey={relation.relationKey} 
					/>
				))}
				<td className="cell last">&nbsp;</td>
			</tr>
		);
	};

};

export default BodyRow;