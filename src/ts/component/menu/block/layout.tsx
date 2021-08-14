import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { blockStore } from 'ts/store';
import { I, keyboard, Key, DataUtil } from 'ts/lib';
import { detailStore, menuStore } from 'ts/store';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

class MenuBlockLayout extends React.Component<Props, {}> {
	
	n: number = 0;
	
	constructor (props: any) {
		super(props);
		
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
							onMouseEnter={(e: any) => { this.onOver(e, action); }} 
							onClick={(e: any) => { this.onClick(e, action); }} 
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
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
	};
	
	componentWillUnmount () {
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getSections () {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const allowedLayout = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Layout ]);
		const allowedDetails = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Details ]);
		const object = detailStore.get(rootId, rootId, [ 'layoutAlign' ]);
		
		let align = { id: 'align', name: 'Align', icon: [ 'align', DataUtil.alignIcon(object.layoutAlign) ].join(' '), arrow: true };
		let resize = { id: 'resize', icon: 'resize', name: 'Set layout width' };

		if (!allowedDetails || (object.layout == I.ObjectLayout.Task)) {
			align = null;
		};
		if (!allowedDetails) {
			resize = null;
		};

		let sections = [];
		if (allowedLayout) {
			sections.push({ name: 'Choose layout type', children: DataUtil.menuTurnLayouts() });
		};

		sections.push({ 
			children: [ 
				resize,
				align,
			]
		});

		sections = sections.filter((section: any) => {
			section.children = section.children.filter((child: any) => { return child; });
			return section.children.length > 0;
		});

		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};
	
	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};

		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.layout);
			return;
		};

		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = detailStore.get(rootId, rootId);

		let menuId = '';
		let menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			classNameWrap: param.classNameWrap,
			data: {
				rootId: rootId,
			},
		};

		switch (item.id) {
			case 'align':
				menuId = 'blockAlign';

				menuParam.data = Object.assign(menuParam.data, {
					value: object.layoutAlign,
					onSelect: (align: I.BlockAlign) => {
						DataUtil.pageSetAlign(rootId, align);
						close();
					}
				});
				break;
		};

		if (menuId && !menuStore.isOpen(menuId, item.id)) {
			menuStore.closeAll(Constant.menuIds.more, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};
	
	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;

		if (item.arrow) {
			return;
		};

		close();

		if (item.id == 'resize') {
			this.onResize(e);
		} else {
			DataUtil.pageSetLayout(rootId, item.id);
		};
	};

	onResize (e: any) {
		$('#editorWrapper').addClass('isResizing');
	};
	
};

export default MenuBlockLayout;