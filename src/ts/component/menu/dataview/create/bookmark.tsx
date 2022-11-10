import * as React from 'react';
import { Input, Button, Loader } from 'Component';
import { I, C, keyboard, translate } from 'Lib';
import { popupStore } from 'Store';

interface Props extends I.Menu {};

interface State { 
	loading: boolean;
};

class MenuDataviewCreateBookmark extends React.Component<Props, State> {
	
	ref: any = null;

	state = {
		loading: false,
	};
	
	constructor (props: any) {
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

				<Input ref={(ref: any) => { this.ref = ref; }} value={value} placeholder={translate('defaultNameBookmark')} />

				<div className="buttons">
					<Button type="input" color="blank" text="Create" onClick={this.onSubmit} />
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

		const { close } = this.props;
		const value = this.ref.getValue();

		if (!value) {
			return;
		};

		this.setState({ loading: true });

		C.ObjectCreateBookmark({ source: value }, (message: any) => {
			this.setState({ loading: false });

			if (message.error.code) {
				popupStore.open('confirm', {
					data: {
						title: 'Oops - something went wrong!',
						text: 'Please try again',
						textConfirm: 'Ok',
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