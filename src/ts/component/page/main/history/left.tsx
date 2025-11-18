import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Header, Block, HeadSimple } from 'Component';
import { I, M, S, U, Dataview } from 'Lib';

interface Props extends I.PageComponent {
	rootId: string;
	onCopy: () => void;
	getWrapperWidth: () => number;
};

interface Ref {
	forceUpdate: () => void;
	getNode: () => any;
	getHeaderRef: () => any;
	getHeadRef: () => any;
};

const HistoryLeft = observer(forwardRef<Ref, Props>((props, ref) => {

	const { rootId, isPopup, onCopy } = props;
	const nodeRef = useRef(null);
	const headRef = useRef(null);
	const headerRef = useRef(null);
	const topRef = useRef(0);
	const [ dummy, setDummy ] = useState(0);
	const root = S.Block.getLeaf(rootId, rootId);
	const childrenIds = S.Block.getChildrenIds(rootId, rootId);
	const check = U.Data.checkDetails(rootId, rootId, [ 'layout', 'layoutAlign' ]);
	const icon = new M.Block({ id: `${rootId}-icon`, type: I.BlockType.IconPage, hAlign: check.layoutAlign, childrenIds: [], fields: {}, content: {} });
	const cover = new M.Block({ id: `${rootId}-cover`, type: I.BlockType.Cover, hAlign: check.layoutAlign, childrenIds: [], fields: {}, content: {} });
	const cn = [ 'editorWrapper', check.className ];
	const isSet = U.Object.isSetLayout(check.layout);
	const isCollection = U.Object.isCollectionLayout(check.layout);
	const isType = U.Object.isTypeLayout(check.layout);

	let head = null;
	let children = S.Block.getChildren(rootId, rootId);

	if (isSet || isCollection || isType) {
		const placeholder = Dataview.namePlaceholder(check.layout);

		head = (
			<HeadSimple 
				{...props} 
				ref={headRef} 
				placeholder={placeholder} 
				rootId={rootId} 
				readonly={true}
			/>
		);

		children = children.filter(it => it.isDataview());
		check.withIcon = false;
	} else
	if (U.Object.isInHumanLayouts(check.layout)) {
		icon.type = I.BlockType.IconUser;
	};

	const onScroll = () => {
		topRef.current = $(nodeRef.current).scrollTop();
		U.Common.getScrollContainer(isPopup).trigger('scroll');
	};

	useEffect(() => {
		S.Block.updateNumbers(rootId);
		$(nodeRef.current).scrollTop(topRef.current);
	});

	useImperativeHandle(ref, () => ({
		getNode: () => nodeRef.current,
		forceUpdate: () => setDummy(dummy + 1),
		getHeaderRef: () => headerRef.current,
		getHeadRef: () => headRef.current,
	}));

	return (
		<div ref={nodeRef} id="historySideLeft" onScroll={onScroll}>
			<Header 
				{...props} 
				ref={headerRef}
				component="mainHistory" 
				rootId={rootId}
				layout={I.ObjectLayout.History}
			/>

			<div id="editorWrapper" className={cn.join(' ')}>
				<div className="editor">
					<div className="blocks">
						<div className="editorControls" />

						{head}
						{check.withCover ? <Block {...props} rootId={rootId} key={cover.id} block={cover} readonly={true} /> : ''}
						{check.withIcon ? <Block {...props} rootId={rootId} key={icon.id} block={icon} readonly={true} /> : ''}
						
						{children.map((block: I.Block, i: number) => (
							<Block 
								key={block.id} 
								{...props}
								rootId={rootId}
								index={i}
								block={block}
								readonly={true}
								onCopy={onCopy}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
	
}));

export default HistoryLeft;