import * as React from 'react';
import { NimblePicker } from 'emoji-mart';
import { I, keyboard } from 'ts/lib';
import { observer, inject } from 'mobx-react';

const EmojiData = require('emoji-mart/data/apple.json');

interface Props extends I.Menu {
	commonStore?: any;
};

@inject('commonStore')
@observer
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
		
		keyboard.setFocus(true);
	};
	
	componentWillUnmount () {
		keyboard.setFocus(false);
	};
	
	onSelect (item: any) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		commonStore.menuClose(this.props.id);
		onSelect(item);
	};
	
};

export default MenuSmile;