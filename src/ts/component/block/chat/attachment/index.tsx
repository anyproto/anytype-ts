import React, { forwardRef, useRef, useImperativeHandle, useState } from 'react';
import { IconObject, Icon, ObjectName, ObjectDescription, ObjectType, MediaVideo, MediaAudio, Loader } from 'Component';
import * as I from 'Interface';

interface Props {
	object: any;
	showAsFile?: boolean;
	bookmarkAsDefault?: boolean;
	isDownload?: boolean;
	withInlineSize?: boolean;
	subId?: string;
	isPopup?: boolean;
	onRemove: (id: string) => void;
	onPreview?: (data: any) => void;
	onClick?: () => void;
	updateAttachments?: () => void;
};

interface RefProps {
	getPreviewItem: () => any;
};

const ChatAttachment = forwardRef<RefProps, Props>((props, ref) => {

	const { object, showAsFile, bookmarkAsDefault, isDownload, withInlineSize = true, onPreview, onClick, updateAttachments, onRemove } = props;

	let syncStatus = Number(object.syncStatus) || I.SyncStatusObject.Synced;
	if (object.isDeleted) {
		syncStatus = I.SyncStatusObject.Synced;
	} else
	if (object.syncStatus === undefined) {
		if (object.isTmp) {
			syncStatus = I.SyncStatusObject.Queued;
		} else
		if (U.Object.isInFileLayouts(object.layout)) {
			syncStatus = I.SyncStatusObject.Syncing;
		};
	};

	const isDownloadingFile = S.Common.isDownloading(object.id);
	const mime = String(object.mime || '');
	const cn = [ 'attachment', `is${I.SyncStatusObject[syncStatus]}` ];
	const nodeRef = useRef(null);
	const syncIconName = (syncStatus != I.SyncStatusObject.Synced) ? `chat/syncStatus/${I.SyncStatusObject[syncStatus].toLowerCase()}` : '';
	const src = useRef('');
	const [ isImageLoaded, setIsImageLoaded ] = useState(false);

	if (isDownloadingFile) {
		cn.push('isDownloadingFile');
	};

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
			<div className="clickable" onClick={e => onOpen(e)}>
				<div className="iconWrapper">
					<IconObject object={object} size={48} iconSize={iconSize} />
					{isDownloadingFile || syncIconName ? (
						<Icon 
							name={syncIconName}
							className="syncStatus" 
							onClick={onSyncStatusClick} 
							size={28}
						/>
					) : ''}
				</div>

				<div className="info">
					<ObjectName object={object} withPlural={true} />
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
						<div className="source">{U.String.shortUrl(source)}</div>
					</div>
					<ObjectName object={object} withPlural={true} />
					<ObjectDescription object={object} />
				</div>

				{picture ? (
					<div className="side right">
						<img 
							src={S.Common.imageUrl(picture, I.ImageSize.Medium)} 
							className="img" 
						/>
					</div>
				) : ''}
			</div>
		);
	};

	const renderImage = () => {
		const { object } = props;
		const ratio = object.widthInPixels / object.heightInPixels;
		const withBlur = withInlineSize && (ratio != 1);

		cn.push('isImage');
		if (withBlur) {
			cn.push('withBlur');
		};

		if (!src.current) {
			if (object.isTmp && object.file) {
				U.File.loadPreviewBase64(object.file, { type: 'jpg', quality: 99, maxWidth: I.ImageSize.Large }, (image: string) => {
					const node = nodeRef.current;

					src.current = image;

					const img = U.Dom.select('#image', node) as HTMLImageElement;
					const blur = U.Dom.select('#blur', node);

					if (img) {
						img.src = image;
					};
					if (blur) {
						U.Dom.css(blur, { backgroundImage: `url(${image})` });
					};
				});

				src.current = './img/space.svg';
			} else {
				src.current = S.Common.imageUrl(object.id, I.ImageSize.Large);
			};
		};

		const blur = withBlur ? <div id="blur" className="blur" style={{ backgroundImage: `url(${src.current})` }} /> : null;
		const style: any = {};

		if (withInlineSize && object.widthInPixels && object.heightInPixels) {
			const ratio = object.widthInPixels / object.heightInPixels;

			let width = 0;
			let height = 0;

			if (object.widthInPixels >= object.heightInPixels) {
				width = Math.min(object.widthInPixels, 360);
				height = width / ratio;
			} else {
				height = Math.min(object.heightInPixels, 360);
				width = height * ratio;
			};

			width = Number(width) || 0;
			height = Number(height) || 0;

			style.width = Number(width) || 0;
			style.height = Number(height) || 0;
			style.aspectRatio = `${width}/${height}`;
		};

		return (
			<div className="mediaWrapper" onClick={onPreviewHandler}>
				{blur}
				{!isImageLoaded ? <Loader type={I.LoaderType.Loader} /> : ''}
				<img
					id="image"
					className="image"
					src={src.current}
					onDragStart={e => e.preventDefault()}
					onLoad={() => setIsImageLoaded(true)}
					style={style}
				/>

				{syncIconName ? <Icon name={syncIconName} className="syncStatus" onClick={onSyncStatusClick} /> : ''}
			</div>
		);
	};

	const renderVideo = () => {
		const src = S.Common.fileUrl(object.id);

		return (
			<div className="mediaWrapper" onClick={onPreviewHandler}>
				<MediaVideo 
					src={src} 
					onClick={onPreviewHandler}
					canPlay={false}
					onSyncStatusClick={onSyncStatusClick}
				/>
			</div>
		);
	};

	const renderAudio = () => {
		const { object, isPopup } = props;
		const playlist = [ 
			{ name: U.File.name(object), src: S.Common.fileUrl(object.id) },
		];

		return <MediaAudio playlist={playlist} getScrollContainer={() => U.Dom.getScrollContainer(isPopup)} />;
	};

	const onOpen = (e: any) => {
		if (object.isTmp) {
			return;
		};

		if (isDownload && (syncStatus != I.SyncStatusObject.Synced)) {
			return;
		};

		if (isDownloadingFile) {
			return;
		};

		onClick?.();

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
				Action.openFile(object, analytics.route.chat);
				break;
			};

			default: {
				if (!object.isTmp) {
					U.Object.openConfig(e, object, { onClose: updateAttachments });
				};
				break;
			};
		};
	};

	const onOpenBookmark = () => {
		Action.openUrl(object.source);
	};

	const onPreviewHandler = () => {
		if (object.isTmp) {
			return;
		};

		onClick?.();

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
				iconParam: { name: 'popup/header/warning', color: 'orange' },
				title: translate(`popupConfirmAttachmentSyncError${syncError}Title`),
				text: translate(`popupConfirmAttachmentSyncError${syncError}Text`),
				textConfirm,
				colorConfirm,
				canCancel: false,
				onConfirm: () => {
					if (syncError == I.SyncStatusError.IncompatibleVersion) {
						window.setTimeout(() => Renderer.send('updateCheck'), J.Constant.delay.popup);
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

						content = renderImage();
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
			
			content = renderImage();
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
			{...U.Common.dataProps({ id: object.id })}
		>
			{content}
			<Icon name="chat/buttons/remove" className="remove" size={8} onClick={onRemoveHandler} />
		</div>
	);

});

export default ChatAttachment;