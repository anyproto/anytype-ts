import * as React from 'react';
import { I, M } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';
import { SortableElement } from 'react-sortable-hoc';

import Cell from './cell';

interface Props extends I.BlockComponentTable {};

const BlockTableRow = observer(class BlockTableRow extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
	};

	render () {
		const { rootId, block, index, isHead, getData } = this.props;
		const { columns } = getData();
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const children = blockStore.getChildren(rootId, block.id);
		const length = childrenIds.length;

		const CellSortableElement = SortableElement((item: any) => {
			return <Cell {...this.props} {...item} />;
		});

		return (
			<div id={`block-${block.id}`} className="row">
				{columns.map((column: any, i: number) => {
					const props: any = {
						block: children[i],
						index: i,
						rowIdx: index,
						columnIdx: i,
						rootId,
					};

					if (!props.block) {
						return null;
					};

					if (isHead) {
						return <CellSortableElement key={i} {...props} isHead={true} />;
					} else {
						return <Cell key={i} {...this.props} {...props} isHead={false} />;
					};
				})}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

});

export default BlockTableRow;