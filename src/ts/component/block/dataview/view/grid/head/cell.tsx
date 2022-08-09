import * as React from 'react';
import { I, DataUtil, keyboard, Relation } from 'ts/lib';
import { SortableElement } from 'react-sortable-hoc';
import { menuStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

import Handle from './handle';

interface Props extends I.ViewComponent, I.ViewRelation {
	rootId: string;
	block?: I.Block;
	index: number;
	onResizeStart(e: any, key: string): void;
};

const Constant = require('json/constant.json');

const HeadCell = observer(class HeadCell extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onEdit = this.onEdit.bind(this);
	};

	render () {
		const { relationKey, index, onResizeStart } = this.props;
		const relation: any = dbStore.getRelationByKey(relationKey) || {};
		const { format, name } = relation;
		const width = Relation.width(this.props.width, format);
		const size = Constant.size.dataview.cell;

		const Cell = SortableElement((item: any) => {
			const cn = [ 'cellHead', DataUtil.relationClass(format) ];
			
			if (width <= size.icon) {
				cn.push('small');
			};

			return (
				<div id={Relation.cellId('head', relationKey, '')} className={cn.join(' ')} style={{ width: width }}>
					<div className="cellContent">
						<Handle {...relation} onClick={this.onEdit} />
						<div className="resize" onMouseDown={(e: any) => { onResizeStart(e, relationKey); }}>
							<div className="line" />
						</div>
					</div>
				</div>
			);
		});

		return <Cell index={index} />;
	};

	onEdit (e: any) {
		const { rootId, block, readonly, getData, getView, relationKey } = this.props;
		const relation = dbStore.getRelationByKey(relationKey);

		if (!relation || keyboard.isResizing) {
			return;
		};

		menuStore.open('dataviewRelationEdit', { 
			element: '#' + Relation.cellId('head', relationKey, ''),
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				getData: getData,
				getView: getView,
				rootId: rootId,
				blockId: block.id,
				relationId: relation.id,
				readonly: readonly,
				extendedOptions: true,
				addCommand: (rootId: string, blockId: string, relationId: string) => {
					DataUtil.dataviewRelationAdd(rootId, blockId, relationId, -1, getView());
				},
			}
		});
	};

});

export default HeadCell;