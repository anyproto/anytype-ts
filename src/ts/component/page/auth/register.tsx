import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Error, Input, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';
import { Util, translate } from 'ts/lib';

interface Props extends RouteComponentProps<any> {};
interface State {
	error: string;
};

const { dialog } = window.require('electron').remote;
const Constant = require('json/constant.json');

@observer
class PageAuthRegister extends React.Component<Props, State> {

	nameRef: any;

	state = {
		error: '',
	};
	
	constructor (props: any) {
		super(props);

		this.onFileClick = this.onFileClick.bind(this);
		this.onNameChange = this.onNameChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
		const { name, preview } = authStore;

		return (
			<div>
				<Cover {...cover} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authRegisterTitle')} />
					<Error text={error} />
		
					<form onSubmit={this.onSubmit}>
						<div className="iconObject isHuman c64 fileWrap" onClick={this.onFileClick}>
							{preview ? <img src={preview} className="iconImage c64" /> : ''}
						</div>
					
						<Input ref={(ref: any) => this.nameRef = ref} placeholder={translate('authRegisterName')} value={name} onKeyUp={this.onNameChange} />
						<Button type="input" text={translate('authRegisterSubmit')} />
					</form>
				</Frame>
			</div>
		);
	};
	
	componentDidMount () {
		this.nameRef.focus();
	};
	
	componentDidUpdate () {
		this.nameRef.focus();
	};

	onFileClick (e: any) {
		const options: any = { 
			properties: [ 'openFile' ], 
			filters: [ { name: '', extensions: Constant.extension.image } ]
		};
		
		dialog.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			let path = files[0];
			
			authStore.iconSet(path);
			Util.loadPreviewBase64(Util.makeFileFromPath(path), {}, (image: string, param: any) => {
				authStore.previewSet(image);
			});
		});
	};
	
	onNameChange (e: any) {
		authStore.nameSet(this.nameRef.getValue());
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		const { match, history } = this.props;
		
		this.nameRef.setError(false);

		let error = '';
		
		if (!authStore.name) {
			error = 'Name cannot be blank';
			this.nameRef.setError(true);
		};
		
		if (!error) {
			history.push('/auth/invite/' + match.params.id);
		} else {
			this.setState({ error: error });
		};
	};
	
};

export default PageAuthRegister;