import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { Cell, Cover } from 'ts/component';
import { commonStore, detailStore, dbStore } from 'ts/store';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
};

const Constant = require('json/constant.json');

const Card = observer(class Card extends React.Component<Props, {}> {

	render () {
		const { index, getView, getRecord, onCellClick, onRef, style } = this.props;
		const view = getView();
		const viewRelations = view.relations.filter((it: any) => { return it.isVisible; });
		const idPrefix = 'dataviewCell';
		const record = getRecord(index);
		const picture = this.getPicture();

		return (
			<div className="card" style={style} onClick={(e: any) => { DataUtil.objectOpenPopup(record); }}>
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
								index={index}
							/>
						);
					})}
				</div>
			</div>
		);
	};

	getPicture () {
		const { rootId, block, index, getView, getRecord } = this.props;
		const view = getView();
		const viewRelations = view.relations.filter((it: any) => { return it.isVisible; });
		const record = getRecord(index);

		let file = '';
		for (let vr of viewRelations) {
			const relation = dbStore.getRelation(rootId, block.id, vr.relationKey);
			if (!relation.isHidden && (relation.format == I.RelationType.File)) {
				file = vr.relationKey;
			};
		};

		let picture = '';
		if (file) {
			const value = DataUtil.getRelationArrayValue(record[file]);
			for (let id of value) {
				const f = detailStore.get(rootId, id, []);
				if (f && (f.type == Constant.typeId.image)) {
					picture = commonStore.imageUrl(f.id, 600);
					break;
				};
			};
		};
		return picture;
	};

});

export default Card;