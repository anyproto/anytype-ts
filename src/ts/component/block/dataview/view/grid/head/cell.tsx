import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { SortableElement } from 'react-sortable-hoc';
import { dbStore } from 'ts/store';
import { observer } from 'mobx-react';

import Handle from './handle';

interface Props extends I.ViewRelation {
	rootId: string;
	block: I.Block;
	index: number;
	onResizeStart(e: any, key: string): void;
};

const Constant = require('json/constant.json');

@observer
class HeadCell extends React.Component<Props, {}> {

	render () {
		const { rootId, block, relationKey, index, onResizeStart } = this.props;
		const relation: any = dbStore.getRelation(rootId, block.id, relationKey) || {};
		const { format, name } = relation;
		const width = DataUtil.relationWidth(this.props.width, relation.format);

		const Cell = SortableElement((item: any) => {
			return (
				<th id={DataUtil.cellId('head', relationKey, '')} className={'cellHead ' + DataUtil.relationClass(relation.format)} style={{ width: width }}>
					<div className="cellContent">
						<Handle {...relation} />
						<div className="resize" onMouseDown={(e: any) => { onResizeStart(e, relationKey); }}>
							<div className="line" />
						</div>
					</div>
				</th>
			);
		});

		return <Cell index={index} />;
	};

};

export default HeadCell;