import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { Cell, Cover } from 'ts/component';
import * as ReactDOM from 'react-dom';
import { commonStore, detailStore, dbStore } from 'ts/store';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const Card = observer(class Card extends React.Component<Props, {}> {

	render () {
		const { rootId, block, index, getView, getRecord, onRef, style } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { 
			return it.isVisible && dbStore.getRelation(rootId, block.id, it.relationKey); 
		});
		const idPrefix = 'dataviewCell';
		const record = getRecord(index);
		const cn = [ 'card', DataUtil.layoutClass(record.id, record.layout) ];

		let cover = null;
		if (view.coverRelationKey) {
			if (view.coverRelationKey == 'pageCover') {
				const { coverType, coverId, coverX, coverY, coverScale } = record;
				cover = <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} />
			} else {
				cover = <Cover src={this.getPicture()} />;
			};
		};

		return (
			<div className={cn.join(' ')} style={style} onClick={(e: any) => { DataUtil.objectOpenPopup(record); }}>
				{cover}
				<div className="inner">
					{relations.map((relation: any, i: number) => {
						const id = DataUtil.cellId(idPrefix, relation.relationKey, index);
						return (
							<Cell 
								elementId={id}
								key={'list-cell-' + view.id + relation.relationKey} 
								{...this.props}
								ref={(ref: any) => { onRef(ref, id); }} 
								relationKey={relation.relationKey}
								viewType={view.type}
								idPrefix={idPrefix}
								index={index}
								arrayLimit={1}
								showTooltip={true}
								tooltipX={I.MenuDirection.Left}
							/>
						);
					})}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	resize () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.cellContent.isEmpty').remove();
	};

	getPicture () {
		const { rootId, index, getView, getRecord } = this.props;
		const view = getView();

		let picture = '';
		if (view.coverRelationKey) {
			const record = getRecord(index);
			const value = DataUtil.getRelationArrayValue(record[view.coverRelationKey]);
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