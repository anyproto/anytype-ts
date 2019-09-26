import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';

const SIZE = 6;

interface Props extends RouteComponentProps<any> {
	authStore?: any;
};

interface State {
	error: string;
};

@inject('authStore')
@observer
class PageAuthPinSelect extends React.Component<Props, State> {
	
	refObj: any = {};
	state = {
		error: ''
	};

	constructor (props: any) {
        super(props);

		this.onChange = this.onChange.bind(this);
	};
	
	render () {
		const { error } = this.state;
		
		let inputs = [];
		for (let i = 1; i <= SIZE; ++i) {
			inputs.push({ id: i });
		};
		
        return (
			<div>
				<Cover num={3} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Choose pin code" />
					<Label text="This is one password you need to remember. You will need this password to login on this device." />
					<Error text={error} />
					
					{inputs.map((item, i) => (
						<Input ref={(ref: any) => this.refObj[item.id] = ref} maxLength={1} key={i} onKeyUp={(e: any) => { this.onChange(e, item.id); }} />
					))}
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		this.refObj[1].focus();
	};

	onChange (e: any, id: number) {
		const { authStore, match } = this.props;
		
		let k = e.key;
		let input = this.refObj[id];
		let prev = this.refObj[id - 1];
		let next = this.refObj[id + 1];
		let v = input.getValue();
		
		input.setType(input.getValue() ? 'password' : 'text');
		
		if ((k == 'Backspace') && prev) {
			prev.setValue('');
			prev.setType('text');
			prev.focus();
		} else 
		if (v && next) {
			next.focus();	
		};
		
		let code = this.getCode();
		
		authStore.pinSet(code);
		
		if (code.length == SIZE) {
			this.props.history.push('/auth/pin-confirm/' + match.params.id);
		};			
	};
	
	getCode () {
		let c: string[] = [];
		for (let i in this.refObj) {
			c.push(this.refObj[i].getValue());
		};
		return c.join('');
	};
	
};

export default PageAuthPinSelect;