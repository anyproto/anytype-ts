import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, Util, DataUtil, SmileUtil, translate } from 'ts/lib';
import { Label, Drag, Checkbox } from 'ts/component';
import { commonStore, blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import * as d3 from 'd3';

interface Props extends I.Popup {};

const fs = window.require('fs');
const { app } = window.require('electron').remote;
const $ = require('jquery');
const path = window.require('path');
const userPath = app.getPath('userData');

const BG0 = '#f3f2ec';
const BG1 = '#f0efe9';

const PopupGraph = observer(class PopupGraph extends React.Component<Props, {}> {

	simulation: any = null;
	width: number = 0;
	height: number = 0;
	edges: any[] = [];
	nodes: any[] = [];

	link: any = null;

	forceProps: any = {
		center: {
			x: 0.5,
			y: 0.5
		},
		charge: {
			enabled: true,
			strength: -30,
			distanceMin: 1,
			distanceMax: 2000
		},
		collide: {
			enabled: true,
			strength: 0.7,
			iterations: 1,
			radius: 1.5
		},
		link: {
			enabled: true,
			distance: 30,
			iterations: 1
		},
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
							<Checkbox value={this.forceProps.link.enabled} onChange={(e: any, v: any) => {
								this.forceProps.link.enabled = v;
								this.updateForces();
								this.updateDisplay();
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
							<Label id="link-iterations" text={`Iterations: ${this.forceProps.link.iterations}`} />
							<Drag value={this.forceProps.link.iterations / 10} onMove={(v: number) => { 
								this.forceProps.link.iterations = v * 10;
								this.updateLabel('link-iterations', `Iterations: ${Math.ceil(v * 10)}`);
								this.updateForces();
							}} />
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const fp = path.join(userPath, 'tmp');

		C.Export(fp, [], I.ExportFormat.GraphJson, false, (message: any) => {
			if (message.error.code) {
				return;
			};

			let content = fs.readFileSync(path.join(message.path, 'export.json'), 'UTF-8');
			let data = { edges: [], nodes: [] };

			try { data = JSON.parse(content); } catch (e) {};

			this.edges = data.edges.map(d => Object.create(d));
			this.nodes = data.nodes.map(d => Object.create(d));
			this.init();

			Util.deleteFolderRecursive(message.path);
		});
	};

	updateLabel (id: string, text: string) {
		const node = $(ReactDOM.findDOMNode(this));
		node.find(`#${id}`).text(text);
	};

	init () {
		const { root } = blockStore;
		const node = $(ReactDOM.findDOMNode(this));
		const wrapper = node.find('#graphWrapper');

		this.width = wrapper.width();
		this.height = wrapper.height();

		const transform = d3.zoomIdentity.translate(-this.width / 2, -this.height / 2).scale(2);
		const zoom = d3.zoom().scaleExtent([ 1, 8 ]).on('zoom', onZoom);

		let group: any = null;
		let weights: any = {};

		for (let item of this.nodes) {
			weights[item.id] = {
				source: this.edges.filter((it: any) => { return it.source == item.id; }).length,
				target: this.edges.filter((it: any) => { return it.target == item.id; }).length,
			};
		};

		this.edges = this.edges.map((d: any) => {
			d.type = Number(d.type) || 0;
			d.typeName = translate('edgeType' + d.type);
			return d;
		});

		this.nodes = this.nodes.map((d: any) => {
			const type = dbStore.getObjectType(d.type);

			d.typeName = type ? type.name : translate('defaultNamePage');
			d.layout = Number(d.layout) || 0;
			d.name = d.name || translate('defaultNamePage');
			d.radius = Math.max(5, Math.min(10, weights[d.id].source));

			if (d.id == root) {
				d.radius = 15;
			};
			return d;
		});

  		this.simulation = d3.forceSimulation(this.nodes);
		this.initForces();

		const svg = d3.select("#graph").append('svg')
		.attr('viewBox', [ 0, 0, this.width, this.height ])
		.attr('width', this.width)
    	.attr('height', this.height)
		.call(zoom)
		.call(zoom.transform, transform);

		group = svg.append('g')
		.attr('transform', transform)
		.call(d3.drag().on('drag', (e: any, d: any) => {
			if (d) {
				d3.select(this)
				.attr('cx', d.x = e.x)
				.attr('cy', d.y = e.y);
			};
		}));

		svg.append('svg:defs')
		.selectAll('pattern')
		.data(this.nodes)
		.join('svg:pattern')
		.attr('id', d => d.id)
		.attr('patternUnits', 'objectBoundingBox')
		.attr('width', '1')
		.attr('height', '1')
		.append('svg:image')
		.attr('preserveAspectRatio', 'xMidYMid slice')
		.attr('width', (d: any) => {
			let r = d.radius;
			if (d.iconImage) {
				r *= 2;
			};
			return r;
		})
		.attr('height', (d: any) => {
			let r = d.radius;
			if (d.iconImage) {
				r *= 2;
			};
			return r;
		})
		.attr('x', (d: any) => {
			let r = d.radius / 2;
			if (d.iconImage) {
				r = 0;
			};
			return r;
		})
		.attr('y', (d: any) => {
			let r = d.radius / 2;
			if (d.iconImage) {
				r = 0;
			};
			return r;
		})
		.attr('xlink:href', (d: any) => {
			let src = '';

			switch (d.layout) {
				case I.ObjectLayout.Task:
					src = 'img/icon/task.svg';
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
		});

		const tooltip = d3.select("#graph")
  		.append('div')
		.attr('class', 'tooltip');

		this.link = group.append('g')
		.attr('stroke-opacity', this.forceProps.link.enabled ? 1 : 0)
		.attr('stroke-width', 0.5)
		.selectAll('line')
		.data(this.edges)
		.join('line')
		.attr('stroke', (d: any) => {
			let r = BG0;
			if (!d.type) {
				r = '#4287f5';
			};
			return r;
		})
		.on('mouseenter', function (e: any, d: any) {
			d3.select(this).style('stroke-width', 1.5);

			tooltip.style('display', 'block').
			html([ 
				`<b>Name:</b> ${Util.shorten(d.name, 24)}`,
				`<b>Type</b>: ${d.typeName}`,
			].join('<br/>'));
		})
		.on('mousemove', (e: any) => {
			tooltip.
			style('top', (e.pageY + 10) + 'px').
			style('left', (e.pageX + 10) + 'px');
		})
		.on('mouseleave', function (e: any, d: any) {
			d3.select(this).style('stroke-width', 0.5);
			tooltip.style('display', 'none');
		});

		const el = group.append('g')
		.selectAll('g')
		.data(this.nodes)
		.join('g')
		.style('cursor', 'pointer')
		.on('click', (e: any, d: any) => {
			DataUtil.objectOpenPopup(d);
		})
		.on('mouseenter', function (e: any, d: any) {
			d3.select(this).select('#bg').style('fill', BG1);
			
			tooltip.style('display', 'block').
			html([ 
				`<b>Name:</b> ${Util.shorten(d.name, 24)}`,
				`<b>Type</b>: ${d.typeName}`,
				`<b>Layout</b>: ${translate('layout' + d.layout)}`,
			].join('<br/>'));
		})
		.on('mousemove', (e: any) => {
			tooltip.
			style('top', (e.pageY + 10) + 'px').
			style('left', (e.pageX + 10) + 'px');
		})
		.on('mouseleave', function (e: any, d: any) {
			d3.select(this).select('#bg').style('fill', BG0);
			tooltip.style('display', 'none');
		})
		.call(d3.drag()
			.on('start', (e: any, d: any) => {
				if (!e.active) {
					this.simulation.alphaTarget(0.3).restart();
				};
				d.fx = d.x;
				d.fy = d.y;

				tooltip.style('display', 'none');
			})
			.on('drag', (e: any, d: any) => {
				d.fx = e.x;
				d.fy = e.y;

				tooltip.style('display', 'none');
			})
			.on('end', (e: any, d: any) => {
				if (!e.active) {
					this.simulation.alphaTarget(0);
				};
				//d.fx = null;
				//d.fy = null;
			})
		);

		function onZoom ({ transform }) {
			if (group) {
				group.attr('transform', transform);
			};
  		};

		const bg = el.append('circle')
		.attr('stroke', BG0)
		.attr('stroke-opacity', 1)
		.attr('stroke-width', 0.5)
		.style('fill', BG0)
		.attr('id', 'bg')
		.attr('r', d => d.radius);

		const img = el.append('circle')
		.attr('r', d => d.radius)
		.style('fill', (d: any) => { return `url(#${d.id})`; });

		const text = el.append('text')
		.attr('class', 'graphLabel')
		.attr('fill', '#929082')
        .style('text-anchor', 'middle')
        .text(d => Util.shorten(d.name, 10));

		const rn = this.nodes.find((d: any) => { return d.id == root; });

		this.simulation.on('tick', () => {
			rn.x = this.width / 2;
          	rn.y = this.height / 2;

			this.link
			.attr('x1', d => d.source.x)
			.attr('y1', d => d.source.y)
			.attr('x2', d => d.target.x)
			.attr('y2', d => d.target.y);

			bg
			.attr('cx', d => d.x)
			.attr('cy', d => d.y);

			img
			.attr('cx', d => d.x)
			.attr('cy', d => d.y);

			text
			.attr('x', d => d.x)
			.attr('y', d => d.y + d.radius + 3);
		});

		node.find('#graph').append(svg.node());
	};

	initForces () {
    	this.simulation
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody())
        .force('collide', d3.forceCollide(this.nodes))
        .force('center', d3.forceCenter())

    	this.updateForces();
	};

	updateDisplay () {
		this.link
        .attr('opacity', this.forceProps.link.enabled ? 1 : 0);
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
		.radius(d => d.radius * this.forceProps.collide.radius)
		.iterations(this.forceProps.collide.iterations);

		this.simulation.force('link')
		.id(d => d.id)
		.distance(this.forceProps.link.distance)
		.iterations(this.forceProps.link.iterations)
		.links(this.forceProps.link.enabled ? this.edges : []);

		this.simulation.alpha(1).restart();
	};

});

export default PopupGraph;