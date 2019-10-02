import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props {
	commonStore?: any;
};

@inject('commonStore')
@observer
class HeaderMainIndex extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onCover = this.onCover.bind(this);
		this.onProfile = this.onProfile.bind(this);
	};

	render () {
		return (
			<div className="header">
				<Icon className="logo" />
				<div className="menu">
					<div id="button-cover" className="item" onMouseDown={this.onCover}>Change cover</div>
					<div className="item" onMouseDown={this.onProfile}>Settings</div>
				</div>
			</div>
		);
	};
	
	onCover (e: any) {
		const { commonStore } = this.props;
		
		commonStore.menuOpen('cover', { 
			element: 'button-cover',
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left
		});
	};
	
	onProfile (e: any) {
		const { commonStore } = this.props;
		commonStore.popupOpen('profile', {});
	};

};

export default HeaderMainIndex;