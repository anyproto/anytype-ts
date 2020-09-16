import * as React from 'react';
import { I } from 'ts/lib';
import { Icon, Input, Button } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

@observer
class MenuObjectType extends React.Component<Props, {}> {
	
	constructor(props: any) {
		super(props);
		
		this.onType = this.onType.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;

		return (
			<div>
				<div className="sectionName">Object type name</div>
				<div className="wrap">
					<Input />
				</div>
				<div className="section">
					<div className="name">Object view type</div>
				</div>
				<div className="sectionName">object type name</div>
				<div id="object-type" className={'item ' + (commonStore.menuIsOpen('select') ? 'active' : '')} onClick={this.onType}>
					<div className="name">Select type</div>
					<Icon className="arrow" />
				</div>
				<div className="buttons">
					<Button text="Create" className="orange" />
				</div>
			</div>
		);
	};
	
	onType (e: any) {
		const { param } = this.props;
		const { data } = param;
		const options = [
			{ id: 'page', icon: 'page', emoji: '', name: 'Page' },
			{ id: 'contact', icon: 'contact', emoji: '', name: 'Contact' },
			{ id: 'task', icon: 'task', emoji: '', name: 'Task' },
		];;
		
		commonStore.menuOpen('select', { 
			element: '#object-type',
			offsetX: 224,
			offsetY: 4,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Left,
			data: {
				options: options,
			}
		});
	};
	
};

export default MenuObjectType;