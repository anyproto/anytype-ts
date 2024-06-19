import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentFile implements I.ContentFile {
	
	targetObjectId = '';
	type: I.FileType = I.FileType.None;
	style: I.FileStyle = I.FileStyle.Auto;
	state: I.FileState = I.FileState.Empty;
	
	constructor (props: I.ContentFile) {
		this.targetObjectId = String(props.targetObjectId || '');
		this.type = Number(props.type) || I.FileType.None;
		this.style = Number(props.style) || I.FileStyle.Auto;
		this.state = Number(props.state) || I.FileState.Empty;
		
		makeObservable(this, {
			targetObjectId: observable,
			type: observable,
			style: observable,
			state: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default BlockContentFile;