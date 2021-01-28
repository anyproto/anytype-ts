import * as React from 'react';
import { Icon, IconObject } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, dbStore } from 'ts/store';

interface Props extends I.MenuItem {};

@observer
class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		let { id, icon, object, inner, name, menuId, description, caption, color, arrow, isActive, withDescription, withCaption, className, onClick, onMouseEnter, style, iconSize } = this.props;
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
		if (isActive) {
			cn.push('active');
		};
		if (menuId && commonStore.menuIsOpen(menuId)) {
			cn.push('active');
		};

		let element = null;
		if (object) {
			element = <IconObject object={object} size={iconSize} />;
		} else 
		if (icon) {
			element = <Icon className={icon} inner={inner} />;
		};

		return (
			<div id={'item-' + id} className={cn.join(' ')} onClick={onClick} onMouseEnter={onMouseEnter} style={style}>
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
						{withCaption ? (
							<div className="caption">{caption}</div>
						) : ''}
					</React.Fragment>
				)}
				{arrow ? <Icon className="arrow" /> : ''}
			</div>
		);
    };

};

export default MenuItemVertical;