import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, ObjectDescription, ObjectType, MediaVideo, MediaAudio, Loader } from 'Component';
import { I, U, S, J, Action } from 'Lib';

interface Props {
	object: any;
	showAsFile?: boolean;
	bookmarkAsDefault?: boolean;
	scrollToBottom?: () => void;
	onRemove: (id: string) => void;
	onPreview?: (data: any) => void;
};

interface State {
	isLoaded: boolean;	
};

const ChatAttachment = observer(class ChatAttachment extends React.Component<Props, State> {

	node = null;
	src = '';
	previewItem: any = null;
	state = {
		isLoaded: false,
	};

	constructor (props: Props) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onOpenBookmark = this.onOpenBookmark.bind(this);
		this.onPreview = this.onPreview.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.getPreviewItem = this.getPreviewItem.bind(this);
	};

	render () {
		const { object, showAsFile, bookmarkAsDefault } = this.props;
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
				onClick={this.onOpenBookmark}
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
		const { object, scrollToBottom } = this.props;
		const { isLoaded } = this.state;

		if (!this.src) {
			if (object.isTmp && object.file) {
				U.File.loadPreviewBase64(object.file, { type: 'jpg', quality: 99, maxWidth: J.Size.image }, (image: string) => {
					this.src = image;
					$(this.node).find('#image').attr({ 'src': image });
				});
				this.src = './img/space.svg';
			} else {
				this.src = S.Common.imageUrl(object.id, J.Size.image);
			};
		};

		if (!isLoaded) {
			const img = new Image();
			img.onload = () => this.setState({ isLoaded: true });
			img.src = this.src;
		};

		return isLoaded ? (
			<img 
				id="image" 
				className="image" 
				src={this.src}
				onClick={this.onPreview}
				onLoad={scrollToBottom}
				onDragStart={e => e.preventDefault()} 
				style={{ aspectRatio: `${object.widthInPixels} / ${object.heightInPixels}` }}
			/>
		) : <Loader />;
	};

	renderVideo () {
		const { object } = this.props;
		const src = S.Common.fileUrl(object.id);

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

	componentDidUpdate (prevProps: Readonly<Props>, prevState: Readonly<State>): void {
		const { scrollToBottom } = this.props;

		if (!prevState.isLoaded && this.state.isLoaded && scrollToBottom) {
			scrollToBottom();
		};
	};

	onOpen () {
		const { object } = this.props;

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

			default: {
				if (!object.isTmp) {
					U.Object.openPopup(object);
				};
				break;
			};
		};
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

	getPreviewItem () {
		const { object } = this.props;
		const ret: any = { object };

		switch (object.layout) {
			case I.ObjectLayout.Image: {
				ret.type = I.FileType.Image;
				ret.src = this.src || S.Common.imageUrl(object.id, J.Size.image);
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
