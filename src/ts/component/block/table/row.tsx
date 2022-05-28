import * as React from 'react';
import { I } from 'ts/lib';
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
		const children = blockStore.getChildren(rootId, block.id);

		const CellSortableElement = SortableElement((item: any) => {
			return (
				<Cell 
					rootId={rootId}
					{...this.props}
					{...item}
					isHead={true}
				/>
			);
		});

		return (
			<div id={`block-${block.id}`} className="row">
				{columns.map((column: any, i: number) => {
					if (isHead) {
						return (
							<CellSortableElement 
								key={i} 
								block={children[i]} 
								index={i} 
								rowIdx={index} 
								columnIdx={i} 
							/>
						);
					} else {
						return (
							<Cell 
								key={i}
								{...this.props}
								rootId={rootId}
								block={children[i]} 
								rowIdx={index} 
								columnIdx={i} 
								isHead={false}
							/>
						);
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