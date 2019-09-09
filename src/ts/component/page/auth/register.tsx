import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Title, Label, Error, Input, Button, IconUser } from 'ts/component.tsx';

const $ = require('jquery');

interface Props {
	history: any;
};

interface State {
	error: string;
	preview: string;
	name: string;
};

class PageAuthRegister extends React.Component<Props, State> {

	codeRef: any;

	state = {
		error: '',
		preview: '',
		name: '',
	};
	
	constructor (props: any) {
        super(props);

		this.onFileChange = this.onFileChange.bind(this);
		this.onNameChange = this.onNameChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { error, preview, name } = this.state;
		
        return (
			<div>
				<div className="cover c1" />
				<div id="frame" className="frame">
					<Title text="Get Anytype ID" />
					<Label text="This ID and your data will be encrypted and stored locally, and only you will have keys to decrypt it. " />
					<Error text={error} />
	
					<div className="inputWithImage">
						<div className="fileWrap">
							<IconUser name={name || 'T'} icon={preview} />
							<Input ref="file" id="file" type="file" onChange={this.onFileChange} />
						</div>
						<Input ref="name" placeHolder="Type your name" value={name} onKeyUp={this.onNameChange} />
					</div>
	
					<div className="buttons">
						<Button text="Get ID" className="orange" onClick={this.onSubmit} />
						<Button text="Back" className="grey" onClick={this.onCancel} />
					</div>
				</div>
			</div>
		);
    };

	onFileChange (e: any) {
		e.preventDefault();
	};
	
	onNameChange (e: any) {
		e.preventDefault();
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		this.props.history.push('/main/index');
	};
	
	onCancel (e: any) {
		e.preventDefault();
		this.props.history.push('/auth/select');
	};
	
	resize () {
		let node = $(ReactDOM.findDOMNode(this));
		let frame = node.find('#frame');
		
		frame.css({ marginTop: -frame.outerHeight() / 2 });
	};

};

export default PageAuthRegister;