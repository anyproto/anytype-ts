import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, UtilCommon, UtilMenu, UtilData, UtilObject, keyboard } from 'Lib';
import { Header, Footer, Graph, Loader } from 'Component';
import { detailStore, commonStore } from 'Store';
const Constant = require('json/constant.json');

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

		this.onTab = this.onTab.bind(this);
	};

	render () {
		const rootId = this.getRootId();

		return (
			<div 
				ref={node => this.node = node} 
				className="body"
			>
				<Header 
					{...this.props} 
					ref={ref => this.refHeader = ref} 
					component="mainGraph" 
					rootId={rootId} 
					tabs={UtilMenu.getGraphTabs()} 
					tab="graph" 
					onTab={this.onTab} 
					layout={I.ObjectLayout.Graph}
				/>

				<Loader id="loader" />

				<div className="wrapper">
					<Graph 
						key="graph"
						{...this.props} 
						ref={ref => this.refGraph = ref} 
						id="global"
						rootId={rootId} 
						data={this.data}
						storageKey={Constant.graphId.global}
					/>
				</div>

				<Footer component="mainObject" />
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
		this.resize();
		this.load();
		this.initRootId(this.getRootId());
	};

	componentDidUpdate () {
		this.resize();

		if (this.loading) {
			window.clearTimeout(this.timeoutLoading);
			this.timeoutLoading = window.setTimeout(() => this.setLoading(false), 100);
		};
	};

	componentWillUnmount () {
		this.unbind();
		window.clearTimeout(this.timeoutLoading);
	};

	unbind () {
		$(window).off(`keydown.graphPage updateGraphRoot.graphPage removeGraphNode.graphPage sidebarResize.graphPage`);
	};

	rebind () {
		const win = $(window);

		this.unbind();
		win.on(`keydown.graphPage`, e => this.onKeyDown(e));
		win.on('updateGraphRoot.graphPage', (e: any, data: any) => this.initRootId(data.id));
		win.on('sidebarResize.graphPage', () => this.resize());
	};

	onKeyDown (e: any) {
		const cmd = keyboard.cmdKey();

		keyboard.shortcut(`${cmd}+f`, e, () => $('#button-header-search').trigger('click'));
	};

	load () {
		this.setLoading(true);

		C.ObjectGraph(commonStore.space, UtilData.graphFilters(), 0, [], Constant.graphRelationKeys, '', [], (message: any) => {
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
					const double = this.data.edges[idx];

					if ((edge.type == I.EdgeType.Link) && (double.type == I.EdgeType.Relation)) {
						edge.type = double.type;
						edge.name = double.name;
					};

					edge.isDouble = true;
					this.data.edges.splice(idx, 1);
				};
			};

			this.data.nodes = message.nodes.map(it => detailStore.mapper(it));

			UtilData.onSubscribe(Constant.subId.graph, 'id', Constant.graphRelationKeys, {
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
			window.setTimeout(() => loader.hide(), 200);
		};
	};

	resize () {
		const { isPopup } = this.props;
		const win = $(window);
		const obj = UtilCommon.getPageContainer(isPopup);
		const node = $(this.node);
		const wrapper = obj.find('.wrapper');
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

	initRootId (id: string) {
		this.rootId = id; 
		this.refHeader.refChild.setRootId(id);
	};

	getRootId () {
		const { rootId, match } = this.props;
		return this.rootId || (rootId ? rootId : match.params.id);
	};

	onTab (id: string) {
		const tab = UtilMenu.getGraphTabs().find(it => it.id == id);

		if (tab) {
			UtilObject.openAuto({ id: this.getRootId(), layout: tab.layout });
		};
	};

});

export default PageMainGraph;
