import { observable, makeObservable } from 'mobx';
import * as I from 'Interface';

class BlockContentEmbed implements I.ContentEmbed {
	
	text = '';
	processor: I.EmbedProcessor = I.EmbedProcessor.Latex;
	
	constructor (props: I.ContentEmbed) {
		this.text = String(props.text || '');
		this.processor = Number(props.processor) || I.EmbedProcessor.Latex;

		makeObservable(this, {
			text: observable,
			processor: observable,
		});

		return this;
	};

};

export default BlockContentEmbed;