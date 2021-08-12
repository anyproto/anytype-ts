import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { Cell } from 'ts/component';

interface Props extends I.ViewComponent {
	index: number;
}

const Row = observer(class Row extends React.Component<Props, {}> {

	render () {
		const { index, getView, onCellClick, onRef } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const idPrefix = 'dataviewCell';

		return (
			<div className="row">
				{relations.map((relation: any, i: number) => {
					const id = DataUtil.cellId(idPrefix, relation.relationKey, index);
					return (
						<Cell 
							key={'list-cell-' + relation.relationKey} 
							ref={(ref: any) => { onRef(ref, id); }} 
							{...this.props}
							relationKey={relation.relationKey}
							viewType={I.ViewType.List}
							idPrefix={idPrefix}
							onClick={(e: any) => { onCellClick(e, relation.relationKey, index); }}
							index={index}
						/>
					);
				})}
			</div>
		);
	};

});

export default Row;