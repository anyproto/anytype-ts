import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, M, C, UtilData, UtilObject, UtilCommon, analytics, keyboard } from 'Lib';
import { Block, Drag } from 'Component';
import { blockStore, detailStore } from 'Store';

interface Props extends I.BlockComponent {
	setLayoutWidth?(v: number): void;
};

const PageHeadEditor = observer(class PageHeadEditor extends React.Component<Props> {
	
	node: any = null;
	refDrag: any = null;

	constructor (props: Props) {
		super(props);

		this.setPercent = this.setPercent.bind(this);
		this.onScaleStart = this.onScaleStart.bind(this);
		this.onScaleMove = this.onScaleMove.bind(this);
		this.onScaleEnd = this.onScaleEnd.bind(this);
	};

	render (): any {
		const { rootId, onKeyDown, onKeyUp, onMenuAdd, onPaste, readonly } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const check = UtilData.checkDetails(rootId);
		const object = detailStore.get(rootId, rootId, [ 'layoutAlign' ], true);
		const header = blockStore.getLeaf(rootId, 'header') || {};
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });
		const icon: any = new M.Block({ id: rootId + '-icon', type: I.BlockType.IconPage, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });

		if (root.isObjectHuman() || root.isObjectParticipant()) {
			icon.type = I.BlockType.IconUser;
		};

		return (
			<div ref={node => this.node = node}>
				<div id="editorSize" className="dragWrap">
					<Drag 
						ref={ref => this.refDrag = ref} 
						value={root.fields.width}
						snaps={[ 0.25, 0.5, 0.75 ]}
						onStart={this.onScaleStart} 
						onMove={this.onScaleMove} 
						onEnd={this.onScaleEnd} 
					/>
					<div id="dragValue" className="number">100%</div>
				</div>

				{check.withCover ? <Block {...this.props} key={cover.id} block={cover} className="noPlus" /> : ''}
				{check.withIcon ? <Block {...this.props} key={icon.id} block={icon} className="noPlus" /> : ''}

				<Block 
					key={header.id} 
					{...this.props}
					readonly={readonly}
					index={0}
					block={header}
					onKeyDown={onKeyDown}
					onKeyUp={onKeyUp}  
					onMenuAdd={onMenuAdd}
					onPaste={onPaste}
					onMouseEnter={() => { $(`#editor-controls-${rootId}`).addClass('hover'); }}
					onMouseLeave={() => { $(`#editor-controls-${rootId}`).removeClass('hover'); }}
				/>
			</div>
		);
	};

	componentDidMount () {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		this.init();

		if (root && this.refDrag) {
			this.refDrag.setValue(root.fields.width);
		};
	};

	componentDidUpdate () {
		this.init();
	};

	init () {
		const { rootId, isPopup } = this.props;
		const check = UtilData.checkDetails(rootId);

		$('#editorWrapper').attr({ class: [ 'editorWrapper', check.className ].join(' ') });
		UtilCommon.triggerResizeEditor(isPopup);
	};

	onScaleStart (e: any, v: number) {
		keyboard.disableSelection(true);
		this.setPercent(v);
	};
	
	onScaleMove (e: any, v: number) {
		this.props.setLayoutWidth(v);
		this.setPercent(v);
	};
	
	onScaleEnd (e: any, v: number) {
		const { rootId } = this.props;

		keyboard.disableSelection(false);
		this.setPercent(v);

		C.BlockListSetFields(rootId, [
			{ blockId: rootId, fields: { width: v } },
		], () => {
			$('.resizable').trigger('resizeInit');
		});
	};

	setPercent (v: number) {
		const node = $(this.node);
		const value = node.find('#dragValue');

		value.text(Math.ceil(v * 100) + '%');
	};

});

export default PageHeadEditor;