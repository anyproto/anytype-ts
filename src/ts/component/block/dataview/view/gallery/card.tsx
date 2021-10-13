import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { Cell, Cover, Icon } from 'ts/component';
import * as ReactDOM from 'react-dom';
import { commonStore, detailStore, dbStore } from 'ts/store';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const Card = observer(class Card extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	render () {
		const { rootId, block, index, getView, getRecord, onRef, style } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { 
			return it.isVisible && dbStore.getRelation(rootId, block.id, it.relationKey); 
		});
		const idPrefix = 'dataviewCell';
		const record = getRecord(index);
		const cn = [ 'card', DataUtil.layoutClass(record.id, record.layout), DataUtil.cardSizeClass(view.cardSize) ];
		//const readonly = this.props.readonly || record.isReadonly;
		const readonly = true;

		if (view.coverFit) {
			cn.push('coverFit');
		};

		let BlankCover = (item: any) => (
			<div className={[ 'cover', 'type0', (!readonly ? 'canEdit' : '') ].join(' ')}>
				<div className="inner">
					{!readonly ? (
						<div className="add">
							<Icon className="plus" />
							Add picture
						</div>
					) : ''}
				</div>
			</div>
		);

		let cover = null;
		if (view.coverRelationKey) {
			if (view.coverRelationKey == 'pageCover') {
				const { coverType, coverId, coverX, coverY, coverScale } = record;
				if (coverId && coverType) {
					cover = <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={false} />;
				} else {
					cover = <BlankCover />;
				};
			} else {
				const src = this.getPicture();
				if (src) {
					cover = <Cover type={I.CoverType.Upload} src={src} />;
				} else {
					cover = <BlankCover />;
				};
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
								arrayLimit={2}
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
		this._isMounted = true;

		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const last = node.find('.cellContent:not(.isEmpty)').last();

		node.find('.cellContent').removeClass('last');
		if (last.length) {
			last.addClass('last');
		};
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