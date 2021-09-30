import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C } from 'ts/lib';
import { RouteComponentProps } from 'react-router';
import { HeaderMainGraph as Header, Graph } from 'ts/component';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
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

		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />
				<Graph 
					ref={(ref: any) => { this.refGraph = ref; }} 
					rootId={rootId} 
					data={this.data}
					{...this.props} 
				/>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		this.load();
	};

	componentDidUpdate () {
		this.resize();
	};

	load () {
		const filters: any[] = [
			{ 
				operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, 
				value: [ 
					Constant.typeId.relation,
					Constant.typeId.template,
					Constant.typeId.type,
					Constant.typeId.file,
					Constant.typeId.image,
					Constant.typeId.video,
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
			
			this.refGraph.init();
		});
	};

	resize () {
		const { isPopup } = this.props;
		
		if (isPopup) {
			const obj = $('#popupPage .content');
			obj.css({ minHeight: 'unset', height: '100%' });
		};
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

});

export default PageMainGraph;