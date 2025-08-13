import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, ObjectDescription, ObjectType, MediaVideo, MediaAudio } from 'Component';
import { I, U, S, J, Action, analytics, keyboard, translate, Renderer } from 'Lib';

interface Props {
	object: any;
	showAsFile?: boolean;
	bookmarkAsDefault?: boolean;
	isDownload?: boolean;
	subId?: string;
	isPopup?: boolean;
	scrollToBottom?: () => void;
	onRemove: (id: string) => void;
	onPreview?: (data: any) => void;
	updateAttachments?: () => void;
};

interface RefProps {
	getPreviewItem: () => any;
};

const ChatAttachment = observer(forwardRef<RefProps, Props>((props, ref) => {

	const { object, subId, showAsFile, bookmarkAsDefault, isDownload, scrollToBottom, onPreview, updateAttachments, onRemove } = props;
	const syncStatus = Number(object.syncStatus) || I.SyncStatusObject.Synced;
	const mime = String(object.mime || '');
	const cn = [ 'attachment', `is${I.SyncStatusObject[syncStatus]}` ];
	const nodeRef = useRef(null);
	const src = useRef('');

	const renderDefault = () => {
		const isFile = U.Object.isInFileLayouts(object.layout);
		const type = S.Record.getTypeById(object.type);

		let iconSize = null;
		let description = null;

		if (isFile) {
			iconSize = 48;
			description = (
				<div className="descr">
					<div><ObjectType object={type} /></div>
					<div className="bullet" />
					<div>{U.File.size(object.sizeInBytes)}</div>
				</div>
			);
		} else {
			description = <ObjectDescription object={object} />;
		};

		return (
			<div className="clickable" onClick={onOpen}>
				<div className="iconWrapper">
					<IconObject object={object} size={48} iconSize={iconSize} />
					<Icon onClick={onSyncStatusClick} className="syncStatus" />
				</div>

				<div className="info">
					<ObjectName object={object} />
					{description}
				</div>
			</div>
		);
	};

	const renderBookmark = () => {
		const { picture, source } = object;
		const cn = [ 'inner' ];

		if (picture) {
			cn.push('withImage');
		};

		return (
			<div
				className={cn.join(' ')}
				onClick={onOpenBookmark}
				{...U.Common.dataProps({ href: source })}
			>
				<div className="side left">
					<div className="link">
						<IconObject object={object} size={14} />
						<div className="source">{U.Common.shortUrl(source)}</div>
					</div>
					<ObjectName object={object} />
					<ObjectDescription object={object} />
				</div>

				{picture ? (
					<div className="side right">
						<img 
							src={S.Common.imageUrl(picture, I.ImageSize.Medium)} 
							className="img" 
							onLoad={scrollToBottom}
						/>
					</div>
				) : ''}
			</div>
		);
	};

	const renderImage = (withBlur?: boolean) => {
		const { object, scrollToBottom } = props;
		const node = $(nodeRef.current);

		if (!src.current) {
			if (object.isTmp && object.file) {
				U.File.loadPreviewBase64(object.file, { type: 'jpg', quality: 99, maxWidth: I.ImageSize.Large }, (image: string) => {
					src.current = image;

					node.find('#image').attr({ src: image });
					node.find('#blur').attr({ backgroundImage: `url(${image})` });
				});

				src.current = './img/space.svg';
			} else {
				src.current = S.Common.imageUrl(object.id, I.ImageSize.Large);
			};
		};

		const blur = withBlur ? <div id="blur" className="blur" style={{ backgroundImage: `url(${src.current})` }} /> : null;

		return (
			<div className="imgWrapper" onClick={onPreviewHandler}>
				{blur}
				<img
					id="image"
					className="image"
					src={src.current}
					onLoad={scrollToBottom}
					onDragStart={e => e.preventDefault()}
					style={{ aspectRatio: `${object.widthInPixels} / ${object.heightInPixels}` }}
				/>

				<Icon onClick={onSyncStatusClick} className="syncStatus" />
			</div>
		);
	};

	const renderVideo = () => {
		const src = S.Common.fileUrl(object.id);

		return (
			<MediaVideo 
				src={src} 
				onClick={onPreviewHandler}
				canPlay={false}
				onSyncStatusClick={onSyncStatusClick}
			/>
		);
	};

	const renderAudio = () => {
		const { object, isPopup } = props;
		const playlist = [ 
			{ name: U.File.name(object), src: S.Common.fileUrl(object.id) },
		];

		return <MediaAudio playlist={playlist} getScrollContainer={() => U.Common.getScrollContainer(isPopup)} />;
	};

	const onOpen = () => {
		const syncStatus = Number(object.syncStatus) || I.SyncStatusObject.Synced;

		if (isDownload && (syncStatus != I.SyncStatusObject.Synced)) {
			return;
		};

		switch (object.layout) {
			case I.ObjectLayout.Bookmark: {
				onOpenBookmark();
				break;
			};

			case I.ObjectLayout.Video:
			case I.ObjectLayout.Image: {
				onPreviewHandler();
				break;
			};

			case I.ObjectLayout.File:
			case I.ObjectLayout.Pdf:
			case I.ObjectLayout.Audio: {
				Action.openFile(object.id, analytics.route.chat);
				break;
			};

			default: {
				if (!object.isTmp) {
					U.Object.openPopup(object, {
						onClose: () => {
							if (updateAttachments) {
								updateAttachments();
							};
						},
					});
				};
				break;
			};
		};
	};

	const onContextMenu = (e: any) => {
		e.stopPropagation();

		if (object.isTmp || object.isDeleted) {
			return;
		};

		S.Menu.open('objectContext', {
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			data: {
				objectIds: [ object.id ],
				subId,
				allowedLinkTo: true,
				allowedOpen: true,
			}
		});
	};

	const onOpenBookmark = () => {
		Action.openUrl(object.source);
	};

	const onPreviewHandler = () => {
		const item = getPreviewItem();

		if (onPreview) {
			onPreview(item);
		} else {
			S.Popup.open('preview', { data: { gallery: [ item ] } });
		};
	};

	const onRemoveHandler = (e: any) => {
		e.stopPropagation();
		onRemove(object.id);
	};

	const onSyncStatusClick = (e: any) => {
		const { syncError } = object;

		if (syncError == I.SyncStatusError.None) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		let textConfirm = '';
		let colorConfirm = '';

		if (syncError == I.SyncStatusError.IncompatibleVersion) {
			textConfirm = translate('popupConfirmButtonUpdateApp');
			colorConfirm = 'black';
		} else {
			textConfirm = translate('popupConfirmButtonGotIt');
			colorConfirm = 'blank';
		};

		S.Popup.open('confirm', {
			data: {
				icon: 'warning',
				title: translate(`popupConfirmAttachmentSyncError${syncError}Title`),
				text: translate(`popupConfirmAttachmentSyncError${syncError}Text`),
				textConfirm,
				colorConfirm,
				canCancel: false,
				onConfirm: () => {
					if (syncError == I.SyncStatusError.IncompatibleVersion) {
						window.setTimeout(() => {
							Renderer.send('updateCheck');
						}, J.Constant.delay.popup);
					};

					if (syncError == I.SyncStatusError.Oversized) {
						// delete?
					};
				}
			}
		});
	};

	const getPreviewItem = () => {
		const ret: any = { object };

		switch (object.layout) {
			case I.ObjectLayout.Image: {
				ret.type = I.FileType.Image;
				ret.src = src.current || S.Common.imageUrl(object.id, I.ImageSize.Large);
				break;
			};

			case I.ObjectLayout.Video: {
				ret.type = I.FileType.Video;
				ret.src = S.Common.fileUrl(object.id);
				break;
			};

		};

		return ret;
	};

	let content = null;

	if (U.Object.isInFileLayouts(object.layout)) {
		cn.push('isFile');
	};

	if (isDownload) {
		cn.push('isDownload');
	};

	const imageContent = () => {
		let withBlur = false;

		cn.push('isImage');
		if ((object.widthInPixels < 360) || (object.heightInPixels > 360)) {
			withBlur = true;
			cn.push('withBlur');
		};

		return renderImage(withBlur);
	};

	switch (object.layout) {
		case I.ObjectLayout.File: {
			if (showAsFile) {
				break;
			};

			if (mime && object.file) {
				const [ t1, t2 ] = mime.split('/');

				switch (t1) {
					case 'image': {
						if (!J.Constant.fileExtension.image.includes(t2)) {
							break;
						};

						content = imageContent();
						break;
					};
				};
			};
			break;
		};

		case I.ObjectLayout.Image:
			if (showAsFile) {
				break;
			};
			
			content = imageContent();
			break;

		case I.ObjectLayout.Video: {
			if (showAsFile) {
				break;
			};

			cn.push('isVideo');
			content = renderVideo();
			break;
		};

		case I.ObjectLayout.Audio: {
			cn.push('isAudio');
			content = renderAudio();
			break;
		};

		case I.ObjectLayout.Bookmark: {
			cn.push('isBookmark');
			content = bookmarkAsDefault ? renderDefault() : renderBookmark();
			break;
		};
	};

	if (!content) {
		content = renderDefault();
	};

	if (cn.length == 1) {
		cn.push(U.Data.layoutClass(object.id, object.layout));
	};

	useImperativeHandle(ref, () => ({
		getPreviewItem,
	}));

	return (
		<div 
			ref={nodeRef}
			className={cn.join(' ')}
			onContextMenu={onContextMenu}
		>
			{content}
			<Icon className="remove" onClick={onRemoveHandler} />
		</div>
	);

}));

export default ChatAttachment;