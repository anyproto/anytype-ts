import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, keyboard } from 'Lib';

const HeaderMainChat = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {
	const { rootId, renderLeftIcons } = props;
	
	const onOpen = () => {
		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => U.Object.openRoute(S.Detail.get(rootId, rootId, [])));
	};

	return (
		<>
			<div className="side left">{renderLeftIcons(onOpen)}</div>
			<div className="side center" />
			<div className="side right" />
		</>
	);

}));

export default HeaderMainChat;