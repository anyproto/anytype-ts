import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, sidebar } from 'Lib';
import { commonStore } from 'Store';

const Header = observer(class Header extends React.Component {

	render () {
		return (
			<div className="sidebarHeader">
				<Icon
					className="toggleSidebar"
					tooltip="Close sidebar"
					tooltipY={I.MenuDirection.Bottom}
					onClick={() => { commonStore.isSidebarFixed ? sidebar.collapse() : sidebar.expand(); }}
				/>
			</div>
		);
	};

});

export default Header;
