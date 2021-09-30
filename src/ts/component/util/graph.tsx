import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, Util, DataUtil, SmileUtil, translate } from 'ts/lib';
import { Label, Drag, Checkbox, Filter } from 'ts/component';
import { commonStore, blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import * as d3 from 'd3';

interface Props {
	rootId: string;
	data: any;
};

const $ = require('jquery');

const Graph = observer(class PopupGraph extends React.Component<Props, {}> {

	canvas: any = null;
	simulation: any = null;
	width: number = 0;
	height: number = 0;
	edges: any[] = [];
	nodes: any[] = [];
	zoom: any = null;
	worker: any = null;
	images: any = {};
	tooltip: any = null;
	subject: any = null;
	isDragging: boolean = false;

	forceProps: any = {
		center: {
			x: 0.5,
			y: 0.5
		},
		charge: {
			enabled: true,
			strength: -50,
			distanceMin: 20,
			distanceMax: 200
		},
		collide: {
			enabled: true,
			strength: 0.5,
			iterations: 1,
			radius: 0.5
		},
		link: {
			enabled: true,
			strength: 0.1,
			distance: 20,
			iterations: 3
		},
		forceX: {
			enabled: false,
			strength: 0.1,
			x: 0.5
		},
		forceY: {
			enabled: false,
			strength: 0.1,
			y: 0.5
		},

		orphans: false,
		markers: true,
		labels: true,
		relations: true,
		links: true,
		filter: '',
	};

	render () {
		return (
			<div className="sides">
				<div id="graphWrapper" className="side left">
					<div id="graph" />
				</div>
				<div className="side right">
					<div className="section">
						<div className="name">Filter</div>
						<div className="item">
							<Filter onChange={(v: string) => {
								this.forceProps.filter = v ? new RegExp(Util.filterFix(v), 'gi') : '';
								this.updateProps();
							}} />
						</div>
					</div>

					<div className="section">
						<div className="name">Center</div>
						<div className="item">
							<Label id="center-x" text={`X: ${this.forceProps.center.x}`} />
							<Drag value={this.forceProps.center.x} onMove={(e: any, v: number) => { 
								this.forceProps.center.x = v; 
								this.updateLabel('center-x', `X: ${Math.ceil(v * 100) + '%'}`);
								this.updateForces();
							}} />

							<Label id="center-y" text={`Y: ${this.forceProps.center.y}`} />
							<Drag value={this.forceProps.center.y} onMove={(e: any, v: number) => { 
								this.forceProps.center.y = v; 
								this.updateLabel('center-y', `Y: ${Math.ceil(v * 100) + '%'}`);
								this.updateForces();
							}} />
						</div>
					</div>

					<div className="section">
						<div className="name">
							<Checkbox value={this.forceProps.charge.enabled} onChange={(e: any, v: any) => {
								this.forceProps.charge.enabled = v;
								this.updateForces();
							}} />
							Charge
						</div>
						<div className="item">
							<Label id="charge-strength" text={`Strength: ${this.forceProps.charge.strength}`} />
							<Drag value={(this.forceProps.charge.strength + 200) / 250} onMove={(e: any, v: number) => { 
								this.forceProps.charge.strength = v * 250 - 200; 
								this.updateLabel('charge-strength', `Strength: ${Math.ceil(v * 250 - 200)}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="charge-distanceMin" text={`Distance Min: ${this.forceProps.charge.distanceMin}`} />
							<Drag value={this.forceProps.charge.distanceMin / 50} onMove={(e: any, v: number) => { 
								this.forceProps.charge.distanceMin = v * 50;
								this.updateLabel('charge-distanceMin', `Distance Min: ${Math.ceil(v * 50)}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="charge-distanceMax" text={`Distance Max: ${this.forceProps.charge.distanceMax}`} />
							<Drag value={this.forceProps.charge.distanceMax / 2000} onMove={(e: any, v: number) => { 
								this.forceProps.charge.distanceMax = v * 2000;
								this.updateLabel('charge-distanceMax', `Distance Max: ${Math.ceil(v * 2000)}`);
								this.updateForces();
							}} />
						</div>
					</div>

					<div className="section">
						<div className="name">
							<Checkbox value={this.forceProps.collide.enabled} onChange={(e: any, v: any) => {
								this.forceProps.collide.enabled = v;
								this.updateForces();
							}} />
							Collide
						</div>
						<div className="item">
							<Label id="collide-strength" text={`Strength: ${this.forceProps.collide.strength}`} />
							<Drag value={this.forceProps.collide.strength / 2} onMove={(e: any, v: number) => { 
								this.forceProps.collide.strength = v * 2; 
								this.updateLabel('collide-strength', `Strength: ${Math.ceil(v * 2 * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="collide-radius" text={`Radius: ${this.forceProps.collide.radius}`} />
							<Drag value={this.forceProps.collide.radius / 5} onMove={(e: any, v: number) => { 
								this.forceProps.collide.radius = v * 5;
								this.updateLabel('collide-radius', `Radius: ${Math.ceil(v * 5 * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="collide-iterations" text={`Iterations: ${this.forceProps.collide.iterations}`} />
							<Drag value={this.forceProps.collide.iterations / 10} onMove={(e: any, v: number) => { 
								this.forceProps.collide.iterations = v * 10;
								this.updateLabel('collide-iterations', `Iterations: ${Math.ceil(v * 10)}`);
								this.updateForces();
							}} />
						</div>
					</div>

					<div className="section">
						<div className="name">
							<Checkbox value={this.forceProps.forceX.enabled} onChange={(e: any, v: any) => {
								this.forceProps.forceX.enabled = v;
								this.updateForces();
							}} />
							Force X
						</div>

						<div className="item">
							<Label id="forceX-strengh" text={`Strength: ${this.forceProps.forceX.strength}`} />
							<Drag value={this.forceProps.forceX.strength} onMove={(e: any, v: number) => { 
								this.forceProps.forceX.strengh = v;
								this.updateLabel('forceX-strengh', `Strength: ${Math.ceil(v * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="forceX-x" text={`X: ${this.forceProps.forceX.x}`} />
							<Drag value={this.forceProps.forceX.x} onMove={(e: any, v: number) => { 
								this.forceProps.forceX.x = v;
								this.updateLabel('forceX-x', `X: ${Math.ceil(v * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>
					</div>

					<div className="section">
						<div className="name">
							<Checkbox value={this.forceProps.forceY.enabled} onChange={(e: any, v: any) => {
								this.forceProps.forceY.enabled = v;
								this.updateForces();
							}} />
							Force Y
						</div>

						<div className="item">
							<Label id="forceY-strengh" text={`Strength: ${this.forceProps.forceY.strength}`} />
							<Drag value={this.forceProps.forceY.strength} onMove={(e: any, v: number) => { 
								this.forceProps.forceY.strengh = v;
								this.updateLabel('forceY-strengh', `Strength: ${Math.ceil(v * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="forceY-x" text={`Y: ${this.forceProps.forceY.y}`} />
							<Drag value={this.forceProps.forceY.y} onMove={(e: any, v: number) => { 
								this.forceProps.forceY.y = v;
								this.updateLabel('forceY-y', `Y: ${Math.ceil(v * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>
					</div>

					<div className="section">
						<div className="name">
							<Checkbox value={this.forceProps.link.enabled} onChange={(e: any, v: any) => {
								this.forceProps.link.enabled = v;
								this.updateForces();
							}} />
							Link
						</div>

						<div className="item">
							<Label id="link-distance" text={`Distance: ${this.forceProps.link.distance}`} />
							<Drag value={this.forceProps.link.distance / 100} onMove={(e: any, v: number) => { 
								this.forceProps.link.distance = v * 100;
								this.updateLabel('link-distance', `Distance: ${Math.ceil(v * 100)}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="link-strength" text={`Strength: ${this.forceProps.link.strength}`} />
							<Drag value={this.forceProps.link.strength} onMove={(e: any, v: number) => { 
								this.forceProps.link.strength = v; 
								this.updateLabel('link-strength', `Strength: ${Math.ceil(v * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="link-iterations" text={`Iterations: ${this.forceProps.link.iterations}`} />
							<Drag value={this.forceProps.link.iterations / 10} onMove={(e: any, v: number) => { 
								this.forceProps.link.iterations = v * 10;
								this.updateLabel('link-iterations', `Iterations: ${Math.ceil(v * 10)}`);
								this.updateForces();
							}} />
						</div>
					</div>

					<div className="section">
						<div className="name">Flags</div>
						<div className="item">
							<Checkbox value={this.forceProps.orphans} onChange={(e: any, v: any) => {
								this.forceProps.orphans = v;
								this.updateProps();
							}} />
							Show orphans
						</div>
						<div className="item">
							<Checkbox value={this.forceProps.markers} onChange={(e: any, v: any) => {
								this.forceProps.markers = v;
								this.updateProps();
							}} />
							Show markers
						</div>
						<div className="item">
							<Checkbox value={this.forceProps.labels} onChange={(e: any, v: any) => {
								this.forceProps.labels = v;
								this.updateProps();
							}} />
							Show labels
						</div>
						<div className="item">
							<Checkbox value={this.forceProps.links} onChange={(e: any, v: any) => {
								this.forceProps.links = v;
								this.updateProps();
							}} />
							Show links
						</div>
						<div className="item">
							<Checkbox value={this.forceProps.relations} onChange={(e: any, v: any) => {
								this.forceProps.relations = v;
								this.updateProps();
							}} />
							Show relations
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		this.rebind();
	};

	componentWillUnmount () {
		if (this.worker) {
			this.worker.terminate();
		};
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('resize.graph', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('resize.graph');
	};

	updateLabel (id: string, text: string) {
		const node = $(ReactDOM.findDOMNode(this));
		node.find(`#${id}`).text(text);
	};

	init () {
		const { rootId, data } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const wrapper = node.find('#graphWrapper');
		const density = window.devicePixelRatio;

		this.width = wrapper.width();
		this.height = wrapper.height();
		this.zoom = d3.zoom().scaleExtent([ 1, 6 ]).on('zoom', e => this.onZoom(e));

		this.edges = (data.edges || []).map((d: any) => {
			d.type = Number(d.type) || 0;
			d.typeName = translate('edgeType' + d.type);
			return d;
		});

		this.nodes = (data.nodes || []).map((d: any) => {
			const sourceCnt = this.edges.filter((it: any) => { return it.source == d.id; }).length;
			const targetCnt = this.edges.filter((it: any) => { return it.target == d.id; }).length;

			d.layout = Number(d.layout) || 0;
			d.name = d.name || translate('defaultNamePage');
			d.shortName = Util.shorten(d.name, 16);
			d.radius = Math.max(5, Math.min(10, sourceCnt));
			d.isRoot = d.id == rootId;
			d.isOrphan = !targetCnt && !sourceCnt;
			d.src = this.imageSrc(d);

			// Clear icon props to fix image size
			if (d.layout == I.ObjectLayout.Task) {
				d.iconImage = '';
				d.iconEmoji = '';
			};

			return d;
		});

		this.tooltip = d3.select('#graph').append('div').attr('class', 'tooltip');

		this.canvas = d3.select('#graph').append('canvas')
		.attr('width', (this.width * density) + 'px')
		.attr('height', (this.height * density) + 'px')
		.node();

		const transfer = node.find('canvas').get(0).transferControlToOffscreen();

		this.worker = new Worker('workers/worker.js');
		this.worker.onerror = (e: any) => { console.log(e); };
		this.worker.addEventListener('message', (data) => { this.onMessage(data); });

		this.send('init', { 
			id: 'init',
			canvas: transfer, 
			width: this.width,
			height: this.height,
			density: density,
			nodes: this.nodes,
			edges: this.edges,
			forceProps: this.forceProps,
		}, [ transfer ]);

		this.initImages();

		d3.select(this.canvas)
        .call(d3.drag().
			subject(() => { return this.subject; }).
			on('start', (e: any, d: any) => this.onDragStart(e, d)).
			on('drag', (e: any, d: any) => this.onDragMove(e, d)).
			on('end', (e: any, d: any) => this.onDragEnd(e, d))
		)
        .call(this.zoom)
		.call(this.zoom.transform, d3.zoomIdentity.translate(-this.width, -this.height).scale(3))
		.on('click', (e: any) => {
			const p = d3.pointer(e);
			this.send('onClick', { x: p[0], y: p[1] });
		})
		.on('mousedown', (e: any) => {
			this.tooltip.style('display', 'none');
		})
		.on('mousemove', (e: any) => {
			const p = d3.pointer(e);
			this.send('onMouseMove', { x: p[0], y: p[1] });
		});
	};

	initImages () {
		this.nodes.map((d: any) => {
			if (this.images[d.src]) {
				return;
			};

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
		});
	};

	updateProps () {
		this.send('updateProps', { forceProps: this.forceProps } );
	};

	updateForces () {
		this.updateProps();
		this.send('updateForces', {});
	};

	onDragStart (e: any, d: any) {
		this.isDragging = true;
		this.send('onDragStart', { active: e.active });
		this.tooltip.style('display', 'none');
	};

	onDragMove (e: any, d: any) {
		const win = $(window);
		const p = d3.pointer(e, d3.select(this.canvas));
		const node = $(ReactDOM.findDOMNode(this));
		const offset = node.offset();

		this.send('onDragMove', { 
			subjectId: this.subject.id, 
			active: e.active, 
			x: p[0] - win.scrollLeft() - offset.left, 
			y: p[1] - win.scrollTop() - offset.top,
		});
		this.tooltip.style('display', 'none');
	};
			
	onDragEnd (e: any, d: any) {
		this.isDragging = false;
		this.subject = null;
		this.send('onDragEnd', { active: e.active });
	};

	onZoom ({ transform }) {
		this.send('onZoom', { transform: transform });
  	};

	onMessage ({ data }) {
		switch (data.id) {

			case 'onClick':
				if (data.node.id == blockStore.root) {
					break;
				};

				DataUtil.objectOpenPopup(data.node);
				break;

			case 'onMouseMove':
				const d = data.node;
				if (!this.isDragging) {
					this.subject = d;
				};

				if (d) {
					const type = dbStore.getObjectType(d.type);

					this.tooltip.
					style('display', 'block').
					style('left', data.x + 'px').
					style('top', data.y + 'px').
					html([ 
						`<b>Name:</b> ${Util.shorten(d.name, 52)}`,
						`<b>Type</b>: ${type ? type.name : translate('defaultNamePage')}`,
						`<b>Layout</b>: ${translate('layout' + d.layout)}`,
					].join('<br/>'));
				} else {
					this.tooltip.style('display', 'none');
				};
				break;

		};
	};

	imageSrc (d: any) {
		let src = '';

		if (d.id == blockStore.root) {
			return 'img/icon/home.svg';
		};

		switch (d.layout) {
			case I.ObjectLayout.Task:
				src = 'img/icon/task.svg';
				break;

			case I.ObjectLayout.File:
				src = `img/icon/file/${Util.fileIcon(d)}.svg`;
				break;

			case I.ObjectLayout.Image:
				if (d.id) {
					src = commonStore.imageUrl(d.id, 160);
				} else {
					src = `img/icon/file/${Util.fileIcon(d)}.svg`;
				};
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

		if (!src) {
			src = 'img/icon/page.svg';
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
		const wrapper = node.find('#graphWrapper');
		const density = window.devicePixelRatio;

		this.width = wrapper.width();
		this.height = wrapper.height();

		this.send('onResize', { width: this.width, height: this.height, density: density });
	};

});

export default Graph;