import * as React from 'react';
import { Icon, IconObject } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItem {};

class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		let { id, icon, object, inner, name, description, caption, color, arrow, checkbox, isActive, withDescription, withCaption, className, onClick, onMouseEnter, onMouseLeave, style, iconSize } = this.props;
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
		if (withCaption) {
			cn.push('withCaption');
		};
		if (checkbox) {
			cn.push('withCheckbox');
		};
		if (isActive) {
			cn.push('active');
		};

		let element = null;
		if (object) {
			element = <IconObject object={object} size={iconSize} />;

			if (object.isHidden) {
				cn.push('isHidden');
			};
		} else 
		if (icon) {
			element = <Icon className={icon} inner={inner} />;
		};

		return (
			<div 
				id={'item-' + id} 
				className={cn.join(' ')} 
				onMouseDown={onClick} 
				onMouseEnter={onMouseEnter} 
				onMouseLeave={onMouseLeave} 
				style={style}
			>
				{withDescription ? (
					<React.Fragment>
						{element}
						<div className="info">
							<div className="txt">
								<div className="name">{name}</div>
								<div className="descr">{description}</div>
							</div>
						</div>
					</React.Fragment>
				) : (
					<React.Fragment>
						{element}
						<div className="name">{name}</div>
						{withCaption ? <div className="caption" dangerouslySetInnerHTML={{ __html: caption }} /> : ''}
					</React.Fragment>
				)}
				{arrow ? <Icon className="arrow" /> : ''}
				{checkbox ? <Icon className="chk" /> : ''}
			</div>
		);
    };

};

export default MenuItemVertical;