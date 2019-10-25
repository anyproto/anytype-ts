import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

import Buttons from './dataview/buttons';
import ViewGrid from './dataview/view/grid';
import ViewBoard from './dataview/view/board';
import ViewGallery from './dataview/view/gallery';

interface Props extends I.BlockDataview {
	commonStore?: any;
};
interface State {
	view: string;
};

@inject('commonStore')
@observer
class BlockDataview extends React.Component<Props, State> {

	state = {
		view: ''
	};
	
	constructor (props: any) {
		super(props);
	};

	render () {
		const { commonStore, header, content } = this.props;
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
		};
		
		return (
			<div>
				<div className="views">
					{views.map((item: I.View, i: number) => (
						<ViewItem key={i} {...item} active={item.id == view} />
					))}
					<div className="item">
						<Icon className="plus dark" />
					</div>
				</div>
				
				<Buttons viewType={viewItem.type} />
				<ViewComponent {...this.props} />
			</div>
		);
	};
	
	onView (e: any, id: string) {
		this.setState({ view: id });
	};
	
};

export default BlockDataview;