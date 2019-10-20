import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

import ViewGrid from './db/view/grid';

interface Props extends I.BlockDb {};
interface State {
	view: number;
};

class BlockDb extends React.Component<Props, {}> {

	state = {
		view: ''
	};

	render () {
		const { views, data, properties } = this.props;
		const view = this.state.view || this.props.view;
		const viewItem = views.find((item) => { return item.id == view; });
		
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
			<div className="blockDb">
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

export default BlockDb;