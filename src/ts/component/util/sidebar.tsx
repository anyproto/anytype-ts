import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, Util, keyboard } from 'ts/lib';
import { IconObject, Icon, ObjectName } from 'ts/component';
import { observer } from 'mobx-react';
import { authStore, blockStore, commonStore } from 'ts/store';

interface Props {
	isPopup: boolean;
};

interface State {
	loading: boolean;
};

const raf = require('raf');
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
        const tree = this.getTree();
		const css: any = { width: sidebar.width };
		const cn = [ 'sidebar' ];

		if (!account) {
			return null;
		};

		if (fixed) {
			cn.push('fixed');
		};

        let depth = 0;

        const Item = (item: any) => {
			let css: any = { paddingLeft: item.depth * 6 };
			let length = item.children.length;
			let id = [ item.id, item.depth ].join('-');

            return (
                <div id={`item-${id}`} className={[ 'item', 'depth' + item.depth ].join(' ')}>
                    <div className="flex" style={css} onClick={(e: any) => { this.onClick(e, item); }}>
						{length ? <Icon className="arrow" onClick={(e: any) => { this.toggle(e, item); }} /> : ''}
                        <IconObject object={...item} size={20} />
						<ObjectName object={item} />
                    </div>

					<div id={`children-${id}`} className="children">
						{item.children.map((child: any, i: number) => (
							<Item key={child.id + '-' + item.depth} {...child} depth={item.depth + 1} />
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
					{tree.map((item: any, i: number) => (
						<Item key={item.id + '-' + depth} {...item} depth={depth} />
					))}
				</div>

				<div className="resize" onMouseDown={this.onResizeStart} />
            </div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.init();
		this.resize();

		$(window).unbind('resize.sidebar').on('resize.sidebar', (e: any) => { this.resize(); });
	};

	componentDidUpdate () {
		this.init();
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
		
		$(window).unbind('resize.sidebar');
	};

	init () {
		if (!this.loaded && !this.state.loading) {
			this.load();
		};
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

	toggle (e: any, item: any) {
		if (!this._isMounted) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const node = $(ReactDOM.findDOMNode(this));
		const el = node.find(`#item-${item.id}-${item.depth}`);
		const children = el.find(`#children-${item.id}-${item.depth}`);

		let height = 0;

		if (el.hasClass('active')) {
			el.removeClass('active');
			height = children.height();
			children.css({ overflow: 'hidden', height: height });

			raf(() => {
				children.css({ height: 0 });
			});
		} else {
			el.addClass('active');

			children.css({ overflow: 'visible', height: 'auto' });

			height = children.height();
			children.css({ overflow: 'hidden', height: 0 });
			raf(() => {
				children.css({ height: height });

				window.setTimeout(() => {
					children.css({ overflow: 'visible', height: 'auto' });
				}, 200);
			});
		};
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

		const node = $(ReactDOM.findDOMNode(this));
		const win = $(window);
		const body = $('body');
		
		this.ox = node.offset().left;

		keyboard.setResize(true);
		body.addClass('colResize');
		win.unbind('mousemove.sidebar mouseup.sidebar');
		win.on('mousemove.sidebar', (e: any) => { this.onResizeMove(e); });
		win.on('mouseup.sidebar', (e: any) => { this.onResizeEnd(e); });
	};

	onResizeMove (e: any) {
		const node = $(ReactDOM.findDOMNode(this));
		const w = this.getWidth(e.pageX - this.ox);

		this.resizeHeader(w);

		node.css({ width: w });
		$('#sidebarDummy').css({ width: w });
	};

	onResizeEnd (e: any) {
		commonStore.sidebarSet({ width: this.getWidth(e.pageX - this.ox) });

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

		this.resizeHeader(width);
	};

	resizeHeader (width: number) {
		if (!this.props.isPopup) {
			Util.resizeHeader(width);
		};
	};

});

export default Sidebar;