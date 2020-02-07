import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItem {
	inner?: any;
	className?: string;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
};

class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		const { id, icon, inner, name, className, onClick, onMouseEnter } = this.props;
		
		let cn = [ 'item' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div id={'item-' + id} className={cn.join(' ')} onClick={onClick} onMouseEnter={onMouseEnter}>
				<Icon className={icon} inner={inner} />
				<div className="name">{name}</div>
			</div>
		);
    };

};

export default MenuItemVertical;