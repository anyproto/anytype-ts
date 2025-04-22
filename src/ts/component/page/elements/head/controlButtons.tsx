import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, J, translate, analytics, focus, Renderer, Relation, Action, Onboarding, keyboard } from 'Lib';

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
		this.onDescription = this.onDescription.bind(this);
		this.getAllowedButtons = this.getAllowedButtons.bind(this);
	};

	render (): any {
		const { rootId } = this.props;
		const root = S.Block.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const { allowedIcon, allowedLayout, allowedCover,  allowedDescription } = this.getAllowedButtons();
		const check = U.Data.checkDetails(rootId);
		const object = S.Detail.get(rootId, rootId, [ 'featuredRelations', 'targetObjectType', 'layoutAlign' ]);
		const hasDescription = Relation.getArrayValue(object.featuredRelations).includes('description');
		const hasConflict = U.Object.hasLayoutConflict(object);

		return (
			<div 
				ref={ref => this.node = ref}
				className="controlButtons"
			>
				{allowedIcon ? (
					<div id="button-icon" className="btn white withIcon" onClick={this.onIcon}>
						<Icon className="icon" />
						<div className="txt">{translate(`editorControlIcon${Number(check.withIcon)}`)}</div>
					</div>
				) : ''}

				{allowedCover ? (
					<div id="button-cover" className="btn white withIcon" onClick={this.onCover}>
						<Icon className="addCover" />
						<div className="txt">{translate(`editorControlCover${Number(check.withCover)}`)}</div>
					</div>
				) : ''}

				{allowedDescription ? (
					<div id="button-description" className="btn white withIcon" onClick={this.onDescription}>
						<Icon className="description" />
						<div className="txt">{translate(`editorControlDescription${Number(hasDescription)}`)}</div>
					</div>
				) : ''}

				{allowedLayout ? (
					<div id="button-layout" className="btn white withIcon small" onClick={this.onLayout}>
						<Icon className="layout" />
						{hasConflict ? <div className="dot" /> : ''}
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount (): void {
		const { allowedDescription } = this.getAllowedButtons();

		if (allowedDescription) {
			Onboarding.start('objectDescriptionButton', keyboard.isPopup());
		};

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

	onDescription (e: any) {
		Action.toggleFeatureRelation(this.props.rootId, 'description');
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

	getAllowedButtons (): { allowedIcon: boolean, allowedLayout: boolean, allowedCover: boolean, allowedDescription: boolean, } {
		const { rootId, readonly } = this.props;
		const root = S.Block.getLeaf(rootId, rootId);

		let allowedLayout = false;
		let allowedIcon = false;
		let allowedCover = false;
		let allowedDescription = false;

		if (!root) {
			return { allowedIcon, allowedLayout, allowedCover, allowedDescription };
		};

		const object = S.Detail.get(rootId, rootId, [ 'featuredRelations', 'targetObjectType', 'layoutAlign' ]);
		const checkType = S.Block.checkBlockTypeExists(rootId);
		const allowedDetails = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const isInSets = U.Object.isInSetLayouts(root.layout);
		const isTask = U.Object.isTaskLayout(root.layout);
		const isNote = U.Object.isNoteLayout(root.layout);
		const isBookmark = U.Object.isBookmarkLayout(root.layout);
		const isChat = U.Object.isChatLayout(root.layout);
		const isType = U.Object.isTypeLayout(root.layout);
		const hasConflict = U.Object.hasLayoutConflict(object);

		allowedLayout = !checkType && allowedDetails && !isChat && !isType;
		allowedIcon = !checkType && allowedDetails && !isTask && !isNote && !isBookmark && !isType;
		allowedCover = !checkType && allowedDetails && !isNote && !isType;
		allowedDescription = !checkType && allowedDetails && !isNote;

		if (isInSets && !hasConflict) {
			allowedLayout = false;
		};

		if (root.isLocked() || readonly) {
			allowedIcon = false;
			allowedLayout = false;
			allowedCover = false;
			allowedDescription = false;
		};

		return { allowedIcon, allowedLayout, allowedCover, allowedDescription };
	};

	resize () {
		const { ww } = U.Common.getWindowDimensions();
		$(this.node).toggleClass('small', ww <= 900);
	};
	
});

export default ControlButtons;
