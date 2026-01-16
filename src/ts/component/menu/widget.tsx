import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { MenuItemVertical, Icon } from 'Component';
import { I, C, S, U, J, keyboard, translate, Action, analytics } from 'Lib';

const MenuWidget = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close, setActive, onKeyDown, position } = props;
	const { data } = param;
	const { blockId, isPreview } = data;
	const { widgets } = S.Block;
	const [ layout, setLayout ] = useState<I.WidgetLayout>(data.layout);
	const [ limit, setLimit ] = useState(data.limit);
	const [ target, setTarget ] = useState(data.target);
	const nodeRef = useRef(null);
	const needUpdate = useRef(false);
	const n = useRef(-1);

	useEffect(() => {
		needUpdate.current = false;
		rebind();

		return () => {
			unbind();
			S.Menu.closeAll(J.Menu.widget);

			if (needUpdate.current) {
				$(window).trigger(`updateWidgetData.${blockId}`);
			};
		};
	}, []);

	useEffect(() => {
		setActive();
		position();
	});
	
	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getSections = () => {
		const checked = checkState(layout, limit);
		const hasLimit = ![ I.WidgetLayout.Link ].includes(checked.layout);
		const canRemove = U.Space.canMyParticipantWrite();
		const layoutOptions = U.Menu.getWidgetLayoutOptions(target?.id, target?.layout, isPreview);
		const block = S.Block.getLeaf(widgets, blockId);
		const isSystem = U.Menu.isSystemWidget(target?.id);

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
				value: layout,
			});
		};

		if (hasLimit) {
			sections.push({
				id: 'limit',
				name: translate('menuWidgetNumberOfObjects'),
				children: [],
				options: U.Menu.getWidgetLimitOptions(layout),
				value: limit,
			});
		};

		if (canRemove) {
			const children: any[] = [];
			const isPinned = block.content.section == I.WidgetSection.Pin;
			const isSystem = U.Menu.isSystemWidget(target?.id);

			if (isPinned) {
				const name = isSystem ? translate('menuWidgetRemoveWidget') : translate('commonUnpin');
				const icon = isSystem ? 'remove' : 'unpin';

				children.push({ id: 'removeWidget', name, icon });
			};

			if (sections.length && children.length) {
				children.unshift({ isDiv: true });
			};

			if (children.length) {
				sections.push({ children });
			};
		};

		if (!isSystem) {
			sections.push({
				children: [
					{ isDiv: true },
					{ id: 'newTab', icon: 'newTab', name: translate('menuObjectOpenInNewTab') },
					{ id: 'newWindow', icon: 'newWindow', name: translate('menuObjectOpenInNewWindow') },
				]
			});
		};

		return sections;
	};

	const checkState = (layout: number, limit: number) => {
		if (!target) {
			return;
		};

		const layoutOptions = U.Menu.getWidgetLayoutOptions(target.id, target.layout).map(it => it.id);
		const ret = {
			layout,
			limit,
		};

		if (U.Menu.isSystemWidget(target.id)) {
			if ((target.id != J.Constant.widgetId.bin) && [ null, I.WidgetLayout.Link ].includes(ret.layout)) {
				ret.layout = I.WidgetLayout.Compact;
			};
		} else {
			if ([ I.WidgetLayout.List, I.WidgetLayout.Compact ].includes(ret.layout) && !U.Object.isInSetLayouts(target.layout)) {
				ret.layout = I.WidgetLayout.Tree;
			};

			if ((ret.layout == I.WidgetLayout.Tree) && U.Object.isInSetLayouts(target.layout)) {
				ret.layout = I.WidgetLayout.Compact;
			};
		};

		ret.layout = layoutOptions.includes(ret.layout) ? ret.layout : (layoutOptions.length ? layoutOptions[0] : null);

		const limitOptions = U.Menu.getWidgetLimitOptions(ret.layout).map(it => Number(it.id));

		ret.limit = limitOptions.includes(ret.limit) ? ret.limit : (limitOptions.length ? limitOptions[0] : null);

		return ret;
	};

	const getItems = () => {
		const sections = getSections();

		let items = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		return items;
	};

	const onMouseEnter = (e: React.MouseEvent, item): void => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onOptionClick = (e: React.MouseEvent, option: any, section: any) => {
		const block = S.Block.getLeaf(widgets, blockId);

		if (!block) {
			return;
		};

		const isSectionPin = block.content.section == I.WidgetSection.Pin;

		needUpdate.current = true;

		switch (section.id) {
			case 'layout': {
				const { layout } = checkState(Number(option.id), limit);
				
				setLayout(layout);

				if (isSectionPin) {
					C.BlockWidgetSetLayout(widgets, blockId, layout, () => close());
				};

				analytics.event('ChangeWidgetLayout', { layout, route: 'Inner', params: { target } });
				break;
			};

			case 'limit': {
				const { limit } = checkState(layout, Number(option.id));

				setLimit(limit);

				if (isSectionPin) {
					C.BlockWidgetSetLimit(widgets, blockId, limit, () => close());
				};

				analytics.event('ChangeWidgetLimit', { limit, layout, route: 'Inner', params: { target } });
				break;
			};
		};
	};

	const onClick = (e: React.MouseEvent, item) => {
		if (item.arrow) {
			return;
		};

		const isSystem = U.Menu.isSystemWidget(target?.id);

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

					if (target?.id == J.Constant.widgetId.favorite) {
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

			case 'newTab': {
				U.Object.openTab(target);
				break;
			};

			case 'newWindow': {
				U.Object.openWindow(target);
				break;
			};
		};

		close();
	};

	const sections = getSections();

	const Section = item => (
		<div id={`section-${item.id}`} className="section">
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
							<div className={cn.join(' ')} key={i} onClick={e => onOptionClick(e, option, item)}>
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
							onMouseEnter={e => onMouseEnter(e, action)}
							onClick={e => onClick(e, action)}
						/>
					))}
				</div>
			) : ''}
		</div>
	);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
	}), []);
	
	return (
		<div ref={nodeRef}>
			<div className="sections">
				{sections.map((item, i) => (
					<Section key={i} index={i} {...item} />
				))}
			</div>
		</div>
	);

}));

export default MenuWidget;
