import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import * as d3 from 'd3';
import { observer } from 'mobx-react';
import { PreviewDefault } from 'Component';
import { I, UtilCommon, UtilObject, UtilSmile, UtilGraph, translate, analytics, keyboard, Action } from 'Lib';
import { commonStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props {
	isPopup?: boolean;
	rootId: string;
	data: any;
};

const Graph = observer(class Graph extends React.Component<Props> {

	node: any = null;
	canvas: any = null;
	edges: any[] = [];
	nodes: any[] = [];
	worker: any = null;
	images: any = {};
	subject: any = null;
	isDragging = false;
	isPreviewDisabled = false;
	ids: string[] = [];
	timeoutPreview = 0;
	zoom: any = null;
	previewId = '';

	constructor (props: Props) {
		super(props);

		this.onMessage = this.onMessage.bind(this);
		this.nodeMapper = this.nodeMapper.bind(this);
		this.setRootId = this.setRootId.bind(this);
	};

	render () {
		const { isPopup } = this.props;
		const id = [ 'graph' ];

		if (isPopup) {
			id.push('popup');
		};

		return (
			<div 
				ref={node => this.node = node} 
				id="graphWrapper"
			>
				<div id={id.join('-')} />
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	componentWillUnmount () {
		if (this.worker) {
			this.worker.terminate();
		};

		this.unbind();
		this.onPreviewHide();
	};

	rebind () {
		const win = $(window);

		this.unbind();
		win.on('updateGraphSettings.graph', () => this.updateSettings());
		win.on('updateGraphRoot.graph', (e: any, data: any) => this.setRootId(data.id));
		win.on('updateTheme.graph', () => this.send('updateTheme', { theme: commonStore.getThemeClass() }));
		win.on('removeGraphNode.graph', (e: any, data: any) => this.send('onRemoveNode', { ids: UtilCommon.objectCopy(data.ids) }));
		win.on(`keydown.graph`, e => this.onKeyDown(e));
	};

	unbind () {
		const events = [ 'updateGraphSettings', 'updateGraphRoot', 'updateTheme', 'removeGraphNode', 'keydown' ];

		$(window).off(events.map(it => `${it}.graph`).join(' '));
	};

	init () {
		const { data, isPopup, rootId } = this.props;
		const node = $(this.node);
		const density = window.devicePixelRatio;
		const elementId = `#graph${isPopup ? '-popup' : ''}`;
		const width = node.width();
		const height = node.height();
	
		this.zoom = d3.zoom().scaleExtent([ 1, 6 ]).on('zoom', e => this.onZoom(e));
		this.edges = (data.edges || []).map(this.edgeMapper);
		this.nodes = (data.nodes || []).map(this.nodeMapper);

		this.canvas = d3.select(elementId).append('canvas')
		.attr('width', (width * density) + 'px')
		.attr('height', (height * density) + 'px')
		.node();

		const transfer = node.find('canvas').get(0).transferControlToOffscreen();

		this.worker = new Worker('workers/graph.js');
		this.worker.onerror = (e: any) => console.log(e);
		this.worker.addEventListener('message', this.onMessage);

		this.send('init', { 
			canvas: transfer, 
			width,
			height,
			density,
			nodes: this.nodes,
			edges: this.edges,
			theme: commonStore.getThemeClass(),
			settings: commonStore.graph,
			rootId,
		}, [ transfer ]);

		d3.select(this.canvas)
		.call(d3.drag().
			subject(() => this.subject).
			on('start', (e: any, d: any) => this.onDragStart(e)).
			on('drag', (e: any, d: any) => this.onDragMove(e)).
			on('end', (e: any, d: any) => this.onDragEnd(e))
		)
		.call(this.zoom)
		.call(this.zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1.5))
		.on('click', (e: any) => {
			const { local } = commonStore.graph;
			const [ x, y ] = d3.pointer(e);

			if (local) {
				this.send('onSetRootId', { x, y });
			} else {
				this.send(e.shiftKey ? 'onSelect' : 'onClick', { x, y });
			};
		})
		.on('dblclick', (e: any) => {
			if (e.shiftKey) {
				const [ x, y ] = d3.pointer(e);
				this.send('onSelect', { x, y, selectRelated: true });
			};
		})
		.on('contextmenu', (e: any) => {
			const [ x, y ] = d3.pointer(e);
			this.send('onContextMenu', { x, y });
		})
		.on('mousemove', (e: any) => {
			const [ x, y ] = d3.pointer(e);
			this.send('onMouseMove', { x, y });
		});
	};

	nodeMapper (d: any) {
		d.layout = Number(d.layout) || 0;
		d.radius = 4;
		d.src = UtilGraph.imageSrc(d);

		if (d.layout == I.ObjectLayout.Note) {
			d.name = d.snippet || translate('commonEmpty');
		} else {
			d.name = d.name || UtilObject.defaultName('Page');
		};

		d.name = UtilSmile.strip(d.name);
		d.shortName = UtilCommon.shorten(d.name, 24);
		d.description = String(d.description || '');
		d.snippet = String(d.snippet || '');

		// Clear icon props to fix image size
		if (d.layout == I.ObjectLayout.Task) {
			d.iconImage = '';
			d.iconEmoji = '';
		};

		if (!this.images[d.src]) {
			const img = new Image();

			img.onload = () => {
				if (this.images[d.src]) {
					return;
				};

				createImageBitmap(img, { resizeWidth: 160, resizeQuality: 'high' }).then((res: any) => {
					if (this.images[d.src]) {
						return;
					};

					this.images[d.src] = true;
					this.send('image', { src: d.src, bitmap: res });
				});
			};
			img.crossOrigin = '';
			img.src = d.src;
		};

		return d;
	};

	edgeMapper (d: any) {
		d.type = Number(d.type) || 0;
		d.typeName = translate('edgeType' + d.type);
		return d;
	};

	updateSettings () {
		this.send('updateSettings', commonStore.graph);

		analytics.event('GraphSettings');
	};

	onDragStart (e: any) {
		this.isDragging = true;
		this.send('onDragStart', { active: e.active });
	};

	onDragMove (e: any) {
		const p = d3.pointer(e, d3.select(this.canvas));
		const node = $(this.node);
		
		if (!node || !node.length) {
			return;
		};

		const { left, top } = node.offset();

		this.send('onDragMove', { 
			subjectId: this.subject.id, 
			active: e.active, 
			x: p[0] - left, 
			y: p[1] - top,
		});
	};

	onDragEnd (e: any) {
		this.isDragging = false;
		this.subject = null;
		this.send('onDragEnd', { active: e.active });
	};

	onZoom ({ transform }) {
		this.send('onZoom', { transform });
	};

	onPreviewShow (data: any) {
		if (this.isPreviewDisabled || !this.subject) {
			return;
		};

		const win = $(window);
		const body = $('body');
		const node = $(this.node);
		const { left, top } = node.offset();
		
		let el = $('#graphPreview');

		const position = () => {
			const obj = el.find('.previewGraph');
			const x = data.x + left - obj.outerWidth() / 2;
			const y = data.y + top + 20 - win.scrollTop();

			el.css({ left: x, top: y });
		};

		if (!el.length) {
			el = $('<div id="graphPreview" />');
			body.append(el);
			ReactDOM.render(<PreviewDefault object={this.subject} className="previewGraph" />, el.get(0), position);

			analytics.event('SelectGraphNode', { objectType: this.subject.type, layout: this.subject.layout });
		} else {
			position();
		};
	};

	onPreviewHide () {
		$('#graphPreview').remove();
	};

	onMessage (e) {
		const { id, data } = e.data;
		const node = $(this.node);
		const { left, top } = node.offset();

		const menuParam = {
			onOpen: () => {
				this.isPreviewDisabled = true;
			},
			onClose: () => {
				this.isPreviewDisabled = false;
			},
			recalcRect: () => ({
				width: 0,
				height: 0,
				x: data.x + 10 + left,
				y: data.y + 10 + top,
			}),
		};

		switch (id) {
			case 'onClick': {
				this.onClickObject(data.node);
				break;
			};

			case 'onSelect': {
				this.onSelect(data.node, data.related);
				break;
			};

			case 'onMouseMove': {
				if (this.isDragging) {
					break;
				};

				this.subject = this.nodes.find(d => d.id == data.node);
				this.subject ? this.onPreviewShow(data) : this.onPreviewHide();
				break;
			};

			case 'onDragMove': {
				this.onPreviewHide();
				break;
			};

			case 'onContextMenu': {
				if (!data.node) {
					break;
				};

				this.onPreviewHide();
				this.onContextMenu(data.node.id, menuParam);
				break;
			};

			case 'onContextSpaceClick': {
				this.onPreviewHide();
				this.onContextSpaceClick(menuParam, data);
				break;
			};

			case 'onTransform': {
				d3.select(this.canvas)
				.call(this.zoom)
				.call(this.zoom.transform, d3.zoomIdentity.translate(data.x, data.y).scale(data.k));
				break;
			};

		};
	};

	onKeyDown (e: any) {
		const cmd = keyboard.cmdKey();
		const length = this.ids.length;

		keyboard.shortcut(`${cmd}+f`, e, () => $('#button-header-search').trigger('click'));

		if (length) {
			keyboard.shortcut('escape', e, () => {
				this.ids = [];
				this.send('onSetSelected', { ids: [] });
			});

			keyboard.shortcut('backspace, delete', e, () => {
				Action.archive(this.ids, () => {
					this.nodes = this.nodes.filter(d => !this.ids.includes(d.id));
					this.send('onRemoveNode', { ids: this.ids });
				});
			});
		};
	};

	onContextMenu (id: string, param: any) {
		const ids = this.ids.length ? this.ids : [ id ];

		menuStore.open('dataviewContext', {
			...param,
			data: {
				route: 'Graph',
				subId: Constant.subId.graph,
				objectIds: ids,
				getObject: id => this.getNode(id),
				allowedLink: true,
				onLinkTo: (sourceId: string, targetId: string) => {
					const target = this.getNode(targetId);
					if (target) {
						this.edges.push(this.edgeMapper({ type: I.EdgeType.Link, source: sourceId, target: targetId }));
						this.send('onSetEdges', { edges: this.edges });
					} else {
						this.addNewNode(targetId, target => this.send('onAddNode', { target, sourceId }));
					};
				},
				onSelect: (itemId: string) => {
					switch (itemId) {
						case 'archive': {
							this.nodes = this.nodes.filter(d => !ids.includes(d.id));
							this.send('onRemoveNode', { ids });
							break;
						};

						case 'fav': {
							ids.forEach((id: string) => {
								const node = this.getNode(id);
								
								if (node) {
									node.isFavorite = true;
								};
							});
							this.send('onSetEdges', { edges: this.edges });
							break;
						};

						case 'unfav': {
							ids.forEach((id: string) => {
								const node = this.getNode(id);
								
								if (node) {
									node.isFavorite = false;
								};
							});
							break;
						};
					};

					this.ids = [];
					this.send('onSetSelected', { ids: this.ids });
				},
			}
		});
	};

	onContextSpaceClick (param: any, data: any) {
		menuStore.open('select', {
			...param,
			data: {
				options: [
					{ id: 'newObject', name: translate('pageMainGraphNewObject') },
				],
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'newObject': {
							const flags = [ I.ObjectFlag.SelectType, I.ObjectFlag.SelectTemplate ];

							UtilObject.create('', '', {}, I.BlockPosition.Bottom, '', {}, flags, (message: any) => {
								UtilObject.openPopup({ id: message.targetId }, {
									onClose: () => {
										this.addNewNode(message.targetId, target => {
											target = Object.assign(target, { x: data.x, y: data.y });
											this.send('onAddNode', { target });
										});
									}
								});

								analytics.event('CreateObject', { objectType: commonStore.type, route: 'Graph' });
							});
							break;
						};
					};
				},
			}
		});
	};

	onSelect (id: string, related?: string[]) {
		const isSelected = this.ids.includes(id);

		let ids = [ id ];

		if (related && related.length) {
			if (!isSelected) {
				this.ids = [];
			};

			ids = ids.concat(related);
		};

		ids.forEach((id) => {
			if (isSelected) {
				this.ids = this.ids.filter(it => it != id);
				return;
			};

			this.ids = this.ids.includes(id) ? this.ids.filter(it => it != id) : this.ids.concat([ id ]);
		});

		this.send('onSetSelected', { ids: this.ids });
	};

	onClickObject (id: string) {
		this.ids = [];
		this.send('onSetSelected', { ids: [] });
		
		UtilObject.openAuto(this.nodes.find(d => d.id == id));
	};

	addNewNode (id: string, cb: (target: any) => void) {
		UtilObject.getById(id, (object: any) => {
			object = this.nodeMapper(object);

			this.nodes.push(object);
			cb(object);
		});
	};

	getNode (id: string) {
		return this.nodes.find(d => d.id == id);
	};

	setRootId (id: string) {
		this.send('setRootId', { rootId: id });
	};

	send (id: string, param: any, transfer?: any[]) {
		if (this.worker) {
			this.worker.postMessage({ id, ...param }, transfer);
		};
	};

	resize () {
		const node = $(this.node);

		this.send('resize', { 
			width: node.width(), 
			height: node.height(), 
			density: window.devicePixelRatio,
		});
	};

});

export default Graph;