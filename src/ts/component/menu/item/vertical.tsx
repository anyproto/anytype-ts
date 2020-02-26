import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItem {
	inner?: any;
	className?: string;
	color?: string;
	isActive?: boolean;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
};

class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		const { id, icon, inner, name, color, isActive, className, onClick, onMouseEnter } = this.props;
		
		let cn = [ 'item' ];
		if (className) {
			cn.push(className);
		};
		if (color) {
			cn.push(color + ' withColor');
		};
		if (isActive) {
			cn.push('active');
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