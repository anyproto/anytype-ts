import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Error, Input, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { Key, Storage, DataUtil, translate } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

const sha1 = require('sha1');
const Constant: any = require('json/constant.json');

interface Props extends RouteComponentProps<any> {};

interface State {
	error: string;
};

@observer
class PageAuthPinCheck extends React.Component<Props, State> {
	
	state = {
		error: ''
	};
	refObj: any = {};

	constructor (props: any) {
		super(props);

		this.onChange = this.onChange.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
		
		let inputs = [];
		for (let i = 1; i <= Constant.pinSize; ++i) {
			inputs.push({ id: i });
		};
		
		return (
			<div>
				<Cover {...cover} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authPinCheckTitle')} />
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
		const { match, history } = this.props;
		const isSelect = match.params.id == 'select';
		const k = e.key.toLowerCase();

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
		if (pin.length != Constant.pinSize) {
			return;
		};
		
		if (sha1(pin) == Storage.get('pin')) {
			if (isSelect) {
				history.push('/auth/setup/select');
			} else {
				history.push('/main/index');
					
				if (!Storage.get('popupNewBlock')) {
					commonStore.popupOpen('new', {});
				};
			};
		} else {
			this.setState({ error: translate('authPinCheckError') });
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

export default PageAuthPinCheck;