import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, Util, DataUtil, focus } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any>  {
	rootId: string;
};

const Constant = require('json/constant.json');

@observer
class FooterMainEdit extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onHelp = this.onHelp.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};

	render () {
		return (
			<div className="footer">
				<Icon id="button-help" className={'help ' + (commonStore.menuIsOpen('help') ? 'active' : '')} onMouseDown={this.onHelp} />
				<Icon id="button-plus" className="plusBig dark" onClick={this.onAdd} tooltip="Add new page" tooltipY={I.MenuDirection.Top} />
			</div>
		);
	};

	onHelp () {
		commonStore.menuOpen('help', {
			type: I.MenuType.Vertical, 
			element: '#button-help',
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right
		});
	};
	
	onAdd (e: any) {
		const { rootId } = this.props;
		const { focused } = focus;
		const fb = blockStore.getLeaf(rootId, focused);
		const details = { 
			iconEmoji: Util.randomSmile(), 
			name: Constant.default.name 
		};
		
		let targetId = '';
		let position = I.BlockPosition.Bottom;
		
		if (fb) {
			if (fb.isTitle()) {
				const first = blockStore.getFirstBlock(rootId, 1, (it: I.Block) => { return it.isFocusable() && !it.isTitle(); });
				if (first) {
					targetId = first.id;
					position = I.BlockPosition.Top;
				};
			} else 
			if (fb.isFocusable()) {
				targetId = fb.id;
			};
		};
		
		DataUtil.pageCreate(e, this.props, rootId, targetId, details, position);
	};

};

export default FooterMainEdit;