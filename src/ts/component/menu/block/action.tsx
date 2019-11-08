import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.Menu {
};

class MenuBlockAction extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};

	render () {
		const markActions = [
			{ type: 'b', name: 'Bold' },
			{ type: 'i', name: 'Italic' },
			{ type: 's', name: 'Strikethrough' },
			{ type: 'a', name: 'Link' },
			{ type: 'kbd', name: 'Code' },
		];
		
		const Item = (item: any) => (
			<div className={'item ' + (item.active ? 'active' : '')} onMouseDown={item.onMouseDown}>
				<Icon className={item.icon} />
				<div className="name">{item.name}</div>
			</div>
		);
		
		return (
			<React.Fragment>
				<div className="section first">
					<Icon arrow className="" />
				</div>
					
				<div className="section">
					{markActions.map((action: any, i: number) => {
						let cn = [ action.type ];
							
						return <Icon id={'icon-' + action.type} key={i} className={cn.join(' ')} />;
					})}
				</div>
					
				<div className="section">
					<Icon className="copy" />
					<Icon className="remove" />
				</div>
			</React.Fragment>
		);
	};

};

export default MenuBlockAction;