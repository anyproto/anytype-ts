import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItemInterface {
	click?(e: any, id: string): void;
};

class MenuItemVertical extends React.Component<Props, {}> {

	render () {
		const { id, name, click } = this.props;
		
        return (
			<div className="item" onMouseDown={(e: any) => { click(e, id); }}>
				<Icon className={id} />
				<div className="name">{name}</div>
			</div>
		);
    };

};

export default MenuItemVertical;