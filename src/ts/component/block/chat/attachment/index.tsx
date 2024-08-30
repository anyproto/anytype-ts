import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName, ObjectDescription } from 'Component';
import { I, U, S, J } from 'Lib';

interface Props {
	object: any;
	onRemove: (id: string) => void;
};

interface State {
	src: string;
};

const ChatAttachment = observer(class ChatAttachment extends React.Component<Props, State> {

	node = null;
	state = {
		src: '',
	};

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

		let { src } = this.state;

		if (!src) {
			if (object.isTmp && object.file) {
				U.File.loadPreviewBase64(object.file, { type: 'jpg', quality: 99, maxWidth: J.Size.image }, (image: string) => {
					this.setState({ src: image });
				});
				src = './img/space.svg';
			} else {
				src = S.Common.imageUrl(object.id, J.Size.image);
			};
		};

		return <img id="image" className="image" src={src} onClick={this.onPreview} onDragStart={e => e.preventDefault()} />;
	};

	onPreview (e: any) {
		const { object } = this.props;
		const { src } = this.state;

		S.Popup.open('preview', { 
			data: { 
				object,
				src, 
				type: I.FileType.Image,
			},
		});
	};

	onRemove (e: any) {
		const { object, onRemove } = this.props;

		e.stopPropagation();
		onRemove(object.id);
	};

});

export default ChatAttachment;