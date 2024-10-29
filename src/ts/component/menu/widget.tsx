import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical, Button } from 'Component';
import { I, C, S, U, J, keyboard, translate, Action, analytics } from 'Lib';

const MenuWidget = observer(class MenuWidget extends React.Component<I.Menu> {

	_isMounted = false;
	node: any = null;
	n = -1;
	target = null;
	layout: I.WidgetLayout = null;
	limit = 0;

	constructor (props: I.Menu) {
		super(props);

		const { param } = this.props;
		const { data } = param;
		const { isEditing, layout, limit, target } = data;

		this.save = this.save.bind(this);
		this.rebind = this.rebind.bind(this);

		if (isEditing) {
			this.layout = layout;
			this.limit = limit;
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
				</div>

				{!isEditing ? (
					<div className="buttons">
						<Button 
							id="button-save"
							className="c28"
							text={translate('menuWidgetAddWidget')}
							onClick={this.save} 
							onMouseEnter={() => S.Menu.closeAll(J.Menu.widget)} 
						/>
					</div>
				) : ''}
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
		const { param } = this.props;
		const { data } = param;
		const { blockId } = data;

		this._isMounted = false;
		this.unbind();

		S.Menu.closeAll(J.Menu.widget);
		$(window).trigger(`updateWidgetData.${blockId}`);
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
		this.checkState();

		const { param } = this.props;
		const { data } = param;
		const { isEditing } = data;
		const hasLimit = ![ I.WidgetLayout.Link, I.WidgetLayout.Tree ].includes(this.layout) || U.Menu.isSystemWidget(this.target?.id);

		let sourceName = translate('menuWidgetChooseSource');
		let layoutName = translate('menuWidgetWidgetType');

		if (this.target) {
			sourceName = U.Object.name(this.target);
		};

		if (this.layout !== null) {
			layoutName = translate(`widget${this.layout}Name`);
		};

		const sections: any[] = [
			{ 
				id: 'source', name: translate('menuWidgetWidgetSource'), children: [
					{ id: 'source', name: sourceName, arrow: true, object: this.target }
				] 
			},
			{ 
				id: 'layout', name: translate('commonAppearance'), children: [
					{ id: 'layout', name: layoutName, arrow: true },
					hasLimit ? { id: 'limit', name: translate('menuWidgetNumberOfObjects'), arrow: true, caption: this.limit } : null,
				] 
			},
		];

		if (isEditing) {
			sections.push({
				children: [
					{ id: 'remove', name: translate('menuWidgetRemoveWidget'), icon: 'removeWidget' },
					{ id: 'edit', name: translate('menuWidgetEditWidgets'), icon: 'source' }
				],
			});
		};

		return U.Menu.sectionsMap(sections);
	};

	checkState () {
		const { id, layout } = this.target || {};
		const layoutOptions = U.Menu.getWidgetLayoutOptions(id, layout).map(it => it.id);

		if (U.Menu.isSystemWidget(id)) {
			if ([ null, I.WidgetLayout.Link ].includes(this.layout)) {
				this.layout = id == J.Constant.widgetId.favorite ? I.WidgetLayout.Tree : I.WidgetLayout.Compact;
			};
		} else {
			if ([ I.WidgetLayout.List, I.WidgetLayout.Compact ].includes(this.layout) && !U.Object.isInSetLayouts(layout)) {
				this.layout = I.WidgetLayout.Tree;
			};

			if ((this.layout == I.WidgetLayout.Tree) && U.Object.isInSetLayouts(layout)) {
				this.layout = I.WidgetLayout.Compact;
			};
		};

		this.layout = layoutOptions.includes(this.layout) ? this.layout : (layoutOptions.length ? layoutOptions[0] : null);

		const limitOptions = U.Menu.getWidgetLimitOptions(this.layout).map(it => Number(it.id));

		this.limit = limitOptions.includes(this.limit) ? this.limit : (limitOptions.length ? limitOptions[0] : null);
	};

	getItems () {
		const sections = this.getSections();

		let items = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		return items;
	};

	onMouseEnter (e: React.MouseEvent, item): void {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};

	onOver (e: React.MouseEvent, item) {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.widget);
			return;
		};

		const { getId, getSize, param, close } = this.props;
		const { data, className, classNameWrap } = param;
		const { blockId, isEditing } = data;
		const { widgets } = S.Block;
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
			case 'source': {
				const templateType = S.Record.getTemplateType();
				const filters: I.Filter[] = [
					{ relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
					{ relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType?.id },
				];

				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					route: analytics.route.widget,
					filters,
					value: this.target ? this.target.id : '',
					canAdd: true,
					dataChange: (context: any, items: any[]) => {
						const reg = new RegExp(U.Common.regexEscape(context.filter), 'gi');
						const fixed: any[] = U.Menu.getFixedWidgets().filter(it => it.name.match(reg));

						return !items.length ? fixed : fixed.concat([ { isDiv: true } ]).concat(items);
					},
					onSelect: (target: any, isNew: boolean) => {
						this.target = target;
						this.checkState();
						this.forceUpdate();
						
						if (isEditing && this.target) {
							if (isNew) {
								U.Object.openConfig(target);
							};

							C.BlockWidgetSetTargetId(widgets, blockId, this.target.id, () => {
								C.BlockWidgetSetLayout(widgets, blockId, this.layout, () => close());
							});
						};

						analytics.event('ChangeWidgetSource', {
							layout: this.layout,
							route: isEditing ? 'Inner' : 'AddWidget',
							params: { target },
						});
					},
				});
				break;
			};

			case 'layout': {
				menuId = 'select';
				menuParam.width = 320;
				menuParam.data = Object.assign(menuParam.data, {
					options: U.Menu.getWidgetLayoutOptions(this.target?.id, this.target?.layout),
					value: this.layout,
					onSelect: (e, option) => {
						this.layout = Number(option.id);
						this.checkState();
						this.forceUpdate();
						
						if (isEditing) {
							C.BlockWidgetSetLayout(widgets, blockId, this.layout, () => close());
						};

						analytics.event('ChangeWidgetLayout', {
							layout: this.layout,
							route: isEditing ? 'Inner' : 'AddWidget',
							params: { target: this.target },
						});
					},
				});
				break;
			};

			case 'limit':
				menuId = 'select';
				menuParam.data = Object.assign(menuParam.data, {
					options: U.Menu.getWidgetLimitOptions(this.layout),
					value: String(this.limit || ''),
					onSelect: (e, option) => {
						this.limit = Number(option.id);
						this.checkState();
						this.forceUpdate();
						
						if (isEditing) {
							C.BlockWidgetSetLimit(widgets, blockId, this.limit, () => close());
						};

						analytics.event('ChangeWidgetLimit', {
							limit: this.limit,
							layout: this.layout,
							route: isEditing ? 'Inner' : 'AddWidget',
							params: { target: this.target },
						});
					},
				});
				break;
		};

		if (menuId && !S.Menu.isOpen(menuId, item.itemId)) {
			S.Menu.closeAll(J.Menu.widget, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	onClick (e: React.MouseEvent, item) {
		if (item.arrow) {
			return;
		};

		const { param, close } = this.props;
		const { data } = param;
		const { blockId, setEditing, target } = data;

		switch (item.itemId) {
			case 'remove':
				Action.removeWidget(blockId, target);
				break;

			case 'edit':
				setEditing(true);
				analytics.event('EditWidget');
				break;
		};

		close();
	};

	save (): void {
		const { close, param } = this.props;
		const { data } = param;
		const { isEditing, onSave } = data;
		const { widgets } = S.Block;

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

		C.BlockCreateWidget(widgets, targetId, newBlock, position, this.layout, this.limit, () => {
			if (onSave) {
				onSave();
			};

			if (!isEditing) {
				analytics.event('AddWidget', { type: this.layout, route: analytics.route.addWidgetMenu });
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
			const widgetIds = S.Block.getChildrenIds(S.Block.widgets, S.Block.widgets);

			if (!widgetIds.length) {
				return '';
			};

			let prevY = 0;
			for (const id of widgetIds) {
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
