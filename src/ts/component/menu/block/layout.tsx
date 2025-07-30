import * as React from 'react';
import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, S, U, J, keyboard, analytics, translate } from 'Lib';

const MenuBlockLayout = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, onKeyDown, setActive, close, getId, getSize } = props;
	const { data } = param;
	const n = useRef(-1);

	const rebind = useCallback(() => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	}, [ onKeyDown, setActive ]);
	
	const unbind = useCallback(() => {
		$(window).off('keydown.menu');
	}, []);

	const getSections = useCallback(() => {
		const { rootId } = data;
		const allowedDetails = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const object = S.Detail.get(rootId, rootId);
		const hasConflict = U.Object.hasLayoutConflict(object);
		
		let align = { id: 'align', name: translate('sidebarSectionLayoutAlign'), icon: [ 'align', U.Data.alignHIcon(object.layoutAlign) ].join(' '), arrow: true };
		let resize = { id: 'resize', icon: 'resize', name: translate('menuBlockLayoutSetLayoutWidth') };

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
				children: [ { id: 'reset', icon: 'reload', name: translate('menuBlockLayoutReset') } ]
			});
		};

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	}, [ data ]);
	
	const getItems = useCallback(() => {
		const sections = getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	}, [ getSections ]);

	const onMouseEnter = useCallback((e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
			onOver(e, item);
		};
	}, [ setActive ]);
	
	const onOver = useCallback((e: any, item: any) => {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.layout);
			return;
		};

		const id = getId();

		if (S.Menu.isAnimating(id)) {
			return;
		};

		const { rootId } = data;
		const object = S.Detail.get(rootId, rootId);

		const menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${id} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			classNameWrap: param.classNameWrap,
			rebind: rebind,
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
	}, [ data, getId, getSize, param, rebind, close ]);
	
	const onClick = useCallback((e: any, item: any) => {
		if (item.arrow) {
			return;
		};

		close();

		const { rootId } = data;

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
	}, [ close, data ]);

	const onResize = useCallback((e: any) => {
		const container = U.Common.getPageFlexContainer(keyboard.isPopup());
		const wrapper = $('#editorWrapper');

		wrapper.addClass('isResizing');

		container.off('mousedown.editorSize').on('mousedown.editorSize', (e: any) => { 
			if (!$(e.target).parents(`#editorSize`).length) {
				wrapper.removeClass('isResizing');
				container.off('mousedown.editorSize');
			};
		});

		analytics.event('SetLayoutWidth');
	}, []);

	useEffect(() => {
		rebind();
		
		return () => {
			S.Menu.closeAll(J.Menu.layout);
			unbind();
		};
	}, [ rebind, unbind ]);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getSections,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		onOver,
	}), [ rebind, unbind, getSections, getItems, onClick, onOver ]);

	const { value } = data;
	const sections = getSections();

	const Section = (item: any) => (
		<div id={'section-' + item.id} className="section">
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
	
	return (
		<div>
			{sections.map((item: any, i: number) => (
				<Section key={i} index={i} {...item} />
			))}
		</div>
	);

}));

export default MenuBlockLayout;
