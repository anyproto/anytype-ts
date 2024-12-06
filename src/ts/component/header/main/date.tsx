import * as React from 'react';
import { observer } from 'mobx-react';
import { Sync } from 'Component';
import { I, S } from 'Lib';

const HeaderMainDate = observer(class HeaderMainObject extends React.Component<I.HeaderComponent> {
	render () {
		const { rootId } = this.props;
		const root = S.Block.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		return (
			<React.Fragment>
				<div className="side left">
					<Sync id="button-header-sync" onClick={this.onSync} />
				</div>
			</React.Fragment>
		);
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

export default HeaderMainDate;
