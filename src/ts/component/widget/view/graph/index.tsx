import * as React from 'react';
import { observer } from 'mobx-react';
import { I, C, S, U, J, Dataview } from 'Lib';
import { Graph } from 'Component';

const WidgetViewGraph = observer(class WidgetViewGraph extends React.Component<I.WidgetViewComponent> {

	_isMounted = false;
	node: any = null;
	data: any = {
		nodes: [],
		edges: [],
	};
	ids: string[] = [];
	refGraph: any = null;
	rootId = '';

	render () {
		const { block } = this.props;

		return (
			<div 
				ref={node => this.node = node} 
				className="wrap"
			>
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
		);
	};

	componentDidMount () {
		this._isMounted = true;

		this.resize();
		this.load();
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	load () {
		const { getView, getObject } = this.props;
		const view = getView();
		if (!view) {
			return;
		};

		const filters = [].concat(view.filters).concat(U.Data.graphFilters()).map(it => Dataview.filterMapper(view, it));
		const object = getObject();
		const isCollection = U.Object.isCollectionLayout(object.layout);

		C.ObjectGraph(S.Common.space, filters, 0, [], J.Relation.graph, (isCollection ? object.id : ''), object.setOf, (message: any) => {
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

	resize () {
		this.refGraph?.resize();
	};

});

export default WidgetViewGraph;