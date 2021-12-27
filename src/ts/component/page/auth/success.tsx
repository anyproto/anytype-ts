import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Button, IconObject, HeaderAuth as Header, FooterAuth as Footer, Textarea } from 'ts/component';
import { translate, DataUtil } from 'ts/lib';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {};
interface State {};

const $ = require('jquery');

const PageAuthSuccess = observer(class PageAuthSuccess extends React.Component<Props, State> {

	refPhrase: any = null;

	constructor (props: any) {
		super(props);

		this.onFocusPhrase = this.onFocusPhrase.bind(this);
		this.onBlurPhrase = this.onBlurPhrase.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { cover } = commonStore;
		const { phrase } = authStore;

		return (
			<div>
				<Cover {...cover} />
				<Header />
				<Footer />
				
				<Frame>
					<IconObject size={64} object={{ iconEmoji: '🎉' }} />

					<Title text="Save your keychain phrase" />
					<Label text="This phrase is needed to log in on another device and recover data. Please, keep it safe. You can find it anytime in settings." />
						
					<Textarea 
						ref={(ref: any) => this.refPhrase = ref} 
						id="phrase" 
						value={phrase} 
						className="isBlurred"
						onFocus={this.onFocusPhrase} 
						onBlur={this.onBlurPhrase} 
						placeholder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" 
						readonly={true}
					/>

					<Button text={translate('authSuccessSubmit')} onClick={this.onSubmit} />
				</Frame>
			</div>
		);
	};

	onSubmit (e: any) {
		DataUtil.onAuth();
	};

	onFocusPhrase (e: any) {
		this.refPhrase.select();
		this.elementUnblur(e);
	};

	onBlurPhrase (e: any) {
		this.elementBlur(e);
		window.getSelection().removeAllRanges();
	};

	elementBlur (e: any) {
		$(e.currentTarget).addClass('isBlurred');
	};

	elementUnblur (e: any) {
		$(e.currentTarget).removeClass('isBlurred');
	};

});

export default PageAuthSuccess;