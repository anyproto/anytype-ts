import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, J, keyboard } from 'Lib';
import { Header, Footer, Graph, Loader } from 'Component';

const PageMainGraph = observer(class PageMainGraph extends React.Component<I.PageComponent> {

	_isMounted = false;
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
					tabs={U.Menu.getGraphTabs()} 
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
						storageKey={J.Constant.graphId.global}
					/>
				</div>

				<Footer component="mainObject" />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;

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
		this._isMounted = false;

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

		C.ObjectGraph(S.Common.space, U.Data.graphFilters(), 0, [], J.Relation.graph, '', [], (message: any) => {
			if (!this._isMounted || message.error.code) {
				return;
			};

			this.data.edges = message.edges;
			this.data.nodes = message.nodes;
			this.forceUpdate();

			if (this.refGraph) {
				this.refGraph.init();
			};
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
		const obj = U.Common.getPageContainer(isPopup);
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
		const tab = U.Menu.getGraphTabs().find(it => it.id == id);

		if (tab) {
			U.Object.openAuto({ id: this.getRootId(), layout: tab.layout });
		};
	};

});

export default PageMainGraph;
