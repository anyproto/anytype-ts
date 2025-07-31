import React, { useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, ObjectDescription, ObjectType, MediaVideo, MediaAudio, Loader } from 'Component';
import { I, U, S, J, Action, analytics, keyboard, translate, Renderer } from 'Lib';

interface Props {
	object: any;
	showAsFile?: boolean;
	bookmarkAsDefault?: boolean;
	subId?: string;
	scrollToBottom?: () => void;
	onRemove: (id: string) => void;
	onPreview?: (data: any) => void;
}

const ChatAttachment = observer((props: Props) => {
	const nodeRef = useRef<HTMLDivElement>(null);
	const [ src, setSrc ] = useState('');
	const previewItemRef = useRef<any>(null);

	const onOpen = () => {
		const { object } = props;

		switch (object.layout) {
			case I.ObjectLayout.Bookmark: {
				onOpenBookmark();
				break;
			}

			case I.ObjectLayout.Video:
			case I.ObjectLayout.Image: {
				onPreview();
				break;
			}

			case I.ObjectLayout.File:
			case I.ObjectLayout.Pdf:
			case I.ObjectLayout.Audio: {
				Action.openFile(object.id, analytics.route.chat);
				break;
			}

			default: {
				if (!object.isTmp) {
					U.Object.openPopup(object);
				}
				break;
			}
		}
	};

	const onContextMenu = (e: any) => {
		e.stopPropagation();

		const { object, subId } = props;
		
		if (object.isTmp) {
			return;
		}

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
		Action.openUrl(props.object.source);
	};

	const onPreview = () => {
		const { onPreview } = props;
		const item = getPreviewItem();

		if (onPreview) {
			onPreview(item);
		} else {
			S.Popup.open('preview', { data: { gallery: [ item ] } });
		}
	};

	const onRemove = (e: any) => {
		const { object, onRemove } = props;

		e.stopPropagation();
		onRemove(object.id);
	};

	const onSyncStatusClick = (e: any) => {
		const { object } = props;
		const { syncError } = object;

		if (syncError == I.SyncStatusError.None) {
			return;
		}

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
		}

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
					}
					if (syncError == I.SyncStatusError.Oversized) {
						// delete?
					}
				}
			}
		});
	};

	const getPreviewItem = () => {
		const { object } = props;
		const ret: any = { object };

		switch (object.layout) {
			case I.ObjectLayout.Image: {
				ret.type = I.FileType.Image;
				ret.src = src || S.Common.imageUrl(object.id, I.ImageSize.Large);
				break;
			}

			case I.ObjectLayout.Video: {
				ret.type = I.FileType.Video;
				ret.src = S.Common.fileUrl(object.id);
				break;
			}
		}
		return ret;
	};

	const renderDefault = () => {
		const { object } = props;
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
		}

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
		const { object } = props;
		const { picture, source } = object;
		const cn = [ 'inner' ];

		if (picture) {
			cn.push('withImage');
		}

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
						<img src={S.Common.imageUrl(picture, I.ImageSize.Medium)} className="img" />
					</div>
				) : ''}
			</div>
		);
	};

	const renderImage = () => {
		const { object, scrollToBottom } = props;

		if (!src) {
			if (object.isTmp && object.file) {
				U.File.loadPreviewBase64(object.file, { type: 'jpg', quality: 99, maxWidth: I.ImageSize.Large }, (image: string) => {
					setSrc(image);
					$(nodeRef.current).find('#image').attr({ 'src': image });
				});
				setSrc('./img/space.svg');
			} else {
				setSrc(S.Common.imageUrl(object.id, I.ImageSize.Large));
			}
		}

		return (
			<div className="imgWrapper" onClick={onPreview}>
				<img
					id="image"
					className="image"
					src={src}
					onLoad={scrollToBottom}
					onDragStart={e => e.preventDefault()}
					style={{ aspectRatio: `${object.widthInPixels} / ${object.heightInPixels}` }}
				/>

				<Icon onClick={onSyncStatusClick} className="syncStatus" />
			</div>
		);
	};

	const renderVideo = () => {
		const { object } = props;
		const src = S.Common.fileUrl(object.id);

		return (
			<MediaVideo 
				src={src} 
				onClick={onPreview}
				canPlay={false}
				onSyncStatusClick={onSyncStatusClick}
			/>
		);
	};

	const renderAudio = () => {
		const { object } = props;
		const playlist = [ 
			{ name: U.File.name(object), src: S.Common.fileUrl(object.id) },
		];

		return <MediaAudio playlist={playlist} />;
	};

	const { object, showAsFile, bookmarkAsDefault } = props;
	const syncStatus = Number(object.syncStatus) || I.SyncStatusObject.Synced;
	const mime = String(object.mime || '');
	const cn = [ 'attachment', `is${I.SyncStatusObject[syncStatus]}` ];

	let content = null;

	if (U.Object.isInFileLayouts(object.layout)) {
		cn.push('isFile');
	}

	switch (object.layout) {
		case I.ObjectLayout.File: {
			if (showAsFile) {
				break;
			}

			if (mime && object.file) {
				const [ t1, t2 ] = mime.split('/');

				switch (t1) {
					case 'image': {
						if (!J.Constant.fileExtension.image.includes(t2)) {
							break;
						}

						cn.push('isImage');
						content = renderImage();
						break;
					}
				}
			}
			break;
		}

		case I.ObjectLayout.Image:
			if (showAsFile) {
				break;
			}

			cn.push('isImage');
			content = renderImage();
			break;

		case I.ObjectLayout.Video: {
			if (showAsFile) {
				break;
			}

			cn.push('isVideo');
			content = renderVideo();
			break;
		}

		case I.ObjectLayout.Audio: {
			cn.push('isAudio');
			content = renderAudio();
			break;
		}

		case I.ObjectLayout.Bookmark: {
			cn.push('isBookmark');
			content = bookmarkAsDefault ? renderDefault() : renderBookmark();
			break;
		}
	}

	if (!content) {
		content = renderDefault();
	}

	if (cn.length == 1) {
		cn.push(U.Data.layoutClass(object.id, object.layout));
	}

	return (
		<div 
			ref={nodeRef}
			className={cn.join(' ')}
			onContextMenu={onContextMenu}
		>
			{content}
			<Icon className="remove" onClick={onRemove} />
		</div>
	);
});

export default ChatAttachment;
