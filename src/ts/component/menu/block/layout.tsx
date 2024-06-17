import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { blockStore } from 'Store';
import { I, keyboard, analytics, UtilData, UtilObject, UtilMenu, UtilCommon, translate } from 'Lib';
import { detailStore, menuStore } from 'Store';
const Constant = require('json/constant.json');

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
		menuStore.closeAll(Constant.menuIds.layout);
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
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const allowedLayout = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Layout ]);
		const allowedDetails = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const object = detailStore.get(rootId, rootId, [ 'layoutAlign' ]);
		
		let align = { id: 'align', name: translate('commonAlign'), icon: [ 'align', UtilData.alignHIcon(object.layoutAlign) ].join(' '), arrow: true };
		let resize = { id: 'resize', icon: 'resize', name: translate('menuBlockLayoutSetLayoutWidth') };

		if (!allowedDetails || (object.layout == I.ObjectLayout.Task)) {
			align = null;
		};
		if (!allowedDetails) {
			resize = null;
		};

		let sections = [];
		if (allowedLayout) {
			sections.push({ name: translate('menuBlockLayoutChooseLayoutType'), children: UtilMenu.turnLayouts() });
		};

		sections.push({ 
			children: [ 
				resize,
				align,
			]
		});

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
			menuStore.closeAll(Constant.menuIds.layout);
			return;
		};

		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = detailStore.get(rootId, rootId);

		let menuId = '';
		const menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			classNameWrap: param.classNameWrap,
			data: {
				rootId: rootId,
				rebind: this.rebind,
			},
		};

		switch (item.id) {
			case 'align':
				menuId = 'blockAlign';

				menuParam.data = Object.assign(menuParam.data, {
					value: object.layoutAlign,
					onSelect: (align: I.BlockHAlign) => {
						UtilObject.setAlign(rootId, align);

						analytics.event('SetLayoutAlign', { align });
						close();
					}
				});
				break;
		};

		if (menuId && !menuStore.isOpen(menuId, item.id)) {
			menuStore.closeAll(Constant.menuIds.layout, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};
	
	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, onLayoutSelect } = data;
		const object = detailStore.get(rootId, rootId, []);

		if (item.arrow) {
			return;
		};

		close();

		if (item.id == 'resize') {
			this.onResize(e);

			analytics.event('SetLayoutWidth');
		} else {
			UtilObject.setLayout(rootId, item.id, (message: any) => {
				if (onLayoutSelect) {
					onLayoutSelect(item.id);
				};
			});

			analytics.event('ChangeLayout', { objectType: object.type, layout: item.id });
		};
	};

	onResize (e: any) {
		const container = UtilCommon.getPageContainer(keyboard.isPopup());
		const wrapper = $('#editorWrapper');

		wrapper.addClass('isResizing');

		container.off('mousedown.editorSize').on('mousedown.editorSize', (e: any) => { 
			if (!$(e.target).parents(`#editorSize`).length) {
				wrapper.removeClass('isResizing');
				container.off('mousedown.editorSize');
			};
		});
	};
	
};

export default MenuBlockLayout;