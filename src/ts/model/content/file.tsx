import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentFile implements I.ContentFile {
	
	hash: string = '';
	name: string = '';
	mime: string = '';
	size: number = 0;
	addedAt: number = 0;
	type: I.FileType = I.FileType.None;
	state: I.FileState = I.FileState.Empty;
	
	constructor (props: I.ContentFile) {
		let self = this;

		self.hash = String(props.hash || '');
		self.name = String(props.name || '');
		self.mime = String(props.mime || '');
		self.size = Number(self.size) || 0;
		self.addedAt = Number(self.addedAt) || 0;
		self.type = Number(self.type) || I.FileType.None;
		self.state = Number(self.state) || I.FileState.Empty;
		
		makeObservable(self, {
			hash: observable,
			name: observable,
			mime: observable,
			size: observable,
			addedAt: observable,
			type: observable,
			state: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentFile;