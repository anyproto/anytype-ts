import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical, IconObject, ObjectName, Icon } from 'Component';
import { analytics, C, I, keyboard, UtilObject, translate, Action, Preview, UtilData } from 'Lib';
import { commonStore, dbStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

class MenuQuickCapture extends React.Component<I.Menu> {

	n = 0;

	constructor (props: I.Menu) {
		super(props);
	};

	render () {
		const items = this.getItems();

		const Item = (item: any) => {
			if (item.id == 'search') {
				return (
					<div
						className="item itemSearch"
						onMouseEnter={() => this.n = item.idx}
						onMouseLeave={() => this.n = -1}
					>
						<Icon className="search" />
					</div>
				);
			};

			return (
				<div
					className="item"
					onClick={e => this.onClick(e, item)}
					onMouseEnter={() => this.n = item.idx}
					onMouseLeave={() => this.n = -1}
				>
					<IconObject object={item} />
					<ObjectName object={item} />
				</div>
			);
		};

		return (
			<div className="quickCapture">
				{items.map((item: any, i: number) => (
					<Item key={i} idx={i} {...item} />
				))}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
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

	onClick (e: any, item: any) {
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

};

export default MenuQuickCapture;
