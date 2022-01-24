import * as React from 'react';
import { Icon } from 'ts/component';
import { I, translate } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	onIcon: (e: any) => void;
	onCover: (e: any) => void;
	onLayout: (e: any) => void;
	onRelation: (e: any) => void;
};

const ControlButtons = observer(class ControlButtons extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
	};

	render (): any {
		const { rootId, onIcon, onCover, onLayout, onRelation } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		let checkType = blockStore.checkBlockType(rootId);
		let allowedDetails = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Details ]);
		let allowedLayout = !checkType && allowedDetails && !root.isObjectSet() && blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Layout ]);
		let allowedRelation = !checkType;
		let allowedIcon = !checkType && allowedDetails && !root.isObjectTask() && !root.isObjectNote();
		let allowedCover = !checkType && allowedDetails && !root.isObjectNote();

		if (root.fields.isLocked) {
			allowedIcon = false;
			allowedLayout = false;
			allowedCover = false;
		};

		return (
			<div className="controlButtons">
				{allowedIcon ? (
					<div id="button-icon" className="btn white withIcon" onClick={onIcon}>
						<Icon className="icon" />
						<div className="txt">{translate('editorControlIcon')}</div>
					</div>
				) : ''}

				{allowedCover ? (
					<div id="button-cover" className="btn white withIcon" onClick={onCover}>
						<Icon className="addCover" />
						<div className="txt">{translate('editorControlCover')}</div>
					</div>
				) : ''}

				{allowedLayout ? (
					<div id="button-layout" className="btn white withIcon" onClick={onLayout}>
						<Icon className="layout" />
						<div className="txt">{translate('editorControlLayout')}</div>
					</div>
				) : ''}

				{allowedRelation ? (
					<div id="button-relation" className="btn white withIcon" onClick={onRelation}>
						<Icon className="relation" />
						<div className="txt">{translate('editorControlRelation')}</div>
					</div>
				) : ''}
			</div>
		);
	};
	
});

export default ControlButtons;