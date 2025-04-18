import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import * as d3 from 'd3';
import { observer } from 'mobx-react';
import { PreviewDefault } from 'Component';
import { I, S, U, J, translate, analytics, keyboard, Action } from 'Lib';

interface Props {
	id?: string;
	isPopup?: boolean;
	rootId: string;
	data: any;
	storageKey: string;
};

interface GraphRefProps {
	init: () => void;
	resize: () => void;
	addNewNode: (id: string, sourceId?: string, param?: any, callBack?: (object: any) => void) => void;
};

const Graph = observer(forwardRef<GraphRefProps, Props>(({
	id = '',
	isPopup = false,
	rootId = '',
	data = {},
	storageKey = '',
}, ref) => {

	const nodeRef = useRef(null);
	const worker = useRef(null);
	const theme = S.Common.getThemeClass();
	const elementId = [ 'graph', id ].join('-') + U.Common.getEventNamespace(isPopup);
	const previewId = useRef('');
	const canvas = useRef(null);
	const edges = useRef([]);
	const nodes = useRef([]);
	const images = useRef({});
	const subject = useRef(null);
	const isDragging = useRef(false);
	const isPreviewDisabled = useRef(false);
	const ids = useRef([]);
	const zoom = useRef(null);
	const isDraggingToSelect = useRef(false);
	const nodesSelectedByDragToSelect = useRef([]);

	const send = (id: string, param: any, transfer?: any[]) => {
		try {
			if (worker.current) {
				worker.current.postMessage({ id, ...param }, transfer);
			};
		} catch (e) { /**/ };
	};

	const rebind = () => {
		const win = $(window);

		unbind();
		win.on('updateGraphSettings.graph', () => updateSettings());
		win.on('updateGraphRoot.graph', (e: any, data: any) => setRootId(data.id));
		win.on('removeGraphNode.graph', (e: any, data: any) => send('onRemoveNode', { ids: U.Common.objectCopy(data.ids) }));
		win.on(`keydown.graph`, e => onKeyDown(e));
	};

	const unbind = () => {
		const events = [ 'updateGraphSettings', 'updateGraphRoot', 'removeGraphNode', 'keydown' ];

		$(window).off(events.map(it => `${it}.graph`).join(' '));
	};

	const getTouchDistance = (touches: { clientX: number, clientY: number }[]): number => {
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;

		return Math.sqrt(dx * dx + dy * dy);
	};

	const init = () => {
		const node = $(nodeRef.current);
		const density = window.devicePixelRatio;
		const width = node.width();
		const height = node.height();
		const settings = S.Common.getGraph(storageKey);

		images.current = {};
		zoom.current = d3.zoom().scaleExtent([ 0.05, 10 ])
			.on('start', e => onZoomStart(e))
			.on('zoom', e => onZoom(e))
			.on('end', e => onZoomEnd(e));
		edges.current = (data.edges || []).map(edgeMapper);
		nodes.current = (data.nodes || []).map(nodeMapper);

		node.find('canvas').remove();

		canvas.current = d3.select(`#${elementId}`).append('canvas')
		.attr('width', (width * density) + 'px')
		.attr('height', (height * density) + 'px')
		.node();

		let touchStartDist = null;
		let touchStartZoom = null;

		canvas.current.addEventListener('touchstart', e => {
			if (e.touches.length != 2) {
				return;
			};

			e.preventDefault();
			touchStartDist = getTouchDistance(e.touches);
			touchStartZoom = d3.zoomTransform(canvas.current).k;
		});

		canvas.current.addEventListener('touchmove', e => {
			e.preventDefault();

			if (!touchStartDist || (e.touches.length != 2)) {
				return;
			};

			const newDist = getTouchDistance(e.touches);
			const scaleChange = newDist / touchStartDist;
			const newZoom = touchStartZoom * scaleChange;

			d3.select(canvas.current).call(zoom.current.scaleTo, newZoom);
		});

		const transfer = canvas.current.transferControlToOffscreen();

		worker.current = new Worker('workers/graph.js');
		worker.current.onerror = (e: any) => console.log(e);
		worker.current.addEventListener('message', onMessage);

		send('init', { 
			canvas: transfer, 
			width,
			height,
			density,
			theme,
			settings,
			rootId,
			nodes: nodes.current,
			edges: edges.current,
			colors: J.Theme[theme].graph || {},
		}, [ transfer ]);

		d3.select(canvas.current)
		.call(d3.drag().
			subject(() => subject.current).
			on('start', (e: any, d: any) => onDragStart(e)).
			on('drag', (e: any, d: any) => onDragMove(e)).
			on('end', (e: any, d: any) => onDragEnd(e))
		)
		.call(zoom.current)
		.call(zoom.current.transform, d3.zoomIdentity.translate(0, 0).scale(1))
		.on('click', (e: any) => {
			const { local } = S.Common.getGraph(storageKey);
			const [ x, y ] = d3.pointer(e);

			let event = '';
			if (local) {
				event = 'onSetRootId';
			} else {
				event = e.shiftKey ? 'onSelect' : 'onClick';
			};

			send(event, { x, y });
		})
		.on('dblclick', (e: any) => {
			if (e.shiftKey) {
				const [ x, y ] = d3.pointer(e);
				send('onSelect', { x, y, selectRelated: true });
			};
		})
		.on('contextmenu', (e: any) => {
			const [ x, y ] = d3.pointer(e);
			send('onContextMenu', { x, y });
		})
		.on('mousemove', (e: any) => {
			const [ x, y ] = d3.pointer(e);
			send('onMouseMove', { x, y });
		});
	};

	const nodeMapper = (d: any) => {
		d = d || {};
		d.layout = Number(d.layout) || 0;
		d.radius = 4;
		d.src = U.Graph.imageSrc(d);
		d.name = U.Smile.strip(U.Object.name(d, true));
		d.shortName = U.Common.shorten(d.name, 24);

		// Clear icon props to fix image size
		if (U.Object.isTaskLayout(d.layout)) {
			d.iconImage = '';
			d.iconEmoji = '';
		};

		if (!images.current[d.src]) {
			const img = new Image();

			img.onload = () => {
				if (images.current[d.src]) {
					return;
				};

				createImageBitmap(img, { resizeWidth: 160, resizeQuality: 'high' }).then((res: any) => {
					if (images.current[d.src]) {
						return;
					};

					images.current[d.src] = true;
					send('image', { src: d.src, bitmap: res });
				});
			};
			img.crossOrigin = 'anonymous';
			img.src = d.src;
		};

		return d;
	};

	const edgeMapper = (d: any) => {
		d.type = Number(d.type) || 0;
		d.typeName = translate('edgeType' + d.type);
		return d;
	};

	const updateSettings = () => {
		send('updateSettings', S.Common.getGraph(storageKey));
	};

	const onDragStart = (e: any) => {
		isDragging.current = true;
		send('onDragStart', { active: e.active });
	};

	const onDragMove = (e: any) => {
		const p = d3.pointer(e, d3.select(canvas.current));
		const node = $(nodeRef.current);

		if (!node || !node.length) {
			return;
		};

		const { left, top } = node.offset();

		send('onDragMove', { 
			subjectId: subject.current?.id, 
			active: e.active, 
			x: p[0] - left, 
			y: p[1] - top,
		});
	};

	const onDragEnd = (e: any) => {
		isDragging.current = false;
		subject.current = null;
		send('onDragEnd', { active: e.active });
	};

	const onZoomStart = ({ sourceEvent }) => {
		if (sourceEvent && (sourceEvent.type == 'mousedown') && sourceEvent.shiftKey) {
			const p = d3.pointer(sourceEvent, d3.select(canvas.current));
			const node = $(nodeRef.current);
			const { left, top } = node.offset();

			isDraggingToSelect.current = true;
			send('onDragToSelectStart', { x: p[0] - left, y: p[1] - top });
		};
	};

	const onZoom = ({ transform, sourceEvent }) => {
		if (isDraggingToSelect.current && sourceEvent) {
			const p = d3.pointer(sourceEvent, d3.select(canvas.current));
			const node = $(nodeRef.current);
			const { left, top } = node.offset();

			send('onDragToSelectMove', { x: p[0] - left, y: p[1] - top });
		} else {
			send('onZoom', { transform });
		};
	};

	const onZoomEnd = (e: any) => {
		if (isDraggingToSelect.current){
			send('onDragToSelectEnd', {});
			nodesSelectedByDragToSelect.current = [];
		};

		isDraggingToSelect.current = false;
	};

	const onPreviewShow = (data: any) => {
		if (isPreviewDisabled.current || !subject.current) {
			return;
		};

		const win = $(window);
		const body = $('body');
		const node = $(nodeRef.current);
		const { left, top } = node.offset();
		const render = previewId.current != subject.current.id;

		previewId.current = subject.current.id;

		let el = $('#graphPreview');

		const position = () => {
			const obj = el.find('.previewGraph');
			const x = data.x + left - obj.outerWidth() / 2;
			const y = data.y + top + 20 - win.scrollTop();

			el.css({ left: x, top: y });
		};

		if (!el.length || render) {
			el = $('<div id="graphPreview" />');

			body.find('#graphPreview').remove();
			body.append(el);

			ReactDOM.render(<PreviewDefault object={subject.current} className="previewGraph" />, el.get(0), position);
			analytics.event('SelectGraphNode', { objectType: subject.current.type, layout: subject.current.layout });
		} else {
			position();
		};
	};

	const onPreviewHide = () => {
		$('#graphPreview').remove();
	};

	const onMessage = (e) => {
		const settings = S.Common.getGraph(storageKey);
		const { id, data } = e.data;
		const node = $(nodeRef.current);

		if (!node || !node.length) {
			return;
		};

		const { left, top } = node.offset();
		const menuParam = {
			onOpen: () => isPreviewDisabled.current = true,
			onClose: () => isPreviewDisabled.current = false,
			recalcRect: () => ({
				width: 0,
				height: 0,
				x: data.x + 10 + left,
				y: data.y + 10 + top,
			}),
		};

		switch (id) {
			case 'onClick': {
				if (data.node){
					onClickObject(data.node);
				} else {
					setSelected([]);
				};
				break;
			};

			case 'onSelect': {
				onSelect(data.node, data.related);
				break;
			};

			case 'onMouseMove': {
				if (isDragging.current) {
					break;
				};

				subject.current = getNode(data.node);

				if (settings.preview) {
					subject.current ? onPreviewShow(data) : onPreviewHide();
				};
				break;
			};

			case 'onDragMove': {
				onPreviewHide();
				break;
			};

			case 'onContextMenu': {
				if (!data.node) {
					break;
				};

				onPreviewHide();
				onContextMenu(data.node.id, menuParam);
				break;
			};

			case 'onContextSpaceClick': {
				onPreviewHide();
				onContextSpaceClick(menuParam, data);
				break;
			};

			case 'onTransform': {
				d3.select(canvas.current)
				.call(zoom.current)
				.call(zoom.current.transform, d3.zoomIdentity.translate(data.x, data.y).scale(data.k));
				break;
			};

			case 'setRootId': {
				$(window).trigger('updateGraphRoot', { id: data.node });
				break;
			};

			case 'onSelectByDragToSelect': {
				const currentSelected = data.selected;

				setSelected(ids.current.filter((id: string) => {
					if (!nodesSelectedByDragToSelect.current.includes(id)){
						return true;
					};
					return currentSelected.includes(id);
				}));

				nodesSelectedByDragToSelect.current = nodesSelectedByDragToSelect.current.filter(id => currentSelected.includes(id));


				currentSelected.forEach((id: string) => {
					if (ids.current.includes(id)){
						return;
					};

					setSelected(ids.current.concat([id]));
					nodesSelectedByDragToSelect.current = nodesSelectedByDragToSelect.current.concat([id]);
				});
			};
		};
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('searchText', e, () => $('#button-header-search').trigger('click'));

		if (!ids.current.length) {
			return;
		};

		keyboard.shortcut('escape', e, () => setSelected([]));

		keyboard.shortcut('backspace, delete', e, () => {
			Action.archive(ids.current, analytics.route.graph, () => {
				nodes.current = nodes.current.filter(d => !ids.current.includes(d.id));
				send('onRemoveNode', { ids: ids.current });
			});
		});
	};

	const onContextMenu = (id: string, param: any) => {
		const selected = ids.current.length ? ids.current : [ id ];

		S.Menu.open('objectContext', {
			...param,
			data: {
				route: analytics.route.graph,
				objectIds: selected,
				getObject: id => getNode(id),
				allowedLinkTo: true,
				allowedOpen: true,
				onLinkTo: (sourceId: string, targetId: string) => {
					const target = getNode(targetId);
					if (target) {
						edges.current.push(edgeMapper({ type: I.EdgeType.Link, source: sourceId, target: targetId }));
						send('onSetEdges', { edges: edges.current });
					} else {
						addNewNode(targetId, sourceId, null);
					};
				},
				onSelect: (itemId: string) => {
					switch (itemId) {
						case 'archive': {
							nodes.current = nodes.current.filter(d => !selected.includes(d.id));
							send('onRemoveNode', { ids: selected });
							break;
						};

						case 'fav': {
							selected.forEach(id => {
								const node = getNode(id);
								
								if (node) {
									node.isFavorite = true;
								};
							});
							send('onSetEdges', { edges: edges.current });
							break;
						};

						case 'unfav': {
							selected.forEach(id => {
								const node = getNode(id);
								
								if (node) {
									node.isFavorite = false;
								};
							});
							break;
						};
					};

					setSelected(ids.current);
				},
			}
		});
	};

	const onContextSpaceClick = (param: any, data: any) => {
		if (!U.Space.canMyParticipantWrite()) {
			return;
		};

		S.Menu.open('select', {
			...param,
			data: {
				options: [
					{ id: 'newObject', name: translate('commonNewObject') },
				],
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'newObject': {
							const flags = [ I.ObjectFlag.SelectType, I.ObjectFlag.SelectTemplate ];

							U.Object.create('', '', {}, I.BlockPosition.Bottom, '', flags, analytics.route.graph, (message: any) => {
								U.Object.openConfig(message.details, { onClose: () => addNewNode(message.targetId, '', data) });
							});
							break;
						};
					};
				},
			}
		});
	};

	const onSelect = (id: string, related?: string[]) => {
		const isSelected = ids.current.includes(id);

		let ret = [ id ];

		if (related && related.length) {
			if (!isSelected) {
				ret = [];
			};

			ret = ret.concat(related);
		};

		ret.forEach(id => {
			if (isSelected) {
				ids.current = ids.current.filter(it => it != id);
				return;
			};

			ids.current = ids.current.includes(id) ? ids.current.filter(it => it != id) : ids.current.concat([ id ]);
		});

		setSelected(ids.current);
	};

	const onClickObject = (id: string) => {
		setSelected([]);
		onPreviewHide();
		U.Object.openConfig(getNode(id));
	};

	const addNewNode = (id: string, sourceId?: string, param?: any, callBack?: (object: any) => void) => {
		U.Object.getById(id, {}, (object: any) => {
			object = nodeMapper(object);

			if (param) {
				object = Object.assign(object, param);
			};

			nodes.current.push(object);
			send('onAddNode', { target: object, sourceId });

			if (callBack) {
				callBack(object);
			};
		});
	};

	const getNode = (id: string) => {
		return nodes.current.find(d => d.id == id);
	};

	const setRootId = (id: string) => {
		send('setRootId', { rootId: id });
	};

	const setSelected = (selected: string[]) => {
		ids.current = selected;
		send('onSetSelected', { ids: ids.current });
	};

	const resize = () => {
		const node = $(nodeRef.current);

		send('resize', { 
			width: node.width(), 
			height: node.height(),
			density: window.devicePixelRatio,
		});
	};

	useEffect(() => {
		rebind();

		return () => {
			unbind();
			onPreviewHide();

			if (worker.current) {
				worker.current.terminate();
			};
		};
	}, []);

	useEffect(() => {
		send('updateTheme', { theme, colors: J.Theme[theme].graph || {} });
	}, [ theme ]);

	useImperativeHandle(ref, () => ({
		init,
		resize,
		addNewNode,
	}));

	return (
		<div 
			ref={nodeRef} 
			className="graphWrapper"
		>
			<div id={elementId} />
		</div>
	);
}));

export default Graph;
