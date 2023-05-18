import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Cell, Cover, Icon, MediaAudio, MediaVideo, DropTarget } from 'Component';
import { I, Util, DataUtil, ObjectUtil, Relation, keyboard } from 'Lib';
import { commonStore, detailStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.ViewComponent {
	recordId: string;
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
		const { rootId, block, recordId, getView, getRecord, onRef, style, onContext, getIdPrefix, getVisibleRelations, isInline, isCollection, onSelectToggle } = this.props;
		const view = getView();
		const { cardSize, coverFit, hideIcon } = view;
		const relations = getVisibleRelations();
		const idPrefix = getIdPrefix();
		const record = getRecord(recordId);
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
			<div className="itemContent">
				{cover}

				<div className="inner">
					{relations.map(relation => {
						const id = Relation.cellId(idPrefix, relation.relationKey, recordId);
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
								onClick={(e: any) => { this.onCellClick(e, relation); }}
								tooltipX={I.MenuDirection.Left}
								iconSize={18}
								shortUrl={true}
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
					{...Util.dataProps({ id: record.id, type: I.SelectType.Record })}
				>
					<Icon
						className="checkbox"
						onClick={e => onSelectToggle(e, record.id)}
						onMouseEnter={() => keyboard.setSelectionClearDisabled(true)}
						onMouseLeave={() => keyboard.setSelectionClearDisabled(false)}
					/>
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
				id={'record-' + record.id}
				ref={node => this.node = node}
				className={cn.join(' ')} 
				style={style}
				draggable={true}
				onClick={this.onClick}
				onContextMenu={(e: any) => { onContext(e, record.id); }}
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
		const { isCollection, recordId, onDragRecordStart } = this.props;

		if (isCollection) {
			onDragRecordStart(e, recordId);
		};
	};

	onClick (e: any) {
		e.preventDefault();

		const { recordId, getRecord, onContext, dataset } = this.props;
		const { selection } = dataset || {};
		const record = getRecord(recordId);
		const cb = {
			0: () => { 
				keyboard.withCommand(e) ? ObjectUtil.openWindow(record) : ObjectUtil.openPopup(record); 
			},
			2: () => { onContext(e, record.id); }
		};

		const ids = selection ? selection.get(I.SelectType.Record) : [];
		if ((keyboard.withCommand(e) && ids.length) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	onCellClick (e: React.MouseEvent, relation) {
		const { onCellClick, recordId } = this.props;

		if (![ I.RelationType.Url, I.RelationType.Phone, I.RelationType.Email, I.RelationType.Checkbox ].includes(relation.format)) {
			return;
		};

		onCellClick(e, relation.relationKey, recordId);
	};

	getCover (): any {
		const { rootId, block, recordId, getView, getRecord } = this.props;
		const view = getView();

		if (!view.coverRelationKey) {
			return null;
		};

		const subId = dbStore.getSubId(rootId, block.id);
		const record = getRecord(recordId);
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