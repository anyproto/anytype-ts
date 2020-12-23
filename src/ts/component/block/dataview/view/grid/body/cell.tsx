import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { Cell } from 'ts/component';
import { dbStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	block: I.Block;
	relationKey: string;
	index: number;
	readOnly: boolean;
	getRecord(index: number): any;
	onRef?(ref: any, id: string): void;
	onCellClick?(e: any, key: string, index: number): void;
	onCellChange?(id: string, key: string, value: any): void;
};

@observer
class BodyCell extends React.Component<Props, {}> {

	render () {
		const { rootId, block, relationKey, index, readOnly, onRef, onCellClick, onCellChange } = this.props;
		const relation = dbStore.getRelation(rootId, block.id, relationKey);
		const cn = [ 'cell', 'c-' + DataUtil.relationClass(relation.format), (!readOnly ? 'canEdit' : '') ];
		const idPrefix = 'dataviewCell';
		const id = DataUtil.cellId(idPrefix, relation.relationKey, index);

		return (
			<td id={id} className={cn.join(' ')} onClick={(e: any) => { onCellClick(e, relation.relationKey, index); }}>
				<Cell 
					ref={(ref: any) => { onRef(ref, id); }} 
					{...this.props}
					relationKey={relation.relationKey}
					viewType={I.ViewType.Grid}
					idPrefix={idPrefix}
					onCellChange={onCellChange}
				/>
			</td>
		);
	};

};

export default BodyCell;