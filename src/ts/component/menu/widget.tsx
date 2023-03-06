import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical, Button } from 'Component';
import { C, I, keyboard, MenuUtil, translate, Action, DataUtil, analytics } from 'Lib';
import { blockStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

const MenuWidget = observer(class MenuWidget extends React.Component<I.Menu> {

    _isMounted = false;
	node: any = null;
    n = -1;
	target = null;
	layout: I.WidgetLayout = null;

    constructor (props: I.Menu) {
		super(props);

		const { param } = this.props;
		const { data } = param;
		const { isEditing, layout, target } = data;

		this.save = this.save.bind(this);
		this.rebind = this.rebind.bind(this);

		if (isEditing) {
			this.layout = layout;
			this.target = target;
			this.checkState();
		};
	};

    render(): React.ReactNode {
		const { param } = this.props;
		const { data } = param;
		const { isEditing } = data;
        const sections = this.getSections();

		const Section = item => (
			<div id={'section-' + item.id} className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action, i) => (
						<MenuItemVertical 
							key={i} 
							{...action} 
							onMouseEnter={e => this.onMouseEnter(e, action)} 
							onClick={e => this.onClick(e, action)} 
						/>
					))}
				</div>
			</div>
		);
		
		return (
			<div
				ref={node => this.node = node}
			>
				<div className="sections">
					{sections.map((item, i) => (
						<Section key={i} index={i} {...item} />
					))}

					{!isEditing ? (
						<div className="buttons">
							<Button 
								id="button-save"
								color={this.target ? 'blank' : 'blank'}
								className="c28"
								text="Add widget"
								onClick={this.save} 
								onMouseEnter={() => menuStore.closeAll(Constant.menuIds.widget)} 
							/>
						</div>
					) : ''}
				</div>
			</div>
		);
    }

	componentDidMount () {
		this._isMounted = true;
		this.rebind();
	};

	componentDidUpdate () {
		this.checkButton();

		this.props.setActive();
		this.props.position();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		menuStore.closeAll(Constant.menuIds.widget);
	};

    rebind (): void {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind (): void {
		$(window).off('keydown.menu');
	};

	checkButton () {
		const node = $(this.node);
		const button = node.find('#button-save');

		button.removeClass('black blank');
		button.addClass((this.target !== null) && (this.layout !== null) ? 'black' : 'blank');
	};

    getSections () {
		const { param } = this.props;
		const { data } = param;
		const { isEditing } = data;
		
		this.checkState();
		
		let sourceName = 'Choose a source';
		let layoutName = 'Choose a layout';
		let layoutIcon = '';

		if (this.target) {
			if (this.target.layout == I.ObjectLayout.Note) {
				sourceName = this.target.snippet || translate('commonEmpty');
			} else {
				sourceName = DataUtil.getObjectName(this.target);
			};
		};

		if (this.layout !== null) {
			layoutName = translate(`widget${this.layout}Name`);
			layoutIcon = `widget-${this.layout}`;
		};

		const sections: any[] = [
			{ 
				id: 'source', name: 'Widget Source', children: [
					{ id: 'source', name: sourceName, arrow: true, object: this.target }
				] 
			},
			{ 
				id: 'layout', name: 'Appearance', children: [
					{ id: 'layout', name: layoutName, icon: layoutIcon, arrow: true }
				] 
			},
		];

		if (isEditing) {
			sections.push({
				children: [
					{ id: 'remove', name: 'Remove widget', icon: 'removeWidget' },
					{ id: 'edit', name: 'Edit widgets', icon: 'source' }
				],
			});
		};

		return MenuUtil.sectionsMap(sections);
	};

	checkState () {
		const options = this.getLayoutOptions().map(it => it.id);
		
		this.layout = options.includes(this.layout) ? this.layout : null;

		if (this.target && (this.layout == I.WidgetLayout.Tree) && (this.target.type == Constant.typeId.set)) {
			this.target = null;
		};
	};

    getItems () {
		return this.getSections().flatMap(section => section.children);
	};

	getLayoutOptions () {
		let options = [
			I.WidgetLayout.Tree,
			I.WidgetLayout.List,
			I.WidgetLayout.Link,
		];

		if (this.target) {
			// Favorites and Recents and Sets can only become List and Tree layouts
			if ([ Constant.widgetId.favorite, Constant.widgetId.recent, Constant.widgetId.set ].includes(this.target.id)) {
				options = options.filter(it => it != I.WidgetLayout.Link);
			} else {
				// Sets can only become Link and List layouts, non-sets can't become List
				if (this.target.type == Constant.typeId.set) {
					options = options.filter(it => it != I.WidgetLayout.Tree);
				} else {
					options = options.filter(it => it != I.WidgetLayout.List);
				};
			};
		};

		return options.map(id => ({
			id,
			name: translate(`widget${id}Name`),
			description: translate(`widget${id}Description`),
			icon: `widget-${id}`,
			withDescription: true,
		}));
	};

    onMouseEnter (e: React.MouseEvent, item): void {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};

	onOver (e: React.MouseEvent, item) {
		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.widget);
			return;
		};

		const { getId, getSize, param } = this.props;
		const { data, className, classNameWrap } = param;
		const { isEditing } = data;
		const menuParam: Partial<I.MenuParam> = {
			menuKey: item.itemId,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			className,
			classNameWrap,
			isSub: true,
			data: {
				rebind: this.rebind,
			} as any,
		};

		let menuId = '';

		switch (item.itemId) {
			case 'source':
				let filters: I.Filter[] = [];

				switch (this.layout) {
					case I.WidgetLayout.List: {
						filters = filters.concat([
							{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set },
							{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
						]);
						break;
					};

					case I.WidgetLayout.Tree: {
						filters = filters.concat([
							{ 
								operator: I.FilterOperator.And, 
								relationKey: 'type', 
								condition: I.FilterCondition.NotIn, 
								value: [ Constant.typeId.set, Constant.typeId.space ].concat(DataUtil.getSystemTypes()),
							},
						]);
					};
				};

				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters,
					value: this.target ? this.target.id : '',
					onSelect: (target) => {
						this.target = target;
						
						if (isEditing) {
							this.save();
						} else {
							this.forceUpdate();
						};
					},
				});

				if (this.layout != I.WidgetLayout.Link) {
					menuParam.data.dataChange = (items: any[]) => {
						return [
							{ id: Constant.widgetId.favorite, name: 'Favorites', iconEmoji: ':star:' },
							{ id: Constant.widgetId.recent, name: 'Recent', iconEmoji: ':date:' },
							{ id: Constant.widgetId.set, name: 'Sets', iconEmoji: ':books:' },
							{ id: Constant.widgetId.collection, name: 'Collections', iconEmoji: ':books:' },
							{ isDiv: true },
						].concat(items);
					};
				};
				break;

			case 'layout':
				menuId = 'select';
				menuParam.width = 320;
				menuParam.data = Object.assign(menuParam.data, {
					options: this.getLayoutOptions(),
					value: this.layout,
					onSelect: (e, option) => {
						this.layout = option.id;
						
						if (isEditing) {
							this.save();
						} else {
							this.forceUpdate();
						};
					},
				});
				break;
		};

		if (menuId && !menuStore.isOpen(menuId, item.itemId)) {
			menuStore.closeAll(Constant.menuIds.widget, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};

	onClick (e: React.MouseEvent, item) {
		if (item.arrow) {
			return;
		};

		const { param, close } = this.props;
		const { data } = param;
		const { blockId, setEditing } = data;

		switch (item.itemId) {
			case 'remove':
				Action.removeWidget(blockId);
				break;

			case 'edit':
				setEditing(true);
				break;
		};

		close();
	};

    save (): void {
		const { close, param } = this.props;
		const { data } = param;
		const { isEditing, blockId } = data;
		const { widgets } = blockStore;

        if (!this.target || (this.layout === null)) {
			return;
		};

		const targetId = isEditing ? blockId : '';
		const position = isEditing ? I.BlockPosition.Replace : I.BlockPosition.Bottom;
		const newBlock = { 
			type: I.BlockType.Link,
			content: { 
				targetBlockId: this.target.id,   
			},
		};

		C.BlockCreateWidget(widgets, targetId, newBlock, position, this.layout, () => {
			analytics.event(isEditing ? 'EditWidget' : 'AddWidget', { type: this.layout });
		});
		close(); 
    };

});

export default MenuWidget;