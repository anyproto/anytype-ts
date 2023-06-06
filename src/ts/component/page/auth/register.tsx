import * as React from 'react';
import { Frame, Cover, Label, Error, Input, Button, Header, Footer, Icon } from 'Component';
import { FileUtil, Util, translate, I, Action } from 'Lib';
import { commonStore, authStore, menuStore } from 'Store';
import { observer } from 'mobx-react';
import Constant from 'json/constant.json';

interface State {
	error: string;
};

const PageAuthRegister = observer(class PageAuthRegister extends React.Component<I.PageComponent, State> {

	refName: any = null;

	state = {
		error: '',
	};
	
	constructor (props: I.PageComponent) {
		super(props);

		this.onFileClick = this.onFileClick.bind(this);
		this.onPathClick = this.onPathClick.bind(this);
		this.onNameChange = this.onNameChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onAdvanced = this.onAdvanced.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { cover, config } = commonStore;
		const { error } = this.state;
		const { name, preview } = authStore;

		return (
			<div>
				<Cover {...cover} className="main" />
				<Header {...this.props} component="authIndex" />
				<Footer {...this.props} component="authIndex" />
				
				<Frame>
					<div className="authBackWrap" onClick={this.onCancel}>
						<Icon className="back" />
						<div className="name">{translate('commonBack')}</div>
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
						<Input ref={ref => this.refName = ref} placeholder={translate('authRegisterName')} value={name} onKeyUp={this.onNameChange} />
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
		Action.openFile(Constant.extension.cover, paths => {
			let file = FileUtil.fromPath(paths[0]);
			if (!file) {
				return;
			};

			authStore.iconSet(paths[0]);
			FileUtil.loadPreviewBase64(file, {}, (image: string, param: any) => { 
				authStore.previewSet(image);
			});
		});
	};

	onPathClick (e: any) {
		Action.openDir({}, paths => authStore.accountPathSet(paths[0]));
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
			this.setState({ error });
		};
	};

	onAdvanced () {
		menuStore.open('accountPath', {
			element: '#button-advanced',
			offsetY: 7,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
		});
	}

	onCancel () {
		Util.route('/auth/select');
	};
	
});

export default PageAuthRegister;