import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Frame, Error, Button, Header, Icon, Phrase } from 'Component';
import { I, C, S, U, J, translate, keyboard, Animation, Renderer, analytics, Storage } from 'Lib';

const PageAuthLogin = observer(forwardRef<{}, I.PageComponent>((props, ref: any) => {

	const nodeRef = useRef(null);
	const phraseRef = useRef(null);
	const submitRef = useRef(null);
	const [ error, setError ] = useState('');
	const isSelecting = useRef(false);
	const { accounts } = S.Auth;
	const length = accounts.length;

	const focus = () => {
		phraseRef.current?.focus();
	};

	const getPhrase = () => {
		return String(phraseRef.current?.getValue() || '');
	};

	const onSubmit = (e: any) => {
		e.preventDefault();

		const phrase = getPhrase();
		const length = phrase.split(' ').length;

		if (length < J.Constant.count.phrase.word) {
			setErrorHandler(1, translate('pageAuthLoginShortPhrase'));
			return;
		};

		if (submitRef.current?.isLoading()) {
			return;
		};

		submitRef.current?.setLoading(true);
		
		C.WalletRecover(S.Common.dataPath, phrase, (message: any) => {
			if (setErrorHandler(message.error.code, translate('pageAuthLoginInvalidPhrase'))) {
				return;
			};

			S.Auth.accountListClear();
			U.Data.createSession(phrase, '', () => {
				C.AccountRecover(message => {
					setErrorHandler(message.error.code, message.error.description);
				});
			});
		});
	};

	const select = () => {
		const { accounts, networkConfig } = S.Auth;
		if (isSelecting.current || !accounts.length) {
			return;
		};

		isSelecting.current = true;

		const { mode, path } = networkConfig;
		const account = accounts[0];

		S.Auth.accountSet(account);
		Renderer.send('keytarSet', account.id, getPhrase());

		C.AccountSelect(account.id, S.Common.dataPath, mode, path, (message: any) => {
			if (setErrorHandler(message.error.code, message.error.description) || !message.account) {
				isSelecting.current = false;
				return;
			};

			S.Auth.accountSet(message.account);
			S.Common.configSet(message.account.config, false);

			const spaceId = Storage.get('spaceId');
			const routeParam = { replace: true };

			if (spaceId) {
				U.Router.switchSpace(spaceId, '', false, routeParam, true);
			} else {
				Animation.from(() => {
					U.Data.onAuthWithoutSpace(routeParam);
					isSelecting.current = false;
				});
			};

			U.Data.onInfo(account.info);
			U.Data.onAuthOnce(true);
			analytics.event('SelectAccount', { middleTime: message.middleTime });
		});
	};

	const setErrorHandler = (code: number, text: string) => {
		if (!code) {
			return false;
		};

		if (code == J.Error.Code.FAILED_TO_FIND_ACCOUNT_INFO) {
			U.Router.go('/auth/setup/select', {});
			return;
		};

		if (code == J.Error.Code.ACCOUNT_STORE_NOT_MIGRATED) {
			U.Router.go('/auth/migrate', {});
			return;
		};

		setError(text);
		phraseRef.current?.setError(true);
		submitRef.current?.setLoading(false);

		S.Auth.accountListClear();
		return U.Common.checkErrorCommon(code);
	};

	const onKeyDownPhrase = (e: React.KeyboardEvent) => {
		if (error) {
			phraseRef.current?.setError(false);
			setError('');
		};

		keyboard.shortcut('enter', e, () => onSubmit(e));
	};
	
	const onCancel = () => {
		S.Auth.logout(true, false);
		Animation.from(() => U.Router.go('/', { replace: true }));
	};

	const onForgot = () => {
		const platform = U.Common.getPlatform();

		S.Popup.open('confirm', {
			className: 'lostPhrase isLeft',
			data: {
				title: translate('popupConfirmLostPhraseTitle'),
				text: translate(`popupConfirmLostPhraseText${platform}`),
				textConfirm: translate('commonOkay'),
				canConfirm: true,
				canCancel: false,
			},
		});
	};

	useEffect(() => {
		Animation.to();
		focus();
	}, []);

	useEffect(() => {
		focus();
		select();
	});
	
	return (
		<div ref={nodeRef}>
			<Header {...props} component="authIndex" />
			<Icon className="arrow back" onClick={onCancel} />
			
			<Frame>
				<form className="form" onSubmit={onSubmit}>
					<Error text={error} className="animation" />

					<div className="animation">
						<Phrase 
							ref={phraseRef} 
							onKeyDown={onKeyDownPhrase}
							isHidden={true} 
							placeholder={translate('phrasePlaceholder')}
						/>
					</div>
					<div className="buttons">
						<div className="animation">
							<Button ref={submitRef} text={translate('authLoginSubmit')} onClick={onSubmit} />
						</div>

						<div className="animation">
							<div className="small" onClick={onForgot}>{translate('authLoginLostPhrase')}</div>
						</div>
					</div>
				</form>
			</Frame>
		</div>
	);

}));

export default PageAuthLogin;