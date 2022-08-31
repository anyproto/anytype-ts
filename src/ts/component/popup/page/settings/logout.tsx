import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Textarea, Button } from 'Component';
import { I, C, translate, analytics, Util } from 'Lib';
import { authStore } from 'Store';
import { observer } from 'mobx-react';

import Head from './head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	isLogout: boolean;
	onPage: (id: string) => void;
	setPinConfirmed: (v: boolean) => void;
};

interface State {
	entropy: string;
	showCode: boolean;
};

const Constant = require('json/constant.json');

const PopupSettingsPageLogout = observer(class PopupSettingsPageLogout extends React.Component<Props, State> {

	refPhrase: any = null;
	state = {
		entropy: '',
		showCode: false,
	};

	constructor (props: any) {
		super(props);

		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onLogout = this.onLogout.bind(this);
	};

	render () {
		return (
			<div>
				<Head {...this.props} returnTo="account" name={translate('popupSettingsAccountTitle')} />
				
				<Title text={translate('popupSettingsPhraseTitle')} />
				<Label text={translate('popupSettingsPhraseText')} />
				
				<div className="inputs">
					<div className="textareaWrap">
						<Textarea 
							ref={(ref: any) => this.refPhrase = ref} 
							id="phrase" 
							value={translate('popupSettingsPhraseStub')} 
							className="isBlurred"
							onFocus={this.onFocus} 
							onBlur={this.onBlur} 
							onCopy={this.onCopy}
							placeholder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" 
							readonly={true} 
						/>
					</div>
				</div>

				<div className="buttons">
					<Button color="blank" text={translate('popupSettingsPhraseBackup')} onClick={this.onCopy} />
					<Button color="blank" className="red" text={translate('popupSettingsLogout')} onClick={this.onLogout} />
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { phrase } = authStore;

		if (phrase) {
			C.WalletConvert(phrase, '', (message: any) => {
				this.setState({ entropy: message.entropy });
			});
		};

		analytics.event('ScreenKeychain', { type: 'BeforeLogout' });
	};

	onFocus () {
		const node = $(ReactDOM.findDOMNode(this));
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(authStore.phrase);
		this.refPhrase.select();

		phrase.removeClass('isBlurred');
	};

	onBlur () {
		const node = $(ReactDOM.findDOMNode(this));
		const phrase = node.find('#phrase');

		this.refPhrase.setValue(translate('popupSettingsPhraseStub'));

		phrase.addClass('isBlurred');
		window.getSelection().removeAllRanges();
	};

	onCopy (e: any) {
		this.refPhrase.focus();
		Util.clipboardCopy({ text: authStore.phrase });

		analytics.event('KeychainCopy', { type: 'BeforeLogout' });
	};

	onLogout (e: any) {
		const { setPinConfirmed } = this.props;

		window.setTimeout(() => {
			authStore.logout(false);
			Util.route('/');

			setPinConfirmed(false);
		}, Constant.delay.popup);
	};

});

export default PopupSettingsPageLogout;