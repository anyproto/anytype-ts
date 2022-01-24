import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentFile implements I.ContentFile {
	
	hash: string = '';
	name: string = '';
	mime: string = '';
	size: number = 0;
	type: I.FileType = I.FileType.None;
	style: I.FileStyle = I.FileStyle.Auto;
	state: I.FileState = I.FileState.Empty;
	
	constructor (props: I.ContentFile) {
		let self = this;

		self.hash = String(props.hash || '');
		self.name = String(props.name || '');
		self.mime = String(props.mime || '');
		self.size = Number(props.size) || 0;
		self.type = Number(props.type) || I.FileType.None;
		self.style = Number(props.style) || I.FileStyle.Auto;
		self.state = Number(props.state) || I.FileState.Empty;
		
		makeObservable(self, {
			hash: observable,
			name: observable,
			mime: observable,
			size: observable,
			type: observable,
			style: observable,
			state: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentFile;