import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, Util, keyboard, Storage } from 'ts/lib';
import { IconObject, Icon, ObjectName, Loader } from 'ts/component';
import { authStore, blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	isPopup?: boolean;
	dataset?: any;
};

interface State {
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const Sidebar = observer(class Sidebar extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		loading: false,
	};
	data: any = {
		nodes: [],
		edges: [],
	};
	loaded: boolean = false;
	top: number = 0;
	id: string = '';
	ox: number = 0;
	oy: number = 0;
	width: number = 0;
	height: number = 0;
	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onExpand = this.onExpand.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { account } = authStore;
		const { sidebar } = commonStore;
		const { root, profile } = blockStore;
		const { width, height, x, y, fixed, snap } = sidebar;
		const { loading } = this.state;
		const sections = this.getSections();
		const css: any = { width };
		const cn = [ 'sidebar' ];

		if (snap == I.MenuDirection.Left) {
			cn.push('left');
		};
		if (snap == I.MenuDirection.Right) {
			cn.push('right');
		};

		if (!account) {
			return null;
		};

		if (fixed) {
			cn.push('fixed');
		} else {
			css.height = height;
		};

        let depth = 0;

		const Section = (section: any) => {
			const length = section.children.length;
			const id = [ 'section', section.id ].join('-');

			return (
				<div id={`item-${id}`} className="section">
					<div 
						className="sectionHead" 
						onMouseDown={(e: any) => { 
							if (length) {
								this.onToggle(e, id); 
							};
						}}
					>
						{length ? <Icon className="arrow" /> : ''}
						<div className="name">{section.name}</div>
						<div className="cnt">{section.children.length || ''}</div>
					</div>

					<div id={`children-${id}`} className="children">
						{section.children.map((child: any, i: number) => (
							<Item 
								key={child.id + '-' + depth} 
								{...child} 
								sectionId={section.id} 
								parentId="" 
								depth={depth} 
							/>
						))}
					</div>
				</div>
			);
		};

        const Item = (item: any) => {
			const css: any = { paddingLeft: 6 + item.depth * 4 };
			const length = item.children.length;
			const id = this.getId(item);
			const cn = [ 'item', 'depth' + item.depth ];

			if ((item.depth > 0) && !item.children.length) {
				css.paddingLeft += 20;
			};

            return (
                <div id={`item-${id}`} className={cn.join(' ')}>
                    <div className="flex" style={css} onMouseDown={(e: any) => { this.onClick(e, item); }}>
						{length ? <Icon className="arrow" onMouseDown={(e: any) => { this.onToggle(e, id); }} /> : ''}
                        <IconObject object={...item} size={20} />
						<ObjectName object={item} />
                    </div>

					<div id={`children-${id}`} className="children">
						{item.children.map((child: any, i: number) => (
							<Item 
								key={child.id + '-' + item.depth} 
								{...child} 
								sectionId={item.sectionId} 
								parentId={item.id} 
								depth={item.depth + 1} 
							/>
						))}
					</div>
                </div>
            );
        };

		return (
            <div id="sidebar" className={cn.join(' ')} style={css} onMouseLeave={this.onMouseLeave}>

				<div className="head" onMouseDown={this.onDragStart}>
					<Icon className={fixed ? 'close' : 'expand'} onMouseDown={this.onExpand} />
				</div>
				
				<div className="body">
					{loading ? (
						<Loader />
					) : (
						<React.Fragment>
							{sections.map((section: any, i: number) => (
								<Section key={i} {...section} />
							))}
						</React.Fragment>
					)}
				</div>

				<div className="resize-h" onMouseDown={(e: any) => { this.onResizeStart(e, I.MenuType.Horizontal); }} />
				<div className="resize-v" onMouseDown={(e: any) => { this.onResizeStart(e, I.MenuType.Vertical); }} />
            </div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.init();
		this.resize();
		this.rebind();
		this.restore();
	};

	componentDidUpdate () {
		this.init();
		this.resize();
		this.restore();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('.body');

		this.unbind();

		$(window).on('resize.sidebar', (e: any) => { this.resize(); });
		body.on('scroll', (e: any) => { this.onScroll(); });
	};

	unbind () {
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('.body');

		$(window).unbind('resize.sidebar');
		body.unbind('.scroll');
	};

	init () {
		if (!this.loaded && !this.state.loading) {
			this.load();
		};
	};

	restore () {
		const { sidebar } = commonStore;
		const { x, y, snap } = sidebar;
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('.body');
		const toggle = Storage.getToggle('sidebar');
		const dummy = $('#sidebarDummy');

		this.width = node.width();
		this.height = node.height();

		toggle.forEach((it: string) => { this.childrenShow(it); });
		body.scrollTop(this.top);

		this.setActive();
		this.setStyle(x, y, snap);

		dummy.css({ width: this.width });
	};

