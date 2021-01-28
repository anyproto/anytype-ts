import * as React from 'react';
import { Menu } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I } from 'ts/lib';

interface Props {
	history: any;
};

@observer
class ListMenu extends React.Component<Props, {}> {

	render () {
		const { history } = this.props;
		const { menus } = commonStore;
		
		return (
			<div className="menus">
				{menus.map((item: I.Menu, i: number) => (
					<Menu history={history} key={i} {...item} />
				))}
				<div id="menu-polygon" />
			</div>
		);
	};
	
};

export default ListMenu;