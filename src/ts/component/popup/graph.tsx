import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';
import * as d3 from 'd3';

interface Props extends I.Popup {};

const $ = require('jquery');
const data = require('json/graph.json');

const BG0 = '#f3f2ec';
const BG1 = '#f0efe9';

const PopupGraph = observer(class PopupGraph extends React.Component<Props, {}> {

	weights: any = {};

	render () {
		return (
			<div />
		);
	};

	componentDidMount () {
		const node = $(ReactDOM.findDOMNode(this));
		const links = data.links.map(d => Object.create(d));
  		const nodes = data.nodes.map(d => Object.create(d));
		const width = 600;
		const height = 600;

		for (let item of nodes) {
			this.weights[item.id] = {
				source: data.links.filter((it: any) => { return it.source == item.id; }).length,
				target: data.links.filter((it: any) => { return it.target == item.id; }).length,
			};
		};

  		const simulation = d3.forceSimulation(nodes)
		.force('link', d3.forceLink(links).id(d => d.id).distance(200))
		.force('charge', d3.forceManyBody())
		.force('center', d3.forceCenter(width / 2, height / 2));

		const svg = d3.create('svg')
		.attr('viewBox', [ 0, 0, width, height ]);

		svg.append('svg:defs')
		.selectAll('pattern')
		.data(nodes)
		.join('svg:pattern')
		.attr('id', d => d.id)
		.attr('patternUnits', 'objectBoundingBox')
		.attr('width', '1')
		.attr('height', '1')
		.append('svg:image')
		.attr('preserveAspectRatio', 'xMidYMid slice')
		.attr('width', d => this.radius(d))
		.attr('height', d => this.radius(d))
		.attr('x', d => this.radius(d) / 2)
		.attr('y', d => this.radius(d) / 2)
		.attr('xlink:href', (d: any) => { return 'img/emoji/1f3d5.png'; })

		const link = svg.append('g')
		.attr('stroke', '#eae9e0')
		.attr('stroke-opacity', 1)
		.attr('stroke-width', 1)
		.selectAll('line')
		.data(links)
		.join('line')

		const el = svg.append('g')
		.attr('stroke', '#fff')
		.attr('stroke-width', 1)
		.selectAll('g')
		.data(nodes)
		.join('g')
		.style('cursor', 'pointer')
		.on('click', (e: any, d: any) => {
			console.log(d.id);
		})
		.on('mouseenter', function (e: any, d: any) {
			d3.select(this).select('#bg').style('fill', BG1);
		})
		.on('mouseleave', function (e: any, d: any) {
			d3.select(this).select('#bg').style('fill', BG0);
		})
		.call(this.drag(simulation));

		const bg = el.append('circle')
		.style('fill', BG0)
		.attr('id', 'bg')
		.attr('r', d => this.radius(d));

		const img = el.append('circle')
		.attr('r', d => this.radius(d))
		.style('fill', (d: any) => { return `url(#${d.id})`; });
		
		simulation.on('tick', () => {
			link
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
		});

		node.append(svg.node());
	};

	radius (d: any) {
		return Math.max(5, Math.min(20, (this.weights[d.id].source + this.weights[d.id].target) / 2));
	};

	drag (simulation: any) {
  
		function dragStart (e: any, d: any) {
			if (!e.active) {
				simulation.alphaTarget(0.3).restart();
			};
			d.fx = d.x;
			d.fy = d.y;
		};
		
		function dragMove (e: any, d: any) {
			d.fx = e.x;
			d.fy = e.y;
		};
		
		function dragEnd (e: any, d: any) {
			if (!e.active) {
				simulation.alphaTarget(0);
			};
			d.fx = null;
			d.fy = null;
		};

		return d3.drag()
		.on('start', dragStart)
		.on('drag', dragMove)
		.on('end', dragEnd);
	};
	
});

export default PopupGraph;