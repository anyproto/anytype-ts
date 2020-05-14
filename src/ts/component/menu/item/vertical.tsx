import * as React from 'react';
import { Icon, Smile } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItem {};

class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		const { id, icon, hash, inner, name, description, color, arrow, isActive, withSmile, withDescription, className, onClick, onMouseEnter } = this.props;
		
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
		if (withDescription) {
			cn.push('withDescription');
		};
		if (isActive) {
			cn.push('active');
		};
		
		let element = null;
		if (withSmile) {
			element = <Smile icon={icon} hash={hash} />;
		} else if (icon) {
			element = <Icon className={icon} inner={inner} />;
		};
		
		return (
			<div id={'item-' + id} className={cn.join(' ')} onClick={onClick} onMouseEnter={onMouseEnter}>
				{withDescription ? (
					<React.Fragment>
						{element}
						<div className="info">
							<div className="name">{name}</div>
							<div className="descr">{description}</div>
						</div>
					</React.Fragment>
				) : (
					<React.Fragment>
						{element}
						<div className="name">{name}</div>
					</React.Fragment>
				)}
				{arrow ? <Icon className="arrow" /> : ''}
			</div>
		);
    };

};

export default MenuItemVertical;