import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { Cell } from 'ts/component';
import { dbStore } from 'ts/store';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
}

const Row = observer(class Row extends React.Component<Props, {}> {

	render () {
		const { rootId, block, index, getView, onCellClick, onRef, style } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { 
			return it.isVisible && dbStore.getRelation(rootId, block.id, it.relationKey); 
		});
		const idPrefix = 'dataviewCell';

		return (
			<div className="row" style={style}>
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
							isInline={true}
						/>
					);
				})}
			</div>
		);
	};

});

export default Row;