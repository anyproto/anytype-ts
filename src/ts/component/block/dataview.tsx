import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, C, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { blockStore } from 'ts/store';

import Controls from './dataview/controls';

import ViewGrid from './dataview/view/grid';
import ViewBoard from './dataview/view/board';
import ViewGallery from './dataview/view/gallery';
import ViewList from './dataview/view/list';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	block: I.Block;
};

const $ = require('jquery');
const Schema = {
	page: require('json/schema/page.json'),
	relation: require('json/schema/relation.json'),
};

@observer
class BlockDataview extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.onView = this.onView.bind(this);
	};

	render () {
		const { block } = this.props;
		const { content } = block;
		const { schemaURL, views, data, viewId } = content;

		console.log('View', viewId, data);

		if (!views.length) {
			return null;
		};

		const view = views.find((item: any) => { return item.id == (viewId || views[0].id); });
		const { type } = view;
		const schema = Schema[DataUtil.schemaField(schemaURL)];
		const readOnly = true; // TMP

		if (!view) {
			return null;
		};

		let ViewComponent: React.ReactType<I.ViewComponent>;
		switch (type) {
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
				<Controls {...this.props} view={view} data={data} readOnly={readOnly} onView={this.onView} />
				<div className="content">
					<ViewComponent {...this.props} onOpen={this.onOpen} readOnly={readOnly} view={view} data={data} />
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		const { block } = this.props;
		const { content } = block;

		if (content.views.length) {
			this.getData(content.views[0].id);
		};
	};

	componentDidUpdate () {
		console.log('UPDATE');
		console.log(JSON.stringify(this.props.block, null, 3));
		$(window).trigger('resize.editor');
	};

	onView (id: string) {
		this.getData(id);
	};

	getData (viewId: string) {
		const { rootId, block } = this.props;

		block.content.viewId = viewId;
		blockStore.blockUpdate(rootId, block);

		C.BlockSetDataviewActiveView(rootId, block.id, viewId, 0, 10);
	};

	onOpen (e: any, data: any) {
		DataUtil.pageOpen(e, data.id);
	};
	
};

export default BlockDataview;