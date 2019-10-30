import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input, Button } from 'ts/component';
import { Util } from 'ts/lib';

const { dialog } = window.require('electron').remote;

interface Props {
	icon?: string;
	textUrl?: string;
	textFile?: string;
	accept?: string;
	withFile?: boolean;
	onChangeUrl?(e: any, url: string): void;
	onChangeFile?(e: any, file: any): void;
};

interface State {
	focused: boolean;
};

class InputWithFile extends React.Component<Props, State> {
	
	private static defaultProps = {
		textUrl: 'Paste a link',
		withFile: true
	};
	
	state = {
		focused: false
	};
	
	t: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onSubmit = this.onSubmit.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		
		this.onClickFile = this.onClickFile.bind(this);
	};
	
	render () {
		const { focused } = this.state;
		const { icon, textUrl, textFile, accept, withFile } = this.props;
		
		let cn = [ 'inputWithFile' ];
		
		if (withFile) {
			cn.push('withFile');
		};
		if (focused) {
			cn.push('isFocused');
		};
		
		return (
			<div className={cn.join(' ')}>
				
			</div>
		);
	};
	
	onFocus (e: any) {
	};
	
	onBlur (e: any) {
	};
	
	onKeyDown (e: any) {
	};
	
	onChangeUrl (e: any, force: boolean) {
	};
	
	onClickFile (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		dialog.showOpenDialog({ properties: [ 'openFile' ] }, (files: any[]) => {
			if (files == undefined) {
				return;
			};
			
			this.props.onChangeFile(e, Util.makeFileFromPath(files[0]));
		});
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		this.onChangeUrl(e, true);
	};
	
};

export default InputWithFile;