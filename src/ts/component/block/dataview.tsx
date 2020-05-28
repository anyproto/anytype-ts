import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
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
};

@observer
class BlockDataview extends React.Component<Props, State> {

	state = {
		view: ''
	};
	
	constructor (props: any) {
		super(props);
		
		this.onView = this.onView.bind(this);
		this.getContent = this.getContent.bind(this);
	};

	render () {
		const { rootId, block } = this.props;
		const { id } = block;
		const { view, views, data, properties } = this.getContent();
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
	
	onView (e: any, id: string) {
		this.setState({ view: id });
	};

	getContent () {
		const { block } = this.props;
		const { content } = block;

		console.log('CONTENT', JSON.stringify(content, null, 3));
		let ret = {
			view: 1,
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
			properties: [
				{ id: '1', name: 'Id', type: I.PropertyType.Number },
				{ id: '2', name: 'Name', type: I.PropertyType.Title },
				{ id: '4', name: 'E-mail', type: I.PropertyType.Email },
				{ id: '5', name: 'Date', type: I.PropertyType.Date },
				{ id: '6', name: 'Select', type: I.PropertyType.Select, values: [ 'select1', 'select2', 'select3' ] },
				{ id: '7', name: 'Multiple', type: I.PropertyType.Multiple, values: [ 'multiple1', 'multiple2', 'multiple3', 'multiple4', 'multiple5' ] },
				{ id: '8', name: 'Account', type: I.PropertyType.Link, values: [ { name: 'Anton Barulenkov' }, { 'name': 'Zhanna Sharipova' } ] },
				{ id: '9', name: 'File', type: I.PropertyType.File },
				{ id: '10', name: 'Bool', type: I.PropertyType.Bool },
				{ id: '11', name: 'Url', type: I.PropertyType.Url },
				{ id: '12', name: 'Phone', type: I.PropertyType.Phone },
			],
			data: [
				{ 
					'1': '1', '2': 'Anton Pronkin', '4': 'pronkin@gmail.com', '5': 1420200661, '6': 'select1', '11': 'http://anytype.io', 
					'12': '+7 (1234) 5678910', '7': [ 'value1', 'value2', 'value3' ], '10': true, '8': { name: 'Anton Barulenkov' }
				},
				{ '1': '2', '2': 'Roman Khafizianov', '4': 'khafizianov@gmail.com', '5': 1420200661, '6': 'select2', '11': 'ftp://anytype.io' },
				{ '1': '3', '2': 'Zhanna Sharipova', '4': 'sharipova@gmail.com', '5': 1420200662, '6': 'select3', '11': 'telnet://anytype.io' },
				{ '1': '4', '2': 'Anton Barulenkov', '4': 'barulenkov@gmail.com', '5': 1420200662, '6': 'select4', '11': 'https://anytype.io' },
				{ '1': '5', '2': 'Kirill', '4': 'kirill@gmail.com', '5': 1420200663, '6': 'select5' },
			]
		};

		ret.views = content.views;

		return ret;
	};
	
};

export default BlockDataview;