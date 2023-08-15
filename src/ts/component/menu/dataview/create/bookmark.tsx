import * as React from 'react';
import { Input, Button, Loader } from 'Component';
import { I, C, keyboard, translate } from 'Lib';
import { popupStore } from 'Store';

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
		const value = this.ref.getValue();
		const details = data.details || {};

		if (!value) {
			return;
		};

		this.setState({ loading: true });

		C.ObjectCreateBookmark({ ...details, source: value }, (message: any) => {
			this.setState({ loading: false });

			if (message.error.code) {
				popupStore.open('confirm', {
					data: {
						title: translate('menuDataviewCreateSomethingWentWrong'),
						text: translate('menuDataviewContextTryAgain'),
						textConfirm: translate('commonOk'),
						canCancel: false,
					},
				});
			} else {
				close();
			};
		});
	};

};

export default MenuDataviewCreateBookmark;