import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, IconUser, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { commonStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, Util, translate } from 'ts/lib';

const { dialog } = window.require('electron').remote;

interface Props extends RouteComponentProps<any> {};
interface State {
	error: string;
	preview: string;
};

@observer
class PageAuthRegister extends React.Component<Props, State> {

	nameRef: any;

	state = {
		error: '',
		preview: '',
	};
	
	constructor (props: any) {
		super(props);

		this.onFileClick = this.onFileClick.bind(this);
		this.onNameChange = this.onNameChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};
	
	render () {
		const { coverId, coverImg } = commonStore;
		const { error, preview } = this.state;

		return (
			<div>
				<Cover type={I.CoverType.Image} num={coverId} image={coverImg} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text={translate('authRegisterTitle')} />
					<Error text={error} />
		
					<form onSubmit={this.onSubmit}>
						<div className="fileWrap" onClick={this.onFileClick}>
							<IconUser icon={preview} color="grey" className={preview ? 'active' : ''} />
						</div>
					
						<Input ref={(ref: any) => this.nameRef = ref} placeHolder={translate('authRegisterName')} value={name} onKeyUp={this.onNameChange} />
						<Button type="input" text={translate('authRegisterSubmit')} className="orange" />
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
		dialog.showOpenDialog({ properties: [ 'openFile' ] }, (files: any) => {
			if ((files == undefined) || !files.length) {
				return;
			};

			let path = files[0];
			
			authStore.iconSet(path);
			Util.loadPreviewBase64(Util.makeFileFromPath(path), {}, (image: string, param: any) => {
				this.setState({ preview: image });
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