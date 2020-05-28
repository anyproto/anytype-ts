import * as React from 'react';
import { Icon } from 'ts/component';
import { I, C, StructDecode } from 'ts/lib';
import { blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

import Controls from './dataview/controls';

import ViewGrid from './dataview/view/grid';
import ViewBoard from './dataview/view/board';
import ViewGallery from './dataview/view/gallery';
import ViewList from './dataview/view/list';

interface Props {
	rootId: string;
	block: I.Block;
};

interface State {
	view: string;
	data: any[];
};

const Constant = require('json/constant.json');
const Schema = {
	page: require('json/schema/page.json'),
	relation: require('json/schema/relation.json'),
};

@observer
class BlockDataview extends React.Component<Props, State> {

	state = {
		view: '',
		data: [],
	};
	
	constructor (props: any) {
		super(props);
		
		this.onView = this.onView.bind(this);
		this.getContent = this.getContent.bind(this);
	};

	render () {
		const { view } = this.state;
		const { block } = this.props;
		const { views, data, properties } = this.getContent();

		if (!view) {
			return null;
		};

		const viewItem = views.find((item: any) => { return item.id == view; });
		
		let ViewComponent: React.ReactType<{ getContent(): any; }>;
		switch (viewItem.type) {
			default:
			case I.ViewType.Grid:
				ViewComponent = ViewGrid;
				break;
				
			case I.ViewType.Board:
				ViewComponent = ViewBoard;
				break;
				
			case I.ViewType.Gallery:
				ViewComponent = ViewGallery;
				break;
			
			case I.ViewType.List:
				ViewComponent = ViewList;
				break;
		};
		
		return (
			<React.Fragment>
				<Controls {...this.props} getContent={this.getContent} {...block} view={view} viewType={viewItem.type} onView={this.onView} />
				<div className="content">
					<ViewComponent {...this.props} getContent={this.getContent} />
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		const { views } = this.getContent();
		
		if (views.length) {
			this.setState({ view: views[0].id });
		};

		this.getData();
	};
	
	onView (e: any, id: string) {
		this.setState({ view: id });
	};

	schemaField (v: string) {
		const a = v.split('/');
		return a[a.length - 1];
	};

	getContent () {
		const { data } = this.state;
		const { block } = this.props;
		const { content } = block;

		let schemaId = 'https://anytype.io/schemas/page';
		let schema = Schema[this.schemaField(schemaId)];

		if (!schema) {
			return {};
		};

		let ret: any = {
			views: [
				{ 
					id: '1', name: 'Grid', type: I.ViewType.Grid,
					sorts: [
						{ propertyId: '1', type: I.SortType.Asc },
						{ propertyId: '2', type: I.SortType.Desc },
					],
					filters: [
						{ propertyId: '1', condition: I.FilterOperator.And, equality: I.FilterCondition.Equal, value: '' },
						{ propertyId: '1', condition: I.FilterOperator.And, equality: I.FilterCondition.Equal, value: '' },
					]
				},
				{ id: '2', name: 'Board', type: I.ViewType.Board, sorts: [], filters: [] },
				{ id: '3', name: 'Gallery', type: I.ViewType.Gallery, sorts: [], filters: [] },
				{ id: '4', name: 'List', type: I.ViewType.List, sorts: [], filters: [] },
			],
			properties: [],
			data: data,
		};

		ret.properties.push({
			id: 'id',
			name: 'Id',
			type: I.PropertyType.Text,
		});

		for (let field of schema.default) {
			ret.properties.push({
				id: field.id,
				name: field.name,
				type: this.schemaField(field.type),
			});
		};

		ret.views = content.views;
		return ret;
	};

	getData () {
		C.NavigationListPages((message: any) => {
			let pages = message.pages.map((it: any) => { return this.getPage(it); });
			this.setState({ data: pages });
		});
	};

	getPage (page: any): I.PageInfo {
		let details = StructDecode.decodeStruct(page.details || {});
		details.name = String(details.name || Constant.default.name || '');

		return {
			id: page.id,
			...details,
		};
	};
	
};

export default BlockDataview;