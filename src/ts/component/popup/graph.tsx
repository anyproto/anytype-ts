import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, Util, DataUtil, SmileUtil, translate } from 'ts/lib';
import { Label, Drag, Checkbox } from 'ts/component';
import { commonStore, blockStore, dbStore, authStore } from 'ts/store';
import { observer } from 'mobx-react';
import * as d3 from 'd3';

interface Props extends I.Popup {};

const $ = require('jquery');
const Constant = require('json/constant.json');

const BG = '#f3f2ec';

const PopupGraph = observer(class PopupGraph extends React.Component<Props, {}> {

	canvas: any = null;
	simulation: any = null;
	width: number = 0;
	height: number = 0;
	edges: any[] = [];
	nodes: any[] = [];
	weights: any = {};
	transform: any = null;
	zoom: any = null;
	worker: any = null;
	images: any = {};

	svg: any = null;
	group: any = null;
	link: any = null;
	node: any = null;
	tooltip: any = null;

	forceProps: any = {
		center: {
			x: 0.5,
			y: 0.5
		},
		charge: {
			enabled: true,
			strength: -30,
			distanceMin: 20,
			distanceMax: 200
		},
		collide: {
			enabled: true,
			strength: 0.1,
			iterations: 1,
			radius: 0.5
		},
		link: {
			enabled: true,
			strength: 0.1,
			distance: 20,
			iterations: 1
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
		markers: false,
	};

	render () {
		return (
			<div className="sides">
				<div id="graphWrapper" className="side left">
					<div id="graph" />
				</div>
				<div className="side right">
					<div className="section">
						<div className="name">Center</div>
						<div className="item">
							<Label id="center-x" text={`X: ${this.forceProps.center.x}`} />
							<Drag value={this.forceProps.center.x} onMove={(v: number) => { 
								this.forceProps.center.x = v; 
								this.updateLabel('center-x', `X: ${Math.ceil(v * 100) + '%'}`);
								this.updateForces();
							}} />

							<Label id="center-y" text={`Y: ${this.forceProps.center.y}`} />
							<Drag value={this.forceProps.center.y} onMove={(v: number) => { 
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
							<Drag value={(this.forceProps.charge.strength + 200) / 250} onMove={(v: number) => { 
								this.forceProps.charge.strength = v * 250 - 200; 
								this.updateLabel('charge-strength', `Strength: ${Math.ceil(v * 250 - 200)}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="charge-distanceMin" text={`Distance Min: ${this.forceProps.charge.distanceMin}`} />
							<Drag value={this.forceProps.charge.distanceMin / 50} onMove={(v: number) => { 
								this.forceProps.charge.distanceMin = v * 50;
								this.updateLabel('charge-distanceMin', `Distance Min: ${Math.ceil(v * 50)}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="charge-distanceMax" text={`Distance Max: ${this.forceProps.charge.distanceMax}`} />
							<Drag value={this.forceProps.charge.distanceMax / 2000} onMove={(v: number) => { 
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
							<Drag value={this.forceProps.collide.strength / 2} onMove={(v: number) => { 
								this.forceProps.collide.strength = v * 2; 
								this.updateLabel('collide-strength', `Strength: ${Math.ceil(v * 2 * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="collide-radius" text={`Radius: ${this.forceProps.collide.radius}`} />
							<Drag value={this.forceProps.collide.radius / 5} onMove={(v: number) => { 
								this.forceProps.collide.radius = v * 5;
								this.updateLabel('collide-radius', `Radius: ${Math.ceil(v * 5 * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="collide-iterations" text={`Iterations: ${this.forceProps.collide.iterations}`} />
							<Drag value={this.forceProps.collide.iterations / 10} onMove={(v: number) => { 
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
							<Drag value={this.forceProps.forceX.strength} onMove={(v: number) => { 
								this.forceProps.forceX.strengh = v;
								this.updateLabel('forceX-strengh', `Strength: ${Math.ceil(v * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="forceX-x" text={`X: ${this.forceProps.forceX.x}`} />
							<Drag value={this.forceProps.forceX.x} onMove={(v: number) => { 
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
							<Drag value={this.forceProps.forceY.strength} onMove={(v: number) => { 
								this.forceProps.forceY.strengh = v;
								this.updateLabel('forceY-strengh', `Strength: ${Math.ceil(v * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="forceY-x" text={`Y: ${this.forceProps.forceY.y}`} />
							<Drag value={this.forceProps.forceY.y} onMove={(v: number) => { 
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
							<Drag value={this.forceProps.link.distance / 100} onMove={(v: number) => { 
								this.forceProps.link.distance = v * 100;
								this.updateLabel('link-distance', `Distance: ${Math.ceil(v * 100)}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="link-strength" text={`Strength: ${this.forceProps.link.strength}`} />
							<Drag value={this.forceProps.link.strength} onMove={(v: number) => { 
								this.forceProps.link.strength = v; 
								this.updateLabel('link-strength', `Strength: ${Math.ceil(v * 1000) / 1000}`);
								this.updateForces();
							}} />
						</div>

						<div className="item">
							<Label id="link-iterations" text={`Iterations: ${this.forceProps.link.iterations}`} />
							<Drag value={this.forceProps.link.iterations / 10} onMove={(v: number) => { 
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
							}} />
							Show markers
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const filters: any[] = [
			{ 
				operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, 
				value: [ 
					Constant.typeId.relation,
					Constant.typeId.template,
					Constant.typeId.type,
					Constant.typeId.file,
					Constant.typeId.image,
					Constant.typeId.video,
				] 
			},
			{ 
				operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, 
				value: [
					'_anytype_profile',
					blockStore.profile,
					blockStore.storeType,
					blockStore.storeTemplate,
					blockStore.storeRelation,
				] 
			},
		];

		C.ObjectGraph(filters, 0, [], (message: any) => {
			if (message.error.code) {
				return;
			};

			this.edges = message.edges.filter(d => { return d.source !== d.target; });
			this.nodes = message.nodes;

			this.init();
		});
	};

	componentWillUnmount () {
		this.worker.terminate();
	};

	updateLabel (id: string, text: string) {
		const node = $(ReactDOM.findDOMNode(this));
		node.find(`#${id}`).text(text);
	};

	init () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { root } = blockStore;
		const node = $(ReactDOM.findDOMNode(this));
		const wrapper = node.find('#graphWrapper');
		const density = window.devicePixelRatio;

		this.width = wrapper.width();
		this.height = wrapper.height();
		this.transform = d3.zoomIdentity;
		this.zoom = d3.zoom().scaleExtent([ 1, 8 ]).on('zoom', e => this.onZoom(e));

		for (let item of this.nodes) {
			this.weights[item.id] = {
				source: this.edges.filter((it: any) => { return it.source == item.id; }).length,
				target: this.edges.filter((it: any) => { return it.target == item.id; }).length,
			};
		};

		this.edges = this.edges.map((d: any) => {
			d.type = Number(d.type) || 0;
			d.typeName = translate('edgeType' + d.type);

			d.bg = BG;
			if (d.type == I.EdgeType.Relation) {
				d.bg = '#4287f5';
			};
			return d;
		});

		this.nodes = this.nodes.map((d: any) => {
			const type = dbStore.getObjectType(d.type);

			d.bg = BG;
			d.typeName = type ? type.name : translate('defaultNamePage');
			d.layout = Number(d.layout) || 0;
			d.name = d.name || translate('defaultNamePage');
			d.radius = Math.max(5, Math.min(10, this.weights[d.id].source));
			d.isRoot = d.id == root;
			d.isOrphan = !this.weights[d.id].target && !this.weights[d.id].source;
			d.src = this.imageSrc(d);

			if (!type) {
				//d.bg = '#f55522';
			};

			if (rootId && (d.id == rootId)) {
				d.fx = this.width / 2;
				d.fy = this.height / 2;
				d.radius = 15;
				d.bg = '#ffb522';
			};
			return d;
		});

		this.canvas = d3.select('#graph').append('canvas')
		.attr('width', (this.width * density) + 'px')
		.attr('height', (this.height * density) + 'px')
		.node();

		const transfer = node.find('canvas').get(0).transferControlToOffscreen();

		this.simulation = d3.forceSimulation(this.nodes);
		this.initForces();

		this.worker = new Worker('workers/worker.js');
		this.worker.onerror = (e: any) => {
			console.log(e);
		};

		this.worker.postMessage({ 
			id: 'init',
			canvas: transfer, 
			width: this.width,
			height: this.height,
			density: density,
		}, [ transfer ]);

		this.nodes.map((d: any) => {
			if (this.images[d.src]) {
				return;
			};

			const img = new Image();

			img.onload = () => {
				createImageBitmap(img).then((res: any) => {
					this.images[d.src] = true;

					this.worker.postMessage({
						id: 'image',
						src: d.src,
						bitmap: res,
					});
				});
			};
			img.crossOrigin = '';
			img.src = d.src;
		});

		d3.select(this.canvas)
        .call(d3.drag().
			subject((e: any, d: any) => this.dragSubject(e, d)).
			on('start', (e: any, d: any) => this.onDragStart(e, d)).
			on('drag', (e: any, d: any) => this.onDragMove(e, d)).
			on('end', (e: any, d: any) => this.onDragEnd(e, d))
		)
        .call(this.zoom)
		.call(this.zoom.transform, d3.zoomIdentity.translate(-this.width, -this.height).scale(3))
		.on('click', (e: any) => {
			const p = d3.pointer(e);
  			const d = this.simulation.find(this.transform.invertX(p[0]), this.transform.invertY(p[1]), 10);

			if (d) {
				DataUtil.objectOpenPopup(d);
			};
		})
		.on('mousedown', (e: any) => {
			this.tooltip.style('display', 'none');
		})
		.on('mousemove', (e: any) => {
			const p = d3.pointer(e);
  			const d = this.simulation.find(this.transform.invertX(p[0]), this.transform.invertY(p[1]), 10);

			if (d) {
				this.tooltip.
				style('display', 'block').
				style('left', (e.x + 10) + 'px').
				style('top', (e.y + 10) + 'px').
				html([ 
					`<b>Name:</b> ${Util.shorten(d.name, 24)}`,
					`<b>Type</b>: ${d.typeName}`,
					`<b>Layout</b>: ${translate('layout' + d.layout)}`,
				].join('<br/>'));
			} else {
				this.tooltip.style('display', 'none');
			};
		});

		this.tooltip = d3.select('#graph').append('div').attr('class', 'tooltip');

		this.simulation.on('tick', () => { 
			this.worker.postMessage({ 
				id: 'draw', 
				nodes: this.nodes, 
				edges: this.forceProps.link.enabled ? this.edges : [],
				transform: this.transform,
			}); 
		});
	};

	initForces () {
    	this.simulation
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody())
        .force('collide', d3.forceCollide(this.nodes))
        .force('center', d3.forceCenter())
		.force('forceX', d3.forceX())
        .force('forceY', d3.forceY());

    	this.updateForces();
	};

	updateProps () {
		this.worker.postMessage({ 
			id: 'forceProps', 
			forceProps: this.forceProps,
		});
	};

	updateForces() {
		if (!this.simulation) {
			return;
		};

		this.simulation.force('center')
		.x(this.width * this.forceProps.center.x)
		.y(this.height * this.forceProps.center.y);

		this.simulation.force('charge')
		.strength(this.forceProps.charge.strength * this.forceProps.charge.enabled)
		.distanceMin(this.forceProps.charge.distanceMin)
		.distanceMax(this.forceProps.charge.distanceMax);

		this.simulation.force('collide')
		.strength(this.forceProps.collide.strength * this.forceProps.collide.enabled)
		.radius(10 * this.forceProps.collide.radius)
		.iterations(this.forceProps.collide.iterations);

		this.simulation.force('link')
		.id(d => d.id)
		.distance(this.forceProps.link.distance)
		.strength(this.forceProps.link.strength * this.forceProps.link.enabled)
		.iterations(this.forceProps.link.iterations)
		.links(this.forceProps.link.enabled ? this.edges : []);

		this.simulation.force('forceX')
        .strength(this.forceProps.forceX.strength * this.forceProps.forceX.enabled)
        .x(this.width * this.forceProps.forceX.x);

    	this.simulation.force('forceY')
        .strength(this.forceProps.forceY.strength * this.forceProps.forceY.enabled)
        .y(this.height * this.forceProps.forceY.y);

		this.simulation.alpha(1).restart();
	};

	dragSubject (e: any, d: any) {
    	let i = 0;
    	let x = this.transform.invertX(e.x);
    	let y = this.transform.invertY(e.y);
    	let dx = 0;
    	let dy = 0;

		for (i = this.nodes.length - 1; i >= 0; --i) {
			let node = this.nodes[i];
			dx = x - node.x;
			dy = y - node.y;

			if (dx * dx + dy * dy < 25) {
				node.x = this.transform.applyX(node.x);
				node.y = this.transform.applyY(node.y);
				return node;
			};
		};
	};

	onDragStart (e: any, d: any) {
		if (!e.active) {
			this.simulation.alphaTarget(0.3).restart();
		};

		e.subject.fx = this.transform.invertX(e.x);
    	e.subject.fy = this.transform.invertY(e.y);

		this.tooltip.style('display', 'none');
	};

	onDragMove (e: any, d: any) {
		e.subject.fx = this.transform.invertX(e.x);
    	e.subject.fy = this.transform.invertY(e.y);

		this.tooltip.style('display', 'none');
	};
			
	onDragEnd (e: any, d: any) {
		if (!e.active) {
			this.simulation.alphaTarget(0);
		};
		//d.fx = null;
		//d.fy = null;
	};

	onZoom (e: any) {
		this.transform = e.transform;
  	};

	imageSrc (d: any) {
		let src = '';

		switch (d.layout) {
			case I.ObjectLayout.Task:
				src = 'img/icon/task.svg';
				break;

			case I.ObjectLayout.File:
				src = `img/icon/file/${Util.fileIcon(d)}.svg`;
				break;

			case I.ObjectLayout.Image:
				if (d.id) {
					src = commonStore.imageUrl(d.id, d.radius * 2);
				} else {
					src = `img/icon/file/${Util.fileIcon(d)}.svg`;
				};
				break;

			default:
				if (d.iconImage) {
					src = commonStore.imageUrl(d.iconImage, d.radius * 2);
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

});

export default PopupGraph;