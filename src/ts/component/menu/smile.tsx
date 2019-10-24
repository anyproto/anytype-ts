import * as React from 'react';
import { NimblePicker } from 'emoji-mart';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';

const EmojiData = require('emoji-mart/data/apple.json');

interface Props extends I.Menu {};

class MenuSmile extends React.Component<Props, {}> {

	ref: any = null;

	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
	};
	
	render () {
		return (
			<NimblePicker
				ref={(ref: any) => { this.ref = ref; }}
				data={EmojiData}
				onSelect={this.onSelect}
				title=""
				showPreview={false}
				emojiTooltip={false}
			/>
		);
	};
	
	componentDidMount () {
		if (this.ref) {
			this.ref.forceUpdate();
		};
	};
	
	onSelect (item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		commonStore.menuClose(this.props.id);
		onSelect(item);
	};
	
};

export default MenuSmile;