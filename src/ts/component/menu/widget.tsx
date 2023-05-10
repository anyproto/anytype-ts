import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical, Button } from 'Component';
import { C, I, keyboard, MenuUtil, translate, Action, ObjectUtil, analytics } from 'Lib';
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
		this.checkButton();
		this.rebind();

		this.getTargetId();
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

		button.removeClass('black blank disabled');
		button.addClass((this.target !== null) && (this.layout !== null) ? 'black' : 'blank disabled');
	};

    getSections () {
		const { param } = this.props;
		const { data } = param;
		const { isEditing } = data;
		
		this.checkState();
		
		let sourceName = 'Choose a source';
		let layoutName = 'Choose a layout';

		if (this.target) {
			sourceName = ObjectUtil.name(this.target);
		};

		if (this.layout !== null) {
			layoutName = translate(`widget${this.layout}Name`);
		};

		const sections: any[] = [
			{ 
				id: 'source', name: 'Widget Source', children: [
					{ id: 'source', name: sourceName, arrow: true, object: this.target }
				] 
			},
			{ 
				id: 'layout', name: 'Appearance', children: [
					{ id: 'layout', name: layoutName, arrow: true }
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
		const setTypes = ObjectUtil.getSetTypes();
		const options = this.getLayoutOptions().map(it => it.id);

		if (this.isCollection()) {
			if (this.layout == I.WidgetLayout.Link) {
				this.layout = I.WidgetLayout.List;
			};
		} else 
		if (this.target) {
			if ((this.layout == I.WidgetLayout.List) && !setTypes.includes(this.target.type)) {
				this.layout = I.WidgetLayout.Link;
			};
			if ((this.layout == I.WidgetLayout.Tree) && setTypes.includes(this.target.type)) {
				this.layout = I.WidgetLayout.Link;
			};
		};

		this.layout = options.includes(this.layout) ? this.layout : null;
	};

    getItems () {
		return this.getSections().flatMap(section => section.children);
	};

	getLayoutOptions () {
		const isCollection = this.isCollection();

		let options = [];
		if (isCollection) {
			options = [
				I.WidgetLayout.List,
				I.WidgetLayout.Tree,
			];
		} else {
			options = [
				I.WidgetLayout.Tree,
				I.WidgetLayout.List,
				I.WidgetLayout.Link,
			];
		};

		if (this.target && !isCollection) {
			const setTypes = ObjectUtil.getSetTypes();
			const treeSkipTypes = setTypes.concat(ObjectUtil.getSystemTypes()).concat(ObjectUtil.getFileTypes());

			// Sets can only become Link and List layouts, non-sets can't become List
			if (treeSkipTypes.includes(this.target.type)) {
				options = options.filter(it => it != I.WidgetLayout.Tree);
			};
			if (!setTypes.includes(this.target.type)) {
				options = options.filter(it => it != I.WidgetLayout.List);
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

	isCollection () {
		return this.target && Object.values(Constant.widgetId).includes(this.target.id);
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
				let filters: I.Filter[] = [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: ObjectUtil.getSystemTypes().concat(ObjectUtil.getFileTypes()) },
				];

				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters,
					value: this.target ? this.target.id : '',
					dataChange: (items: any[]) => {
						const fixed: any[] = [
							{ id: Constant.widgetId.favorite, name: 'Favorites', iconEmoji: ':star:' },
							{ id: Constant.widgetId.set, name: 'Sets', iconEmoji: ':mag:' },
							{ id: Constant.widgetId.collection, name: 'Collections', iconEmoji: ':card_index_dividers:' },
							{ id: Constant.widgetId.recent, name: 'Recent', iconEmoji: ':date:' },
						];
						return !items.length ? fixed : fixed.concat([ { isDiv: true } ]).concat(items);
					},
					onSelect: (target) => {
						this.target = target;
						
						const options = this.getLayoutOptions();
						if (options.length) {
							this.layout = options[0].id;
						};

						this.checkState();
						this.forceUpdate();
						
						if (isEditing) {
							this.save();
						};
					},
				});
				break;

			case 'layout':
				menuId = 'select';
				menuParam.width = 320;
				menuParam.data = Object.assign(menuParam.data, {
					options: this.getLayoutOptions(),
					value: this.layout,
					onSelect: (e, option) => {
						this.layout = option.id;
						this.checkState();
						this.forceUpdate();
						
						if (isEditing) {
							this.save();
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
		const { isEditing, onSave } = data;
		const { widgets } = blockStore;

        if (!this.target || (this.layout === null)) {
			return;
		};

		const targetId = this.getTargetId();
		const position = isEditing ? I.BlockPosition.Replace : I.BlockPosition.Top;
		const newBlock = { 
			type: I.BlockType.Link,
			content: { 
				targetBlockId: this.target.id,   
			},
		};

		C.BlockCreateWidget(widgets, targetId, newBlock, position, this.layout, () => {
			if (onSave) {
				onSave();
			};

			if (!isEditing) {
				analytics.event('AddWidget', { type: this.layout });
			};
		});

		close(); 
    };

	getTargetId (): string {
		const { param } = this.props;
		const { data } = param;
		const { isEditing, blockId, coords } = data;

		let targetId = '';

		if (isEditing) {
			targetId = blockId;
		} else  
		if (coords) {
			const widgetIds = blockStore.getChildrenIds(blockStore.widgets, blockStore.widgets);

			if (!widgetIds.length) {
				return '';
			};

			let prevY = 0;
			for (let id of widgetIds) {
				const item = $(`#widget-${id}`);
				if (!item || !item.length) {
					continue;
				};

				const { top } = item.offset();
				const height = item.outerHeight();
				
				if ((coords.y >= prevY) && (coords.y <= top + height + 12)) {
					targetId = id;
					break;
				};

				prevY = top;
			};
		};

		return targetId;
	};

});

export default MenuWidget;