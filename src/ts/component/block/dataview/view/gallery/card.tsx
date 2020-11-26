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
		const { index, getView } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });

		return (
			<div className="card">
				{relations.map((relation: any, i: number) => (
					<Cell 
						key={'list-cell-' + relation.key} 
						{...this.props}
						id={DataUtil.cellId('cell', relation.key, index)} 
						relation={...relation} 
						viewType={I.ViewType.List}
						index={index}
					/>
				))}
			</div>
		);
	};

};

export default Card;