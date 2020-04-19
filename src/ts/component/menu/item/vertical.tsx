import * as React from 'react';
import { Icon, Smile } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItem {};

class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		const { id, icon, withSmile, inner, name, color, arrow, isActive, className, onClick, onMouseEnter } = this.props;
		
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
		
		let element = null;
		if (withSmile) {
			element = <Smile icon={icon} />;
		} else if (icon) {
			element = <Icon className={icon} inner={inner} />;
		};
		
		return (
			<div id={'item-' + id} className={cn.join(' ')} onClick={onClick} onMouseEnter={onMouseEnter}>
				{element}
				<div className="name">{name}</div>
				{arrow ? <Icon className="arrow" /> : ''}
			</div>
		);
    };

};

export default MenuItemVertical;