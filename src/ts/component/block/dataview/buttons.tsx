import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props {
	commonStore?: any;
	viewType: I.ViewType;
};

@inject('commonStore')
@observer
class Buttons extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onProperty = this.onProperty.bind(this);
	};

	render () {
		const { commonStore, viewType } = this.props;
		
		return (
			<div className="buttons">
				<div className="side left">
					<div className="item">
						<Icon className="plus" />
						<div className="name">New</div>
					</div>
				</div>
				<div className="side right">
					<div 
						id="button-property" 
						className={'item ' + (commonStore.menuIsOpen('propertyList') ? 'active' : '')} 
						onClick={this.onProperty}
					>
						<Icon className="property" />
						<div className="name">Property</div>
					</div>
					<div className="item">
						<Icon className="filter" />
						<div className="name">Filter</div>
					</div>
					<div className="item">
						<Icon className="sort" />
						<div className="name">Sort</div>
					</div>
					<div className="item">
						<Icon className={'view c' + viewType} />
						<Icon className="arrow" />
					</div>
					<div className="item">
						<Icon className="more" />
					</div>
				</div>
			</div>
		);
	};
	
	onProperty () {
		const { commonStore } = this.props;
		
		commonStore.menuOpen('propertyList', { 
			element: 'button-property',
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left
		});
	};
	
};

export default Buttons;