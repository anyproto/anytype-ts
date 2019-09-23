import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, IconUser, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { Util } from 'ts/lib';

interface Props extends RouteComponentProps<any> {
	authStore?: any;
};
interface State {
	error: string;
	preview: string;
};

@inject('authStore')
@observer
class PageAuthRegister extends React.Component<Props, State> {

	fileRef: any;
	nameRef: any;

	state = {
		error: '',
		preview: ''
	};
	
	constructor (props: any) {
        super(props);

		this.onFileChange = this.onFileChange.bind(this);
		this.onNameChange = this.onNameChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};
	
	render () {
		const { error, preview } = this.state;
		const { authStore } = this.props;
		
        return (
			<div>
				<Cover num={3} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Add name and profile picture" />
					<Error text={error} />
		
					<div className="fileWrap">
						<IconUser icon={preview} className={preview ? 'active' : ''} />
						<Input ref={(ref: any) => this.fileRef = ref} id="file" type="file" onChange={this.onFileChange} />
					</div>
						
					<Input ref={(ref: any) => this.nameRef = ref} placeHolder="Type your name" value={name} onKeyUp={this.onNameChange} />
					<Button text="Create profile" className="orange" onClick={this.onSubmit} />
				</Frame>
			</div>
		);
    };

	onFileChange (e: any) {
		if (!e.target.files.length) {
			return;
		};
		
		let icon = e.target.files[0];
		
		Util.loadPreviewBase64(icon, {}, (image: string, param: any) => {
			this.setState({ preview: image });
		});
	};
	
	onNameChange (e: any) {
		const { authStore } = this.props;
		authStore.nameSet(this.nameRef.getValue());
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		this.props.history.push('/auth/pin-select/register');
	};
	
};

export default PageAuthRegister;