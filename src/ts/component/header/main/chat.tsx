import * as React from 'react';
import { observer } from 'mobx-react';
import { Sync } from 'Component';
import { I, S, U, J, keyboard } from 'Lib';

const HeaderMainChat = observer(class HeaderMainChat extends React.Component<I.HeaderComponent> {

	render () {
		const { rootId, renderLeftIcons } = this.props;

		return (
			<React.Fragment>
				<div className="side left">
					{renderLeftIcons(this.onOpen)}
					<Sync id="button-header-sync" onClick={this.onSync} />
				</div>

				<div className="side center" />
				<div className="side right" />
			</React.Fragment>
		);
	};

	onOpen = () => {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, []);

		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => U.Object.openRoute(object));
	};

	onSync = () => {
		const { rootId, menuOpen } = this.props;

		menuOpen('syncStatus', '#button-header-sync', {
			subIds: [ 'syncStatusInfo' ],
			data: {
				rootId,
			}
		});
	};
	
});

export default HeaderMainChat;