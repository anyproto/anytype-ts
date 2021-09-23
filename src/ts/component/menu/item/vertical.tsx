import * as React from 'react';
import { Icon, IconObject, Switch } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItem {};

class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		let { id, icon, object, inner, name, description, caption, color, arrow, checkbox, isActive, withDescription, withCaption, withSwitch, className, onClick, onMouseEnter, onMouseLeave, style, iconSize, switchValue, onSwitch } = this.props;
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
		if (withSwitch) {
			cn.push('withSwitch');
		};
		if (checkbox) {
			cn.push('withCheckbox');
		};
		if (isActive) {
			cn.push('active');
		};

		let iconElement = null;
		if (object) {
			iconElement = <IconObject object={object} size={iconSize} />;

			if (object.isHidden) {
				cn.push('isHidden');
			};
		} else 
		if (icon) {
			iconElement = <Icon className={icon} inner={inner} />;
		};

		let content = null;
		if (withDescription) {
			content = (
				<React.Fragment>
					{iconElement}
					<div className="info">
						<div className="txt">
							<div className="name">{name}</div>
							<div className="descr">{description}</div>
						</div>
					</div>
				</React.Fragment>
			);
		} else {
			if (withSwitch) {
				content = (
					<React.Fragment>
						<div className="clickable" onMouseDown={onClick}>
							{iconElement}
							<div className="name">{name}</div>
						</div>
						<Switch 
							value={switchValue} 
							onChange={(e: any, v: boolean) => { onSwitch(e, v); }} 
						/>
					</React.Fragment>
				);
			} else {
				content = (
					<React.Fragment>
						{iconElement}
						<div className="name">{name}</div>
						{withCaption ? <div className="caption" dangerouslySetInnerHTML={{ __html: caption }} /> : ''}
					</React.Fragment>
				);
			};
		};

		return (
			<div 
				id={'item-' + id} 
				className={cn.join(' ')} 
				onMouseDown={!withSwitch ? onClick : undefined} 
				onMouseEnter={onMouseEnter} 
				onMouseLeave={onMouseLeave} 
				style={style}
			>
				{content}
				{arrow ? <Icon className="arrow" /> : ''}
				{checkbox ? <Icon className="chk" /> : ''}
			</div>
		);
    };

};

export default MenuItemVertical;