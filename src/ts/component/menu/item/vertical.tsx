import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItem {};

class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		const { id, icon, inner, name, color, arrow, isActive, className, onClick, onMouseEnter } = this.props;
		
		let cn = [ 'item' ];
		if (className) {
			cn.push(className);
		};
		if (color) {
			cn.push(color + ' withColor');
		};
		if (arrow) {
			cn.push('withChildren');
		};
		if (isActive) {
			cn.push('active');
		};
		
		return (
			<div id={'item-' + id} className={cn.join(' ')} onClick={onClick} onMouseEnter={onMouseEnter}>
				{icon ? <Icon className={icon} inner={inner} /> : ''}
				<div className="name">{name}</div>
				{arrow ? <Icon className="arrow" /> : ''}
			</div>
		);
    };

};

export default MenuItemVertical;