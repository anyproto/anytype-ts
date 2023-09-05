import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName } from 'Component';
import { I, UtilCommon, UtilData, UtilObject, UtilRouter, keyboard } from 'Lib';
import { dbStore, detailStore, popupStore, commonStore } from 'Store';
import Constant from 'json/constant.json';

const MenuSpace = observer(class MenuSpace extends React.Component<I.Menu> {

	node: any = null;
	n = 0;

	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onSettings = this.onSettings.bind(this);
	};
	
	render () {
		const items = this.getItems();
		const profile = UtilObject.getProfile();

		const Item = (item) => (
			<div 
				id={`item-${item.id}`}
				className="item" 
				onClick={e => this.onClick(e, item)}
				onMouseEnter={e => this.onMouseEnter(e, item)} 
			>
				<div className="iconWrap">
					<IconObject object={item} size={96} forceLetter={true} />
				</div>
				<ObjectName object={item} />
			</div>
		);

		const ItemAdd = (item: any) => (
			<div 
				id="item-add" 
				className="item add" 
				onClick={this.onAdd}
				onMouseEnter={e => this.onMouseEnter(e, item)} 
			>
				<div className="iconWrap" />
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<div className="head">
					<div className="side left">
						<IconObject object={profile} size={40} />
						<ObjectName object={profile} />
					</div>
					<div className="side left">
						<Icon className="settings" onClick={this.onSettings} />
					</div>
				</div>
				<div className="items">
					{items.map(item => {
						if (item.id == 'add') {
							return <ItemAdd key={`item-space-${item.id}`} {...item} />;
						} else {
							return <Item key={`item-space-${item.id}`} {...item} />;
						};
					})}
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		const { space } = commonStore;
		const items = this.getItems();

		this.n = items.findIndex(it => it.spaceId = space);
		this.rebind();
	};

	componentDidUpdate (): void {
		this.beforePosition();
	};

	componentWillUnmount (): void {
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
		let ret = false;

		keyboard.shortcut('arrowleft, arrowright, ctrl+tab', e, (pressed: string) => {
			this.onArrow(pressed == 'arrowleft' ? -1 : 1);
			ret = true;
		});

		if (!ret) {
			this.props.onKeyDown(e);
		};
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onArrow (dir: number) {
		const items = this.getItems();
		const max = items.length - 1;

		this.n += dir;

		if (this.n < 0) {
			this.n = max;
		};
		if (this.n > max) {
			this.n = 0;
		};

		this.props.setActive();
	};

	getItems () {
		const subId = Constant.subId.space;
		const items = UtilCommon.objectCopy(dbStore.getRecords(subId, '')).map(id => detailStore.get(subId, id, UtilData.spaceRelationKeys()));

		items.push({ id: 'add' });

		return items;
	};

	onClick (e: any, item: any) {
		if (item.id == 'add') {
			this.onAdd();
		} else {
			UtilRouter.switchSpace(item.spaceId);
			this.props.close();
		};
	};

	onAdd () {
		popupStore.open('settings', { data: { page: 'spaceCreate', isSpace: true }, className: 'isSpaceCreate' });
		this.props.close();
	};

	onSettings () {
		popupStore.open('settings', {});
		this.props.close();
	};

	beforePosition () {
		const { getId } = this.props;
		const obj = $(`#${getId()}`);
		const container = UtilCommon.getPageContainer(false);
		const editor = container.find('#editorWrapper');

		let mw = 0;

		if (editor.length) {
			mw = editor.width();
		} else {
			const { ww } = UtilCommon.getWindowDimensions();
			const sidebar = $('#sidebar');
			const sw = sidebar.outerWidth();

			mw = ww - sw;
		};

		obj.css({ maxWidth: mw });
	};
	
});

export default MenuSpace;