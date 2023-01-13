import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentFile implements I.ContentFile {
	
	hash = '';
	name = '';
	mime = '';
	size = 0;
	type: I.FileType = I.FileType.None;
	style: I.FileStyle = I.FileStyle.Auto;
	state: I.FileState = I.FileState.Empty;
	
	constructor (props: I.ContentFile) {
		this.hash = String(props.hash || '');
		this.name = String(props.name || '');
		this.mime = String(props.mime || '');
		this.size = Number(props.size) || 0;
		this.type = Number(props.type) || I.FileType.None;
		this.style = Number(props.style) || I.FileStyle.Auto;
		this.state = Number(props.state) || I.FileState.Empty;
		
		makeObservable(this, {
			hash: observable,
			name: observable,
			mime: observable,
			size: observable,
			type: observable,
			style: observable,
			state: observable,
		});

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
	};

};

export default BlockContentFile;