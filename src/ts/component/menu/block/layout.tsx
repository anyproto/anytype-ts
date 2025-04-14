import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { I, S, U, J, keyboard, analytics, translate } from 'Lib';

class MenuBlockLayout extends React.Component<I.Menu> {
	
	n = -1;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onResize = this.onResize.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const sections = this.getSections();

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
							onMouseEnter={e => this.onMouseEnter(e, action)} 
							onClick={e => this.onClick(e, action)} 
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
	};
	
	componentDidMount () {
		this.rebind();
	};

	componentWillUnmount (): void {
		S.Menu.closeAll(J.Menu.layout);
	};
	
	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
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
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};
	
	onOver (e: any, item: any) {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.layout);
			return;
		};

		const { id, param, getId, getSize, close } = this.props;

		if (S.Menu.isAnimating(id)) {
			return;
		};

		const { data } = param;
		const { rootId } = data;
		const object = S.Detail.get(rootId, rootId);

		const menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			classNameWrap: param.classNameWrap,
			rebind: this.rebind,
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
	
	onClick (e: any, item: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { rootId } = data;

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
				this.onResize(e);
				break;
			};
		};
	};

	onResize (e: any) {
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
	};
	
};

export default MenuBlockLayout;
