import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Input, Textarea, Button, Error, Smile, Loader } from 'ts/component';
import { I, Util, translate } from 'ts/lib';
import * as Sentry from '@sentry/browser';

interface Props extends I.Popup, RouteComponentProps<any> {};

enum Type {
	Bug		 = 0,
	Feature	 = 1,
	Help	 = 2,
};

interface State {
	error: string;
	success: boolean;
	loading: boolean;
	page: Type;
};

const $ = require('jquery');
const Url = require('json/url.json');

class PopupFeedback extends React.Component<Props, State> {
	
	refObject: any = {};
	state = {
		error: '',
		success: false,
		loading: false,
		page: Type.Bug,
	};
	
	constructor (props: any) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
	};
	
	render () {
		const { error, success, loading, page } = this.state;
		const tabs = [
			{ id: Type.Bug, name: 'Bug' },
			{ id: Type.Feature, name: 'Feature' },
			{ id: Type.Help, name: 'Help' },
		];

		let content = null;
		switch (page) {
			case Type.Bug:
				content = (
					<React.Fragment>
						<div className="row">
							<Label text={translate('popupFeedbackBugLabel1')} />
							<Textarea ref={(ref: any) => { this.refObject.text1 = ref; }} placeHolder={translate('popupFeedbackBugText1')} />
						</div>
						<div className="row">
							<Label text={translate('popupFeedbackBugLabel2')} />
							<Textarea ref={(ref: any) => { this.refObject.text2 = ref; }} placeHolder={translate('popupFeedbackBugText2')} />
						</div>
					</React.Fragment>
				);
				break;

			case Type.Feature:
				content = (
					<React.Fragment>
						<div className="row">
							<Label text={translate('popupFeedbackFeatureLabel1')} />
							<Textarea ref={(ref: any) => { this.refObject.text1 = ref; }} placeHolder={translate('popupFeedbackFeatureText1')} />
						</div>
						<div className="row">
							<Label text={translate('popupFeedbackFeatureLabel2')} />
							<Textarea ref={(ref: any) => { this.refObject.text2 = ref; }} placeHolder={translate('popupFeedbackFeatureText2')} />
						</div>
					</React.Fragment>
				);
				break;

			case Type.Help:
				content = (
					<React.Fragment>
						<div className="row">
							<Label text={translate('popupFeedbackHelpLabel')} />
							<Textarea ref={(ref: any) => { this.refObject.text1 = ref; }} />
						</div>
					</React.Fragment>
				);
				break;
		};
		
		return (
			<div className={[ 'wrapper', (success ? 'success' : '') ].join(' ')}>
				{loading ? <Loader /> : ''}
				{success ? (
					<React.Fragment>
						<Smile className="c64" size={32} icon=":relieved:" />
						<Title text={translate('popupFeedbackSuccessTitle')} />
						<Label text={translate('popupFeedbackSuccessText')} />
						<Button className="orange" text={translate('popupFeedbackSuccessBack')} onClick={() => { this.props.close(); }} />
					</React.Fragment>
				) : (
					<React.Fragment>
						<Title text="Feedback" />
						
						<div className="tabs">
							{tabs.map((item: any, i: number) => (
								<div key={i} className={[ 'tab', (item.id == page ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onPage(item.id); }}>
									{item.name}
								</div>
							))}
						</div>
						
						<form onSubmit={this.onSubmit}>
							{content}

							<div className="row">
								<Label text={translate('popupFeedbackScreenLabel')} />
								<Input ref={(ref: any) => { this.refObject.link = ref; }} placeHolder={translate('popupFeedbackScreenText')} />
							</div>

							<div className="row last">
								<Label text="Contacts:" />
								<div className="flex">
									<Input ref={(ref: any) => { this.refObject.name = ref; }} placeHolder={translate('popupFeedbackName')} />
									<Input ref={(ref: any) => { this.refObject.email = ref; }} placeHolder={translate('popupFeedbackEmail')} />
								</div>
							</div>
							
							<div className="row flex">
								<Button className="orange submit" type="input" text={translate('commonSubmit')} /> 
								<Error text={error} />
							</div>
						</form>
					</React.Fragment>
				)}
			</div>
		);
	};
	
	componentDidUpdate () {
		this.props.position();
	};
	
	onPage (page: Type) {
		this.setState({ page: page });
	};
	
	onSubmit (e: any) {
		const { page } = this.state;
		const message = [];
		
		e.preventDefault();
		
		this.refObject.email.setError(false);
		this.refObject.text1.setError(false);

		const text1 = this.refObject.text1 ? this.refObject.text1.getValue() : '';
		const text2 = this.refObject.text2 ? this.refObject.text2.getValue() : '';
		const link = this.refObject.link ? this.refObject.link.getValue() : '';

		if (text1) message.push(text1);
		if (text2) message.push(text2);
		if (link) message.push(link);

		const request: any = {
			name: this.refObject.name.getValue(),
			email: this.refObject.email.getValue(),
			comments: message.join('\n\n'),
			event_id: '',
		};
		
		let error = '';
		let fld: any = null;
		
		if (request.email && !Util.emailCheck(request.email)) {
			error = 'Please enter valid email';
			fld = this.refObject.email;
		};

		switch (page) {
			case Type.Bug:
				if (!text1) {
					error = 'Please describe the bug';
					fld = this.refObject.text1;
				};
				if (!text2) {
					error = 'Please enter steps to reproduce';
					fld = this.refObject.text2;
				};
				break;

			case Type.Feature:
				if (!text2) {
					error = 'Please describe the feasture';
					fld = this.refObject.text2;
				};
				break;

			case Type.Help:
				if (!text1) {
					error = 'Please describe your question';
					fld = this.refObject.text1;
				};
				break;
		};
		
		if (error) {
			this.setState({ error: error });
			if (fld) {
				fld.setError(true);
			};
			return;
		};
		
		request.name = request.name || 'blank';
		request.email = request.email || 'example@example.com';
		Sentry.captureMessage('Feedback');
		request.event_id = Sentry.lastEventId();
		
		this.setState({ loading: true });
		
		$.ajax({
			url: Url.feedback,
			data: JSON.stringify(request),
			type: 'POST',
			success: (data: any) => {
				this.setState({ success: true, loading: false });
			},
			error: (xhr: any, status: string, error: string) => {
				let err = {};
				try {
					err = JSON.parse(xhr.responseText || '{}s');
				} catch (e) {};
				
				this.setState({ loading: false, error: 'Feedback upload failed' });
			}
		});
	};
	
};

export default PopupFeedback;