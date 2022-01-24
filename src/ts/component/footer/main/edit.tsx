import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, DataUtil, focus } from 'ts/lib';
import { menuStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any>  {
	rootId: string;
	isPopup?: boolean;
};

const FooterMainEdit = observer(class FooterMainEdit extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onHelp = this.onHelp.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const canAdd = this.canAdd();

		return (
			<div id="footer" className="footer footerMainEdit">
				{canAdd ? <Icon id="button-add" className="big add" tooltip="Create new object" tooltipY={I.MenuDirection.Top} onClick={this.onAdd} /> : ''}
				<Icon id="button-help" className="big help" tooltip="Help" tooltipY={I.MenuDirection.Top} onClick={this.onHelp} />
			</div>
		);
	};

	canAdd () {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return false;
		};

		const allowed = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Block ]);
		return allowed && !root.fields.isLocked && !root.isObjectRelation() && !root.isObjectType() && !root.isObjectSet() && !root.isObjectFileKind();
	};

	onAdd (e: any) {
		const { rootId } = this.props;
		const { focused } = focus.state;
		const root = blockStore.getLeaf(rootId, rootId);
		const canAdd = this.canAdd();

		if (!root || !canAdd) {
			return;
		};
		
		let fb = blockStore.getLeaf(rootId, focused);
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
	
});

export default FooterMainEdit;