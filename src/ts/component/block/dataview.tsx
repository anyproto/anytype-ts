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
	};

	render () {
		const { rootId, block } = this.props;
		const { id, content } = block;
		const { views, data, properties } = content;
		const view = this.state.view || content.view;
		const viewItem = views.find((item: any) => { return item.id == view; });
		
		const ViewItem = (item: any) => (
			<div className={'item ' + (item.active ? 'active' : '')} onClick={(e: any) => { this.onView(e, item.id); }}>
				{item.name}
			</div>
		);
		
		let ViewComponent: React.ReactType<{}>;
		
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
				<Controls {...this.props} {...block} view={view} viewType={viewItem.type} onView={this.onView} />
				<div className="content">
					<ViewComponent {...this.props} />
				</div>
			</React.Fragment>
		);
	};
	
	onView (e: any, id: string) {
		this.setState({ view: id });
	};
	
};

export default BlockDataview;