import React, { forwardRef, useEffect, useRef } from 'react';
import { Icon, Select } from 'Component';
import { observer } from 'mobx-react';
import { Action, Animation, I, S, U, J } from 'Lib';

interface Props extends I.HeaderComponent {
	onBack?: () => void;
};

const HeaderAuthIndex = observer(forwardRef<{}, Props>((props, ref) => {

	const { onBack } = props;
	const { interfaceLang } = S.Common;
	const interfaceLanguages = U.Menu.getInterfaceLanguages();
	const refLang = useRef(null);

	const onBackHandler = () => {
		if (onBack) {
			onBack();
			return;
		};

		S.Auth.logout(true, false);
		Animation.from(() => U.Router.go('/auth/select', { replace: true }));
	};

	useEffect(() => {
		window.setTimeout(() => {
			if (refLang && refLang.current) {
				refLang.current.setValue(S.Common.interfaceLang);
			};
		}, J.Constant.delay.route);
	}, []);

	return (
		<>
			<div className="side left">
				<Icon className="arrow back withBackground" onClick={onBackHandler} />
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