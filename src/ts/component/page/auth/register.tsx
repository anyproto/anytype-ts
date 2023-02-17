import * as React from 'react';
import { Frame, Cover, Label, Error, Input, Button, Header, Footer, Icon } from 'Component';
import { FileUtil, Util, translate, I, Action, Animation } from 'Lib';
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
				
				<Frame className="animation" dataset={{ 'animation-index-from': 3 }}>
					<div 
						className="backWrap animation" 
						onClick={this.onCancel}
						{...Util.dataProps({ 'animation-index-from': 0 })}
					>
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
						<div 
							className="iconObject isHuman c96 fileWrap animation" 
							onClick={this.onFileClick}
							{...Util.dataProps({ 'animation-index-from': 1 })}
						>
							{preview ? <img src={preview} className="iconImage c64" /> : ''}
						</div>

						<Label className="animation" dataset={{ 'animation-index-from': 2 }} text={translate('authRegisterLabel')} />
						<Input className="animation" ref={ref => this.refName = ref} placeholder={translate('authRegisterName')} value={name} onKeyUp={this.onNameChange} />

						<div className="buttons animation" {...Util.dataProps({ 'animation-index-from': 4 })}>
							<Button type="input" text={translate('authRegisterSubmit')} />
						</div>
					</form>
				</Frame>
			</div>
		);
	};
	
	componentDidMount () {
		Animation.to();
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
		Action.openDir(paths => authStore.accountPathSet(paths[0]));
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
			Animation.from(() => { Util.route('/auth/invite/' + match.params.id); });
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
		Animation.from(() => { Util.route('/auth/select'); });
	};
	
});

export default PageAuthRegister;