import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Cell, Cover, Icon, MediaAudio, MediaVideo, DropTarget } from 'Component';
import { I, Util, DataUtil, ObjectUtil, Relation, keyboard } from 'Lib';
import { commonStore, detailStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
};

const Card = observer(class Card extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
	};

	render () {
		const { rootId, block, index, getView, getRecord, onRef, style, onContext, onCellClick, getIdPrefix, getVisibleRelations, isInline, isCollection, onMultiselect } = this.props;
		const view = getView();
		const { cardSize, coverFit, hideIcon } = view;
		const relations = getVisibleRelations();
		const idPrefix = getIdPrefix();
		const record = getRecord(index);
		const cn = [ 'card', DataUtil.layoutClass(record.id, record.layout), DataUtil.cardSizeClass(cardSize) ];
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

			const coverNode = this.getCover();
			if (coverNode) {
				cover = coverNode;
			};
		};

		let content = (
			<React.Fragment>
				<Icon className="checkbox" onClick={(e: any) => { onMultiselect(record.id); }} />
				<div className="itemContent" onClick={this.onClick} onContextMenu={(e: any) => { onContext(e, record.id); }}>
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
									ref={ref => { onRef(ref, id); }}
									relationKey={relation.relationKey}
									viewType={view.type}
									idPrefix={idPrefix}
									index={index}
									arrayLimit={2}
									showTooltip={true}
									onClick={(e: any) => {
										e.stopPropagation();
										onCellClick(e, relation.relationKey, index);
									}}
									tooltipX={I.MenuDirection.Left}
									iconSize={18}
								/>
							);
						})}
					</div>
				</div>
			</React.Fragment>
		);

		if (!isInline) {
			content = (
				<div
					id={'selectable-' + record.id}
					className={[ 'selectable', 'type-' + I.SelectType.Record ].join(' ')}
					{...Util.dataProps({ id: record.id, type: I.SelectType.Record })}
				>
					{content}
				</div>
			);
		};

		if (isCollection) {
			content = (
				<DropTarget {...this.props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
					{content}
				</DropTarget>
			);
		};

		return (
			<div
				id={'record-' + record.id}
				ref={node => this.node = node}
				className={cn.join(' ')} 
				style={style}
				draggable={true}
				onDragStart={this.onDragStart}
			>
				{content}
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

		const node = $(this.node);
		const last = node.find('.cellContent:not(.isEmpty)').last();

		node.find('.cellContent').removeClass('last');
		if (last.length) {
			last.addClass('last');
		};
	};

	onDragStart (e: any) {
		const { isCollection, index, onDragRecordStart } = this.props;

		if (isCollection) {
			onDragRecordStart(e, index);
		};
	};

	onClick (e: any) {
		e.preventDefault();

		const { index, getRecord, onContext, dataset } = this.props;
		const { selection } = dataset || {};
		const record = getRecord(index);
		const cb = {
			0: () => { 
				keyboard.withCommand(e) ? ObjectUtil.openWindow(record) : ObjectUtil.openPopup(record); 
			},
			2: () => { onContext(e, record.id); }
		};

		const ids = selection ? selection.get(I.SelectType.Record) : [];
		if (keyboard.withCommand(e) && ids.length) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	getCover (): any {
		const { rootId, block, index, getView, getRecord } = this.props;
		const view = getView();

		if (!view.coverRelationKey) {
			return null;
		};

		const subId = dbStore.getSubId(rootId, block.id);
		const record = getRecord(index);
		const value = Relation.getArrayValue(record[view.coverRelationKey]);

		let cover = null;
		if (view.coverRelationKey == 'pageCover') {
			cover = this.mediaCover(record);
		} else {
			for (const id of value) {
				const f = detailStore.get(subId, id, []);
				if (!f._empty_) {
					cover = this.mediaCover(f);
				};
			};
		};
		return cover;
	};

	mediaCover (item: any) {
		const { coverType, coverId, coverX, coverY, coverScale } = item;
		const cn = [ 'cover', `type${I.CoverType.Upload}` ];
		
		let mc = null;
		if (coverId && coverType) {
			mc = (
				<Cover
					type={coverType}
					id={coverId}
					image={coverId}
					className={coverId}
					x={coverX}
					y={coverY}
					scale={coverScale}
					withScale={false}
				/>
			);
		} else {
			switch (item.type) {
				case Constant.typeId.image: {
					cn.push('coverImage');
					mc = <img src={commonStore.imageUrl(item.id, 600)}/>;
					break;
				};

				case Constant.typeId.audio: {
					cn.push('coverAudio');
					mc = <MediaAudio playlist={[ { name: item.name, src: commonStore.fileUrl(item.id) } ]}/>;
					break;
				};

				case Constant.typeId.video: {
					cn.push('coverVideo');
					mc = <MediaVideo src={commonStore.fileUrl(item.id)}/>;
					break;
				};
			};
		};

		return mc ? <div className={cn.join(' ')}>{mc}</div> : null;
	};

});

export default Card;