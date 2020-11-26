import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { Cell } from 'ts/component';

interface Props extends I.ViewComponent {
	index: number;
};

@observer
class Row extends React.Component<Props, {}> {

	render () {
		const { index, getView, onCellClick, onRef } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		return (
			<div className="row">
				{relations.map((relation: any, i: number) => {
					const id = DataUtil.cellId('cell', relation.key, index);
					return (
						<Cell 
							key={'list-cell-' + relation.key} 
							ref={(ref: any) => { onRef(ref, id); }} 
							{...this.props}
							id={id} 
							relation={...relation} 
							viewType={I.ViewType.List}
							onClick={(e: any) => { onCellClick(e, relation.key, index); }}
							index={index}
						/>
					);
				})}
			</div>
		);
	};

};

export default Row;