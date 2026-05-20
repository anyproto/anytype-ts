import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { MenuItemVertical } from 'Component';
import * as I from 'Interface';

const MenuBlockLayout = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { id, param, getId, getSize, close, onKeyDown, setActive } = props;
	const { data } = param;
	const { rootId, value, isPopup } = data;
	const n = useRef(-1);

	const rebind = () => {
		unbind();
		U.Dom.addEvent(window, 'keydown', onKeyDown);
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		U.Dom.removeEvent(window, 'keydown', onKeyDown);
	};

	const getSections = () => {
		const allowedDetails = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const object = S.Detail.get(rootId, rootId);
		const hasConflict = U.Object.hasLayoutConflict(object);
		
		let align = { id: 'align', name: translate('sidebarSectionLayoutAlign'), iconParam: { name: U.Data.alignHIcon(object.layoutAlign) }, arrow: true };
		let resize = { id: 'resize', iconParam: { name: 'menu/action/resize' }, name: translate('menuBlockLayoutSetLayoutWidth') };

		if (!allowedDetails || U.Object.isTaskLayout(object.layout) || U.Object.isInSetLayouts(object.layout)) {
			align = null;
		};
		if (!allowedDetails || U.Object.isInSetLayouts(object.layout)) {
			resize = null;
		};

		let sections: any[] = [ { children: [ resize, align ] } ];

		if (hasConflict) {
			sections.unshift({
				name: translate('menuBlockLayoutConflict'),
				children: [ { id: 'reset', iconParam: { name: 'menu/action/reload' }, name: translate('menuBlockLayoutReset') } ]
			});
		};

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	};
	
	const getItems = () => {
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		return items;
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
			onOver(e, item);
		};
	};
	
	const onOver = (e: any, item: any) => {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.layout);
			return;
		};

		if (S.Menu.isAnimating(id)) {
			return;
		};

		const { data } = param;
		const { rootId } = data;
		const object = S.Detail.get(rootId, rootId);

		const menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${U.Common.esc(item.id)}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			classNameWrap: param.classNameWrap,
			rebind,
			parentId: id,
			data: {
				rootId: rootId,
			},
		};

		let menuId = '';

		switch (item.id) {
			case 'align':
				menuId = 'blockAlign';

				menuParam.data = Object.assign(menuParam.data, {
					value: object.layoutAlign,
					restricted: [ I.BlockHAlign.Justify ],
					onSelect: (align: I.BlockHAlign) => {
						U.Object.setAlign(rootId, align);

						analytics.event('SetLayoutAlign', { align, route: analytics.route.object });
						close();
					}
				});
				break;
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll(J.Menu.layout, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};
	
	const onClick = (e: any, item: any) => {
		if (item.arrow) {
			return;
		};

		close();

		switch (item.id) {
			case 'reset': {
				U.Object.resetLayout(rootId);
				analytics.event('ResetToTypeDefault', { route: analytics.route.object });
				break;
			};

			case 'resize': {
				onResize(e);
				break;
			};
		};
	};

	const onResize = (e: any) => {
		const containerEl = U.Dom.getPageFlexContainer(isPopup);
		const wrapper = U.Dom.get('editorWrapper');

		U.Dom.addClass(wrapper, 'isResizing');

		const onMouseDown = (e: any) => {
			if (!(e.target as HTMLElement).closest('#editorSize')) {
				U.Dom.removeClass(wrapper, 'isResizing');
				if (containerEl) {
					U.Dom.removeEvent(containerEl, 'mousedown', onMouseDown);
				};
			};
		};
		if (containerEl) {
			U.Dom.addEvent(containerEl, 'mousedown', onMouseDown);
		};

		analytics.event('SetLayoutWidth');
	};

	const sections = getSections();

	const Section = (item: any) => (
		<div id={`section-${item.id}`} className="section">
			{item.name ? <div className="name">{item.name}</div> : ''}
			<div className="items">
				{item.children.map((action: any, i: number) => (
					<MenuItemVertical 
						key={i} 
						{...action} 
						icon={action.icon || action.id}
						checkbox={action.id == value}
						onMouseEnter={e => onMouseEnter(e, action)} 
						onClick={e => onClick(e, action)} 
					/>
				))}
			</div>
		</div>
	);

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		onOver,
	}), []);
	
	return (
		<div>
			{sections.map((item: any, i: number) => (
				<Section key={i} index={i} {...item} />
			))}
		</div>
	);
	
});

export default MenuBlockLayout;