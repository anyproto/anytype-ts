import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, M, C, S, U, keyboard } from 'Lib';
import { Block, DragHorizontal } from 'Component';

interface Props extends I.BlockComponent {
	setLayoutWidth?(v: number): void;
};

interface RefProps {
	getDrag: () => any;
	setPercent: (v: number) => void;
};

const PageHeadEditor = observer(forwardRef<RefProps, Props>((props, ref) => {

	const { rootId, isPopup, readonly, onKeyDown, onKeyUp, onMenuAdd, onPaste, setLayoutWidth } = props;
	const nodeRef = useRef(null);
	const dragRef = useRef(null);
	const check = U.Data.checkDetails(rootId, rootId, []);
	const header = S.Block.getLeaf(rootId, 'header');
	const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, hAlign: check.layoutAlign, childrenIds: [], fields: {}, content: {} });
	const icon: any = new M.Block({ id: rootId + '-icon', type: I.BlockType.IconPage, hAlign: check.layoutAlign, childrenIds: [], fields: {}, content: {} });

	if (U.Object.isInHumanLayouts(check.layout)) {
		icon.type = I.BlockType.IconUser;
	};

	const init = () => {
		$('#editorWrapper').attr({ class: [ 'editorWrapper', check.className ].join(' ') });
		U.Common.triggerResizeEditor(isPopup);
	};

	const onScaleStart = (e: any, v: number) => {
		keyboard.disableSelection(true);
		setPercent(v);
	};
	
	const onScaleMove = (e: any, v: number) => {
		setLayoutWidth(v);
		setPercent(v);
	};
	
	const onScaleEnd = (e: any, v: number) => {
		keyboard.disableSelection(false);
		setPercent(v);

		const root = S.Block.getLeaf(rootId, rootId);
		if (!root) {
			return;
		};

		C.BlockListSetFields(rootId, [
			{ blockId: rootId, fields: { ...root.fields, width: v } },
		], () => {
			$('.resizable').trigger('resizeInit');
		});
	};

	const setPercent = (v: number) => {
		const node = $(nodeRef.current);
		const value = node.find('#dragValue');

		value.text(Math.ceil((v + 1) * 100) + '%');
	};

	useEffect(() => {
		const root = S.Block.getLeaf(rootId, rootId);

		init();

		if (root && dragRef.current) {
			dragRef.current.setValue(root.fields.width);
		};
	}, []);

	useEffect(() => {
		init();
	});

	useImperativeHandle(ref, () => ({
		getDrag: () => dragRef.current,
		setPercent: (v: number) => setPercent(v),
	}));

	return (
		<div ref={nodeRef}>
			<div id="editorSize" className="dragWrap">
				<DragHorizontal 
					ref={dragRef} 
					value={check.layoutWidth}
					snaps={[ 0.25, 0.5, 0.75 ]}
					onStart={onScaleStart} 
					onMove={onScaleMove} 
					onEnd={onScaleEnd} 
				/>
				<div id="dragValue" className="number">100%</div>
			</div>

			{check.withCover ? <Block {...props} key={cover.id} block={cover} className="noPlus" /> : ''}
			{check.withIcon ? <Block {...props} key={icon.id} block={icon} className="noPlus" /> : ''}

			<Block 
				key={header?.id}
				{...props}
				readonly={readonly}
				index={0}
				block={header}
				blockContextParam={{ hAlign: check.layoutAlign }}
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}  
				onMenuAdd={onMenuAdd}
				onPaste={onPaste}
				onMouseEnter={() => $(`#editor-controls-${rootId}`).addClass('hover')}
				onMouseLeave={() => $(`#editor-controls-${rootId}`).removeClass('hover')}
			/>
		</div>
	);

}));

export default PageHeadEditor;