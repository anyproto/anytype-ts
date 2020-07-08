import * as React from 'react';
import { Emoji } from 'emoji-mart';
import { Input } from 'ts/component';
import { I, Util } from 'ts/lib';
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
				<div className="smile">
					<Emoji native={true} emoji={':' + smileId + '::skin-tone-' + item.skin + ':'} set="apple" size={32} />
				</div>
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