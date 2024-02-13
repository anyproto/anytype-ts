import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Cell, Cover, MediaAudio, MediaVideo, DropTarget } from 'Component';
import { I, UtilCommon, UtilData, UtilObject, Relation, keyboard } from 'Lib';
import { commonStore, dbStore } from 'Store';

interface Props extends I.ViewComponent {
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
		const { rootId, block, record, getView, onRef, style, onContext, getIdPrefix, getVisibleRelations, isInline, isCollection } = this.props;
		const view = getView();
		const { cardSize, coverFit, hideIcon } = view;
		const relations = getVisibleRelations();
		const idPrefix = getIdPrefix();
		const cn = [ 'card', UtilData.layoutClass(record.id, record.layout), UtilData.cardSizeClass(cardSize) ];
		const subId = dbStore.getSubId(rootId, block.id);
		const cover = this.getCover();

		if (coverFit) {
			cn.push('coverFit');
		};

		if (cover) {
			cn.push('withCover');
		};

		let content = (
			<div className="itemContent">
				{cover}

				<div className="inner">
					{relations.map(relation => {
						const id = Relation.cellId(idPrefix, relation.relationKey, record.id);
						return (
							<Cell
								elementId={id}
								key={'list-cell-' + view.id + relation.relationKey}
								{...this.props}
								subId={subId}
								ref={ref => onRef(ref, id)}
								relationKey={relation.relationKey}
								viewType={view.type}
								idPrefix={idPrefix}
								arrayLimit={2}
								showTooltip={true}
								onClick={e => this.onCellClick(e, relation)}
								tooltipX={I.MenuDirection.Left}
								iconSize={relation.relationKey == 'name' ? 20 : 18}
								shortUrl={true}
								withName={true}
							/>
						);
					})}
				</div>
			</div>
		);

		if (!isInline) {
			content = (
				<div
					id={'selectable-' + record.id}
					className={[ 'selectable', 'type-' + I.SelectType.Record ].join(' ')}
					{...UtilCommon.dataProps({ id: record.id, type: I.SelectType.Record })}
				>
					{content}
				</div>
			);

			if (isCollection) {
				content = (
					<DropTarget {...this.props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
						{content}
					</DropTarget>
				);
			};
		};

		return (
			<div
				id={`record-${record.id}`}
				ref={node => this.node = node}
				className={cn.join(' ')} 
				style={style}
				draggable={isCollection && !isInline}
				onClick={this.onClick}
				onContextMenu={(e: any) => onContext(e, record.id)}
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
		const { isCollection, record, onDragRecordStart } = this.props;

		if (isCollection) {
			onDragRecordStart(e, record.id);
		};
	};

	onClick (e: any) {
		e.preventDefault();

		const { record, onContext, dataset } = this.props;
		const { selection } = dataset || {};
		const cb = {
			0: () => { 
				keyboard.withCommand(e) ? UtilObject.openWindow(record) : UtilObject.openPopup(record); 
			},
			2: () => onContext(e, record.id)
		};

		const ids = selection ? selection.get(I.SelectType.Record) : [];
		if ((keyboard.withCommand(e) && ids.length) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	onCellClick (e: React.MouseEvent, vr: I.ViewRelation) {
		const { onCellClick, record } = this.props;
		const relation = dbStore.getRelationByKey(vr.relationKey);

		if (!relation || ![ I.RelationType.Url, I.RelationType.Phone, I.RelationType.Email, I.RelationType.Checkbox ].includes(relation.format)) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		onCellClick(e, relation.relationKey, record.id);
	};

	getCover (): any {
		const { record, getCoverObject } = this.props;
		const cover = getCoverObject(record.id);

		return cover ? this.mediaCover(cover) : null;
	};

	mediaCover (item: any) {
		const { layout, coverType, coverId, coverX, coverY, coverScale } = item;
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
			switch (layout) {
				case I.ObjectLayout.Image: {
					cn.push('coverImage');
					mc = <img src={commonStore.imageUrl(item.id, 600)} onDragStart={e => e.preventDefault()} />;
					break;
				};

				case I.ObjectLayout.Audio: {
					cn.push('coverAudio');
					mc = <MediaAudio playlist={[ { name: item.name, src: commonStore.fileUrl(item.id) } ]}/>;
					break;
				};

				case I.ObjectLayout.Video: {
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