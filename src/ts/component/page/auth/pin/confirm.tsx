import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { Key, Storage, translate } from 'ts/lib';
import { observer, inject } from 'mobx-react';

const sha1 = require('sha1');
const Constant: any = require('json/constant.json');

interface Props extends RouteComponentProps<any> {
	commonStore?: any;
	authStore?: any;
};

interface State {
	error: string;
};

@inject('commonStore')
@inject('authStore')
@observer
class PageAuthPinConfirm extends React.Component<Props, State> {
	
	refObj: any = {};
	state = {
		error: ''
	};

	constructor (props: any) {
		super(props);

		this.onChange = this.onChange.bind(this);
	};
	
	render () {
		const { commonStore } = this.props;
		const { coverId, coverImg } = commonStore;
		const { error } = this.state;
		
		let inputs = [];
		for (let i = 1; i <= Constant.pinSize; ++i) {
			inputs.push({ id: i });
		};
		
        return (
			<div>
				<Cover num={coverId} image={coverImg} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authPinConfirmTitle')} />
					<Label text={translate('authPinConfirmLabel')} />
					<Error text={error} />
					
					{inputs.map((item: any, i: number) => (
						<Input ref={(ref: any) => this.refObj[item.id] = ref} maxLength={1} key={i} onKeyUp={(e: any) => { this.onChange(e, item.id); }} />
					))}
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		window.setTimeout(() => { this.refObj[1].focus(); }, 15);
	};

	onChange (e: any, id: number) {
		const { authStore, match, history } = this.props;
		const isAdd = match.params.id == 'add';
		const isSelect = match.params.id == 'select';
		
		let k = e.which;
		let input = this.refObj[id];
		let prev = this.refObj[id - 1];
		let next = this.refObj[id + 1];
		let v = input.getValue();
		
		input.setType(input.getValue() ? 'password' : 'text');
		
		if ((k == Key.backspace) && prev) {
			prev.setValue('');
			prev.setType('text');
			prev.focus();
		} else 
		if (v && next) {
			next.focus();	
		};
		
		let pin = this.getPin();
		if (pin.length == Constant.pinSize) {
			if (pin == authStore.pin) {
				Storage.set('pin', sha1(pin));
				
				if (isSelect) {
					history.push('/auth/setup/select');
				};
				
				if (isAdd) {
					history.push('/main/index');
				};
			} else {
				this.setState({ error: translate('authPinConfirmError') });
			};
		};
	};
	
	getPin () {
		let c: string[] = [];
		for (let i in this.refObj) {
			c.push(this.refObj[i].getValue());
		};
		return c.join('');
	};
	
};

export default PageAuthPinConfirm;