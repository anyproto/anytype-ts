import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { Cell } from 'ts/component';

interface Props extends I.ViewComponent {
	index: number;
};

@observer
class Card extends React.Component<Props, {}> {

	render () {
		const { index, getView, onCellClick, onRef } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		return (
			<div className="card">
				{relations.map((relation: any, i: number) => {
					const id = DataUtil.cellId('cell', relation.key, index);
					return (
						<Cell 
							key={'list-cell-' + view.id + relation.key} 
							{...this.props}
							ref={(ref: any) => { onRef(ref, id); }} 
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

export default Card;