import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Error, Input, Button, Header, FooterAuth as Footer } from 'ts/component';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';
import { FileUtil, Util, translate } from 'ts/lib';

interface Props extends RouteComponentProps<any> {}
interface State {
	error: string;
}

const Constant = require('json/constant.json');

const PageAuthRegister = observer(class PageAuthRegister extends React.Component<Props, State> {

	refName: any = null;

	state = {
		error: '',
	};
	
	constructor (props: any) {
		super(props);

		this.onFileClick = this.onFileClick.bind(this);
		this.onPathClick = this.onPathClick.bind(this);
		this.onNameChange = this.onNameChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { error } = this.state;
		const { name, preview, accountPath } = authStore;

		return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer />
				
				<Frame>
					<Title text={translate('authRegisterTitle')} />
					<Error text={error} />
		
					<form onSubmit={this.onSubmit}>
						<div className="row flex">
							<div className="iconObject isHuman c64 fileWrap" onClick={this.onFileClick}>
								{preview ? <img src={preview} className="iconImage c64" /> : ''}
							</div>
							<Input ref={(ref: any) => this.refName = ref} placeholder={translate('authRegisterName')} value={name} onKeyUp={this.onNameChange} />
							<Button type="input" text={translate('authRegisterSubmit')} />
						</div>
						<div className="row cp location" onClick={this.onPathClick}>
							Account location: {accountPath}
						</div>
					</form>
				</Frame>
			</div>
		);
	};
	
	componentDidMount () {
		this.refName.focus();
	};
	
	componentDidUpdate () {
		this.refName.focus();
		this.refName.setValue(authStore.name);
	};

	onFileClick (e: any) {
		const options: any = { 
			properties: [ 'openFile' ], 
			filters: [ { name: '', extensions: Constant.extension.image } ]
		};
		
		window.Electron.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			let path = files[0];
			
			authStore.iconSet(path);
			FileUtil.loadPreviewBase64(FileUtil.fromPath(path), {}, (image: string, param: any) => {
				authStore.previewSet(image);
			});
		});
	};

	onPathClick (e: any) {
		const options = { 
			properties: [ 'openDirectory' ],
		};

		window.Electron.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			authStore.accountPathSet(files[0]);
		});
	};
	
	onNameChange (e: any) {
		authStore.nameSet(this.refName.getValue());
	};

	onSubmit (e: any) {
		e.preventDefault();
		
		const { match } = this.props;
		
		this.refName.setError(false);

		let error = '';
		
		if (!authStore.name) {
			error = 'Name cannot be blank';
			this.refName.setError(true);
		};
		
		if (!error) {
			Util.route('/auth/invite/' + match.params.id);
		} else {
			this.setState({ error: error });
		};
	};
	
});

export default PageAuthRegister;