	load () {
		const { root, profile } = blockStore;
		if (!root || !profile) {
			return;
		};

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ 
				operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, 
				value: [
					'_anytype_profile',
					profile,
					root,
				] 
			},
		];

		this.setState({ loading: true });

		C.ObjectGraph(filters, 0, [], (message: any) => {
			if (message.error.code) {
				return;
			};

			this.loaded = true;
			this.data.edges = message.edges.filter(d => { return d.source !== d.target; });
			this.data.nodes = message.nodes;

			this.setState({ loading: false });
		});
	};

	onScroll () {
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('.body');

		this.top = body.scrollTop();
	};

	onToggle (e: any, id: string) {
		if (!this._isMounted) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`#item-${id}`);

		el.hasClass('active') ? this.childrenHide(id) : this.childrenShow(id);
	};

	childrenShow (id: string) {
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`#item-${id}`);
		const children = el.find(`#children-${id}`);

		el.addClass('active');
		children.css({ overflow: 'visible', height: 'auto' });
		Storage.setToggle('sidebar', id, true);
	};

	childrenHide (id: string) {
		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`#item-${id}`);
		const children = el.find(`#children-${id}`);

		el.removeClass('active');
		children.css({ overflow: 'hidden', height: 0 });
		Storage.setToggle('sidebar', id, false);
	};

	getSections () {
		const tree = this.getTree();

		let sections: any[] = [
			{ id: I.TabIndex.Favorite, name: 'Favorites' },
			{ id: I.TabIndex.Recent, name: 'Recent' },
			{ id: I.TabIndex.Set, name: 'Sets' },
		];
		let children: I.Block[] = [];
		let ids: string[] = [];

		sections = sections.map((s: any) => {
			s.children = [];

			switch (s.id) {
				case I.TabIndex.Favorite:
					children = blockStore.getChildren(blockStore.root, blockStore.root, (it: I.Block) => { return it.isLink(); });
					ids = children.map((it: I.Block) => { return it.content.targetBlockId; });

					s.children = tree.filter((c: any) => {
						return ids.includes(c.id);
					});
					break;

				case I.TabIndex.Recent:
					children = blockStore.getChildren(blockStore.recent, blockStore.recent, (it: I.Block) => { return it.isLink(); });
					ids = children.map((it: I.Block) => { return it.content.targetBlockId; }).slice(0, 20);

					s.children = tree.filter((c: any) => {
						return ids.includes(c.id);
					});
					s.children.sort((c1: any, c2: any) => {
						const i1 = ids.indexOf(c1.id);
						const i2 = ids.indexOf(c2.id);
						if (i1 > i2) return -1; 
						if (i1 < i2) return 1;
						return 0;
					});
					break;

				case I.TabIndex.Set:
					s.children = tree.filter((c: any) => {
						return c.type == Constant.typeId.set;
					});
					s.children = s.children.slice(0, 20);
					break;

			};
			return s;
		});

		return sections;
	};

    getTree () {
		const data = Util.objectCopy(this.data);

        let edges = data.edges.map((edge: any) => {
            edge.target = data.nodes.find((node: any) => { return node.id == edge.target; });
            return edge;
        });
		edges = edges.filter((edge: any) => { return edge.type == I.EdgeType.Link; });

        let nodes = data.nodes.map((node: any) => {
            node.children = edges.filter((edge: any) => {
                return edge.source == node.id;
            }).map((edge: any) => { 
                return edge.target;
            });
            return node;
        });
        return nodes;
    };

	onExpand (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { sidebar } = commonStore;
		commonStore.sidebarSet({ fixed: !sidebar.fixed });
	};

	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		this.id = this.getId(item);

		DataUtil.objectOpenEvent(e, item);
		this.setActive();
	};

	setActive () {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('.item.hover').removeClass('hover');

		if (this.id) {
			node.find(`#item-${this.id}`).addClass('hover');
		};
	};

	getId ({ sectionId, parentId, id, depth }) {
		return [ sectionId, parentId, id, depth ].join('-');
	};

	onMouseLeave (e: any) {
		if (!this._isMounted || keyboard.isResizing || keyboard.isDragging) {
			return;
		};

		const { sidebar } = commonStore;
		const { x, snap } = sidebar;

		if (!snap) {
			return;
		};

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			const node = $(ReactDOM.findDOMNode(this));
			node.removeClass('active');
		}, 300);
	};

	onResizeStart (e: any, dir: I.MenuType) {
		if (!this._isMounted) {
			return;
		};

		const { dataset } = this.props;
		const { selection } = dataset || {};
		const { sidebar } = commonStore;
		const { fixed } = sidebar;
		const node = $(ReactDOM.findDOMNode(this));
		const win = $(window);
		const body = $('body');
		const offset = node.offset();

		if (fixed && (dir == I.MenuType.Vertical)) {
			return;
		};
		
		this.width = node.width();
		this.height = node.height();
		this.ox = offset.left;
		this.oy = offset.top;

		if (selection) {
			selection.preventSelect(true);
		};

		keyboard.setResize(true);
		body.addClass('colResize');
		win.unbind('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onResizeMove(e, dir); });
		win.on('mouseup.sidebar', (e: any) => { this.onResizeEnd(e, dir); });
	};

	onResizeMove (e: any, dir: I.MenuType) {
		const { sidebar } = commonStore;
		const { snap } = sidebar;
		const node = $(ReactDOM.findDOMNode(this));

		let d = 0;

		if (dir == I.MenuType.Horizontal) {
			if (snap == I.MenuDirection.Right) {
				d = this.ox - e.pageX + this.width;
			} else {
				d = e.pageX - this.ox;
			};
	
			this.width = this.getWidth(d);
	
			this.resizeHeaderFooter(this.width);
			node.css({ width: this.width });
			$('#sidebarDummy').css({ width: this.width });
		};

		if (dir == I.MenuType.Vertical) {
			this.height = this.getHeight(e.pageY - this.oy);
			node.css({ height: this.height });
		};
	};

	onResizeEnd (e: any, dir: I.MenuType) {
		const { dataset } = this.props;
		const { selection } = dataset || {};

		if (dir == I.MenuType.Horizontal) {
			commonStore.sidebarSet({ width: this.width });
		};
		if (dir == I.MenuType.Vertical) {
			commonStore.sidebarSet({ height: this.height });
		};

		if (selection) {
			selection.preventSelect(false);
		};

		keyboard.setResize(false);
		$('body').removeClass('colResize');
		$(window).unbind('mousemove.sidebar mouseup.sidebar');
	};

	onDragStart (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const { sidebar } = commonStore;
		const { fixed } = sidebar;

		if (fixed) {
			return;
		};

		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const offset = node.offset();

		this.width = node.width();
		this.height = node.height();
		this.ox = e.pageX - offset.left;
		this.oy = e.pageY - offset.top;

		keyboard.setDrag(true);
		if (selection) {
			selection.preventSelect(true);
		};

		win.unbind('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onDragMove(e); });
		win.on('mouseup.sidebar', (e: any) => { this.onDragEnd(e); });
	};

	onDragMove (e: any) {
		const win = $(window);
		const x = e.pageX - this.ox - win.scrollLeft();
		const y = e.pageY - this.oy - win.scrollTop();

		this.setStyle(x, y, null);
	};

	onDragEnd (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const { sidebar } = commonStore;
		const { width } = sidebar;
		const win = $(window);
		
		let x = e.pageX - this.ox - win.scrollLeft();
		let y = e.pageY - this.oy - win.scrollTop();
		let snap = null;

		if (x <= 0) {
			snap = I.MenuDirection.Left;
		};
		if (x + width >= win.width()) {
			snap = I.MenuDirection.Right;
		};

		if (snap !== null) {
			x = 0;
		};

		commonStore.sidebarSet({ x, y, snap });
		this.setStyle(x, y, snap);

		$(window).unbind('mousemove.sidebar mouseup.sidebar');

		keyboard.setDrag(false);
		if (selection) {
			selection.preventSelect(false);
		};
	};

	getWidth (w: number) {
		const size = Constant.size.sidebar.width;
		return Math.max(size.min, Math.min(size.max, w));
	};

	getHeight (h: number) {
		const win = $(window);
		const size = Constant.size.sidebar.height;
		return Math.max(size.min, Math.min(win.height() - Util.sizeHeader(), h));
	};

	checkCoords (x: number, y: number): { x: number, y: number } {
		const win = $(window);

		x = Number(x);
		x = Math.max(0, x);
		x = Math.min(win.width() - this.width, x);

		y = Number(y);
		y = Math.max(Util.sizeHeader(), y);
		y = Math.min(win.height() - this.height, y);

		return { x, y };
	};

	setStyle (x: number, y: number, snap: I.MenuDirection) {
		const node = $(ReactDOM.findDOMNode(this));
		const coords = this.checkCoords(x, y);

		node.css({ 
			top: coords.y,
			left: (snap === null ? coords.x : ''),
		});
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { sidebar } = commonStore;
		const { width } = sidebar;

		this.resizeHeaderFooter(width);
	};

	resizeHeaderFooter (width: number) {
		if (!this.props.isPopup) {
			Util.resizeHeaderFooter(width);
		};
	};

});

export default Sidebar;