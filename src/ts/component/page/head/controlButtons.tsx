import * as React from 'react';
import { Icon } from 'ts/component';
import { I, DataUtil, translate, analytics, focus } from 'ts/lib';
import { blockStore, menuStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	readonly?: boolean;
	onIcon: (e: any) => void;
	onCoverOpen: () => void;
	onCoverClose: () => void;
	onLayout: (e: any) => void;
	onRelation: (e: any) => void;
	onEdit: (e: any) => void;
	onUploadStart: (e: any) => void;
	onUpload: (type: I.CoverType, hash: string) => void;
};

const Constant = require('json/constant.json');

const ControlButtons = observer(class ControlButtons extends React.Component<Props, {}> {
	
	menuContext: any = null;
	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onIcon = this.onIcon.bind(this);
		this.onCover = this.onCover.bind(this);
		this.onLayout = this.onLayout.bind(this);
		this.onRelation = this.onRelation.bind(this);
	};

	render (): any {
		const { rootId, readonly } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		let checkType = blockStore.checkBlockTypeExists(rootId);
		let allowedDetails = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		let allowedLayout = !checkType && allowedDetails && !root.isObjectSet() && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Layout ]);
		let allowedRelation = !checkType;
		let allowedIcon = !checkType && allowedDetails && !root.isObjectTask() && !root.isObjectNote();
		let allowedCover = !checkType && allowedDetails && !root.isObjectNote();

		if (root.isLocked()) {
			allowedIcon = false;
			allowedLayout = false;
			allowedCover = false;
		};

		if (readonly) {
			allowedIcon = false;
			allowedLayout = false;
			allowedCover = false;
			allowedRelation = false;
		};

		return (
			<div className="controlButtons">
				{allowedIcon ? (
					<div id="button-icon" className="btn white withIcon" onClick={this.onIcon}>
						<Icon className="icon" />
						<div className="txt">{translate('editorControlIcon')}</div>
					</div>
				) : ''}

				{allowedCover ? (
					<div id="button-cover" className="btn white withIcon" onClick={this.onCover}>
						<Icon className="addCover" />
						<div className="txt">{translate('editorControlCover')}</div>
					</div>
				) : ''}

				{allowedLayout ? (
					<div id="button-layout" className="btn white withIcon" onClick={this.onLayout}>
						<Icon className="layout" />
						<div className="txt">{translate('editorControlLayout')}</div>
					</div>
				) : ''}

				{allowedRelation ? (
					<div id="button-relation" className="btn white withIcon" onClick={this.onRelation}>
						<Icon className="relation" />
						<div className="txt">{translate('editorControlRelation')}</div>
					</div>
				) : ''}
			</div>
		);
	};

	onIcon (e: any) {
		e.preventDefault();
		e.stopPropagation();

		focus.clear(true);
		this.props.onIcon(e);
	};

	onLayout (e: any) {
		e.preventDefault();
		e.stopPropagation();

		focus.clear(true);
		this.props.onLayout(e);
	};

	onRelation (e: any) {
		e.preventDefault();
		e.stopPropagation();

		focus.clear(true);
		this.props.onRelation(e);
	};

	onCover (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId, onCoverOpen, onCoverClose, onEdit } = this.props;
		const object = detailStore.get(rootId, rootId, Constant.coverRelationKeys, true);
		const element = $(e.currentTarget);
		const hasCover = object.coverType != I.CoverType.None;
		
		if (!hasCover) {
			this.onChange(element);
		} else {
			const options: any[] = [
				{ id: 'change', icon: 'coverChange', name: 'Change cover' },
			];
			if (DataUtil.coverIsImage(object.coverType)) {
				options.push({ id: 'position', icon: 'coverPosition', name: 'Reposition' });
			};
			if (hasCover) {
				options.push({ id: 'remove', icon: 'remove', name: 'Remove' });
			};

			this.menuContext = null;

			menuStore.open('select', {
				element,
				horizontal: I.MenuDirection.Center,
				onOpen: (context: any) => {
					this.menuContext = context;
					onCoverOpen();
				},
				onClose: () => {
					window.clearTimeout(this.timeout);
					this.timeout = window.setTimeout(() => { onCoverClose }, Constant.delay.menu);
				},
				data: {
					noClose: true,
					options: options,
					onSelect: (e: any, item: any) => {
						switch (item.id) {
							case 'change':
								this.onChange(element);
								this.menuContext.close();

								window.clearTimeout(this.timeout);
								break;
							
							case 'position':
								onEdit(e);
								this.menuContext.close();
								break;
	
							case 'remove':
								DataUtil.pageSetCover(rootId, I.CoverType.None, '');
								this.menuContext.close();
	
								analytics.event('RemoveCover');
								break;
						};
					}
				}
			});
		};
	};

	onChange (element: any) {
		const { rootId, onEdit, onUploadStart, onUpload, onCoverOpen, onCoverClose } = this.props;

		menuStore.open('blockCover', {
			element,
			horizontal: I.MenuDirection.Center,
			onOpen: onCoverOpen,
			onClose: onCoverClose,
			data: {
				rootId,
				onEdit,
				onUploadStart,
				onUpload,
				onSelect: (item: any) => {
					DataUtil.pageSetCover(rootId, item.type, item.id, item.coverX, item.coverY, item.coverScale);
				}
			},
		});
	};
	
});

export default ControlButtons;