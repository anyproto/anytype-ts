import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, J, keyboard, Dataview } from 'Lib';
import { Graph } from 'Component';

const PADDING = 46;

const ViewGraph = observer(class ViewGraph extends React.Component<I.ViewComponent> {

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

	render () {
		const { block, className } = this.props;
		const cn = [ 'viewContent', className ];

		return (
			<div 
				ref={node => this.node = node} 
				className="wrap"
			>
				<div className={cn.join(' ')}>
					<Graph 
						key="graph"
						{...this.props} 
						ref={ref => this.refGraph = ref} 
						id={block.id}
						rootId="" 
						data={this.data}
						storageKey={J.Constant.graphId.dataview}
					/>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;

		this.rebind();
		this.resize();
		this.load();
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
		win.on('sidebarResize.graphPage', () => this.resize());
	};

	onKeyDown (e: any) {
		const cmd = keyboard.cmdKey();

		keyboard.shortcut(`${cmd}+f`, e, () => $('#button-header-search').trigger('click'));
	};

	load () {
		const { getView, getSearchIds, getTarget, isCollection } = this.props;
		const view = getView();
		if (!view) {
			return;
		};

		const searchIds = getSearchIds();
		const filters = [].concat(view.filters).concat(U.Data.graphFilters()).map(it => Dataview.filterMapper(view, it));
		const target = getTarget();

		if (searchIds) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		this.setLoading(true);

		C.ObjectGraph(S.Common.space, filters, 0, [], J.Relation.graph, (isCollection ? target.id : ''), target.setOf, (message: any) => {
			if (!this._isMounted || message.error.code) {
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

			this.data.nodes = message.nodes.map(it => S.Detail.mapper(it));
			this.forceUpdate();

			if (this.refGraph) {
				this.refGraph.init();
			};
		});
	};

	setLoading (v: boolean) {
	};

	resize () {
		const { isPopup, isInline } = this.props;
		const node = $(this.node);

		if (!node || !node.length) {
			return;
		};

		if (!isInline) {
			node.css({ width: 0, height: 0, marginLeft: 0 });

			const container = U.Common.getPageContainer(isPopup);
			const cw = container.width();
			const ch = container.height();
			const mw = cw - PADDING * 2;
			const margin = (cw - mw) / 2;
			const { top } = node.offset();

			node.css({ width: cw, height: Math.max(600, ch - top - 2), marginLeft: -margin - 2 });
		};

		if (this.refGraph) {
			this.refGraph.resize();
		};
	};

});

export default ViewGraph;