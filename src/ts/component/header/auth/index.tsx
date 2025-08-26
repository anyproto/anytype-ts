import React, { forwardRef, useEffect, useRef } from 'react';
import { Icon, Label, Select } from 'Component';
import { observer } from 'mobx-react';
import { Action, Animation, I, S, U, J } from 'Lib';

const HeaderAuthIndex = observer(forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const pathname = U.Router.getRoute();
	const { action } = U.Router.getParam(pathname);
	const { interfaceLang } = S.Common;
	const interfaceLanguages = U.Menu.getInterfaceLanguages();
	const refLang = useRef(null);

	const onBack = () => {
		const isOnboarding = action == 'onboard';

		S.Auth.logout(true, false);
		Animation.from(() => U.Router.go('/', { replace: true }));
	};

	useEffect(() => {
		window.setTimeout(() => {
			refLang?.current.setValue(S.Common.interfaceLang);
		}, J.Constant.delay.route);
	}, []);

	return (
		<>
			<div className="side left">
				<Icon className="arrow back" onClick={onBack} />
			</div>
			<div className="side center">
				<div className="logo" />
			</div>
			<div className="side right">
				<Select
					ref={refLang}
					id="interfaceLang"
					value={interfaceLang}
					options={interfaceLanguages}
					onChange={v => Action.setInterfaceLang(v)}
					menuParam={{ horizontal: I.MenuDirection.Right, width: 300 }}
				/>

				<Icon className="settings withBackground" onClick={() => S.Popup.open('settingsOnboarding', {})} />
			</div>
		</>
	);
}));

export default HeaderAuthIndex;
