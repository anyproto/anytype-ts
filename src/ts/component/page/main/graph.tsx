import * as React from 'react';
import { I, C, crumbs, Util } from 'ts/lib';
import { RouteComponentProps } from 'react-router';
import { HeaderMainGraph as Header, Graph, Icon, Loader } from 'ts/component';
import { blockStore } from 'ts/store';
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
	refHeader: any = null;
	refGraph: any = null;
	refPanel: any = null;

	constructor (props: any) {
		super(props);

		this.onSwitch = this.onSwitch.bind(this);
		this.onClickObject = this.onClickObject.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.togglePanel = this.togglePanel.bind(this);
	};

	render () {
		const { loading } = this.state;
		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const ref = this.refGraph;

		return (
			<div className="body">
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />

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
								togglePanel={this.togglePanel}
							/>
						) : ''}
					</div>
				</div>

				<div className="footer">
					<Icon className="manager" onClick={() => { this.togglePanel(true); }} />
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		this.rebind();
		this.load();

		crumbs.addPage(this.getRootId());
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('resize.graph', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('resize.graph');
	};

	load () {
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			{ 
				operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, 
				value: [ 
					Constant.typeId.relation,
					Constant.typeId.type,
					Constant.typeId.template,
					Constant.typeId.space,
					
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
					blockStore.profile,
				] 
			},
		];

		this.setState({ loading: true });

		C.ObjectGraph(filters, 0, [], (message: any) => {
			if (message.error.code) {
				return;
			};

			this.data.edges = message.edges.filter(d => { return d.source !== d.target; });
			this.data.nodes = message.nodes;
			this.refGraph.init();

			window.setTimeout(() => { this.setState({ loading: false }); }, 250);
		});
	};

	resize () {
		const { isPopup } = this.props;
		const win = $(window);
		const obj = $(isPopup ? '#popupPage #innerWrap' : '.page.isFull');
		const wrapper = obj.find('.wrapper');
		const header = obj.find('#header');
		const hh = header.height();
		const height = isPopup ? win.height() : (obj.height() - hh);
		
		wrapper.css({ height: height })
		wrapper.find('.side').css({ height: height });
		
		if (isPopup) {
			const element = $('#popupPage .content');
			element.css({ minHeight: 'unset', height: '100%' });
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
		const obj = $(isPopup ? '#popupPage #innerWrap' : '.page.isFull');
		const wrapper = obj.find('.wrapper');

		v ? wrapper.addClass('withPanel') : wrapper.removeClass('withPanel');
	};

	onClickObject (object: any) {
		this.togglePanel(true);
		this.refPanel.setState({ view: I.GraphView.Preview, rootId: object.id });
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	onSwitch (id: string, v: any) {
		this.refGraph.forceProps[id] = v;
		this.refGraph.updateProps();
	};

	onFilterChange (v: string) {
		this.refGraph.forceProps.filter = v ? new RegExp(Util.filterFix(v), 'gi') : '';
		this.refGraph.updateProps();
	};

});

export default PageMainGraph;