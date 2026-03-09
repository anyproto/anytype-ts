import * as React from 'react';
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { I, C, S, U, translate } from 'Lib';
import { LazyExcalidraw } from '../../lib/excalidraw/LazyExcalidraw';
import { loadExcalidraw } from '../../lib/excalidraw/loader';
import { Icon, Button } from 'Component';
import { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types';

interface Props extends I.BlockComponent {}

const BlockExcalidraw = observer(forwardRef<{}, Props>(({ rootId, block }, ref) => {
	const nodeRef = useRef<HTMLDivElement>(null);
	const elementsTimer = useRef<NodeJS.Timeout>();
	const svgTimer = useRef<NodeJS.Timeout>();

	const { fields = {} } = block;
	const elementsStr = fields.excalidraw_elements || '[]';
	const appStateStr = fields.excalidraw_app_state || '{}';
	const filesStr = fields.excalidraw_files || '{}';
	const heightStr = fields.excalidraw_height || '400';
	const svgPreviewStr = fields.excalidraw_svg_preview || '';

	const height = parseInt(heightStr, 10);
	const initialElements = JSON.parse(elementsStr);
	const initialAppState = JSON.parse(appStateStr);
	const initialFiles = JSON.parse(filesStr);

	useImperativeHandle(ref, () => ({
		getNode: () => nodeRef.current
	}));

	useEffect(() => {
		return () => {
			if (elementsTimer.current) clearTimeout(elementsTimer.current);
			if (svgTimer.current) clearTimeout(svgTimer.current);
		};
	}, []);

	const openFullScreen = () => {
		S.Popup.open('excalidraw', {
			data: {
				blockId: block.id,
				rootId: rootId,
				elements: initialElements,
				appState: initialAppState,
				files: initialFiles
			}
		});
	};

	const renderPreview = () => {
		if (!svgPreviewStr) {
			return (
				<div
					className="excalidraw-placeholder"
					onClick={openFullScreen}
					style={{
						minHeight: '200px',
						height: `${height}px`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer',
						border: '1px dashed var(--color-border)',
						borderRadius: '8px',
						background: 'var(--color-bg-secondary)',
						position: 'relative'
					}}>
					<div style={{ textAlign: 'center', pointerEvents: 'none' }}>
						<Icon id="pencil" />
						<div style={{ marginTop: '8px', fontWeight: 500 }}>Click to draw</div>
					</div>
					<div className="excalidraw-overlay" style={{
						position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
						backgroundColor: 'rgba(0,0,0,0.05)', display: 'none', borderRadius: '8px'
					}} />
				</div>
			);
		}

		return (
			<div
				className="excalidraw-preview"
				onClick={openFullScreen}
				style={{
					cursor: 'pointer',
					textAlign: 'center',
					position: 'relative',
					minHeight: '200px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center'
				}}>
				<div
					dangerouslySetInnerHTML={{ __html: svgPreviewStr }}
					style={{ maxWidth: '100%', height: 'auto', pointerEvents: 'none' }}
				/>
				<div className="excalidraw-overlay" style={{
					position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					backgroundColor: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.2s',
					borderRadius: '8px'
				}}>
					<Button text="Edit Drawing" icon="pencil" />
				</div>
			</div>
		);
	};

	return (
		<div ref={nodeRef} className="blockExcalidraw" style={{ position: 'relative' }}>
			{renderPreview()}
			<style dangerouslySetInnerHTML={{__html: `
				.blockExcalidraw:hover .excalidraw-overlay {
					display: flex !important;
					opacity: 1 !important;
				}
			`}} />
		</div>
	);
}));

export default BlockExcalidraw;
