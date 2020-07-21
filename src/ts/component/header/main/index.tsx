import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, DataUtil, SmileUtil, Util } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any>  {};

@observer
class HeaderMainIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onSettings = this.onSettings.bind(this);
		this.onSearch = this.onSearch.bind(this);
	};

	render () {
		return (
			<div className="header headerMainIndex">
				<Icon className="logo" />

				<div className="side right">
					<Icon tooltip="Search for page" className={[ 'search', (commonStore.popupIsOpen('navigation') ? 'active' : '') ].join(' ')} onClick={this.onSearch} />
					<Icon tooltip="Create new page" className="add" onClick={this.onAdd} />
					<Icon tooltip="Settings" className={[ 'settings', (commonStore.popupIsOpen('settings') ? 'active' : '') ].join(' ')} onClick={this.onSettings} />
				</div>
			</div>
		);
	};

	onSearch (e: any) {
		const { root } = blockStore;

		commonStore.popupOpen('navigation', { 
			preventResize: true,
			data: { 
				type: I.NavigationType.Go, 
				disableFirstKey: true,
				rootId: root,
			}, 
		});
	};

	onAdd (e: any) {
		const { root } = blockStore;
		
		DataUtil.pageCreate(e, root, '', { iconEmoji: SmileUtil.random() }, I.BlockPosition.Bottom, (message: any) => {
			Util.scrollTopEnd();
		});
	};

	onSettings (e: any) {
		commonStore.popupOpen('settings', {});
	};

};

export default HeaderMainIndex;