import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, Util, analytics, DataUtil, ObjectUtil, keyboard, Onboarding } from 'Lib';
import { Header, Footer, Graph, Loader } from 'Component';
import { blockStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

const ctrl = keyboard.cmdSymbol();
const Tabs = [
	{ id: 'graph', name: 'Graph', layout: I.ObjectLayout.Graph, tooltipCaption: `${ctrl} + Alt + O` },
	{ id: 'navigation', name: 'Flow', layout: I.ObjectLayout.Navigation, tooltipCaption: `${ctrl} + O` },
];

const PageMainGraph = observer(class PageMainGraph extends React.Component<I.PageComponent> {

	node: any = null;
	data: any = {
		nodes: [],
		edges: [],
	};
	ids: string[] = [];
	refHeader: any = null;
	refGraph: any = null;
	loading = false;
	timeoutLoading = 0;
	rootId = '';

	constructor (props: I.PageComponent) {
		super(props);

		this.onClickObject = this.onClickObject.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onTab = this.onTab.bind(this);
	};

	render () {
		const rootId = this.getRootId();

		return (
			<div 
				ref={node => this.node = node} 
				className="body"
			>
				<Header component="mainGraph" ref={ref => this.refHeader = ref} {...this.props} rootId={rootId} tabs={Tabs} tab="graph" onTab={this.onTab} />
				<Loader id="loader" />

				<div className="wrapper">
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

				<Footer component="mainObject" />
			</div>
		);
	};

	componentDidMount () {
		const obj = Util.getPageContainer(this.props.isPopup);
		const isPopup = this.props.isPopup && !obj.hasClass('full');

		this.rebind();
		this.resize();
		this.load();
		this.initRootId(this.getRootId());

		if (!isPopup) {
			Onboarding.start('wizardGraph', false);
		};

		window.Graph = this;
	};

	componentDidUpdate () {
		this.resize();

		if (this.loading) {
			window.clearTimeout(this.timeoutLoading);
			this.timeoutLoading = window.setTimeout(() => { this.setLoading(false); }, 100);
		};
	};

	componentWillUnmount () {
		this.unbind();
		window.clearTimeout(this.timeoutLoading);
	};

	unbind () {
		$(window).off(`keydown.graphPage updateGraphRoot.graphPage removeGraphNode.graphPage`);
	};

	rebind () {
		const win = $(window);

		this.unbind();
		win.on(`keydown.graphPage`, (e: any) => { this.onKeyDown(e); });
		win.on('updateGraphRoot.graphPage', (e: any, data: any) => { 
			this.initRootId(data.id);
		});
		win.on('removeGraphNode.graphPage', (e: any, data: any) => { 
			this.refGraph.send('onRemoveNode', { ids: Util.objectCopy(data.ids) });
		});
	};

	initRootId (id: string) {
		this.rootId = id; 
		this.refHeader.refChild.setRootId(id);
	};

	onKeyDown (e: any) {
		const length = this.ids.length;
		if (!length) {
			return;
		};

		keyboard.shortcut('escape', e, (pressed: string) => {
			this.ids = [];
			this.refGraph.send('onSetSelected', { ids: [] });
		});

		if (this.ids.length) {
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
	};

	load () {
		this.setLoading(true);

		C.ObjectGraph(DataUtil.graphFilters(), 0, [], Constant.graphRelationKeys, (message: any) => {
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

			this.data.nodes = message.nodes.map(it => detailStore.mapper(it));

			DataUtil.onSubscribe(Constant.subId.graph, 'id', Constant.graphRelationKeys, {
				error: {},
				records: message.nodes,
				dependencies: [],
				counters: { total: message.nodes.length },
			});

			this.resize();

			if (this.refGraph) {
				this.refGraph.init();
			};

			this.forceUpdate();
		});
	};

	setLoading (v: boolean) {
		const node = $(this.node);
		const loader = node.find('#loader');

		this.loading = v;

		if (v) {
			loader.show().css({ opacity: 1 });
		} else {
			loader.css({ opacity: 0 });
			window.setTimeout(() => { loader.hide(); }, 200);
		};
	};

	resize () {
		const win = $(window);
		const obj = Util.getPageContainer(this.props.isPopup);
		const node = $(this.node);
		const wrapper = obj.find('.wrapper');
		const isPopup = this.props.isPopup && !obj.hasClass('full');
		const oh = obj.height();
		const header = node.find('#header');
		const hh = header.height();
		const wh = isPopup ? oh - hh : win.height();

		wrapper.css({ height: wh, paddingTop: isPopup ? 0 : hh });
		
		if (isPopup) {
			const element = $('#popupPage .content');
			if (element.length) {
				element.css({ minHeight: 'unset', height: '100%' });
			};
		};

		if (this.refGraph) {
			this.refGraph.resize();
		};
	};

	onClickObject (id: string) {
		this.ids = [];

		if (this.refGraph) {
			this.refGraph.send('onSetSelected', { ids: this.ids });
		};
		
		ObjectUtil.openAuto(this.data.nodes.find(d => d.id == id));
	};

	getRootId () {
		const { rootId, match } = this.props;
		return this.rootId || (rootId ? rootId : match.params.id);
	};

	onSelect (id: string, related?: string[]) {
		const isSelected = this.ids.includes(id);

		let ids = [ id ];

		if (related && related.length) {
			if (!isSelected) {
				this.ids = [];
			};

			ids = ids.concat(related);
		};

		ids.forEach((id) => {
			if (isSelected) {
				this.ids = this.ids.filter(it => it != id);
				return;
			};

			this.ids = this.ids.includes(id) ? this.ids.filter(it => it != id) : this.ids.concat([ id ]);
		});

		this.refGraph.send('onSetSelected', { ids: this.ids });
	};

	getNode (id: string) {
		return this.data.nodes.find(d => d.id == id);
	};

	onContextMenu (id: string, param: any) {
		const ids = this.ids.length ? this.ids : [ id ];

		menuStore.open('dataviewContext', {
			...param,
			data: {
				subId: Constant.subId.graph,
				objectIds: ids,
				getObject: id => this.getNode(id),
				onLinkTo: (sourceId: string, targetId: string) => {
					let target = this.getNode(targetId);
					if (target) {
						this.data.edges.push(this.refGraph.edgeMapper({ type: I.EdgeType.Link, source: sourceId, target: targetId }));
						this.refGraph.send('onSetEdges', { edges: this.data.edges });
					} else {
						ObjectUtil.getById(targetId, (object: any) => {
							target = this.refGraph.nodeMapper(object);
							this.refGraph.send('onAddNode', { sourceId, target });
						});
					};
				},
				onSelect: (itemId: string) => {
					switch (itemId) {
						case 'archive': {
							this.data.nodes = this.data.nodes.filter(d => !ids.includes(d.id));
							this.refGraph.send('onRemoveNode', { ids });
							break;
						};

						case 'fav': {
							ids.forEach((id: string) => {
								const node = this.getNode(id);
								
								if (node) {
									node.isFavorite = true;
								};
							});
							break;
						};

						case 'unfav': {
							ids.forEach((id: string) => {
								const node = this.getNode(id);
								
								if (node) {
									node.isFavorite = false;
								};
							});
							break;
						};
					};

					this.ids = [];
					this.refGraph.send('onSetSelected', { ids: this.ids });
				},
			}
		});
	};

	onTab (id: string) {
		const tab = Tabs.find(it => it.id == id);

		if (tab) {
			ObjectUtil.openAuto({ id: this.getRootId(), layout: tab.layout });
		};
	};

});

export default PageMainGraph;