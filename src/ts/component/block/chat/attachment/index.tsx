import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, ObjectDescription, ObjectType, MediaVideo, MediaAudio } from 'Component';
import { I, U, S, J } from 'Lib';

interface Props {
	object: any;
	showAsFile?: boolean;
	onRemove: (id: string) => void;
	onPreview?: (data: any) => void;
};

const ChatAttachment = observer(class ChatAttachment extends React.Component<Props> {

	node = null;
	src = '';
	previewItem: any = null;

	constructor (props: Props) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onPreview = this.onPreview.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.getPreviewItem = this.getPreviewItem.bind(this);
	};

	render () {
		const { object, showAsFile } = this.props;
		const mime = String(object.mime || '');
		const cn = [ 'attachment' ];

		let content = null;

		if (U.Object.isInFileLayouts(object.layout)) {
			cn.push('isFile');
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
				content = this.renderBookmark();
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
				<IconObject object={object} size={48} iconSize={iconSize} />

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
		const cn = [ 'inner', 'isVertical' ];

		if (picture) {
			cn.push('withImage');
		};

		return (
			<div
				className={cn.join(' ')}
				onClick={this.onOpen}
				{...U.Common.dataProps({ href: source })}
			>
				<div className="side left">
					<div className="link">
						<IconObject object={object} size={14} />
						{U.Common.shortUrl(source)}
					</div>
					<ObjectName object={object} />
					<ObjectDescription object={object} />
				</div>
				<div className="side right">
					{picture ? <img src={S.Common.imageUrl(picture, 500)} className="img" /> : ''}
				</div>
			</div>
		);
	};

	renderImage () {
		const { object } = this.props;

		this.previewItem = { type: I.FileType.Image, object };

		if (!this.src) {
			if (object.isTmp && object.file) {
				U.File.loadPreviewBase64(object.file, { type: 'jpg', quality: 99, maxWidth: J.Size.image }, (image: string, param: any) => {
					this.src = image;
					this.previewItem.src = image;
					$(this.node).find('#image').attr({ 'src': image });
				});
				this.src = './img/space.svg';
			} else {
				this.src = S.Common.imageUrl(object.id, J.Size.image);
			};
		};

		this.previewItem.src = this.src;

		return (
			<img 
				id="image" 
				className="image" 
				src={this.src}
				onClick={this.onPreview}
				onDragStart={e => e.preventDefault()} 
			/>
		);
	};

	renderVideo () {
		const { object } = this.props;
		const src = S.Common.fileUrl(object.id);

		this.previewItem = { type: I.FileType.Video, src, object };

		return (
			<MediaVideo 
				src={src} 
				onClick={this.onPreview}
				canPlay={false} 
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
		const { object } = this.props;

		if (!object.isTmp) {
			U.Object.openPopup(object);
		};
	};

	onPreview () {
		const { onPreview } = this.props;

		if (!this.previewItem) {
			return;
		};

		if (onPreview) {
			onPreview(this.previewItem);
		} else {
			S.Popup.open('preview', { data: { gallery: [ this.previewItem ] } });
		};
	};

	onRemove (e: any) {
		const { object, onRemove } = this.props;

		e.stopPropagation();
		onRemove(object.id);
	};

	getPreviewItem () {
		return this.previewItem;
	};

});

export default ChatAttachment;
