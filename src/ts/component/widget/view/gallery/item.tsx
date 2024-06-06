import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { ObjectName, IconObject, DropTarget, Cover, MediaAudio, MediaVideo } from 'Component';
import { blockStore, menuStore, detailStore, commonStore } from 'Store';
import { I, UtilObject, keyboard, analytics, UtilSpace, Dataview } from 'Lib';

const Constant = require('json/constant.json');

interface Props extends I.WidgetViewComponent {
	subId: string;
	id: string;
	isEditing?: boolean;
	hideIcon?: boolean;
};

const WidgetBoardItem = observer(class WidgetBoardItem extends React.Component<Props> {

	node = null;
	frame = 0;

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onContext = this.onContext.bind(this);
	};

	render () {
		const { subId, id, block, isEditing, hideIcon } = this.props;
		const rootId = keyboard.getRootId();
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);
		const { isReadonly, isArchived, restrictions } = object;
		const allowedDetails = blockStore.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
		const iconKey = `widget-icon-${block.id}-${id}`;
		const canDrop = !isEditing && blockStore.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
		const cn = [ 'item' ];
		const cover = this.getCover();

		if (cover) {
			cn.push('withCover');
		};

		let icon = null;
		if (!hideIcon) {
			icon = (
				<IconObject 
					id={iconKey}
					key={iconKey}
					object={object} 
					size={16} 
					iconSize={16}
					canEdit={!isReadonly && !isArchived && allowedDetails} 
					menuParam={{ 
						className: 'fixed',
						classNameWrap: 'fromSidebar',
					}}
				/>
			);
		};

		let inner = (
			<div className="inner" onMouseDown={this.onClick}>
				{cover}
				<div className="info">
					{icon}
					<ObjectName object={object} />
				</div>
			</div>
		);

		if (canDrop) {
			inner = (
				<DropTarget
					cacheKey={[ block.id, object.id ].join('-')}
					id={object.id}
					rootId={rootId}
					targetContextId={object.id}
					dropType={I.DropType.Menu}
					canDropMiddle={true}
				>
					{inner}
				</DropTarget>
			);
		};

		return (
			<div
				ref={node => this.node = node}
				className={cn.join(' ')}
				onContextMenu={this.onContext}
			>
				{inner}
			</div>
		);
	};

	componentDidMount (): void {
		this.resize();
	};

	componentDidUpdate (): void {
		this.resize();
	};

	onClick (e: React.MouseEvent) {
		if (e.button) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const { subId, id, } = this.props;
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);

		UtilObject.openEvent(e, object);
		analytics.event('OpenSidebarObject');
	};

	onContext (e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const { subId, id, getView } = this.props;
		const view = getView();
		if (!view) {
			return;
		};

		const canWrite = UtilSpace.canMyParticipantWrite();
		if (!canWrite) {
			return;
		};

		const node = $(this.node);
		const menuParam: any = {
			element: node,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetX: node.outerWidth(true),
			vertical: I.MenuDirection.Center,
			onOpen: () => node.addClass('active'),
			onClose: () => node.removeClass('active'),
			data: {
				route: analytics.route.widget,
				objectIds: [ id ],
				subId,
			},
		};

		menuStore.open('dataviewContext', menuParam);
	};

	getCoverObject (): any {
		const { getView, subId, id } = this.props;
		const view = getView();

		return view ? Dataview.getCoverObject(subId, detailStore.get(subId, id), view.coverRelationKey) : null;
	};

	getCover () {
		const object = this.getCoverObject();
		if (!object) {
			return null;
		};

		const { id, name, layout, coverType, coverId, coverX, coverY, coverScale } = object;
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
					mc = <img src={commonStore.imageUrl(id, 600)} onDragStart={e => e.preventDefault()} />;
					break;
				};

				case I.ObjectLayout.Audio: {
					cn.push('coverAudio');
					mc = <MediaAudio playlist={[ { name, src: commonStore.fileUrl(id) } ]}/>;
					break;
				};

				case I.ObjectLayout.Video: {
					cn.push('coverVideo');
					mc = <MediaVideo src={commonStore.fileUrl(id)}/>;
					break;
				};
			};
		};

		if (mc) {
			mc = <div className={cn.join(' ')}>{mc}</div>;
		};

		return mc;
	};

	resize () {
		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			const node = $(this.node);
			const icon = node.find('.iconObject');

			icon.length ? node.addClass('withIcon') : node.removeClass('withIcon');
		});
	};

});

export default WidgetBoardItem;