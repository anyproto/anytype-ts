import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, C, Decode, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';

import Controls from './dataview/controls';

import ViewGrid from './dataview/view/grid';
import ViewBoard from './dataview/view/board';
import ViewGallery from './dataview/view/gallery';
import ViewList from './dataview/view/list';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	block: I.Block;
};

interface State {
	viewId: string;
	data: any[];
};

const Constant = require('json/constant.json');

@observer
class BlockDataview extends React.Component<Props, State> {

	state = {
		viewId: '',
		data: [],
	};
	
	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.onView = this.onView.bind(this);
	};

	render () {
		const { block } = this.props;
		const { content } = block;
		const { views } = content;
		const { viewId, data } = this.state;

		if (!views.length) {
			return null;
		};
		
		const view = views.find((item: any) => { return item.id == (viewId || views[0].id); });
		const { type } = view;

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
				<Controls {...this.props} view={view} data={data} onView={this.onView} />
				<div className="content">
					<ViewComponent {...this.props} onOpen={this.onOpen} view={view} data={data} />
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		const { block } = this.props;
		const { content } = block;

		if (content.views.length) {
			this.setState({ viewId: content.views[0].id });
		};
	};

	componentDidUpdate (nextProps: Props, nextState: State) {
		if (this.state.viewId != nextState.viewId) {
			this.getData();
		};
	};
	
	onView (e: any, id: string) {
		this.setState({ viewId: id });
	};

	getData () {
		const { rootId, block } = this.props;
		const { viewId } = this.state;

		if (viewId) {
			C.BlockSetDataviewActiveView(rootId, block.id, viewId, 0, 10, (message: any) => {

			});
		};
	};

	getPage (page: any): I.PageInfo {
		let details = Decode.decodeStruct(page.details || {});
		details.name = String(details.name || Constant.default.name || '');

		return {
			id: page.id,
			description: page.snippet,
			...details,
		};
	};

	onOpen (e: any, data: any) {
		DataUtil.pageOpen(e, data.id);
	};
	
};

export default BlockDataview;