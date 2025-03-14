import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Loader } from 'Component';
import { I, C, S, U, J, focus, keyboard } from 'Lib';
import ControlButtons from './controlButtons';

interface Props extends I.PageComponent {
	readonly?: boolean;
	resize?: () => void;
	onLayoutSelect?: (layout: I.ObjectLayout) => void;
};

interface State {
	loading: boolean;
};

const Controls = observer(class Controls extends React.Component<Props, State> {
	
	_isMounted = false;
	node: any = null;
	refButtons = null;
	state = {
		loading: false,
	};

	constructor (props: Props) {
		super(props);
		
		this.onIcon = this.onIcon.bind(this);
		this.onCoverOpen = this.onCoverOpen.bind(this);
		this.onCoverClose = this.onCoverClose.bind(this);
		this.onCoverSelect = this.onCoverSelect.bind(this);
		this.onLayout = this.onLayout.bind(this);
		
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onUploadStart = this.onUploadStart.bind(this);
		this.onUpload = this.onUpload.bind(this);
	};

	render (): any {
		const { rootId, readonly } = this.props;
		const { loading } = this.state;
		const object = S.Detail.get(rootId, rootId, J.Relation.cover);
		const cn = [ 'editorControls', 'editorControlElements' ];
		
		if ((object.coverType != I.CoverType.None) && object.coverId) {
			return null;
		};

		if (loading) {
			cn.push('active');
		};

		return (
			<div 
				ref={node => this.node = node}
				id={`editor-controls-${rootId}`}
				className={cn.join(' ')}
				onDragOver={this.onDragOver} 
				onDragLeave={this.onDragLeave} 
				onDrop={this.onDrop}
			>
				{loading ? <Loader /> : ''}
				<ControlButtons 
					ref={ref => this.refButtons = ref}
					rootId={rootId} 
					readonly={readonly}
					onIcon={this.onIcon} 
					onCoverOpen={this.onCoverOpen}
					onCoverClose={this.onCoverClose}
					onCoverSelect={this.onCoverSelect}
					onLayout={this.onLayout}
					onUploadStart={this.onUploadStart}
					onUpload={this.onUpload}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
		this.props.resize();
		this.refButtons?.forceUpdate();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onIcon (e: any) {
		const { rootId } = this.props;
		const node = $(this.node);
		const object = S.Detail.get(rootId, rootId, []);
		const cb = () => S.Menu.update('smile', { element: `#block-icon-${rootId}` });
		const isType = U.Object.isTypeLayout(object.layout);

		focus.clear(true);

		S.Menu.open('smile', { 
			element: node.find('#button-icon'),
			horizontal: I.MenuDirection.Center,
			onOpen: () => node.addClass('hover'),
			onClose: () => node.removeClass('hover'),
			data: {
				noUpload: isType,
				noGallery: isType,
				withIcons: isType,
				value: (object.iconEmoji || object.iconImage || ''),
				onSelect: (icon: string) => {
					U.Object.setIcon(rootId, icon, '', cb);
				},
				onIconSelect: (iconName: string, iconOption: number) => {
					U.Object.setTypeIcon(rootId, iconName, iconOption);
				},
				onUpload (objectId: string) {
					U.Object.setIcon(rootId, '', objectId, cb);
				},
			}
		});
	};
	
	onCoverOpen () {
		if (this._isMounted) {
			$(this.node).addClass('hover');
		};
	};

	onCoverClose () {
		if (this._isMounted) {
			$(this.node).removeClass('hover');
		};
	};

	onCoverSelect (item: any) {
		const { rootId } = this.props;

		U.Object.setCover(rootId, item.type, item.id, item.coverX, item.coverY, item.coverScale);
	};

	onLayout () {
		const { rootId, onLayoutSelect } = this.props;
		const node = $(this.node);
		
		S.Menu.open('blockLayout', { 
			element: '.editorControls #button-layout',
			onOpen: () => node.addClass('hover'),
			onClose: () => node.removeClass('hover'),
			subIds: J.Menu.layout,
			data: {
				rootId,
				onLayoutSelect,
			}
		});
	};

	onDragOver (e: any) {
		if (!this._isMounted || !U.File.checkDropFiles(e)) {
			return;
		};

		const node = $(this.node);
		node.addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		if (!this._isMounted || !U.File.checkDropFiles(e)) {
			return;
		};
		
		const node = $(this.node);
		node.removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		if (!this._isMounted || !U.File.checkDropFiles(e)) {
			return;
		};
		
		const electron = U.Common.getElectron();
		const file = electron.webFilePath(e.dataTransfer.files[0]);
		const node = $(this.node);
		
		node.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);
		this.onUploadStart();
		
		C.FileUpload(S.Common.space, '', file, I.FileType.Image, {}, (message: any) => {
			this.setState({ loading: false });
			keyboard.disableCommonDrop(false);
			
			if (!message.error.code) {
				this.onUpload(I.CoverType.Upload, message.objectId);
			};
		});
	};

	onUploadStart () {
		this.setState({ loading: true });
	};
	
	onUpload (type: I.CoverType, objectId: string) {
		U.Object.setCover(this.props.rootId, type, objectId, 0, -0.25, 0, () => this.setState({ loading: false }));
	};

});

export default Controls;
