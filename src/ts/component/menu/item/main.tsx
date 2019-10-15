import * as React from 'react';
import { Smile } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.MenuItem {};

class MenuItemMain extends React.Component<Props, {}> {

	render () {
		const { icon, name } = this.props;
		
        return (
			<div className="item" onMouseDown={(e: any) => { }}>
				<Smile icon={icon} size={24} />
				<div className="name">{name}</div>
			</div>
		);
    };

};

export default MenuItemMain;