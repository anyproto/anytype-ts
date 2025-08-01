import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, ObjectDescription, ObjectType, MediaVideo, MediaAudio, Loader } from 'Component';
import { I, U, S, J, Action, analytics, keyboard, translate, Renderer } from 'Lib';

interface Props {
	object: any;
	showAsFile?: boolean;
	bookmarkAsDefault?: boolean;
	isDownload?: boolean;
	subId?: string;
	scrollToBottom?: () => void;
	onRemove: (id: string) => void;
	onPreview?: (data: any) => void;
	updateAttachments?: () => void;
};

const ChatAttachment = observer(class ChatAttachment extends React.Component<Props> {

	node = null;
	src = '';
	previewItem: any = null;

	constructor (props: Props) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
		this.onOpenBookmark = this.onOpenBookmark.bind(this);
		this.onPreview = this.onPreview.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onSyncStatusClick = this.onSyncStatusClick.bind(this);
		this.getPreviewItem = this.getPreviewItem.bind(this);
	};

	render () {
		const { object, showAsFile, bookmarkAsDefault, isDownload } = this.props;
		const syncStatus = Number(object.syncStatus) || I.SyncStatusObject.Synced;
		const mime = String(object.mime || '');
		const cn = [ 'attachment', `is${I.SyncStatusObject[syncStatus]}` ];

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

							cn.push('isImage');
							content = this.renderImage();
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

				cn.push('isImage');
				content = this.renderImage();
				break;

			case I.ObjectLayout.Video: {
				if (showAsFile) {
					break;
				};

				cn.push('isVideo');
				content = this.renderVideo();
				break;
			};

			case I.ObjectLayout.Audio: {
				cn.push('isAudio');
				content = this.renderAudio();
				break;
			};

			case I.ObjectLayout.Bookmark: {
				cn.push('isBookmark');
				content = bookmarkAsDefault ? this.renderDefault() : this.renderBookmark();
				break;
			};
		};

		if (!content) {
			content = this.renderDefault();
		};

		if (cn.length == 1) {
			cn.push(U.Data.layoutClass(object.id, object.layout));
		};

		return (
			<div 
				ref={node => this.node = node}
				className={cn.join(' ')}
				onContextMenu={this.onContextMenu}
			>
				{content}
				<Icon className="remove" onClick={this.onRemove} />
			</div>
		);
	};

	renderDefault () {
		const { object } = this.props;
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
			<div className="clickable" onClick={this.onOpen}>
				<div className="iconWrapper">
					<IconObject object={object} size={48} iconSize={iconSize} />
					<Icon onClick={this.onSyncStatusClick} className="syncStatus" />
				</div>

				<div className="info">
					<ObjectName object={object} />
					{description}
				</div>
			</div>
		);
	};

	renderBookmark () {
		const { object } = this.props;
		const { picture, source } = object;
		const cn = [ 'inner' ];

		if (picture) {
			cn.push('withImage');
		};

		return (
			<div
				className={cn.join(' ')}
				onClick={this.onOpenBookmark}
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

	renderImage () {
		const { object, scrollToBottom } = this.props;
		const status = object.syncStatus ? object.syncStatus : I.SyncStatusObject.Syncing;

		if (!this.src) {
			if (object.isTmp && object.file) {
				U.File.loadPreviewBase64(object.file, { type: 'jpg', quality: 99, maxWidth: I.ImageSize.Large }, (image: string) => {
					this.src = image;
					$(this.node).find('#image').attr({ 'src': image });
				});
				this.src = './img/space.svg';
			} else {
				this.src = S.Common.imageUrl(object.id, I.ImageSize.Large);
			};
		};

		return (
			<div className="imgWrapper" onClick={this.onPreview}>
				<img
					id="image"
					className="image"
					src={this.src}
					onLoad={scrollToBottom}
					onDragStart={e => e.preventDefault()}
					style={{ aspectRatio: `${object.widthInPixels} / ${object.heightInPixels}` }}
				/>

				<Icon onClick={this.onSyncStatusClick} className="syncStatus" />
			</div>
		);
	};

	renderVideo () {
		const { object } = this.props;
		const src = S.Common.fileUrl(object.id);

		return (
			<MediaVideo 
				src={src} 
				onClick={this.onPreview}
				canPlay={false}
				onSyncStatusClick={this.onSyncStatusClick}
			/>
		);
	};

	renderAudio () {
		const { object } = this.props;
		const playlist = [ 
			{ name: U.File.name(object), src: S.Common.fileUrl(object.id) },
		];

		return <MediaAudio playlist={playlist} />;
	};

	onOpen () {
		const { object, isDownload, updateAttachments } = this.props;
		const syncStatus = Number(object.syncStatus) || I.SyncStatusObject.Synced;

		if (isDownload && (syncStatus != I.SyncStatusObject.Synced)) {
			return;
		};

		switch (object.layout) {
			case I.ObjectLayout.Bookmark: {
				this.onOpenBookmark();
				break;
			};

			case I.ObjectLayout.Video:
			case I.ObjectLayout.Image: {
				this.onPreview();
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

	onContextMenu (e: any) {
		e.stopPropagation();

		const { object, subId } = this.props;
		
		if (object.isTmp) {
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

	onOpenBookmark () {
		Action.openUrl(this.props.object.source);
	};

	onPreview () {
		const { onPreview } = this.props;
		const item = this.getPreviewItem();

		if (onPreview) {
			onPreview(item);
		} else {
			S.Popup.open('preview', { data: { gallery: [ item ] } });
		};
	};

	onRemove (e: any) {
		const { object, onRemove } = this.props;

		e.stopPropagation();
		onRemove(object.id);
	};

	onSyncStatusClick (e: any) {
		const { object } = this.props;
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

	getPreviewItem () {
		const { object } = this.props;
		const ret: any = { object };

		switch (object.layout) {
			case I.ObjectLayout.Image: {
				ret.type = I.FileType.Image;
				ret.src = this.src || S.Common.imageUrl(object.id, I.ImageSize.Large);
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

});

export default ChatAttachment;
