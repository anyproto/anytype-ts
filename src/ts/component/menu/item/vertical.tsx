import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItem {
	className?: string;
	onClick?(e: any, id: string): void;
};

class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		const { id, icon, name, onClick, className } = this.props;
		
		let cn = [ 'item' ];
		if (className) {
			cn.push(className);
		};
		
		return (
			<div id={'item-' + id} className={cn.join(' ')} onMouseDown={(e: any) => { onClick(e, icon); }}>
				<Icon className={icon} />
				<div className="name">{name}</div>
			</div>
		);
    };

};

export default MenuItemVertical;