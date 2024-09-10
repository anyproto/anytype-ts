import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, ObjectDescription, ObjectType } from 'Component';
import { I, U, S, J } from 'Lib';

interface Props {
	object: any;
	onRemove: (id: string) => void;
};

const ChatAttachment = observer(class ChatAttachment extends React.Component<Props> {

	node = null;
	src = '';

	constructor (props: Props) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onPreview = this.onPreview.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};

	render () {
		const { object } = this.props;
		const mime = String(object.mime || '');
		const cn = [ 'attachment' ];

		let content = null;

		if (U.Object.isInFileLayouts(object.layout)) {
			cn.push('isFile');
		};

		switch (object.layout) {
			case I.ObjectLayout.File:
				if (mime) {
					const [ t1, t2 ] = mime.split('/');

					switch (t1) {
						case 'image': {
							cn.push('isImage');
							content = this.renderImage();
							break;
						};
					};
				};
				break;

			case I.ObjectLayout.Image:
				cn.push('isImage');
				content = this.renderImage();
				break;
		};

		if (!content) {
			cn.push(U.Data.layoutClass(object.id, object.layout));
			content = this.renderDefault();
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

	renderImage () {
		const { object } = this.props;

		if (!this.src) {
			if (object.isTmp && object.file) {
				U.File.loadPreviewBase64(object.file, { type: 'jpg', quality: 99, maxWidth: J.Size.image }, (image: string, param: any) => {
					this.src = image;
					$(this.node).find('#image').attr({ 'src': image });
				});
				this.src = './img/space.svg';
			} else {
				this.src = S.Common.imageUrl(object.id, J.Size.image);
			};
		};

		return <img id="image" className="image" src={this.src} onClick={this.onPreview} onDragStart={e => e.preventDefault()} />;
	};

	onOpen () {
		const { object } = this.props;

		if (!object.isTmp) {
			U.Object.openPopup(object);
		};
	};

	onPreview (e: any) {
		const { object } = this.props;
		const data: any = {
			src: this.src, 
			type: I.FileType.Image,
		};

		if (!object.isTmp) {
			data.object = object;
		};

		S.Popup.open('preview', { data });
	};

	onRemove (e: any) {
		const { object, onRemove } = this.props;

		e.stopPropagation();
		onRemove(object.id);
	};

});

export default ChatAttachment;