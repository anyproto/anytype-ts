import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class ChatMessage implements I.ChatMessage {

	id = '';
	author = '';
	text = '';
	data = {};

	constructor (props: I.ChatMessage) {

		this.id = String(props.id || '');
		this.author = String(props.author || '');
		this.text = String(props.text || '');
		this.data = props.data || {};

		makeObservable(this, {
			text: observable,
			data: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default ChatMessage;