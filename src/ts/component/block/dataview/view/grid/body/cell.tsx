import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { Cell } from 'ts/component';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	block: I.Block;
	relation: I.ViewRelation;
	index: number;
	readOnly: boolean;
	getRecord(index: number): any;
	onRef(ref: any, id: string): void;
	onCellClick(e: any, key: string, index: number): void;
	onCellChange?(id: string, key: string, value: any): void;
};

@observer
class BodyCell extends React.Component<Props, {}> {

	render () {
		const { relation, index, readOnly, onRef, onCellClick, onCellChange } = this.props;
		const cn = [ 'cell', 'c-' + DataUtil.relationClass(relation.format), (!readOnly ? 'canEdit' : '') ];
		const id = DataUtil.cellId('cell', relation.key, index);

		return (
			<td id={id} className={cn.join(' ')} onClick={(e: any) => { onCellClick(e, relation.key, index); }}>
				<Cell 
					ref={(ref: any) => { onRef(ref, id); }} 
					{...this.props}
					id={id} 
					viewType={I.ViewType.Grid}
					onCellChange={onCellChange}
				/>
			</td>
		);
	};

};

export default BodyCell;