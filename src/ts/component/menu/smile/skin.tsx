import * as React from 'react';
import { IconObject } from 'Component';
import { I, SmileUtil } from 'Lib';

class MenuSmileSkin extends React.Component<I.Menu> {

	ref: any = null;
	state = {
		filter: ''
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { smileId } = data;
		const skins = [ 1, 2, 3, 4, 5, 6 ];
		
		const Item = (item: any) => (
			<div className="item" onMouseDown={(e: any) => { this.onClick(e, item.skin); }}>
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
	
	onClick (e: any, id: number) {
		e.preventDefault();
		e.stopPropagation();

		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;

		onSelect(id);
		close();
	};
	
};

export default MenuSmileSkin;