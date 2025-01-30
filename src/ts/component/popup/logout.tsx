import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Title, Icon, Label, Button, Phrase } from 'Component';
import { I, keyboard, translate, Storage, S, Renderer, C, analytics, U } from 'Lib';

const PopupLogout = forwardRef<{}, I.Popup>(({ param, close }, ref) => {

	const { account } = S.Auth;
	const buttonsRef = useRef(null);
	const phraseRef = useRef(null);
	const [ n, setN ] = useState(0);

	const setHighlight = () => {
		const buttons = $(buttonsRef).find('.button');

		if (buttons[n]) {
			$(buttonsRef).find('.hover').removeClass('hover');
			$(buttons[n]).addClass('hover');
		};
	};

	const onKeyDown = (e) => {
		keyboard.shortcut('enter, space', e, () => {
			e.stopPropagation();
			const buttons = $(buttonsRef).find('.button');

			if (buttons[n]) {
				$(buttons[n]).trigger('click');
			};
		});

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (arrow) => {
			const dir = [ 'arrowup', 'arrowleft' ].includes(arrow) ? 1 : -1;
			const buttons = $(buttonsRef).find('.button');

			if (buttons.length < 2) {
				return;
			};

			let next = n + dir;
			if (next < 0) {
				next = buttons.length - 1;
			};
			if (next > buttons.length - 1) {
				next = 0;
			};

			setN(next);
			setHighlight();
		});
	};

	const onLogout = () => {
		analytics.event('LogOut');

		U.Router.go('/', {
			replace: true,
			animate: true,
			onRouteChange: () => {
				S.Auth.logout(true, false);
			},
		});
	};

	const onToggle = (isHidden: boolean) => {
		if (!isHidden) {
			U.Common.copyToast(translate('commonPhrase'), phraseRef.current.getValue());
			analytics.event('KeychainCopy', { type: 'BeforeLogout' });
		};
	};

	const onCopy = () => {
		phraseRef.current.onToggle();
	};

	const onMouseEnter = (e: any) => {
		const buttons = $(buttonsRef).find('.button');

		setN($(buttons).index(e.currentTarget));
		setHighlight();
	};

	const init = () => {
		if (!account) {
			return;
		};

		setHighlight();

		Renderer.send('keytarGet', account.id).then((value: string) => {
			C.WalletConvert(value, '', (message: any) => {
				if (!message.error.code) {
					phraseRef.current.setValue(value);
				};
			});
		});


		analytics.event('ScreenKeychain', { type: 'BeforeLogout' });
	};

	useEffect(() => {
		init();
		$(window).on('keydown.logout', e => onKeyDown(e));

		return () => {
			$(window).off('keydown.logout');
		};
	}, []);

	return (
		<div className="wrap">
			<Title text={translate('popupLogoutTitle')} />
			<Label text={translate('popupLogoutText')} />

			<div className="inputs" onClick={onCopy}>
				<Phrase
					ref={phraseRef}
					readonly={true}
					isHidden={true}
					checkPin={true}
					onToggle={onToggle}
				/>
			</div>

			<div ref={buttonsRef} className="buttons">
				<Button text={translate('popupLogoutCopyButton')} color="black" className="c36" onClick={onCopy} onMouseEnter={onMouseEnter} />
				<Button text={translate('popupLogoutLogoutButton')} color="red" className="c36" onClick={onLogout} onMouseEnter={onMouseEnter} />
			</div>
		</div>
	);
	
});

export default PopupLogout;
