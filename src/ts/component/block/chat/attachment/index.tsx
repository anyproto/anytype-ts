import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, ObjectDescription } from 'Component';
import { I, U, S, J } from 'Lib';

interface Props {
	object: any;
	onRemove: () => void;
};

const ChatAttachment = observer(class ChatAttachment extends React.Component<Props> {

	node = null;
	src = '';

	constructor (props: Props) {
		super(props);

		this.onPreview = this.onPreview.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};

	render () {
		const { object } = this.props;
		const mime = String(object.mime || '');
		const cn = [ 'attachment' ];

		let content = null;

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

		return (
			<div className="clickable" onClick={() => U.Object.openPopup(object)}>
				<IconObject object={object} size={48} />

				<div className="info">
					<ObjectName object={object} />
					<ObjectDescription object={object} />
				</div>
			</div>
		);
	};

	renderImage () {
		const { object } = this.props;

		if (object.isTmp && object.file) {
			U.File.loadPreviewBase64(object.file, { type: 'jpg', quality: 99, maxWidth: J.Size.image }, (image: string) => {
				const node = $(this.node);
				const obj = node.find('#image');

				this.src = image;
				obj.attr({ src: image });
			});
			this.src = './img/space.svg';
		} else {
			this.src = S.Common.imageUrl(object.id, J.Size.image);
		};

		return <img id="image" className="image" src={this.src} onClick={this.onPreview} onDragStart={e => e.preventDefault()} />;
	};

	onPreview (e: any) {
		const { object } = this.props;

		S.Popup.open('preview', { 
			data: { 
				object,
				src: this.src, 
				type: I.FileType.Image,
			},
		});
	};

	onRemove (e: any) {
		e.stopPropagation();
		this.props.onRemove();
	};

});

export default ChatAttachment;