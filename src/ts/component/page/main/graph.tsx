import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, C, Util, analytics, sidebar, DataUtil } from 'Lib';
import { Header, Graph, Icon, Loader } from 'Component';
import { blockStore, detailStore, menuStore } from 'Store';
import { observer } from 'mobx-react';

import Panel from './graph/panel';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	matchPopup?: any;
};

interface State {
	loading: boolean;
};

const Constant = require('json/constant.json');
const $ = require('jquery');

const PageMainGraph = observer(class PageMainGraph extends React.Component<Props, State> {

	state = {
		loading: false,
	};
	data: any = {
		nodes: [],
		edges: [],
	};
	ids: string[] = [];
	refHeader: any = null;
	refGraph: any = null;
	refPanel: any = null;

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
		const { loading } = this.state;
		const rootId = this.getRootId();
		const ref = this.refGraph;

		return (
			<div className="body">
				<Header component="mainGraph" ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} />

				{loading ? <Loader id="loader" /> : ''}

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
						{ref ? (
							<Panel
								key="panel"
								{...this.props} 
								ref={(ref: any) => { this.refPanel = ref; }}
								data={ref.forceProps}
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

		this.resize();
		this.load();

		if (!isPopup) {
			DataUtil.setWindowTitleText('Graph');
		};
	};

	componentDidUpdate () {
		this.resize();
	};

	load () {
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			{ 
				operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, 
				value: [ Constant.typeId.space ].concat(DataUtil.getFileTypes()).concat(DataUtil.getSystemTypes())
			},
			{ 
				operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, 
				value: [
					'_anytype_profile',
					blockStore.profile,
				] 
			},
		];

		this.setState({ loading: true });

		C.ObjectGraph(filters, 0, [], Constant.defaultRelationKeys.concat([ 'links' ]), (message: any) => {
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
				return (d.source !== d.target); 
			});

			this.data.nodes = message.nodes.map(it => detailStore.check(it));
			this.refGraph.init();

			window.setTimeout(() => { this.setState({ loading: false }); }, 250);
		});
	};

	resize () {
		const win = $(window);
		const obj = Util.getPageContainer(this.props.isPopup);
		const wrapper = obj.find('.wrapper');
		const hh = Util.sizeHeader();
		const platform = Util.getPlatform();
		const isPopup = this.props.isPopup && !obj.hasClass('full');
		
		let wh = isPopup ? obj.height() - hh : win.height();
		let sh = isPopup ? obj.height() : win.height();

		if (platform == I.Platform.Windows) {
			wh += 30;
		};

		wrapper.css({ height: wh });
		wrapper.find('.side').css({ height: sh });
		
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
		this.togglePanel(true);
		this.refPanel.setState({ view: I.GraphView.Preview, rootId: object.id });

		analytics.event('GraphSelectNode');
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	onSwitch (id: string, v: any) {
		this.refGraph.forceProps[id] = v;
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

	onContextMenu (id: string, param: any) {
		const ids = this.ids.length ? this.ids : [ id ];

		menuStore.open('dataviewContext', {
			...param,
			data: {
				objectIds: ids,
				getObject: (id: string) => this.data.nodes.find(d => d.id == id),
				onSelect: (itemId: string) => {
					switch (itemId) {
						case 'archive':
							this.data.nodes = this.data.nodes.filter(d => !ids.includes(d.id));
							this.refGraph.send('onRemoveNode', { ids });
							break;

						case 'fav':
							ids.forEach((id: string) => {
								const node = this.data.nodes.find(d => d.id == id);
								
								node.isFavorite = true;
								this.data.edges.push({ type: I.EdgeType.Link, source: blockStore.root, target: id });
							});
							this.refGraph.send('onSetEdges', { edges: this.data.edges });
							break;

						case 'unfav':
							ids.forEach((id: string) => {
								const node = this.data.nodes.find(d => d.id == id);

								node.isFavorite = false;
								this.data.edges = this.data.edges.filter(d => d.target != id);
							});
							this.refGraph.send('onSetEdges', { edges: this.data.edges });
							break;
					};

					this.ids = [];
					this.refGraph.send('onSetSelected', { ids: [] });
				},
			}
		});
	};

});

export default PageMainGraph;