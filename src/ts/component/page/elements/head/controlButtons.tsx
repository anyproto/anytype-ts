import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, J, translate, analytics, focus, Renderer } from 'Lib';

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
		const root = S.Block.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const checkType = S.Block.checkBlockTypeExists(rootId);
		const allowedDetails = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const isInSets = U.Object.isInSetLayouts(root.layout);
		const isTask = U.Object.isTaskLayout(root.layout);
		const isNote = U.Object.isNoteLayout(root.layout);
		const isBookmark = U.Object.isBookmarkLayout(root.layout);
		const isChat = U.Object.isChatLayout(root.layout);
		const isType = U.Object.isTypeLayout(root.layout);

		let allowedLayout = !checkType && allowedDetails && !isInSets && !isChat && !isType;
		let allowedIcon = !checkType && allowedDetails && !isTask && !isNote && !isBookmark;
		let allowedCover = !checkType && allowedDetails && !isNote;

		if (root.isLocked() || readonly) {
			allowedIcon = false;
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
		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);
		const element = $(e.currentTarget);
		const { coverType, coverId } = object;
		const hasCover = coverType != I.CoverType.None;
		
		if (!hasCover) {
			this.onChange(element);
			return;
		};

		const options: any[] = [
			{ id: 'change', icon: 'coverChange', name: translate('pageHeadControlButtonsChangeCover') },
		];
		if (U.Data.coverIsImage(coverType)) {
			options.push({ id: 'position', icon: 'coverPosition', name: translate('pageHeadControlButtonsReposition') });
		};
		if ([ I.CoverType.Upload, I.CoverType.Source ].includes(coverType) && coverId) {
			options.push({ id: 'download', icon: 'download', name: translate('commonDownload') });
		};

		if (hasCover) {
			options.push({ id: 'remove', icon: 'remove', name: translate('commonRemove') });
		};

		S.Menu.open('select', {
			element,
			horizontal: I.MenuDirection.Center,
			onOpen: onCoverOpen,
			onClose: () => {
				window.clearTimeout(this.timeout);
				this.timeout = window.setTimeout(() => onCoverClose(), S.Menu.getTimeout());
			},
			data: {
				options: options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'change': {
							window.setTimeout(() => {
								window.clearTimeout(this.timeout);
								this.onChange(element);
							}, S.Menu.getTimeout());
							break;
						};
						
						case 'position': {
							if (onEdit) {
								onEdit(e);
							};
							break;
						};

						case 'download': {
							Renderer.send('download', S.Common.imageUrl(coverId, 1000000), { saveAs: true });
							break;
						};

						case 'remove': {
							U.Object.setCover(rootId, I.CoverType.None, '');
							analytics.event('RemoveCover');
							break;
						};
					};
				}
			}
		});
	};

	onChange (element: any) {
		const { rootId, onEdit, onUploadStart, onUpload, onCoverOpen, onCoverClose, onCoverSelect } = this.props;

		S.Menu.open('blockCover', {
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
		const { ww } = U.Common.getWindowDimensions();
		const node = $(this.node);

		ww <= 900 ? node.addClass('small') : node.removeClass('small');
	};
	
});

export default ControlButtons;