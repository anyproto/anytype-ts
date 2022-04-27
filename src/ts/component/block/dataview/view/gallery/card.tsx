import * as React from 'react';
import { I, DataUtil, Relation } from 'ts/lib';
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
		const { rootId, block, index, getView, getRecord, onRef, style, onContext } = this.props;
		const view = getView();
		const { cardSize, coverFit, hideIcon } = view;
		const relations = view.relations.filter((it: any) => { 
			return it.isVisible && dbStore.getRelation(rootId, block.id, it.relationKey); 
		});
		const idPrefix = 'dataviewCell';
		const record = getRecord(index);
		const cn = [ 'card', DataUtil.layoutClass(record.id, record.layout), DataUtil.cardSizeClass(cardSize) ];
		//const readonly = this.props.readonly || record.isReadonly;
		const readonly = true;
		const subId = dbStore.getSubId(rootId, block.id);

		if (coverFit) {
			cn.push('coverFit');
		};

		const BlankCover = (item: any) => (
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
			cover = <BlankCover />;

			if (view.coverRelationKey == 'pageCover') {
				const { coverType, coverId, coverX, coverY, coverScale } = record;
				if (coverId && coverType) {
					cover = <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={false} />;
				};
			} else {
				const src = this.getPicture();
				if (src) {
					cover = <Cover type={I.CoverType.Upload} src={src} />;
				};
			};
		};

		return (
			<div 
				className={cn.join(' ')} 
				style={style} 
				onClick={(e: any) => { this.onClick(e); }}
				onContextMenu={(e: any) => { onContext(e, record.id); }}
			>
				<div 
					id={'selectable-' + record.id} 
					className={[ 'selectable', 'type-' + I.SelectType.Record ].join(' ')} 
					data-id={record.id}
					data-type={I.SelectType.Record}
				>
					{cover}
					<div className="inner">
						{relations.map((relation: any, i: number) => {
							const id = Relation.cellId(idPrefix, relation.relationKey, index);
							return (
								<Cell 
									elementId={id}
									key={'list-cell-' + view.id + relation.relationKey} 
									{...this.props}
									subId={subId}
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

	onClick (e: any) {
		e.preventDefault();

		if (e.shiftKey || e.ctrlKey || e.metaKey) {
			return;
		};

		const { index, getRecord, onContext } = this.props;
		const record = getRecord(index);
		const cb = {
			0: () => { DataUtil.objectOpenPopup(record); },
			2: () => { onContext(e, record.id); }
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	getPicture (): string {
		const { rootId, block, index, getView, getRecord } = this.props;
		const view = getView();

		if (!view || !view.coverRelationKey) {
			return '';
		};

		const subId = dbStore.getSubId(rootId, block.id);
		const record = getRecord(index);
		const value = Relation.getArrayValue(record[view.coverRelationKey]);

		let picture = '';
		for (let id of value) {
			const f = detailStore.get(subId, id, []);
			if (f && (f.type == Constant.typeId.image)) {
				picture = commonStore.imageUrl(f.id, 600);
				break;
			};
		};
		return picture;
	};

});

export default Card;