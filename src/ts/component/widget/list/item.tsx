import * as React from 'react';
import raf from 'raf';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { ObjectName, Icon, IconObject, ObjectDescription, DropTarget } from 'Component';
import { blockStore, menuStore, detailStore } from 'Store';
import { I, UtilCommon, UtilObject, keyboard, analytics, translate } from 'Lib';
import Constant from 'json/constant.json';

type Props = {
	block: I.Block;
	subId: string;
	id: string;
	style?: any;
	isEditing?: boolean;
	isCompact?: boolean;
};

const WidgetListItem = observer(class WidgetListItem extends React.Component<Props> {

	node = null;
	frame = 0;

	constructor (props: Props) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
	};

	render () {
		const { subId, id, block, style, isCompact, isEditing } = this.props;
		const rootId = keyboard.getRootId();
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);
		const { isReadonly, isArchived, restrictions, source, done } = object;
		const canDrop = !isEditing && blockStore.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
		const iconKey = `widget-icon-${block.id}-${id}`;

		let descr = null;
		if (object.type == Constant.typeId.bookmark) {
			descr = (
				<div className="descr">
					{UtilCommon.shortUrl(source)}
				</div>
			);
		} else {
			descr = <ObjectDescription object={object} />;
		};

		if (isCompact) {
			descr = null;
		};

		let inner = (
			<div className="inner">
				<IconObject 
					id={iconKey}
					key={iconKey}
					object={object} 
					size={isCompact ? 18 : 48} 
					iconSize={isCompact ? 18 : 28}
					canEdit={!isReadonly && !isArchived} 
					onSelect={this.onSelect} 
					onUpload={this.onUpload} 
					onCheckbox={this.onCheckbox} 
					menuParam={{ 
						className: 'fixed',
						classNameWrap: 'fromSidebar',
					}}
				/>

				<div className="info">
					<ObjectName object={object} />
					{descr}
				</div>
				<div className="buttons">
					<Icon className="more" tooltip={translate('widgetOptions')} onMouseDown={e => this.onContext(e, true)} />
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
				className="item"
				key={object.id}
				onMouseDown={e => this.onClick(e)}
				onContextMenu={e => this.onContext(e, false)}
				style={style}
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

	onClick = (e: React.MouseEvent): void => {
		if (e.button) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const { subId, id,  } = this.props;
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);

		UtilObject.openEvent(e, object);
		analytics.event('OpenSidebarObject');
	};

	onContext = (e: React.SyntheticEvent, withElement: boolean): void => {
		e.preventDefault();
		e.stopPropagation();

		const { subId, id } = this.props;
		const node = $(this.node);
		const more = node.find('.icon.more');
		const { x, y } = keyboard.mouse.page;
		const menuParam: any = {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: () => { node.addClass('active'); },
			onClose: () => { node.removeClass('active'); },
			data: {
				objectIds: [ id ],
				subId,
			},
		};

		if (withElement) {
			menuParam.element = more;
			menuParam.vertical = I.MenuDirection.Center;
			menuParam.offsetX = 32;
		} else {
			menuParam.rect = { width: 0, height: 0, x: x + 4, y };
		};

		menuStore.open('dataviewContext', menuParam);
	};

	onSelect (icon: string) {
		const { id } = this.props;

		UtilObject.setIcon(id, icon, '');
	};

	onUpload (hash: string) {
		const { id } = this.props;

		UtilObject.setIcon(id, '', hash);
	};

	onCheckbox () {
		const { subId, id } = this.props;
		const object = detailStore.get(subId, id, Constant.sidebarRelationKeys);

		UtilObject.setDone(id, !object.done);
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

export default WidgetListItem;
