import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, crumbs, Util } from 'ts/lib';
import { RouteComponentProps } from 'react-router';
import { HeaderMainGraph as Header, Graph, Filter, MenuItemVertical, Icon } from 'ts/component';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	matchPopup?: any;
};

const Constant = require('json/constant.json');
const $ = require('jquery');

const PageMainGraph = observer(class PageMainGraph extends React.Component<Props, {}> {

	data: any = {
		nodes: [],
		edges: [],
	};
	refHeader: any = null;
	refGraph: any = null;

	render () {
		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const itemsAppearance: any[] = [
			{ id: 'labels', icon: 'label', name: 'Labels' },
			{ id: 'links', icon: 'link', name: 'Links' },
			{ id: 'relations', icon: 'relation', name: 'Relations' },
			{ id: 'orphans', icon: 'orphan', name: 'Orphans' },
		];
		const ref = this.refGraph;

		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />

				<div className="wrapper">
					<div className="side left">
						<Graph 
							key="graph"
							ref={(ref: any) => { this.refGraph = ref; }} 
							rootId={rootId} 
							data={this.data}
							{...this.props} 
						/>
					</div>

					<div className="side right">
						{this.refGraph ? (
							<React.Fragment>
								<div className="tabs">
									<div className="tab">View</div>
									<div className="tab">Filters</div>
								</div>
								<div className="sections">
									<div className="section">
										<div className="name">Appearance</div>
										{itemsAppearance.map((item: any, i: number) => (
											<MenuItemVertical 
												key={i}
												{...item}
												withSwitch={true}
												switchValue={ref.forceProps[item.id]}
												onSwitch={(e: any, v: any) => {
													ref.forceProps[item.id] = v;
													ref.updateProps();
												}}
											/>
										))}
									</div>
								</div>

								<div className="bottom">
									<Icon className="search" />
									<Filter placeholder="Search for an object" onChange={(v: string) => {
										ref.forceProps.filter = v ? new RegExp(Util.filterFix(v), 'gi') : '';
										ref.updateProps();
									}} />
								</div>
							</React.Fragment>
						) : ''}
						</div>
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
					blockStore.profile,
					blockStore.storeType,
					blockStore.storeTemplate,
					blockStore.storeRelation,
				] 
			},
		];

		C.ObjectGraph(filters, 0, [], (message: any) => {
			if (message.error.code) {
				return;
			};

			this.data.edges = message.edges.filter(d => { return d.source !== d.target; });
			this.data.nodes = message.nodes;
			
			this.forceUpdate();
			this.refGraph.init();
		});
	};

	updateLabel (id: string, text: string) {
		const node = $(ReactDOM.findDOMNode(this));
		node.find(`#${id}`).text(text);
	};

	resize () {
		const { isPopup } = this.props;
		const win = $(window);
		const obj = $(isPopup ? '#popupPage #innerWrap' : '.page');
		const wrapper = obj.find('.wrapper');
		const header = obj.find('#header');
		const tabs = obj.find('.tabs');
		const hh = header.height();

		let height = 0;
		if (isPopup) {
			height = obj.height();
		} else {
			height = win.height();
		};

		tabs.css({ lineHeight: hh + 'px' });
		wrapper.find('.side').css({ height: height });
		
		if (isPopup) {
			const obj = $('#popupPage .content');
			obj.css({ minHeight: 'unset', height: '100%' });
		};

		this.refGraph.resize();
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

});

export default PageMainGraph;