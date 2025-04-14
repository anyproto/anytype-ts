import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical, Button, Icon } from 'Component';
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
		this.onMouseLeave = this.onMouseLeave.bind(this);

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

				{item.options ? (
					<div className="options">
						{item.options.map((option, i) => {
							const cn = [ 'option' ];

							if (item.value == option.id) {
								cn.push('active');
							};

							if (option.icon) {
								cn.push('icon');
							};

							return (
								<div className={cn.join(' ')} key={i} onClick={e => this.onOptionClick(e, option, item)}>
									{option.icon ? <Icon className={option.icon} tooltipParam={{ text: option.description }} /> : option.name}
								</div>
							);
						})}
					</div>
				) : ''}

				{item.children.length ? (
					<div className="items">
						{item.children.map((action, i) => (
							<MenuItemVertical
								key={i}
								{...action}
								onMouseEnter={e => this.onMouseEnter(e, action)}
								onMouseLeave={this.onMouseLeave}
								onClick={e => this.onClick(e, action)}
							/>
						))}
					</div>
				) : ''}
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
		const { param } = this.props;
		const { data } = param;
		const { blockId } = data;
		const { widgets } = S.Block;
		const block = S.Block.getLeaf(widgets, blockId);

		this._isMounted = true;
		this.checkButton();
		this.rebind();
		this.getTargetId();

		analytics.event('ScreenWidgetMenu', { widgetType: analytics.getWidgetType(block?.content.autoAdded) });
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
		const layoutOptions = U.Menu.prepareForSelect(U.Menu.getWidgetLayoutOptions(this.target?.id, this.target?.layout));
		const hasLimit = ![ I.WidgetLayout.Link, I.WidgetLayout.Tree ].includes(this.layout);
		const sections: any[] = [];

		if (layoutOptions.length > 1) {
			sections.push({
				id: 'layout',
				name: translate('commonAppearance'),
				children: [],
				options: U.Menu.prepareForSelect(U.Menu.getWidgetLayoutOptions(this.target?.id, this.target?.layout)),
				value: this.layout,
			});
		};

		if (hasLimit) {
			sections.push({
				id: 'limit',
				name: translate('menuWidgetNumberOfObjects'),
				children: [],
				options: U.Menu.getWidgetLimitOptions(this.layout),
				value: this.limit,
			});
		};

		if (isEditing) {
			const children: any[] = [ 
				{ id: 'remove', name: translate('menuWidgetRemoveWidget'), icon: 'removeWidget' },
			];

			if (sections.length) {
				children.unshift({ isDiv: true });
			};

			sections.push({ children });
		};

		return sections;
	};

	checkState () {
		const { id, layout } = this.target || {};
		const layoutOptions = U.Menu.getWidgetLayoutOptions(id, layout).map(it => it.id);

		if (U.Menu.isSystemWidget(id)) {
			if ((id != J.Constant.widgetId.bin) && [ null, I.WidgetLayout.Link ].includes(this.layout)) {
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
		};
	};

	onMouseLeave () {
		$(this.node).find('.hover').removeClass('hover');
	};

	onOptionClick (e: React.MouseEvent, option: any, section: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { blockId, isEditing } = data;
		const { widgets } = S.Block;

		switch (section.id) {
			case 'layout': {
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
				break;
			};

			case 'limit': {
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
				break;
			};
		};
	};

	onClick (e: React.MouseEvent, item) {
		if (item.arrow) {
			return;
		};

		const { param, close } = this.props;
		const { data } = param;
		const { blockId, target } = data;

		switch (item.id) {
			case 'remove': {
				Action.removeWidget(blockId, target);
				break;
			};
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
				analytics.createWidget(this.layout, analytics.route.addWidgetMenu, analytics.widgetType.manual);
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