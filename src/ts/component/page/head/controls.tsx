import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Loader } from 'Component';
import { I, C, focus, ObjectUtil, Util, Action } from 'Lib';
import { menuStore, blockStore, detailStore } from 'Store';
import ControlButtons  from './controlButtons';
import Constant from 'json/constant.json';

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
	state = {
		loading: false,
	};

	constructor (props: Props) {
		super(props);
		
		this.onIcon = this.onIcon.bind(this);
		this.onCoverOpen = this.onCoverOpen.bind(this);
		this.onCoverClose = this.onCoverClose.bind(this);
		this.onCoverSelect = this.onCoverSelect.bind(this)
		this.onLayout = this.onLayout.bind(this);
		this.onRelation = this.onRelation.bind(this);
		
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
				className={cn.join(' ')}
				onDragOver={this.onDragOver} 
				onDragLeave={this.onDragLeave} 
				onDrop={this.onDrop}
			>
				{loading ? <Loader /> : ''}
				<ControlButtons 
					rootId={rootId} 
					readonly={readonly}
					onIcon={this.onIcon} 
					onCoverOpen={this.onCoverOpen}
					onCoverClose={this.onCoverClose}
					onCoverSelect={this.onCoverSelect}
					onLayout={this.onLayout}
					onRelation={this.onRelation}
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
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onIcon (e: any) {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		
		focus.clear(true);
		root.isObjectHuman() ? this.onIconUser() : this.onIconPage();
	};
	
	onIconPage () {
		const { rootId } = this.props;
		const node = $(this.node);
		const object = detailStore.get(rootId, rootId, []);
		const { iconEmoji, iconImage } = object;

		menuStore.open('smile', { 
			element: '.editorControls #button-icon',
			onOpen: () => {
				node.addClass('hover');
			},
			onClose: () => {
				node.removeClass('hover');
			},
			data: {
				noRemove: !(iconEmoji || iconImage),
				onSelect: (icon: string) => {
					ObjectUtil.setIcon(rootId, icon, '', () => {
						menuStore.update('smile', { element: `#block-icon-${rootId}` });
					});
				},
				onUpload (hash: string) {
					ObjectUtil.setIcon(rootId, '', hash, () => {
						menuStore.update('smile', { element: `#block-icon-${rootId}` });
					});
				},
			}
		});
	};
	
	onIconUser () {
		const { rootId } = this.props;

		Action.openFile(Constant.extension.cover, paths => {
			C.FileUpload('', paths[0], I.FileType.Image, (message: any) => {
				if (message.hash) {
					ObjectUtil.setIcon(rootId, '', message.hash);
				};
			});
		});
	};
	
	onCoverOpen () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		node.addClass('hover');
	};

	onCoverClose () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(this.node);
		node.removeClass('hover');
	};

	onCoverSelect (item: any) {
		const { rootId } = this.props;

		ObjectUtil.setCover(rootId, item.type, item.id, item.coverX, item.coverY, item.coverScale);
	};

	onLayout (e: any) {
		const { rootId, onLayoutSelect } = this.props;
		const node = $(this.node);
		const object = detailStore.get(rootId, rootId, []);
		
		menuStore.open('blockLayout', { 
			element: '.editorControls #button-layout',
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

	onRelation (e: any) {
		const { isPopup, rootId, readonly } = this.props;
		const node = $(this.node);
		const cnw = [ 'fixed' ];

		if (!isPopup) {
			cnw.push('fromHeader');
		};

		const param: any = {
			recalcRect: () => {
				const container = Util.getScrollContainer(isPopup);
				const rect = { x: container.width() / 2 , y: Util.sizeHeader() + container.scrollTop(), width: 1, height: 1 };

				if (isPopup) {
					const offset = container.offset();
					rect.x += offset.left;
					rect.y += offset.top;
				};
				return rect;
			},
			noFlipX: true,
			noFlipY: true,
			subIds: Constant.menuIds.cell,
			classNameWrap: cnw.join(' '),
			onOpen: () => {
				node.addClass('hover');
			},
			onClose: () => {
				node.removeClass('hover');
				menuStore.closeAll();
			},
			data: {
				isPopup,
				rootId,
				readonly,
			},
		};

		menuStore.closeAll(null, () => { menuStore.open('blockRelationView', param); });
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
		
		const { rootId, dataset } = this.props;
		const { preventCommonDrop } = dataset || {};
		const file = e.dataTransfer.files[0].path;
		const node = $(this.node);
		
		node.removeClass('isDraggingOver');
		preventCommonDrop(true);
		this.onUploadStart();
		
		C.FileUpload('', file, I.FileType.Image, (message: any) => {
			this.setState({ loading: false });
			preventCommonDrop(false);
			
			if (!message.error.code) {
				this.onUpload(I.CoverType.Upload, message.hash);
			};
		});
	};

	onUploadStart () {
		this.setState({ loading: true });
	};
	
	onUpload (type: I.CoverType, hash: string) {
		const { rootId } = this.props;

		ObjectUtil.setCover(rootId, type, hash, 0, -0.25, 0, () => {
			this.setState({ loading: false });
		});
	};


});

export default Controls;