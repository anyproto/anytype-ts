import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Loader } from 'Component';
import { I, C, focus, UtilObject, Action } from 'Lib';
import { menuStore, blockStore, detailStore, commonStore } from 'Store';
import ControlButtons from './controlButtons';
const Constant = require('json/constant.json');

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
		const object = detailStore.get(rootId, rootId, Constant.coverRelationKeys);
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
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return;
		};
		
		focus.clear(true);
		root.isObjectHuman() || root.isObjectParticipant() ? this.onIconUser() : this.onIconPage();
	};
	
	onIconPage () {
		const { rootId } = this.props;
		const node = $(this.node);
		const object = detailStore.get(rootId, rootId, []);
		const { iconEmoji, iconImage, layout } = object;
		const noUpload = layout == I.ObjectLayout.Type;

		menuStore.open('smile', { 
			element: '.editorControls #button-icon',
			horizontal: I.MenuDirection.Center,
			onOpen: () => {
				node.addClass('hover');
			},
			onClose: () => {
				node.removeClass('hover');
			},
			data: {
				noUpload,
				noRemove: !(iconEmoji || iconImage),
				onSelect: (icon: string) => {
					UtilObject.setIcon(rootId, icon, '', () => {
						menuStore.update('smile', { element: `#block-icon-${rootId}` });
					});
				},
				onUpload (objectId: string) {
					UtilObject.setIcon(rootId, '', objectId, () => {
						menuStore.update('smile', { element: `#block-icon-${rootId}` });
					});
				},
			}
		});
	};
	
	onIconUser () {
		const { rootId } = this.props;

		Action.openFile(Constant.fileExtension.cover, paths => {
			C.FileUpload(commonStore.space, '', paths[0], I.FileType.Image, {}, (message: any) => {
				if (message.objectId) {
					UtilObject.setIcon(rootId, '', message.objectId);
				};
			});
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

		UtilObject.setCover(rootId, item.type, item.id, item.coverX, item.coverY, item.coverScale);
	};

	onLayout (e: any) {
		const { rootId, onLayoutSelect } = this.props;
		const node = $(this.node);
		const object = detailStore.get(rootId, rootId, []);
		
		menuStore.open('blockLayout', { 
			element: '.editorControls #button-layout',
			horizontal: I.MenuDirection.Center,
			onOpen: () => {
				node.addClass('hover');
			},
			onClose: () => {
				node.removeClass('hover');
			},
			subIds: Constant.menuIds.layout,
			data: {
				rootId,
				value: object.layout,
				onLayoutSelect,
			}
		});
	};

	onDragOver (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};

		const node = $(this.node);
		node.addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const node = $(this.node);
		node.removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const { dataset } = this.props;
		const { preventCommonDrop } = dataset || {};
		const file = e.dataTransfer.files[0].path;
		const node = $(this.node);
		
		node.removeClass('isDraggingOver');
		preventCommonDrop(true);
		this.onUploadStart();
		
		C.FileUpload(commonStore.space, '', file, I.FileType.Image, {}, (message: any) => {
			this.setState({ loading: false });
			preventCommonDrop(false);
			
			if (!message.error.code) {
				this.onUpload(I.CoverType.Upload, message.objectId);
			};
		});
	};

	onUploadStart () {
		this.setState({ loading: true });
	};
	
	onUpload (type: I.CoverType, objectId: string) {
		UtilObject.setCover(this.props.rootId, type, objectId, 0, -0.25, 0, () => this.setState({ loading: false }));
	};

});

export default Controls;