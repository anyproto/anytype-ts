import * as React from 'react';
import { observer } from 'mobx-react';
import { Editable } from 'Component';
import { I, C, keyboard } from 'Lib';
import { blockStore } from 'Store';

import ChatMessage from './chat/message';

const LIMIT = 50;

const BlockChat = observer(class BlockChat extends React.Component<I.BlockComponent> {

	_isMounted = false;
	refList = null;
	refEditable = null;

	constructor (props: I.BlockComponent) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onFocusInput = this.onFocusInput.bind(this);
		this.onBlurInput = this.onBlurInput.bind(this);
		this.onKeyUpInput = this.onKeyUpInput.bind(this);
		this.onKeyDownInput = this.onKeyDownInput.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onPaste = this.onPaste.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const children = blockStore.unwrapTree([ blockStore.wrapTree(rootId, block.id) ]).filter(it => it.isText());


		console.log(children);

		const length = children.length;
		const slice = length > LIMIT ? children.slice(length - LIMIT, length) : children;

		return (
			<div>
				<div ref={ref => this.refList = ref} className="list">
					{slice.map((item: any, index: number) => (
						<ChatMessage key={item.id} {...item} />
					))}
				</div>

				<Editable 
					ref={ref => this.refEditable = ref}
					id="input"
					readonly={readonly}
					placeholder={'Enter your message'}
					onSelect={this.onSelect}
					onFocus={this.onFocusInput}
					onBlur={this.onBlurInput}
					onKeyUp={this.onKeyUpInput} 
					onKeyDown={this.onKeyDownInput}
					onInput={this.onChange}
					onPaste={this.onPaste}
					onMouseDown={this.onSelect}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.scrollToBottom();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	onSelect = (e: any) => {
	};

	onFocusInput = (e: any) => {
	};

	onBlurInput = (e: any) => {
	};

	onKeyUpInput = (e: any) => {
	};

	onKeyDownInput = (e: any) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			this.onAddMessage();
		});
	};

	onChange = (e: any) => {
	};

	onPaste = (e: any) => {
	};

	onAddMessage = () => {
		const value = this.refEditable.getTextValue().trim();

		if (!value) {
			return;
		};

		const { rootId, block } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const length = childrenIds.length;
		const target = length ? childrenIds[length - 1] : block.id;
		const position = length ? I.BlockPosition.Bottom : I.BlockPosition.InnerFirst;
		
		const param = {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
			content: {
				text: value,
			}
		};
		
		C.BlockCreate(rootId, target, position, param, (message: any) => {
			this.scrollToBottom();
		});

		this.refEditable.setValue('');
	};

	scrollToBottom () {
		$(this.refList).scrollTop(this.refList.scrollHeight);
	};
	
});

export default BlockChat;