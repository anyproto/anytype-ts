import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Label, Error, Input, Button, Header, FooterAuth as Footer, Icon } from 'Component';
import { commonStore, authStore, menuStore } from 'Store';
import { observer } from 'mobx-react';
import { FileUtil, Util, translate, I } from 'Lib';

interface Props extends RouteComponentProps<any> {};
interface State {
	error: string;
};

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
		this.onAdvanced = this.onAdvanced.bind(this);
	};
	
	render () {
		const { cover, config } = commonStore;
		const { error } = this.state;
		const { name, preview } = authStore;

		return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer />
				
				<Frame>
					<div className="authBackWrap" onClick={this.onCancel}>
						<Icon className="back" />
						<div className="name">{translate('authLoginBack')}</div>
					</div>

					{config.experimental ? (
						<div id="button-advanced" className="advanced" onClick={this.onAdvanced}>
							{translate('authRegisterAdvanced')}
						</div>
					) : ''}

					<Error text={error} />
		
					<form onSubmit={this.onSubmit}>
						<div className="iconObject isHuman c96 fileWrap" onClick={this.onFileClick}>
							{preview ? <img src={preview} className="iconImage c64" /> : ''}
						</div>
						<Label text={translate('authRegisterLabel')} />
						<Input ref={(ref: any) => this.refName = ref} placeholder={translate('authRegisterName')} value={name} onKeyUp={this.onNameChange} />
						<Button type="input" text={translate('authRegisterSubmit')} />
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

	onAdvanced (e: any) {
		menuStore.open('accountPath', {
			element: '#button-advanced',
			offsetY: 7,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
		});
	}

	onCancel (e: any) {
		Util.route('/auth/select');
	};
	
});

export default PageAuthRegister;