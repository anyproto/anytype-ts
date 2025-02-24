import * as React from 'react';
import { Input, Button, Loader } from 'Component';
import { I, C, S, keyboard, translate, analytics } from 'Lib';

interface State { 
	loading: boolean;
};

class MenuDataviewCreateBookmark extends React.Component<I.Menu, State> {
	
	ref = null;

	state = {
		loading: false,
	};
	
	constructor (props: I.Menu) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
	};

	render () {
		const { loading } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { value } = data;

		return (
			<form onSubmit={this.onSubmit} className="flex">
				{loading ? <Loader /> : ''}

				<Input ref={ref => this.ref = ref} value={value} placeholder={translate('defaultNameBookmark')} />

				<div className="buttons">
					<Button type="input" color="blank" text={translate('commonCreate')} onClick={this.onSubmit} />
				</div>
			</form>
		);
	};
	
	componentDidMount () {
		if (this.ref) {
			this.ref.focus(); 
		};
	};

	componentWillUnmount () {
		keyboard.setFocus(false);
	};

	onSubmit (e: any) {
		e.preventDefault();

		const { close, param } = this.props;
		const { data } = param;
		const { onSubmit, route } = data;
		const value = this.ref.getValue();
		const details = data.details || {};
		const bookmark = S.Record.getBookmarkType();

		if (!value) {
			return;
		};

		this.setState({ loading: true });

		C.ObjectCreateBookmark({ ...details, source: value }, S.Common.space, bookmark?.defaultTemplateId, (message: any) => {
			this.setState({ loading: false });

			if (message.error.code) {
				S.Popup.open('confirm', {
					data: {
						title: translate('menuDataviewCreateSomethingWentWrong'),
						text: translate('menuObjectContextTryAgain'),
						textConfirm: translate('commonOk'),
						canCancel: false,
					},
				});
			} else {
				const object = message.details;

				if (onSubmit) {
					onSubmit(object);
				};

				analytics.createObject(object.type, object.layout, route, message.middleTime);
				close();
			};
		});
	};

};

export default MenuDataviewCreateBookmark;
