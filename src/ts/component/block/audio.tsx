import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InputWithFile, Icon, Loader, Error } from 'ts/component';
import { I, C, translate, focus } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {}

const $ = require('jquery');
const Constant = require('json/constant.json');

const BlockAudio = observer(class BlockAudio extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
	};

	render () {
		const { block, readonly } = this.props;
		const { id, fields, content } = block;
		const { state, hash, type, mime } = content;
		
		let { width } = fields;
		let element = null;
		let css: any = {};
		
		switch (state) {
			default:
			case I.FileState.Error:
			case I.FileState.Empty:
				element = (
					<React.Fragment>
						{state == I.FileState.Error ? <Error text={translate('blockFileError')} /> : ''}
						<InputWithFile 
							block={block} 
							icon="audio" 
							textFile="Upload an audio" 
							accept={Constant.extension.audio} 
							readonly={readonly} 
						/>
					</React.Fragment>
				);
				break;
				
			case I.FileState.Uploading:
				element = (
					<Loader />
				);
				break;
				
			case I.FileState.Done:
				element = (
					<div className="wrap" style={css}>
					</div>
				);
				break;
		};
		
		return (
			<div className={[ 'focusable', 'c' + id ].join(' ')} tabIndex={0}>
				{element}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentDidUpdate () {
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
});

export default BlockAudio;