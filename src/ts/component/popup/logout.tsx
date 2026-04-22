import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Title, Label, Button, Phrase } from 'Component';
import * as I from 'Interface';

const PopupLogout = forwardRef<{}, I.Popup>((props, ref) => {

	const { account } = S.Auth;
	const buttonsRef = useRef(null);
	const phraseRef = useRef(null);
	const [ n, setN ] = useState(0);

	const setHighlight = (index: number) => {
		if (!buttonsRef.current) {
			return;
		};

		const buttons = U.Dom.selectAll('.button', buttonsRef.current);

		U.Dom.selectAll('.hover', buttonsRef.current).forEach(el => U.Dom.removeClass(el, 'hover'));

		if (buttons[index]) {
			U.Dom.addClass(buttons[index], 'hover');
		};
	};

	const onKeyDown = (e) => {
		keyboard.shortcut('enter, space', e, () => {
			e.stopPropagation();
			const buttons = buttonsRef.current ? U.Dom.selectAll('.button', buttonsRef.current) : [];

			const btn = buttons[n] as HTMLElement;
			if (btn) {
				btn.click();
			};
		});

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (arrow) => {
			const dir = [ 'arrowup', 'arrowleft' ].includes(arrow) ? -1 : 1;
			const buttons = buttonsRef.current ? U.Dom.selectAll('.button', buttonsRef.current) : [];

			if (buttons.length < 2) {
				return;
			};

			setN((prev) => {
				let next = prev + dir;
				if (next < 0) {
					next = buttons.length - 1;
				};
				if (next > buttons.length - 1) {
					next = 0;
				};

				setHighlight(next);
				return next;
			});
		});
	};

	const onLogout = () => {
		analytics.event('LogOut');

		U.Router.go('/auth/select', {
			replace: true,
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
		const buttons = buttonsRef.current ? U.Dom.selectAll('.button', buttonsRef.current) : [];
		const index = Array.from(buttons).indexOf(e.currentTarget);

		setN(index);
		setHighlight(index);
	};

	const onMouseLeave = () => {
		if (!buttonsRef.current) {
			return;
		};

		U.Dom.selectAll('.hover', buttonsRef.current).forEach(el => U.Dom.removeClass(el, 'hover'));
	};

	const init = () => {
		if (!account) {
			return;
		};

		setHighlight(0);

		Renderer.send('keytarGet', account.id).then((value: string) => {
			if (!value) {
				console.warn('[Logout] Failed to retrieve phrase from keychain');
				return;
			};

			C.WalletConvert(value, '', (message: any) => {
				if (!message.error.code) {
					phraseRef.current.setValue(value);
				};
			});
		}).catch((err: any) => {
			console.error('[Logout] Error retrieving phrase from keychain:', err);
		});


		analytics.event('ScreenKeychain', { type: 'BeforeLogout' });
	};

	const keyHandler = useRef<(e: any) => void>(null);

	useEffect(() => {
		init();
		keyHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keyHandler.current);

		return () => {
			if (keyHandler.current) {
				U.Dom.removeEvent(window, 'keydown', keyHandler.current);
			};
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
				<Button 
					text={translate('commonShowKey')} 
					color="accent" 
					size={36} 
					onClick={onCopy} 
					onMouseEnter={onMouseEnter} 
					onMouseLeave={onMouseLeave} 
				/>
				<Button 
					text={translate('popupLogoutLogoutButton')} 
					color="red" 
					size={36} 
					onClick={onLogout} 
					onMouseEnter={onMouseEnter} 
					onMouseLeave={onMouseLeave} 
				/>
			</div>
		</div>
	);
	
});

export default PopupLogout;