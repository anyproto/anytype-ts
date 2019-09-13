import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Error, Input, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';

const $ = require('jquery');
const SIZE = 6;

interface Props extends RouteComponentProps<any> {};

interface State {
	error: string;
	code: string;
};

class PageAuthPinSelect extends React.Component<Props, State> {
	
	refObj: any = {};
	state = {
		code: '',
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
				<div className="cover c3" />
				<Header />
				<Footer />
				
				<div className="frame">
					<Title text="Choose pin code" />
					<Label text="This is one password you need to remember. You will need this password to login on this device." />
					<Error text={error} />
					
					{inputs.map((item, i) => (
						<Input ref={(ref: any) => this.refObj[item.id] = ref} maxLength={1} key={i} onKeyUp={(e: any) => { this.onChange(e, item.id); }} />
					))}
				</div>
			</div>
		);
    };

	componentDidMount () {
		this.refObj[1].focus();
	};

	onChange (e: any, id: number) {
		let { code } = this.state;
		
		code += this.refObj[id].getValue();
		this.setState({ code: code });
		
		this.refObj[id].setType('password');
			
		if (this.refObj[id + 1]) {
			this.refObj[id + 1].focus();
		};

		if (code.length == SIZE) {
			this.props.history.push('/auth/pin-confirm');	
		};			
	};
	
	resize () {
		let node = $(ReactDOM.findDOMNode(this));
		let frame = node.find('.frame');
		
		frame.css({ marginTop: -frame.outerHeight() / 2 });
	};

};

export default PageAuthPinSelect;