import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, DataUtil, focus } from 'ts/lib';
import { menuStore, blockStore } from 'ts/store';

interface Props extends RouteComponentProps<any>  {
	rootId: string;
	isPopup?: boolean;
};

class FooterMainEdit extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onHelp = this.onHelp.bind(this);
	};

	render () {
		const { rootId, isPopup } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Block ]);
		const canAdd = allowed && !root.isObjectRelation() && !root.isObjectType() && !root.isObjectSet() && !root.isObjectFileKind();

		return (
			<div className="footer footerMainEdit">
				{canAdd ? <Icon id="button-add" className="big add" tooltip="Create new object" tooltipY={I.MenuDirection.Top} onClick={this.onAdd} /> : ''}
				<Icon id="button-help" className="big help" tooltip="Help" tooltipY={I.MenuDirection.Top} onClick={this.onHelp} />
			</div>
		);
	};

	onAdd (e: any) {
		const { rootId } = this.props;
		const { focused } = focus.state;
		const root = blockStore.getLeaf(rootId, rootId);
		const fb = blockStore.getLeaf(rootId, focused);
		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Block ]);

		if (!root || !allowed) {
			return;
		};
		
		let targetId = '';
		let position = I.BlockPosition.Bottom;
		
		if (fb) {
			if (fb.isTextTitle()) {
				const first = blockStore.getFirstBlock(rootId, 1, (it: I.Block) => { return it.isFocusable() && !it.isTextTitle(); });
				if (first) {
					targetId = first.id;
					position = I.BlockPosition.Top;
				};
			} else 
			if (fb.isFocusable()) {
				targetId = fb.id;
			};
		};
		
		DataUtil.pageCreate(rootId, targetId, {}, position, '', {}, (message: any) => {
			DataUtil.objectOpen({ id: message.targetId });
		});
	};

	onHelp () {
		menuStore.open('help', {
			element: '#button-help',
			offsetY: -4,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
		});
	};
	
};

export default FooterMainEdit;