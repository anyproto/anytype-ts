import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { Cell, Cover } from 'ts/component';
import { commonStore, detailStore, dbStore } from 'ts/store';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const Card = observer(class Card extends React.Component<Props, {}> {

	render () {
		const { rootId, block, index, getView, getRecord, onCellClick, onRef, style } = this.props;
		const view = getView();
		const viewRelations = view.relations.filter((it: any) => { return it.isVisible; });
		const relations = dbStore.getRelations(rootId, block.id);
		const idPrefix = 'dataviewCell';
		const record = getRecord(index);
		const file = relations.find((it: any) => { 	
			return !it.isHidden && (it.format == I.RelationType.File); 
		});

		// Find any file relation with picture
		let picture = '';
		if (file) {
			const value = DataUtil.getRelationArrayValue(record[file.relationKey]);
			for (let id of value) {
				const f = detailStore.get(rootId, id, []);
				if (f && (f.type == Constant.typeId.image)) {
					picture = commonStore.imageUrl(f.id, 600);
					break;
				};
			};
		};

		return (
			<div className="card" style={style}>
				{picture ? <Cover src={picture} /> : ''}
				<div className="inner">
					{viewRelations.map((relation: any, i: number) => {
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
			</div>
		);
	};

});

export default Card;