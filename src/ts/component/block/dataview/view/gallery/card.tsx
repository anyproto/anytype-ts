import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { Cell } from 'ts/component';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
};

const Card = observer(class Card extends React.Component<Props, {}> {

	render () {
		const { index, getView, onCellClick, onRef, style } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const idPrefix = 'dataviewCell';

		return (
			<div className="card" style={style}>
				{relations.map((relation: any, i: number) => {
					const id = DataUtil.cellId(idPrefix, relation.relationKey, index);
					return (
						<Cell 
							key={'list-cell-' + view.id + relation.relationKey} 
							{...this.props}
							ref={(ref: any) => { onRef(ref, id); }} 
							relationKey={relation.relationKey}
							viewType={view.type}
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

export default Card;