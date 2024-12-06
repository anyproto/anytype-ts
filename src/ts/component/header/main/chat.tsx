import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Sync } from 'Component';
import { I, S, U, keyboard } from 'Lib';

const HeaderMainChat = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {
	const { rootId, renderLeftIcons, menuOpen } = props;
	
	const onOpen = () => {
		const object = S.Detail.get(rootId, rootId, []);

		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => U.Object.openRoute(object));
	};

	const onSync = () => {
		menuOpen('syncStatus', '#button-header-sync', {
			subIds: [ 'syncStatusInfo' ],
			data: { rootId },
		});
	};

	return (
		<>
			<div className="side left">
				{renderLeftIcons(onOpen)}
				<Sync id="button-header-sync" onClick={onSync} />
			</div>

			<div className="side center" />
			<div className="side right" />
		</>
	);

}));

export default HeaderMainChat;