import React, { forwardRef, useEffect, useRef } from 'react';
import Icon from 'Component/util/icon';
import Select from 'Component/form/select';
import * as I from 'Interface';
import Animation from 'Lib/animation';

interface Props extends I.HeaderComponent {
	onBack?: () => void;
};

const HeaderAuthIndex = forwardRef<{}, Props>((props, ref) => {

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
				<Icon name="common/back" className="arrow back" withBackground={true} onClick={onBackHandler} />
			</div>
			<div className="side center">
				<div className="logo" />
			</div>
			<div className="side right">
				<Select
					ref={refLang}
					id="interfaceLang"
					iconParam={{ name: 'header/language', size: 18 }}
					value={interfaceLang}
					options={interfaceLanguages}
					onChange={v => Action.setInterfaceLang(v)}
					menuParam={{ horizontal: I.MenuDirection.Right, width: 300 }}
				/>

				<Icon
					name="header/settings"
					className="settings"
					withBackground={true}
					onClick={() => S.Popup.open('settingsOnboarding', {})} 
				/>
			</div>
		</>
	);
});

export default HeaderAuthIndex;