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
	ox: number = 0;
	loaded: boolean = false;
	top: number = 0;

	constructor (props: any) {
		super(props);

		this.onExpand = this.onExpand.bind(this);
		this.onResizeStart = this.onResizeStart.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { account } = authStore;
		const { sidebar } = commonStore;
		const { root, profile } = blockStore;
		const { width, height, x, y, fixed } = sidebar;
		const { loading } = this.state;
		const sections = this.getSections();
		const css: any = { width: sidebar.width };
		const cn = [ 'sidebar' ];

		if (!account) {
			return null;
		};

		if (fixed) {
			cn.push('fixed');
		};

        let depth = 0;

		const Section = (section: any) => {
			const length = section.children.length;
			const id = [ 'section', section.id ].join('-');

			return (
				<div id={`item-${id}`} className="section">
					<div className="sectionHead">
						{length ? <Icon className="arrow" onClick={(e: any) => { this.onToggle(e, id); }} /> : ''}
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
			const id = [ item.sectionId, item.parentId, item.id, item.depth ].join('-');
			const cn = [ 'item', 'depth' + item.depth ];

			if ((item.depth > 0) && !item.children.length) {
				css.paddingLeft += 20;
			};

            return (
                <div id={`item-${id}`} className={cn.join(' ')}>
                    <div className="flex" style={css} onClick={(e: any) => { this.onClick(e, item); }}>
						{length ? <Icon className="arrow" onClick={(e: any) => { this.onToggle(e, id); }} /> : ''}
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
				<div className="head">
					<Icon className={fixed ? 'close' : 'expand'} onClick={this.onExpand} />
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

				<div className="resize" onMouseDown={this.onResizeStart} />
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
		const node = $(ReactDOM.findDOMNode(this));
		const body = node.find('.body');
		const toggle = Storage.getToggle('sidebar');

		toggle.forEach((it: string) => { this.childrenShow(it); });
		body.scrollTop(this.top);
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
				operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, 
				value: [ 
					Constant.typeId.relation,
					Constant.typeId.type,
					Constant.typeId.template,
					Constant.typeId.file,
					Constant.typeId.image,
					Constant.typeId.video,
					Constant.typeId.audio,
				] 
			},
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
					ids = children.map((it: I.Block) => { return it.content.targetBlockId; });

					s.children = tree.filter((c: any) => {
						return ids.includes(c.id);
					});
					break;

				case I.TabIndex.Set:
					s.children = tree.filter((c: any) => {
						return c.type == Constant.typeId.set;
					});
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
		const { sidebar } = commonStore;
		commonStore.sidebarSet({ fixed: !sidebar.fixed });
	};

	onClick (e: any, item: any) {
		DataUtil.objectOpenEvent(e, item);
	};

	onMouseLeave (e: any) {
		if (!this._isMounted || keyboard.isResizing) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));

		node.removeClass('active');
	};

	onResizeStart (e: any) {
		if (!this._isMounted) {
			return;
		};

		const { dataset } = this.props;
		const { selection } = dataset || {};
		const node = $(ReactDOM.findDOMNode(this));
		const win = $(window);
		const body = $('body');
		
		this.ox = node.offset().left;

		if (selection) {
			selection.preventSelect(true);
		};

		keyboard.setResize(true);
		body.addClass('colResize');
		win.unbind('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onResizeMove(e); });
		win.on('mouseup.sidebar', (e: any) => { this.onResizeEnd(e); });
	};

	onResizeMove (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const w = this.getWidth(e.pageX - this.ox);

		this.resizeHeaderFooter(w);

		node.css({ width: w });
		$('#sidebarDummy').css({ width: w });
	};

	onResizeEnd (e: any) {
		const { dataset } = this.props;
		const { selection } = dataset || {};

		commonStore.sidebarSet({ width: this.getWidth(e.pageX - this.ox) });

		if (selection) {
			selection.preventSelect(false);
		};

		keyboard.setResize(false);
		$('body').removeClass('colResize');
		$(window).unbind('mousemove.sidebar mouseup.sidebar');
	};

	getWidth (w: number) {
		const size = Constant.size.sidebar;
		return Math.max(size.min, Math.min(size.max, w));
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