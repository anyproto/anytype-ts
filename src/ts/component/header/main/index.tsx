import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { Util } from 'ts/lib';
import { popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	isPopup?: boolean;
};

const HeaderMainIndex = observer(class HeaderMainIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onSettings = this.onSettings.bind(this);
		this.onSearch = this.onSearch.bind(this);
	};

	render () {
		return (
			<div id="header" className="header headerMainIndex">
				<div className="side center" onClick={this.onSearch}>Search for an object</div>

				<div className="side right">
					<Icon tooltip="Settings" className={[ 'settings', (popupStore.isOpen('settings') ? 'active' : '') ].join(' ')} onClick={this.onSettings} />
				</div>
			</div>
		);
	};

	componentDidMount () {
		Util.resizeSidebar();
	};

	componentDidUpdate () {
		Util.resizeSidebar();	
	};

	onSearch (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { isPopup } = this.props;

		popupStore.open('search', {
			preventResize: true, 
			data: { 
				isPopup,
			},
		});
	};

	onSettings (e: any) {
		popupStore.open('settings', {});
	};

});

export default HeaderMainIndex;