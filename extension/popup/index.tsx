import * as React from 'react';
import { observer } from 'mobx-react';
import { Phrase, Button } from 'Component';
import { I, C, UtilCommon, translate, keyboard } from 'Lib';
import { authStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	error: string;
};

const Index = observer(class Index extends React.Component<I.PageComponent, State> {

	node: any = null;
	refPhrase: any = null;
	state = {
		error: '',
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onChange = this.onChange.bind(this);
		this.canSubmit = this.canSubmit.bind(this);
	};

	render () {
		const prefix = Constant.extension.clipper.prefix;

		return (
			<div className={`${prefix}-page ${prefix}-pageIndex`}>
				<form className="form" onSubmit={this.onSubmit}>
					<Phrase ref={ref => this.refPhrase = ref} onChange={this.onChange} isHidden={true} />
					<Button id="submit" type="input" text={translate('authLoginSubmit')} />
				</form>
			</div>
		);
	};

	componentDidMount () {
		this.focus();
	};
	
	componentDidUpdate () {
		const { error } = this.state;

		this.focus();

		if (error) {
			this.setState({ error: '' });
			this.refPhrase?.setError(false);
		};
	};

	focus () {
		if (this.refPhrase) {
			this.refPhrase.focus();
		};
	};

	onSubmit (e: any) {
		e.preventDefault();

		if (!this.canSubmit()) {
			return;
		};
		
		const phrase = this.refPhrase.getValue();
		
		C.WalletCreateSession(phrase, (message: any) => {
			if (message.error.code) {
				this.refPhrase.setError(true);
				this.setState({ error: translate('pageAuthLoginInvalidPhrase') });	
				return;
			};

			authStore.phraseSet(phrase);
			UtilCommon.route('/auth/account-select', { replace: true })
		});
	};

	checkButton () {
		const node = $(this.node);
		const button = node.find('#submit');

		this.canSubmit() ? button.removeClass('disabled') : button.addClass('disabled');
	};

	canSubmit () {
		return this.refPhrase.getValue().length;
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, () => { this.onSubmit(e); });
	};
	
	onChange () {
		this.checkButton();
	};

});

export default Index;