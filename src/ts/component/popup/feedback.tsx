import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Input, Textarea, Button, Error } from 'ts/component';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';
import * as Sentry from '@sentry/browser';

import Block from 'ts/component/page/help/item/block';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};
interface State {
	error: string;
};

const Url = require('json/url.json');

class PopupFeedback extends React.Component<Props, State> {
	
	refName: any = null;
	refEmail: any = null;
	refMessage: any = null;
	state = {
		error: ''
	};
	
	constructor (props: any) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
		return (
			<div className="wrapper">
				<Title text="Feedback" />
				<Label text="Issues, bugs, feedback or help? Write us what’s in your mind." />
				<Error text={error} />
				
				<form onSubmit={this.onSubmit}>
					<div className="row">
						<Input ref={(ref: any) => { this.refName = ref; }} placeHolder="Name (Optional)" />
						<Input ref={(ref: any) => { this.refEmail = ref; }} placeHolder="E-mail (Optional)" />
					</div>
					
					<div className="row">
						<Textarea ref={(ref: any) => { this.refMessage = ref; }} placeHolder="Feedback like &quot;I pressed Enter and this happened&quot;" />
					</div>
					
					<div className="buttons">
						<Button className="orange" type="input" text="Submit" />
					</div>
				</form>
			</div>
		);
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		
		const request: any = {
			name: this.refName.getValue(),
			email: this.refEmail.getValue(),
			message: this.refMessage.getValue(),
		};
		
		if (!request.message) {
			this.setState({ error: 'Please enter feedback message' });
			return;
		};
		
		commonStore.popupClose(this.props.id);
		Sentry.captureMessage('Feedback');
		request.eventId = Sentry.lastEventId();
		
		console.log(request);
	};
	
};

export default PopupFeedback;