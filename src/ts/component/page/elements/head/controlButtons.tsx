import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';
import { focus } from 'Lib/focus';

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

interface ControlButtonsRef {
	forceUpdate: () => void;
};

const ControlButtons = forwardRef<ControlButtonsRef, Props>((props, ref) => {

	const { rootId, readonly, onIcon, onLayout, onCoverOpen, onCoverClose, onEdit, onUploadStart, onUpload, onCoverSelect } = props;
	const [ dummy, setDummy ] = useState(0);
	const root = S.Block.getLeaf(rootId, rootId);
	const isInSets = U.Object.isInSetLayouts(root?.layout);
	const isTask = U.Object.isTaskLayout(root?.layout);
	const isNote = U.Object.isNoteLayout(root?.layout);
	const isBookmark = U.Object.isBookmarkLayout(root?.layout);
	const isChat = U.Object.isChatLayout(root?.layout);
	const isType = U.Object.isTypeLayout(root?.layout);
	const object = S.Detail.get(rootId, rootId, [ 'featuredRelations', 'targetObjectType', 'layoutAlign', 'type', 'templateNamePrefillType' ]);
	const isTemplate = U.Object.isTemplateType(object.type);
	const hasDescription = Relation.getArrayValue(object.featuredRelations).includes('description');
	const prefillType = Number(object.templateNamePrefillType) || 0;
	const hasConflict = U.Object.hasLayoutConflict(object);
	const check = U.Data.checkDetails(rootId);
	const nodeRef = useRef(null);
	const timeout = useRef(0);

	const resizeHandler = useRef(() => resize());

	const rebind = () => {
		unbind();
		U.Dom.addEvent(window, 'resize', resizeHandler.current);
	};

	const unbind = () => {
		U.Dom.removeEvent(window, 'resize', resizeHandler.current);
	};

	const onIconHandler = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		focus.clear(true);
		onIcon(e);
	};

	const onLayoutHandler = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		focus.clear(true);
		onLayout(e);
	};

	const onDescriptionHandler = (e: any) => {
		Action.toggleFeatureRelation(rootId, 'description');
	};

	const onPrefillNameHandler = (e: any) => {
		C.ObjectListSetDetails([ rootId ], [ { key: 'templateNamePrefillType', value: prefillType ? 0 : 1 } ]);
	};

	const onCoverHandler = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const object = S.Detail.get(rootId, rootId, J.Relation.cover, true);
		const element = e.currentTarget as HTMLElement;
		const { coverType, coverId } = object;
		const hasCover = coverType != I.CoverType.None;
		
		if (!hasCover) {
			onChange(element);
			return;
		};

		const options: any[] = [
			{ id: 'change', iconParam: { name: 'common/image' }, name: translate('pageHeadControlButtonsChangeCover') },
		];
		if (U.Data.coverIsImage(coverType)) {
			options.push({ id: 'position', iconParam: { name: 'control/cover/position' }, name: translate('pageHeadControlButtonsReposition') });
		};
		if ([ I.CoverType.Upload, I.CoverType.Source ].includes(coverType) && coverId) {
			options.push({ id: 'download', iconParam: { name: 'menu/action/download' }, name: translate('commonDownload') });
		};

		if (hasCover) {
			options.push({ id: 'remove', iconParam: { name: 'menu/action/remove' }, name: translate('commonRemove') });
		};

		S.Menu.open('select', {
			classNameWrap: 'fromBlock',
			element,
			horizontal: I.MenuDirection.Center,
			onOpen: onCoverOpen,
			onClose: () => {
				window.clearTimeout(timeout.current);
				timeout.current = window.setTimeout(() => onCoverClose(), S.Menu.getTimeout());
			},
			data: {
				options: options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'change': {
							window.setTimeout(() => {
								window.clearTimeout(timeout.current);
								onChange(element);
							}, S.Menu.getTimeout());
							break;
						};
						
						case 'position': {
							onEdit?.(e);
							break;
						};

						case 'download': {
							Renderer.send('download', S.Common.imageUrl(coverId, 0), { saveAs: true });
							break;
						};

						case 'remove': {
							U.Object.setCover(rootId, I.CoverType.None, '');
							analytics.event('RemoveCover');
							break;
						};
					};
				},
			},
		});
	};

	const onChange = (element: any) => {
		S.Menu.open('blockCover', {
			classNameWrap: 'fromBlock',
			element,
			horizontal: I.MenuDirection.Center,
			onOpen: () => {
				window.clearTimeout(timeout.current);
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

	const getAllowedButtons = (): { allowedIcon: boolean, allowedLayout: boolean, allowedCover: boolean, allowedDescription: boolean, allowedPrefillName: boolean } => {
		let allowedLayout = false;
		let allowedIcon = false;
		let allowedCover = false;
		let allowedDescription = false;
		let allowedPrefillName = false;

		if (!root) {
			return { allowedIcon, allowedLayout, allowedCover, allowedDescription, allowedPrefillName };
		};

		const allowedDetails = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);

		allowedLayout = allowedDetails && !isChat && !isType;
		allowedIcon = allowedDetails && !isTask && !isNote && !isBookmark && !isType;
		allowedCover = allowedDetails && !isNote && !isType;
		allowedDescription = allowedDetails && !isNote;
		allowedPrefillName = allowedDetails && isTemplate;

		if (isInSets && !hasConflict) {
			allowedLayout = false;
		};

		if (root.isLocked() || readonly) {
			allowedIcon = false;
			allowedLayout = false;
			allowedCover = false;
			allowedDescription = false;
			allowedPrefillName = false;
		};

		return { allowedIcon, allowedLayout, allowedCover, allowedDescription, allowedPrefillName };
	};

	const resize = () => {
		const { ww } = U.Dom.getWindowDimensions();
		U.Dom.toggleClass(nodeRef.current, 'small', ww <= 900);
	};

	const { allowedIcon, allowedLayout, allowedCover, allowedDescription, allowedPrefillName } = getAllowedButtons();

	useEffect(() => {
		if (allowedDescription) {
			Onboarding.start('objectDescriptionButton', keyboard.isPopup());
		};

		rebind();

		return () => {
			unbind();
		};
	}, []);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
	}));

	return root ? (
		<div 
			ref={nodeRef}
			className="controlButtons"
		>
			{allowedIcon ? (
				<div id="button-icon" className="btn white withIcon" onClick={onIconHandler}>
					<Icon name="control/editor/icon" />
					<div className="txt">{translate(`editorControlIcon${Number(check.withIcon)}`)}</div>
				</div>
			) : ''}

			{allowedCover ? (
				<div id="button-cover" className="btn white withIcon" onClick={onCoverHandler}>
					<Icon name="control/editor/cover" />
					<div className="txt">{translate(`editorControlCover${Number(check.withCover)}`)}</div>
				</div>
			) : ''}

			{allowedDescription ? (
				<div id="button-description" className="btn white withIcon" onClick={onDescriptionHandler}>
					<Icon name="control/editor/description" />
					<div className="txt">{translate(`editorControlDescription${Number(hasDescription)}`)}</div>
				</div>
			) : ''}

			{allowedPrefillName ? (
				<div id="button-prefill-name" className="btn white withIcon" onClick={onPrefillNameHandler}>
					<Icon name="control/editor/preFillName" />
					<div className="txt">{translate(`editorControlPrefillName${prefillType}`)}</div>
				</div>
			) : ''}

			{allowedLayout ? (
				<div id="button-layout" className="btn white withIcon small" onClick={onLayoutHandler}>
					<Icon name="control/editor/layout" />
					{hasConflict ? <div className="dot" /> : ''}
				</div>
			) : ''}
		</div>
	) : null;

});

export default ControlButtons;