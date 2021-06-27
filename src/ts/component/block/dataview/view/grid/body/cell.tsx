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
	width: number;
	getRecord(index: number): any;
	onRef?(ref: any, id: string): void;
	onCellClick?(e: any, key: string, index: number): void;
	onCellChange?(id: string, key: string, value: any, callBack?: (message: any) => void): void;
};

const Constant = require('json/constant.json');

@observer
class BodyCell extends React.Component<Props, {}> {

	render () {
		const { rootId, block, relationKey, index, readOnly, onRef, onCellClick, onCellChange } = this.props;
		const relation: any = dbStore.getRelation(rootId, block.id, relationKey) || {};
		const cn = [ 'cell', DataUtil.relationClass(relation.format), (!readOnly ? 'canEdit' : '') ];
		const idPrefix = 'dataviewCell';
		const id = DataUtil.cellId(idPrefix, relation.relationKey, index);
		const width = DataUtil.relationWidth(this.props.width, relation.format);
		const size = Constant.size.dataview.cell;

		if (relation.relationKey == Constant.relationKey.name) {
			cn.push('isName');
		};

		if (width <= size.icon) {
			cn.push('small');
		};

		return (
			<div key={id} id={id} className={cn.join(' ')} onClick={(e: any) => { onCellClick(e, relation.relationKey, index); }} style={{ width: width }}>
				<Cell 
					ref={(ref: any) => { onRef(ref, id); }} 
					{...this.props}
					relationKey={relation.relationKey}
					viewType={I.ViewType.Grid}
					idPrefix={idPrefix}
					onCellChange={onCellChange}
				/>
			</div>
		);
	};

};

export default BodyCell;