import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, S, U, keyboard } from 'Lib';

const HeaderMainChat = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {
	const { rootId, renderLeftIcons } = props;
	const object = S.Detail.get(rootId, rootId, []);
	
	const onOpen = () => {
		keyboard.disableClose(true);
		S.Popup.closeAll(null, () => U.Object.openRoute(object));
	};

	return (
		<>
			<div className="side left">{renderLeftIcons(true, onOpen)}</div>
			<div className="side center" />
			<div className="side right" />
		</>
	);

}));

export default HeaderMainChat;
