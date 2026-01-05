import React, { forwardRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { I, C, S, U, translate, focus } from 'Lib';
import { Icon, Loader, Block } from 'Component';

/**
 *
 * - **Transclusion Block**: A block of type "transclusion" that references another block to display inline.
 *
 * - **Referenced Block**: The block that a transclusion points to (stored in transclusion.source.blockId).
 *
 * - **Transclusion Depth**: How many levels of nested transclusions we're currently rendering.
 *   
 * - **Depth Limit**: A fixed (at render time) allowed nesting depth (TRANSCLUSION_MAX_DEPTH).
 *   When depth >= limit, show a message instead of rendering. This trivially prevent infinite loops.
 *   With limit=0, no nested transclusions are displayed at all.
 *
 * - **Object/Root/Document**: The object (identified by rootId) that contains the blocks.
 */

const TRANSCLUSION_MAX_DEPTH = 1;

const BlockTransclusion = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {
	const { rootId, block, readonly, onKeyDown, onKeyUp } = props;
	const { source } = block.content;

	// Naming: "referenced" block = the block this transclusion points to
	const { rootId: referencedRootId, blockId: referencedBlockId } = source;

	// Track current transclusion nesting depth
	const currentDepth = props.transclusionDepth ?? 0;

	const nodeRef = React.useRef<HTMLDivElement>(null);
	const cn = [ 'focusable', `c${block.id}` ];

	const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');

	useEffect(() => {
		// Only load if we haven't exceeded depth limit
		if (currentDepth >= TRANSCLUSION_MAX_DEPTH) {
			setLoadingState('loaded'); // Show depth limit message
			return;
		}

		// Load the referenced block if needed
		if (referencedRootId && referencedBlockId) {
			const referencedDocument = S.Detail.get(referencedRootId, referencedRootId, []);
			const referencedBlock = S.Block.getLeaf(referencedRootId, referencedBlockId);

			if (referencedDocument._empty_) {
				setLoadingState('loading');
				loadReferencedDocument(referencedRootId);
			} else if (referencedBlock) {
				setLoadingState('loaded');
			} else {
				setLoadingState('error');
			}
		}
	}, [referencedRootId, referencedBlockId, currentDepth]);

	const loadReferencedDocument = (documentId: string) => {
		C.ObjectShow(documentId, '', S.Common.space, (message: any) => {
			if (message.error.code) {
				console.error('Failed to load referenced document:', message.error);
				setLoadingState('error');
			} else {
				const referencedBlock = S.Block.getLeaf(documentId, referencedBlockId);
				setLoadingState(referencedBlock ? 'loaded' : 'error');
			}
		});
	};

	const onKeyDownHandler = (e: any) => {
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, props);
		}
	};

	const onKeyUpHandler = (e: any) => {
		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, props);
		}
	};

	const onFocus = () => {
		focus.set(block.id, { from: 0, to: 0 });
	};

	// Render based on depth and loading state
	let element = null;

	if (currentDepth >= TRANSCLUSION_MAX_DEPTH) {
		// Depth limit reached - show collapsed indicator to prevent infinite loops
		element = (
			<div className="depthLimit" title={`Transclusion depth limit (${TRANSCLUSION_MAX_DEPTH}) reached`}>
				<Icon className="transclusion" />
				<div className="name">{translate('blockTransclusionDepthLimit')}</div>
			</div>
		);
	} else if (loadingState === 'loading') {
		// Still loading
		element = (
			<div className="loading">
				<Loader />
				<div className="name">{translate('blockTransclusionLoading')}</div>
			</div>
		);
	} else if (loadingState === 'loaded') {
		// Render the actual transcluded block
		const referencedBlock = S.Block.getLeaf(referencedRootId, referencedBlockId);

		if (referencedBlock) {
			// Render the referenced block with isTranscluded flag
			// This makes Block skip the wrapper structure (no hierarchical indentation)
			element = (
				<div className="transcludedContent">
					<div className="transclusionIndicator">
						<Icon className="transclusion" />
					</div>
					<Block
						{...props}
						rootId={referencedRootId}
						block={referencedBlock}
						readonly={true}
						isInsideTable={false}
						transclusionDepth={currentDepth + 1}
						isTranscluded={true}
						transclusionSourceId={block.id}
					/>
				</div>
			);
		} else {
			element = (
				<div className="notFound">
					<Icon className="ghost" />
					<div className="name">{translate('blockTransclusionNotFound')}</div>
				</div>
			);
		}
	} else {
		// Error state
		element = (
			<div className="error">
				<Icon className="alert" />
				<div className="name">{translate('blockTransclusionError')}</div>
			</div>
		);
	}

	return (
		<div
			ref={nodeRef}
			className={cn.join(' ')}
			tabIndex={0}
			onKeyDown={onKeyDownHandler}
			onKeyUp={onKeyUpHandler}
			onFocus={onFocus}
		>
			{element}
		</div>
	);
}));

export default BlockTransclusion;
