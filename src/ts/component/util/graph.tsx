import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import * as d3 from 'd3';
import { observer } from 'mobx-react';
import { PreviewDefault } from 'Component';
import { I, Util, ObjectUtil, SmileUtil, FileUtil, translate, Relation, analytics } from 'Lib';
import { commonStore, blockStore } from 'Store';
import Colors from 'json/colors.json';

interface Props {
	isPopup?: boolean;
	rootId: string;
	data: any;
	onClick?: (object: any) => void;
	onContextMenu?: (id: string, param: any) => void;
	onSelect?: (id: string, related?: string[]) => void;
};

const bgColor = {
	'': '#000',
	dark: '#fff',
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
	isPreview = false;
	isPreviewDisabled = false;
	ids: string[] = [];
	timeoutPreview = 0;
	zoom: any = null;

	constructor (props: Props) {
		super(props);

		this.onMessage = this.onMessage.bind(this);
		this.nodeMapper = this.nodeMapper.bind(this);
		this.setRootId = this.setRootId.bind(this);
	};

	render () {
		const { isPopup } = this.props;
		const { theme } = commonStore;
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

	componentDidUpdate (): void {
		this.send('updateTheme', { theme: commonStore.getThemeClass() });
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
		win.on('updateGraphSettings.graph', () => { this.updateSettings(); });
		win.on('updateGraphRoot.graph', (e: any, data: any) => { this.setRootId(data.id); });
	};

	unbind () {
		$(window).off('updateGraphSettings.graph updateGraphRoot.graph');
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
		this.worker.onerror = (e: any) => { console.log(e); };
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
			const [ x, y ] = d3.pointer(e);
			this.send(e.shiftKey ? 'onSelect' : 'onClick', { x, y });
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
		d.src = this.imageSrc(d);

		if (d.layout == I.ObjectLayout.Note) {
			d.name = d.snippet || translate('commonEmpty');
		} else {
			d.name = d.name || ObjectUtil.defaultName('page');
		};

		d.name = SmileUtil.strip(d.name);
		d.shortName = Util.shorten(d.name, 24);
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

		this.isPreview = true;

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
		} else {
			position();
		};
	};

	onPreviewHide () {
		if (this.isPreview) {
			window.clearTimeout(this.timeoutPreview);
			$('#graphPreview').remove();
		};
	};

	onMessage (e) {
		const { id, data } = e.data;
		const { onClick, onContextMenu, onSelect } = this.props;
		const node = $(this.node);
		const { left, top } = node.offset();

		switch (id) {
			case 'onClick': {
				onClick(data.node);
				window.clearTimeout(this.timeoutPreview);
				break;
			};

			case 'onSelect': {
				const { related } = data;
				onSelect(data.node, related);
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

				onContextMenu(data.node.id, {
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
				});
				break;
			};

			case 'onTransform': {
				d3.select(this.canvas)
        		.call(this.zoom)
				.call(this.zoom.transform, d3.zoomIdentity.translate(data.x, data.y).scale(data.k))
				break;
			};

		};
	};

	imageSrc (d: any) {
		let src = '';

		switch (d.layout) {
			case I.ObjectLayout.Relation: {
				src = `img/icon/relation/big/${Relation.typeName(d.relationFormat)}.svg`;
				break;
			};

			case I.ObjectLayout.Task: {
				src = `img/icon/graph/task.svg`;
				break;
			};

			case I.ObjectLayout.File: {
				src = `img/icon/file/${FileUtil.icon(d)}.svg`;
				break;
			};

			case I.ObjectLayout.Image: {
				if (d.id) {
					src = commonStore.imageUrl(d.id, 160);
				} else {
					src = `img/icon/file/${FileUtil.icon(d)}.svg`;
				};
				break;
			};
				
			case I.ObjectLayout.Human: {
				if (d.iconImage) {
					src = commonStore.imageUrl(d.iconImage, 160);
				} else
				if (d.iconOption) {
					src = this.gradientIcon(d.iconOption);
				};
				break;
			};

			case I.ObjectLayout.Note: {
				break;
			};

			case I.ObjectLayout.Bookmark: {
				src = commonStore.imageUrl(d.iconImage, 24);
				break;
			};
				
			default: {
				if (d.iconImage) {
					src = commonStore.imageUrl(d.iconImage, 160);
				} else
				if (d.iconEmoji) {
					const data = SmileUtil.data(d.iconEmoji);
					if (data) {
						src = SmileUtil.srcFromColons(data.colons, data.skin);
					};
					src = src.replace(/^.\//, '');
				} else
				if (d.iconOption) {
					src = this.gradientIcon(d.iconOption, true);
				};
				break;
			};
		};

		return src;
	};

	gradientIcon (iconOption: number, small?: boolean) {
		const option: any = Colors.gradientIcons.options[iconOption - 1];
		if (!option) {
			return;
		};

		const theme = commonStore.getThemeClass();
		const { from, to } = option.colors;
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const w = 160;
		const r = w / 2;
		const fillW = small ? w * 0.7 : w;
		const fillR = fillW / 2;
		const steps = option.steps || Colors.gradientIcons.common.steps;
		const step0 = Util.getPercentage(fillR, Number(steps.from.replace('%', '')));
		const step1 = Util.getPercentage(fillR, Number(steps.to.replace('%', '')));
		const grd = ctx.createRadialGradient(r, r, step0, r, r, step1);

		canvas.width = w;
		canvas.height = w;
		grd.addColorStop(0, from);
		grd.addColorStop(1, to);

		if (small) {
			ctx.fillStyle = bgColor[theme];
			ctx.fillRect(0, 0, w, w);
		};

		ctx.fillStyle = grd;
		ctx.beginPath();
		ctx.arc(r, r, fillR, 0, 2 * Math.PI);
		ctx.fill();

		return canvas.toDataURL();
	};

	setRootId (id: string) {
		this.send('onSetRootId', { rootId: id });
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