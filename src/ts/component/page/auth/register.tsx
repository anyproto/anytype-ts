import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, IconUser, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
<<<<<<< HEAD
import { dispatcher, Util } from 'ts/lib';

const { dialog } = window.require('electron').remote;
const Err: any = {
	FAILED_TO_SET_AVATAR: 103
};

=======
import { Util } from 'ts/lib';

>>>>>>> b88246a9dee7d9528caff15946c67e5cb8f72001
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

	nameRef: any;

	state = {
		error: '',
<<<<<<< HEAD
		preview: '',
=======
		preview: ''
>>>>>>> b88246a9dee7d9528caff15946c67e5cb8f72001
	};
	
	constructor (props: any) {
		super(props);

		this.onFileClick = this.onFileClick.bind(this);
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
		
<<<<<<< HEAD
					<div className="fileWrap" onMouseDown={this.onFileClick}>
						<IconUser icon={preview} className={preview ? 'active' : ''} />
=======
					<div className="fileWrap">
						<IconUser icon={preview} className={preview ? 'active' : ''} />
						<Input ref={(ref: any) => this.fileRef = ref} id="file" type="file" onChange={this.onFileChange} />
>>>>>>> b88246a9dee7d9528caff15946c67e5cb8f72001
					</div>
						
					<Input ref={(ref: any) => this.nameRef = ref} placeHolder="Type your name" value={name} onKeyUp={this.onNameChange} />
					<Button text="Create profile" className="orange" onClick={this.onSubmit} />
				</Frame>
			</div>
		);
	};

<<<<<<< HEAD
	onFileClick (e: any) {
		const { authStore } = this.props;
		
		dialog.showOpenDialog({ properties: [ 'openFile' ] }, (files: any) => {
			if ((files == undefined) || !files.length) {
				return;
			};

			let path = files[0];
			let file = Util.makeFileFromPath(path);
			
			authStore.iconSet(path);
			Util.loadPreviewBase64(file, {}, (image: string, param: any) => {
				this.setState({ preview: image });
			});
	    });
=======
	onFileChange (e: any) {
		if (!e.target.files.length) {
			return;
		};
		
		let icon = e.target.files[0];
		
		Util.loadPreviewBase64(icon, {}, (image: string, param: any) => {
			this.setState({ preview: image });
		});
>>>>>>> b88246a9dee7d9528caff15946c67e5cb8f72001
	};
	
	onNameChange (e: any) {
		const { authStore } = this.props;
		authStore.nameSet(this.nameRef.getValue());
	};

	onSubmit (e: any) {
		const { authStore } = this.props;
		e.preventDefault();
		
		let request = { 
			username: authStore.name, 
			avatarLocalPath: authStore.icon 
		};
		
		dispatcher.call('accountCreate', request, (message: any) => {
			if (message.error.code) {
				let error = '';
				switch (message.error.code) {
					case Err.FAILED_TO_SET_AVATAR:
						error = 'Please select profile picture';
						break; 
					default:
						error = message.error.desc;
						break;
				};
				if (error) {
					this.setState({ error: error });
				};
			} else {
				let account = message.account;
				
				authStore.accountSet({
					id: account.id,
					name: account.name,
					icon: account.avatar,
				});
				
				this.props.history.push('/auth/pin-select/register');				
			};
		});
	};
	
};

export default PageAuthRegister;