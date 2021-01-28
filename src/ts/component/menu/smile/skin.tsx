import * as React from 'react';
import { Emoji } from 'emoji-mart';
import { IconObject } from 'ts/component';
import { I, SmileUtil } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

class MenuSmileSkin extends React.Component<Props, {}> {

	ref: any = null;
	state = {
		filter: ''
	};

	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { smileId } = data;
		const skins = [ 1, 2, 3, 4, 5, 6 ];
		
		const Item = (item: any) => (
			<div className="item" onClick={(e: any) => { this.onClick(item.skin); }}>
				<IconObject size={32} object={{ iconEmoji: SmileUtil.nativeById(smileId, item.skin) }} />
			</div>
		);
		
		return (
			<div>
				{skins.map((skin: any, i: number) => (
					<Item key={i} skin={skin} />
				))}
			</div>
		);
	};
	
	onClick (id: number) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		onSelect(id);
		this.props.close();
	};
	
};

export default MenuSmileSkin;