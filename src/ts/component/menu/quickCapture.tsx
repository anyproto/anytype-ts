import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical, IconObject, ObjectName, Icon } from 'Component';
import { analytics, C, I, keyboard, UtilObject, translate, Action, Preview, UtilData } from 'Lib';
import { commonStore, dbStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

class MenuQuickCapture extends React.Component<I.Menu> {

	node: any = null;
	n = -1;

	constructor (props: I.Menu) {
		super(props);

		this.onOut = this.onOut.bind(this);
	};

	render () {
		const items = this.getItems();

		const Item = (item: any) => {
			return (
				<div
					id={`item-${item.id}`}
					className="item"
					onClick={() => this.onClick(item)}
					onMouseEnter={(e: any) => { this.onOver(e, item); }}
					onMouseLeave={this.onOut}
				>
					{item.id == 'search' ? <Icon className="search" /> : (
						<React.Fragment>
							<IconObject object={item} />
							<ObjectName object={item} />
						</React.Fragment>
					)}
				</div>
			);
		};

		return (
			<div ref={node => this.node = node} className="quickCapture">
				{items.map((item: any, i: number) => (
					<Item key={i} idx={i} {...item} />
				))}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown (e: any) {
		const items = this.getItems();

		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowleft', e, () => {
			e.preventDefault();
			e.key = 'arrowup';

			this.n--;
			if (this.n < 0) {
				this.n = items.length - 1;
			};

			this.setHover(items[this.n]);
		});

		keyboard.shortcut('arrowdown, arrowright', e, () => {
			e.preventDefault();
			e.key = 'arrowup';

			this.n++;
			if (this.n > items.length - 1) {
				this.n = 0;
			};

			this.setHover(items[this.n]);
		});

		keyboard.shortcut('enter, space', e, () => {
			e.preventDefault();

			if (items[this.n]) {
				this.onClick(items[this.n]);
			};
		});
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = detailStore.get(rootId, rootId, []);
		const items = UtilData.getObjectTypesForNewObject({ withCollection: true, withSet: true, withDefault: true }).filter(it => it.id != object.type);
		const itemIds = items.map(it => it.id);
		const defaultType = dbStore.getTypeById(commonStore.type);

		if (!itemIds.includes(defaultType.id)) {
			items.unshift(defaultType);
		};

		items.unshift({ id: 'search', icon: 'search', name: '' });

		return items;
	};

	onClick (item: any) {
		if (item.id == 'search') {
			this.onExpand();
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const targetId = '';
		const position = I.BlockPosition.Bottom;
		const details: any = { type: item.id };
		const flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ];

		UtilObject.create(rootId, targetId, details, position, '', {}, flags, (message: any) => {
			UtilObject.openAuto({ id: message.targetId });
			analytics.event('CreateObject', { route: 'Navigation', objectType: item.id });
		});
	};

	onExpand () {
		
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setHover(item);
		};
	};

	onOut () {
		if (!keyboard.isMouseDisabled) {
			this.setHover();
		};
	};

	setHover (item?: any) {
		const node = $(this.node);

		node.find('.item.hover').removeClass('hover');
		if (item) {
			node.find('#item-' + item.id).addClass('hover');
		};
	};

};

export default MenuQuickCapture;
