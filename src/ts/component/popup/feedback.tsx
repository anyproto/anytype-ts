import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Input, Icon, Textarea, Button, Error, Smile } from 'ts/component';
import { I, Util } from 'ts/lib';
import { commonStore } from 'ts/store';
import * as Sentry from '@sentry/browser';

import Block from 'ts/component/page/help/item/block';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};
interface State {
	error: string;
	checked: boolean;
	success: boolean;
};

const $ = require('jquery');
const Url = require('json/url.json');

class PopupFeedback extends React.Component<Props, State> {
	
	refName: any = null;
	refEmail: any = null;
	refMessage: any = null;
	state = {
		error: '',
		checked: false,
		success: false,
	};
	
	constructor (props: any) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
		this.onCheck = this.onCheck.bind(this);
	};
	
	render () {
		const { error, checked, success } = this.state;
		
		return (
			<div className={[ 'wrapper', (success ? 'success' : '') ].join(' ')}>
				{success ? (
					<React.Fragment>
						<Smile className="c64" size={32} icon=":relieved:" />
						<Title text="Your feedback was sent" />
						<Label text="Thank you for making the new web together!<br />If you left email we will get in touch soon." />
						<Button className="orange" text="Back to dashboard" onClick={() => { commonStore.popupClose(this.props.id); }} />
					</React.Fragment>
				) : (
					<React.Fragment>
						<Title text="Feedback" />
						<Label text="Issues, bugs, feedback or help? Write us what’s in your mind." />
						
						<form onSubmit={this.onSubmit}>
							<div className="row flex">
								<Input ref={(ref: any) => { this.refName = ref; }} placeHolder="Name (Optional)" />
								<Input ref={(ref: any) => { this.refEmail = ref; }} placeHolder="E-mail (Optional)" />
							</div>
							
							<div className="row">
								<Textarea ref={(ref: any) => { this.refMessage = ref; }} placeHolder="Feedback like &quot;I pressed Enter and this happened&quot;" />
							</div>
							
							<div className="row flex">
								<Icon className={'checkbox ' + (checked ? 'active' : '')} onClick={this.onCheck} />
								<div className="small">Send anonymous metadata: OS, app version and IP. It doesn't contain personal information and will help us solve your issue.</div>
							</div>
							
							<div className="row flex">
								<Button className="orange submit" type="input" text="Submit" /> 
								<Error text={error} />
							</div>
						</form>
					</React.Fragment>
				)}
			</div>
		);
	};
	
	componentDidUpdate () {
		this.resize();
	};
	
	onCheck (e: any) {
		this.setState({ checked: !this.state.checked });
	};
	
	onSubmit (e: any) {
		const { checked } = this.state;
		
		e.preventDefault();
		
		this.refEmail.setError(false);
		this.refMessage.setError(false);
		
		const request: any = {
			name: this.refName.getValue(),
			email: this.refEmail.getValue(),
			message: this.refMessage.getValue(),
		};
		
		let error = '';
		let fld: any = null;
		
		if (request.email && !Util.emailCheck(request.email)) {
			error = 'Please enter valid email';
			fld = this.refEmail;
		} else
		if (!request.message) {
			error = 'Please enter feedback message';
			fld = this.refMessage;
		};
		
		if (error) {
			this.setState({ error: error });
			fld.setError(true);
			return;
		};
		
		this.setState({ success: true });
		
		if (checked) {
			Sentry.captureMessage('Feedback');
			request.eventId = Sentry.lastEventId();
		};
		
		console.log(request);
	};
	
	resize () {
		const obj = $('#popupFeedback');
		obj.css({ marginTop: -obj.height() / 2 });
	};
	
};

export default PopupFeedback;