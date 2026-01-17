import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Phrase, QR, Button } from 'Component';
import { I, C, S, U, translate, analytics, Renderer } from 'Lib';

const PageMainSettingsPhrase = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { onPage } = props;
	const [ entropy, setEntropy ] = useState('');
	const [ showCode, setShowCode ] = useState(false);
	const isLocal = U.Data.isLocalNetwork();
	const phraseRef = useRef<any>(null);
	const { account } = S.Auth;
	const { pin } = S.Common;

	const onToggle = (isHidden: boolean): void => {
		if (!isHidden) {
			U.Common.copyToast(translate('commonPhrase'), phraseRef.current?.getValue());
			analytics.event('KeychainCopy', { type: 'ScreenSettings' });
		};
	};

	const onCopy = () => {
		phraseRef.current?.onToggle();
	};

	const onCode = () => {
		const onSuccess = () => {
			setShowCode(!showCode);
		};

		pin && !showCode ? S.Popup.open('pin', { data: { onSuccess } }) : onSuccess();
	};

	useEffect(() => {
		if (!account) {
			return;
		};

		Renderer.send('keytarGet', account.id).then((value: string) => {
			if (!value) {
				console.warn('[Phrase] Failed to retrieve phrase from keychain');
				return;
			};

			C.WalletConvert(value, '', (message: any) => {
				if (!message.error.code) {
					phraseRef.current?.setValue(value);
					setEntropy(message.entropy);
				};
			});
		}).catch((err: any) => {
			console.error('[Phrase] Error retrieving phrase from keychain:', err);
		});

		analytics.event('ScreenKeychain', { type: 'ScreenSettings' });
	}, []);

	return (
		<>
			<Title text={translate('popupSettingsPhraseTitle')} />
			<Label className="description" text={translate('popupSettingsPhraseText')} />
			
			<div className="inputs" onClick={onCopy}>
				<Phrase
					ref={phraseRef}
					readonly={true}
					isHidden={true}
					checkPin={true}
					onToggle={onToggle}
				/>
			</div>

			<Title className="sub" text={translate('popupSettingsMobileQRSubTitle')} />
			<Label className="description" text={translate('popupSettingsMobileQRText')} />

			<div className="qrWrap" onClick={onCode}>
				<div className={!showCode ? 'isBlurred' : ''}>
					<QR value={showCode ? entropy : translate('popupSettingsCodeStub')} />
				</div>
			</div>

			{!isLocal ? (
				<>
					<Title className="sub" text={translate('popupSettingsDataManagementDeleteTitle')} />
					<Label className="description" text={translate('popupSettingsDataManagementDeleteText')} />
					<Button className="c36" onClick={() => onPage('delete')} color="red" text={translate('popupSettingsDataManagementDeleteButton')} />
				</>
			) : ''}
		</>
	);

}));

export default PageMainSettingsPhrase;