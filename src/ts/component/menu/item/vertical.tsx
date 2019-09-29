import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItemInterface {
	onClick?(e: any, id: string): void;
};

class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		const { icon, name, onClick } = this.props;
		
        return (
			<div className="item" onMouseDown={(e: any) => { onClick(e, icon); }}>
				<Icon className={icon} />
				<div className="name">{name}</div>
			</div>
		);
    };

};

export default MenuItemVertical;