import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical, Icon } from 'Component';
import { I, C, S, U, J, keyboard, translate, Action, analytics } from 'Lib';

const MenuWidget = observer(class MenuWidget extends React.Component<I.Menu> {

	node: any = null;
	n = -1;
	target = null;
	layout: I.WidgetLayout = null;
	limit = 0;

	constructor (props: I.Menu) {
		super(props);

		const { param } = this.props;
		const { data } = param;
		const { layout, limit, target } = data;

		this.save = this.save.bind(this);
		this.rebind = this.rebind.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);

		this.layout = layout;
		this.limit = limit;
		this.target = target;
		this.checkState();
};

	render(): React.ReactNode {
		const { param } = this.props;
		const { data } = param;
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
			</div>
		);
	}

	componentDidMount () {
		this.checkButton();
		this.rebind();

		analytics.event('ScreenWidgetMenu');
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
		const { blockId, isPreview } = data;
		const { widgets } = S.Block;
		const hasLimit = ![ I.WidgetLayout.Link ].includes(this.layout);
		const canRemove = U.Space.canMyParticipantWrite();
		const layoutOptions = U.Menu.prepareForSelect(U.Menu.getWidgetLayoutOptions(this.target?.id, this.target?.layout, isPreview));
		const block = S.Block.getLeaf(widgets, blockId);

		if (!block) {
			return [];
		};

		const sections: any[] = [];

		if (layoutOptions.length > 1) {
			sections.push({
				id: 'layout',
				name: translate('commonAppearance'),
				children: [],
				options: layoutOptions,
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

		if (canRemove) {
			const children: any[] = [];
			const isPinned = block.content.section == I.WidgetSection.Pin;
			const isSystem = U.Menu.isSystemWidget(this.target?.id);

			if (isPinned) {
				const name = isSystem ? translate('menuWidgetRemoveWidget') : translate('commonUnpin');
				const icon = isSystem ? 'remove' : 'unpin';

				children.push({ id: 'removeWidget', name, icon });
			} else {
				//children.push({ id: 'removeType', name: translate('menuWidgetRemoveType'), icon: 'remove' });
			};

			if (sections.length && children.length) {
				children.unshift({ isDiv: true });
			};

			if (children.length) {
				sections.push({ children });
			};
		};

		return sections;
	};

	checkState () {
		const { id, layout } = this.target || {};
		const layoutOptions = U.Menu.getWidgetLayoutOptions(id, layout).map(it => it.id);

		if (U.Menu.isSystemWidget(id)) {
			if ((id != J.Constant.widgetId.bin) && [ null, I.WidgetLayout.Link ].includes(this.layout)) {
				this.layout = I.WidgetLayout.Compact;
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
		const { blockId, target } = data;
		const { widgets } = S.Block;
		const block = S.Block.getLeaf(widgets, blockId);

		if (!block) {
			return;
		};

		const isSectionPin = block.content.section == I.WidgetSection.Pin;
		const isSectionType = block.content.section == I.WidgetSection.Type;

		switch (section.id) {
			case 'layout': {
				this.layout = Number(option.id);
				this.checkState();
				this.forceUpdate();

				if (isSectionPin) {
					C.BlockWidgetSetLayout(widgets, blockId, this.layout, () => close());
				} else
				if (isSectionType) {
					C.ObjectListSetDetails([ target.id ], [ { key: 'widgetLayout', value: this.layout } ], () => close());
				};

				analytics.event('ChangeWidgetLayout', {
					layout: this.layout,
					route: 'Inner',
					params: { target: this.target },
				});
				break;
			};

			case 'limit': {
				this.limit = Number(option.id);
				this.checkState();
				this.forceUpdate();

				if (isSectionPin) {
					C.BlockWidgetSetLimit(widgets, blockId, this.limit, () => close());
				} else
				if (isSectionType) {
					C.ObjectListSetDetails([ target.id ], [ { key: 'widgetLimit', value: this.limit } ], () => close());
				};

				analytics.event('ChangeWidgetLimit', {
					limit: this.limit,
					layout: this.layout,
					route: 'Inner',
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
		const isSystem = U.Menu.isSystemWidget(this.target?.id);

		switch (item.id) {
			case 'removeWidget': {
				if (isSystem) {
					const param: Partial<I.MenuParam> = {
						data: {
							icon: 'warning-red',
							title: translate('popupConfirmSystemWidgetRemoveTitle'),
							text: translate('popupConfirmSystemWidgetRemoveText'),
							textConfirm: translate('commonDelete'),
							colorConfirm: 'red',
							onConfirm: () => {
								Action.removeWidget(blockId, target);
							},
						},
					};


					if (this.target?.id == J.Constant.widgetId.favorite) {
						param.className = 'removeFavorite';
						param.data.title = translate('popupConfirmSystemWidgetRemoveFavoriteTitle');
						param.data.text = translate('popupConfirmSystemWidgetRemoveFavoriteText');
						param.data.icon = 'screenshot';
					};

					S.Popup.open('confirm', param);
				} else {
					Action.removeWidget(blockId, target);
				};
				break;
			};

			case 'removeType': {
				S.Popup.open('confirm', {
					data: {
						icon: 'confirm',
						colorConfirm: 'red',
						title: translate('popupConfirmDeleteTypeTitle'),
						text: translate('popupConfirmDeleteTypeText'),
						onConfirm: () => {
							Action.archive([ target.id ], analytics.route.addWidgetMenu);
						},
					},
				});
				break;
			};
		};

		close();
	};

	save (): void {
		const { close, param } = this.props;
		const { data } = param;
		const { blockId, onSave } = data;
		const { widgets } = S.Block;

		if (!this.target || (this.layout === null)) {
			return;
		};

		const newBlock = { 
			type: I.BlockType.Link,
			content: { 
				targetBlockId: this.target.id, 
			},
		};

		C.BlockCreateWidget(widgets, blockId, newBlock, I.BlockPosition.Replace, this.layout, this.limit, onSave);
		close(); 
	};

});

export default MenuWidget;