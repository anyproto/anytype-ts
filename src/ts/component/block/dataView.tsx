import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

import ViewGrid from './dataView/view/grid';

interface Props extends I.BlockDataView {};
interface State {
	view: string;
};

class BlockDataView extends React.Component<Props, State> {

	state = {
		view: ''
	};

	render () {
		const { header, content } = this.props;
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
				
				<div className="buttons">
				</div>
				
				<ViewComponent {...this.props} />
			</div>
		);
	};
	
	onView (e: any, id: string) {
		this.setState({ view: id });
	};
	
};

export default BlockDataView;