import * as React from 'react';
import $ from 'jquery';
import { Icon } from 'Component';
import { I, UtilData, UtilObject, UtilCommon, translate, analytics, focus } from 'Lib';
import { blockStore, menuStore, detailStore } from 'Store';
import { observer } from 'mobx-react';
const Constant = require('json/constant.json');

interface Props {
	rootId: string;
	readonly?: boolean;
	onIcon?: (e: any) => void;
	onCoverOpen?: () => void;
	onCoverClose?: () => void;
	onCoverSelect?: (item: any) => void;
	onLayout?: (e: any) => void;
	onEdit?: (e: any) => void;
	onUploadStart?: (e: any) => void;
	onUpload?: (type: I.CoverType, objectId: string) => void;
};

const ControlButtons = observer(class ControlButtons extends React.Component<Props> {
	
	node = null;
	timeout = 0;

	constructor (props: Props) {
		super(props);

		this.onIcon = this.onIcon.bind(this);
		this.onCover = this.onCover.bind(this);
		this.onLayout = this.onLayout.bind(this);
	};

	render (): any {
		const { rootId, readonly } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const checkType = blockStore.checkBlockTypeExists(rootId);
		const allowedDetails = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);

		let allowedLayout = !checkType && allowedDetails && !root.isObjectSet() && !root.isObjectCollection();
		let allowedIcon = !checkType && allowedDetails && !root.isObjectTask() && !root.isObjectNote() && !root.isObjectBookmark();
		let allowedCover = !checkType && allowedDetails && !root.isObjectNote();

		if (root.isLocked() || readonly) {
			allowedIcon = false;
			allowedLayout = false;
			allowedCover = false;
		};

		if (root.isObjectType()) {
			allowedLayout = false;
			allowedCover = false;
		};

		return (
			<div 
				ref={ref => this.node = ref}
				className="controlButtons"
			>
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
			</div>
		);
	};

	componentDidMount (): void {
		this.rebind();
	};

	componentWillUnmount (): void {
		this.unbind();
	};

	rebind () {
		this.unbind();

		$(window).on('resize.controlButtons', () => this.resize());
	};

	unbind () {
		$(window).off('resize.controlButtons');
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

	onCover (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { rootId, onCoverOpen, onCoverClose, onEdit } = this.props;
		const object = detailStore.get(rootId, rootId, Constant.coverRelationKeys, true);
		const element = $(e.currentTarget);
		const hasCover = object.coverType != I.CoverType.None;
		
		if (!hasCover) {
			this.onChange(element);
			return;
		};

		const options: any[] = [
			{ id: 'change', icon: 'coverChange', name: translate('pageHeadControlButtonsChangeCover') },
		];
		if (UtilData.coverIsImage(object.coverType)) {
			options.push({ id: 'position', icon: 'coverPosition', name: translate('pageHeadControlButtonsReposition') });
		};
		if (hasCover) {
			options.push({ id: 'remove', icon: 'remove', name: translate('commonRemove') });
		};

		menuStore.open('select', {
			element,
			horizontal: I.MenuDirection.Center,
			onOpen: onCoverOpen,
			onClose: () => {
				window.clearTimeout(this.timeout);
				this.timeout = window.setTimeout(() => onCoverClose(), menuStore.getTimeout());
			},
			data: {
				options: options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'change':
							window.setTimeout(() => {
								window.clearTimeout(this.timeout);
								this.onChange(element);
							}, menuStore.getTimeout());
							break;
						
						case 'position':
							if (onEdit) {
								onEdit(e);
							};
							break;

						case 'remove':
							UtilObject.setCover(rootId, I.CoverType.None, '');
							analytics.event('RemoveCover');
							break;
					};
				}
			}
		});
	};

	onChange (element: any) {
		const { rootId, onEdit, onUploadStart, onUpload, onCoverOpen, onCoverClose, onCoverSelect } = this.props;

		menuStore.open('blockCover', {
			element,
			horizontal: I.MenuDirection.Center,
			onOpen: () => {
				window.clearTimeout(this.timeout);
				onCoverOpen();
			},
			onClose: onCoverClose,
			data: {
				rootId,
				onEdit,
				onUploadStart,
				onUpload,
				onSelect: onCoverSelect
			},
		});
	};

	resize () {
		const { ww } = UtilCommon.getWindowDimensions();
		const node = $(this.node);

		ww <= 900 ? node.addClass('small') : node.removeClass('small');
	};
	
});

export default ControlButtons;