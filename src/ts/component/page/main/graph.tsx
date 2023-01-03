import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, Util, analytics, sidebar, DataUtil, keyboard } from 'Lib';
import { Header, Graph, Icon, Loader } from 'Component';
import { blockStore, detailStore, menuStore, commonStore } from 'Store';
import Panel from './graph/panel';
import Constant from 'json/constant.json';

interface Props extends I.PageComponent {
	rootId: string;
	matchPopup?: any;
};


const PageMainGraph = observer(class PageMainGraph extends React.Component<Props, object> {

	data: any = {
		nodes: [],
		edges: [],
	};
	ids: string[] = [];
	refHeader: any = null;
	refGraph: any = null;
	refPanel: any = null;
	loading: boolean = false;
	timeoutLoading: number = 0;

	constructor (props: any) {
		super(props);

		this.onSwitch = this.onSwitch.bind(this);
		this.onClickObject = this.onClickObject.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.togglePanel = this.togglePanel.bind(this);
	};

	render () {
		const rootId = this.getRootId();

		return (
			<div className="body">
				<Header component="mainGraph" ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} />
				<Loader id="loader" />

				<div className="wrapper">
					<div className="side left">
						<Graph 
							key="graph"
							{...this.props} 
							ref={(ref: any) => { this.refGraph = ref; }} 
							rootId={rootId} 
							data={this.data}
							onClick={this.onClickObject}
							onSelect={this.onSelect}
							onContextMenu={this.onContextMenu}
						/>
					</div>

					<div id="sideRight" className="side right">
						{this.refGraph ? (
							<Panel
								key="panel"
								{...this.props} 
								ref={(ref: any) => { this.refPanel = ref; }}
								data={this.refGraph.forceProps}
								onFilterChange={this.onFilterChange}
								onSwitch={this.onSwitch}
								onContextMenu={this.onContextMenu}
								togglePanel={this.togglePanel}
							/>
						) : ''}
					</div>
				</div>

				<div id="footer" className="footer footerMainGraph">
					<Icon 
						id="button-expand" 
						className="big" 
						tooltip="Show sidebar" 
						tooltipY={I.MenuDirection.Top} 
						onClick={() => { sidebar.expand(); }} 
					/>

					<Icon 
						id="button-manager" 
						className="big" 
						tooltip="Sidebar settings"
						tooltipY={I.MenuDirection.Top} 
						onClick={() => { this.togglePanel(true); }} 
					/>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { isPopup } = this.props;

		this.rebind();
		this.resize();
		this.load();

		if (!isPopup) {
			DataUtil.setWindowTitleText('Graph');
		};
	};

	componentDidUpdate () {
		this.resize();

		if (this.loading) {
			window.clearTimeout(this.timeoutLoading);
			this.timeoutLoading = window.setTimeout(() => { this.setLoading(false); }, 2000);
		};
	};

	componentWillUnmount () {
		this.unbind();
		window.clearTimeout(this.timeoutLoading);
	};

	unbind () {
		$(window).off(`keydown.graph`);
	};

	rebind () {
		const win = $(window);

		this.unbind();
		win.on(`keydown.graph`, (e: any) => { this.onKeyDown(e); });
	};

	onKeyDown (e: any) {
		const length = this.ids.length;
		if (!length) {
			return;
		};

		keyboard.shortcut('escape', e, (pressed: string) => {
			this.ids = [];
			this.refGraph.send('onSetSelected', { ids: this.ids });
		});

		keyboard.shortcut('backspace, delete', e, (pressed: string) => {
			C.ObjectListSetIsArchived(this.ids, true, (message: any) => {
				if (!message.error.code) {
					this.data.nodes = this.data.nodes.filter(d => !this.ids.includes(d.id));
					this.refGraph.send('onRemoveNode', { ids: this.ids });
				};
			});
			
			analytics.event('MoveToBin', { count: length });
		});
	};

	load () {
		const { workspace } = commonStore;
		const skipTypes = [ Constant.typeId.space ].concat(DataUtil.getFileTypes()).concat(DataUtil.getSystemTypes());

		const skipIds = [ '_anytype_profile', blockStore.profile ];
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: skipTypes },
			{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds },
			{ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: workspace },
		];

		this.setLoading(true);

		C.ObjectGraph(filters, 0, [], Constant.graphRelationKeys, (message: any) => {
			if (message.error.code) {
				return;
			};

			const hashes: any = [];

			this.data.edges = message.edges.filter(d => { 
				const hash = [ d.source, d.target ].join('-');
				if (hashes.includes(hash)) {
					return false;
				};

				hashes.push(hash);
				return (d.source != d.target);
			});

			// Find backlinks
			for (const edge of this.data.edges) {
				const idx = this.data.edges.findIndex(d => (d.source == edge.target) && (d.target == edge.source));
				if (idx >= 0) {
					edge.isDouble = true;
					this.data.edges.splice(idx, 1);
				};
			};

			this.data.nodes = message.nodes.map(it => detailStore.check(it));

			this.resize();

			if (this.refGraph) {
				this.refGraph.init();
			};
			this.forceUpdate();
		});
	};

	setLoading (v: boolean) {
		const node = $(ReactDOM.findDOMNode(this));
		const loader = node.find('#loader');

		this.loading = v;

		if (v) {
			loader.show().css({ opacity: 1 });
		} else {
			loader.css({ opacity: 0 });
			window.setTimeout(() => { loader.hide(); }, 500);
		};
	};

	resize () {
		const win = $(window);
		const obj = Util.getPageContainer(this.props.isPopup);
		const wrapper = obj.find('.wrapper');
		const platform = Util.getPlatform();
		const isPopup = this.props.isPopup && !obj.hasClass('full');
		const oh = obj.height();
		
		let wh = isPopup ? oh : win.height();

		if (platform == I.Platform.Windows) {
			wh -= Constant.size.headerWindows;
		};

		wrapper.css({ height: wh });
		
		if (isPopup) {
			const element = $('#popupPage .content');
			if (element.length) {
				element.css({ minHeight: 'unset', height: '100%' });
			};
		};

		if (this.refGraph) {
			this.refGraph.resize();
		};
		if (this.refPanel) {
			this.refPanel.resize();
		};
	};

	togglePanel (v: boolean) {
		const { isPopup } = this.props;
		const container = Util.getPageContainer(isPopup);
		const wrapper = container.find('.wrapper');

		v ? wrapper.addClass('withPanel') : wrapper.removeClass('withPanel');
	};

	onClickObject (object: any) {
		this.ids = [];
		this.togglePanel(true);

		if (this.refPanel) {
			this.refPanel.setState({ view: I.GraphView.Preview, rootId: object.id });
		};
		if (this.refGraph) {
			this.refGraph.send('onSetSelected', { ids: this.ids });
		};
		
		analytics.event('GraphSelectNode');
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	onSwitch (id: string, v: any) {
		const { graph } = commonStore;

		graph[id] = v;

		commonStore.graphSet(graph);
		this.refGraph.updateProps();

		analytics.event('GraphSettings', { id });
	};

	onFilterChange (v: string) {
		this.refGraph.forceProps.filter = v ? new RegExp(Util.filterFix(v), 'gi') : '';
		this.refGraph.updateProps();

		analytics.event('SearchQuery', { route: 'ScreenGraph', length: v.length });
	};

	onSelect (id: string) {
		this.ids = this.ids.includes(id) ? this.ids.filter(it => it != id) : this.ids.concat([ id ]);
		this.refGraph.send('onSetSelected', { ids: this.ids });
	};

	getNode (id: string) {
		return this.data.nodes.find(d => d.id == id) || null;
	};

	onContextMenu (id: string, param: any) {
		const { root } = blockStore;
		const ids = this.ids.length ? this.ids : [ id ];

		menuStore.open('dataviewContext', {
			...param,
			data: {
				objectIds: ids,
				getObject: (id: string) => this.data.nodes.find(d => d.id == id),
				onLinkTo: (sourceId: string, targetId: string) => {
					let target = this.getNode(targetId);
					if (target) {
						this.data.edges.push(this.refGraph.edgeMapper({ type: I.EdgeType.Link, source: sourceId, target: targetId }));
						this.refGraph.send('onSetEdges', { edges: this.data.edges });
					} else {
						DataUtil.getObjectById(targetId, (object: any) => {
							target = this.refGraph.nodeMapper(object);
							this.refGraph.send('onAddNode', { sourceId, target });
						});
					};
				},
				onSelect: (itemId: string) => {
					switch (itemId) {
						case 'archive':
							this.data.nodes = this.data.nodes.filter(d => !ids.includes(d.id));
							this.refGraph.send('onRemoveNode', { ids });
							break;

						case 'fav':
							ids.forEach((id: string) => {
								const node = this.data.nodes.find(d => d.id == id);
								
								if (node) {
									node.isFavorite = true;
									this.data.edges.push({ type: I.EdgeType.Link, source: root, target: id });
								};
							});
							this.refGraph.send('onSetEdges', { edges: this.data.edges });
							break;

						case 'unfav':
							ids.forEach((id: string) => {
								const node = this.data.nodes.find(d => d.id == id);
								
								if (node) {
									node.isFavorite = false;
								};
							});

							this.data.edges = this.data.edges.filter(d => {
								if ((d.source == root) && ids.includes(d.target)) {
									return false;
								};
								return true;
							});

							this.refGraph.send('onSetEdges', { edges: this.data.edges });
							break;
					};

					this.ids = [];
					this.refGraph.send('onSetSelected', { ids: this.ids });
				},
			}
		});
	};

});

export default PageMainGraph;