import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import $ from 'jquery';
import * as d3 from 'd3';
import { I, Util, DataUtil, SmileUtil, FileUtil, translate, Relation } from 'Lib';
import { commonStore, blockStore } from 'Store';

interface Props {
	isPopup?: boolean;
	rootId: string;
	data: any;
	onClick?: (object: any) => void;
	onContextMenu?: (id: string, param: any) => void;
	onSelect?: (id: string) => void;
};

const Graph = observer(class Graph extends React.Component<Props> {

	canvas: any = null;
	edges: any[] = [];
	nodes: any[] = [];
	worker: any = null;
	images: any = {};
	subject: any = null;
	isDragging: boolean = false;
	ids: string[] = [];

	forceProps: any = {
		center: {
			x: 0.5,
			y: 0.5,
		},
		charge: {
			enabled: true,
			strength: -100,
			distanceMin: 0,
			distanceMax: 200,
		},
		collide: {
			enabled: true,
			strength: 0.3,
			iterations: 1,
			radius: 10,
		},
		link: {
			enabled: true,
			strength: 0.3,
			distance: 80,
			iterations: 1,
		},
		forceX: {
			enabled: true,
			strength: 0.05,
			x: 0.4,
		},
		forceY: {
			enabled: true,
			strength: 0.05,
			y: 0.4,
		},
	};

	constructor (props: Props) {
		super(props);

		this.onMessage = this.onMessage.bind(this);
		this.nodeMapper = this.nodeMapper.bind(this);
	};

	render () {
		const { isPopup } = this.props;
		const id = [ 'graph' ];

		if (isPopup) {
			id.push('popup');
		};

		return (
			<div id="graphWrapper">
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

		$('body').removeClass('cp');
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('updateGraphProps', () => { this.updateProps(); });
	};

	unbind () {
		$(window).off('updateGraphProps');
	};

	init () {
		const { data, isPopup } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const density = window.devicePixelRatio;
		const elementId = '#graph' + (isPopup ? '-popup' : '');
		const transform: any = {};
		const width = node.width();
		const height = node.height();
		const zoom = d3.zoom().scaleExtent([ 1, 6 ]).on('zoom', e => this.onZoom(e));
		const scale = transform.k || 5;
		const x = transform.x || -width * 2;
		const y = transform.y || -height * 2;

		this.edges = (data.edges || []).map(this.edgeMapper);
		this.nodes = (data.nodes || []).map(this.nodeMapper);

		this.canvas = d3.select(elementId).append('canvas')
		.attr('width', (width * density) + 'px')
		.attr('height', (height * density) + 'px')
		.node();

		const transfer = node.find('canvas').get(0).transferControlToOffscreen();

		this.worker = new Worker('workers/graph.js');
		this.worker.onerror = (e: any) => { console.log(e); };
		this.worker.addEventListener('message', (data: any) => { this.onMessage(data); });

		this.send('init', { 
			canvas: transfer, 
			width,
			height,
			density,
			nodes: this.nodes,
			edges: this.edges,
			forceProps: this.getProps(),
			theme: commonStore.getThemeClass(),
		}, [ transfer ]);

		d3.select(this.canvas)
        .call(d3.drag().
			subject(() => { return this.subject; }).
			on('start', (e: any, d: any) => this.onDragStart(e, d)).
			on('drag', (e: any, d: any) => this.onDragMove(e, d)).
			on('end', (e: any, d: any) => this.onDragEnd(e, d))
		)
        .call(zoom)
		.call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale))
		.on('click', (e: any) => {
			const [ x, y ] = d3.pointer(e);
			this.send(e.shiftKey ? 'onSelect' : 'onClick', { x, y });
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
		const { rootId } = this.props;

		d.layout = Number(d.layout) || 0;
		d.radius = 5;
		d.isRoot = d.id == rootId;
		d.src = this.imageSrc(d);

		if (d.layout == I.ObjectLayout.Note) {
			d.name = d.snippet || translate('commonEmpty');
		} else {
			d.name = d.name || DataUtil.defaultName('page');
		};

		d.name = SmileUtil.strip(d.name);
		d.shortName = Util.shorten(d.name, 24);

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

	getProps () {
		return Object.assign(this.forceProps, { flags: commonStore.graph });
	};

	updateProps () {
		this.send('updateProps', { forceProps: this.getProps() } );
	};

	onDragStart (e: any, d: any) {
		this.isDragging = true;
		this.send('onDragStart', { active: e.active });

		$('body').addClass('grab');
	};

	onDragMove (e: any, d: any) {
		const p = d3.pointer(e, d3.select(this.canvas));
		const node = $(ReactDOM.findDOMNode(this));
		const { left, top } = node.offset();

		this.send('onDragMove', { 
			subjectId: this.subject.id, 
			active: e.active, 
			x: p[0] - left, 
			y: p[1] - top,
		});
	};
			
	onDragEnd (e: any, d: any) {
		this.isDragging = false;
		this.subject = null;
		this.send('onDragEnd', { active: e.active });

		$('body').removeClass('grab');
	};

	onZoom ({ transform }) {
		this.send('onZoom', { transform: transform });
  	};

	onMessage ({ data }) {
		const { root } = blockStore;
		const { isPopup, onClick, onContextMenu, onSelect } = this.props;
		const body = $('body');

		switch (data.id) {
			case 'onClick':
				if (data.node.id != root) {
					onClick(data.node);
				};
				break;

			case 'onSelect':
				if (data.node.id != root) {
					onSelect(data.node.id);
				};
				break;

			case 'onMouseMove':
				if (!this.isDragging) {
					this.subject = this.nodes.find(d => d.id == data.node);
					this.subject ? body.addClass('cp') : body.removeClass('cp');
				};
				break;

			case 'onContextMenu':
				if (data.node == root) {
					break;
				};

				onContextMenu(data.node, {
					recalcRect: () => { 
						const rect = { width: 0, height: 0, x: data.x, y: data.y };

						if (isPopup) {
							const container = Util.getPageContainer(isPopup);
							const { left, top } = container.offset();

							rect.x += left;
							rect.y += top;
						};

						return rect;
					},
				});
				break;

		};
	};

	imageSrc (d: any) {
		let src = '';

		if (d.id == blockStore.root) {
			return 'img/icon/home-big.svg';
		};

		switch (d.layout) {
			case I.ObjectLayout.Relation:
				src = `img/icon/relation/big/${Relation.typeName(d.relationFormat)}.svg`;
				break;

			case I.ObjectLayout.Task:
				src = `img/icon/graph/task.svg`;
				break;

			case I.ObjectLayout.File:
				src = `img/icon/file/${FileUtil.icon(d)}.svg`;
				break;

			case I.ObjectLayout.Image:
				if (d.id) {
					src = commonStore.imageUrl(d.id, 160);
				} else {
					src = `img/icon/file/${FileUtil.icon(d)}.svg`;
				};
				break;
				
			case I.ObjectLayout.Human:
				src = d.iconImage ? commonStore.imageUrl(d.iconImage, 160) : '';
				break;

			case I.ObjectLayout.Note:
				break;

			case I.ObjectLayout.Bookmark:
				src = commonStore.imageUrl(d.iconImage, 24);
				break;
				
			default:
				if (d.iconImage) {
					src = commonStore.imageUrl(d.iconImage, 160);
				} else
				if (d.iconEmoji) {
					const data = SmileUtil.data(d.iconEmoji);
					if (data) {
						src = SmileUtil.srcFromColons(data.colons, data.skin);
					};
					src = src.replace(/^.\//, '');
				};
				break;
		};

		return src;
	};

	send (id: string, param: any, transfer?: any[]) {
		if (this.worker) {
			this.worker.postMessage({ id: id, ...param }, transfer);
		};
	};

	resize () {
		const node = $(ReactDOM.findDOMNode(this));

		this.send('onResize', { 
			width: node.width(), 
			height: node.height(), 
			density: window.devicePixelRatio,
		});
	};

});

export default Graph;