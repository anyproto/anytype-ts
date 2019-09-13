import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Title, Label, Error, Input, Button, IconUser, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';

interface Props extends RouteComponentProps<any> {};
interface State {
	error: string;
	preview: string;
	name: string;
};

class PageAuthRegister extends React.Component<Props, State> {

	fileRef: any;
	nameRef: any;

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
				<div className="cover c3" />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Add name and profile picture" />
					<Error text={error} />
		
					<div className="inputWithImage">
						<div className="fileWrap">
							<IconUser name={name || 'T'} icon={preview} />
							<Input ref={(ref: any) => this.fileRef = ref} id="file" type="file" onChange={this.onFileChange} />
						</div>
						<Input ref={(ref: any) => this.nameRef = ref} placeHolder="Type your name" value={name} onKeyUp={this.onNameChange} />
					</div>
		
					<div className="buttons">
						<Button text="Create profile" className="orange" onClick={this.onSubmit} />
						<Button text="Back" className="grey" onClick={this.onCancel} />
					</div>
				</Frame>
			</div>
		);
    };

	onFileChange (e: any) {
		e.preventDefault();
	};
	
	onNameChange (e: any) {
		e.preventDefault();
		
		let name = this.nameRef.getValue();
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		this.props.history.push('/main/index');
	};
	
	onCancel (e: any) {
		e.preventDefault();
		this.props.history.push('/auth/select');
	};
	
};

export default PageAuthRegister;