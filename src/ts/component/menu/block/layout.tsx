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
		const allowedLayout = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Layout ]);
		const allowedDetails = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const object = S.Detail.get(rootId, rootId, [ 'layoutAlign' ]);
		
		let align = { id: 'align', name: translate('commonAlign'), icon: [ 'align', U.Data.alignHIcon(object.layoutAlign) ].join(' '), arrow: true };
		let resize = { id: 'resize', icon: 'resize', name: translate('menuBlockLayoutSetLayoutWidth') };

		if (!allowedDetails || U.Object.isTaskLayout(object.layout)) {
			align = null;
		};
		if (!allowedDetails) {
			resize = null;
		};

		let sections = [];
		if (allowedLayout) {
			sections.push({ name: translate('menuBlockLayoutChooseLayoutType'), children: U.Menu.turnLayouts() });
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
					onSelect: (align: I.BlockHAlign) => {
						U.Object.setAlign(rootId, align);

						analytics.event('SetLayoutAlign', { align });
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
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, onLayoutSelect } = data;
		const object = S.Detail.get(rootId, rootId, []);

		if (item.arrow) {
			return;
		};

		close();

		if (item.id == 'resize') {
			this.onResize(e);

			analytics.event('SetLayoutWidth');
		} else {
			U.Object.setLayout(rootId, item.id, (message: any) => {
				if (onLayoutSelect) {
					onLayoutSelect(item.id);
				};
			});

			analytics.event('ChangeLayout', { objectType: object.type, layout: item.id });
		};
	};

	onResize (e: any) {
		const container = U.Common.getPageContainer(keyboard.isPopup());
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