import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { SortableElement } from 'react-sortable-hoc';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

import Handle from './handle';

interface Props extends I.ViewComponent, I.ViewRelation {
	rootId: string;
	block: I.Block;
	index: number;
	onResizeStart(e: any, key: string): void;
};

const Constant = require('json/constant.json');

@observer
class HeadCell extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onEdit = this.onEdit.bind(this);
	};

	render () {
		const { rootId, block, relationKey, index, onResizeStart } = this.props;
		const relation: any = dbStore.getRelation(rootId, block.id, relationKey) || {};
		const { format, name } = relation;
		const width = DataUtil.relationWidth(this.props.width, relation.format);

		const Cell = SortableElement((item: any) => {
			return (
				<th id={DataUtil.cellId('head', relationKey, '')} className={'cellHead ' + DataUtil.relationClass(relation.format)} style={{ width: width }} onClick={this.onEdit}>
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

	onEdit (e: any) {
		const { rootId, block, readOnly, getData, getView, relationKey } = this.props;
		const relation: any = dbStore.getRelation(rootId, block.id, relationKey) || {};

		if (readOnly || relation.isReadOnly) {
			return;
		};

		commonStore.menuOpen('dataviewRelationEdit', { 
			type: I.MenuType.Vertical,
			element: '#' + DataUtil.cellId('head', relationKey, ''),
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: {
				getData: getData,
				getView: getView,
				rootId: rootId,
				blockId: block.id,
				relationKey: relationKey,
				updateCommand: (rootId: string, blockId: string, relation: any) => {
					DataUtil.dataviewRelationUpdate(rootId, blockId, relation, getView());
				},
			}
		});
	};

};

export default HeadCell;