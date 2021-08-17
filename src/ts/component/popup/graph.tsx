import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, Util, DataUtil, SmileUtil } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import * as d3 from 'd3';

interface Props extends I.Popup {};

const fs = window.require('fs');
const { app } = window.require('electron').remote;
const $ = require('jquery');
const data = require('json/graph.json');
const path = window.require('path');
const userPath = app.getPath('userData');

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
		const fp = path.join(userPath, 'tmp');

		C.Export(fp, [], I.ExportFormat.GraphJson, false, (message: any) => {
			if (message.error.code) {
				return;
			};

			let content = fs.readFileSync(path.join(message.path, 'export.json'), 'UTF-8');
			let data = { edges: [], nodes: [] };

			try { data = JSON.parse(content); } catch (e) {};
			this.init(data);

			Util.deleteFolderRecursive(message.path);
		});
	};

	init (data: any) {
		const { getId } = this.props;
		const obj = $(`#${getId()} #innerWrap`);
		const node = $(ReactDOM.findDOMNode(this));
		const edges = data.edges.map(d => Object.create(d));
  		const nodes = data.nodes.map(d => Object.create(d));
		const width = obj.width();
		const height = obj.height();
		const transform = d3.zoomIdentity;

		for (let item of nodes) {
			this.weights[item.id] = {
				source: edges.filter((it: any) => { return it.source == item.id; }).length,
				target: edges.filter((it: any) => { return it.target == item.id; }).length,
			};
		};

  		const simulation = d3.forceSimulation(nodes)
		.force('link', d3.forceLink(edges).id(d => d.id).distance(20))
		.force('charge', d3.forceManyBody())
		.force('center', d3.forceCenter(width / 2, height / 2))
		.force('collision', d3.forceCollide(nodes).radius(d => this.radius(d)));

		const svg = d3.create('svg')
		.attr('viewBox', [ 0, 0, width, height ])
		.attr('width', width)
    	.attr('height', height)
		.call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', zoom));

		const group = svg.append('g')
		.call(d3.drag().on('drag', (d: any) => {
			d3.select(this)
			.attr('cx', d.x = d3.event.x)
			.attr('cy', d.y = d3.event.y);
		}));

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
		.attr('width', (d: any) => {
			let r = this.radius(d);
			if (d.iconImage) {
				r *= 2;
			};
			return r;
		})
		.attr('height', (d: any) => {
			let r = this.radius(d);
			if (d.iconImage) {
				r *= 2;
			};
			return r;
		})
		.attr('x', (d: any) => {
			let r = this.radius(d) / 2;
			if (d.iconImage) {
				r = 0;
			};
			return r;
		})
		.attr('y', (d: any) => {
			let r = this.radius(d) / 2;
			if (d.iconImage) {
				r = 0;
			};
			return r;
		})
		.attr('xlink:href', (d: any) => {
			let src = '';

			if (d.iconEmoji) {
				const data = SmileUtil.data(d.iconEmoji);
				if (data) {
					src = SmileUtil.srcFromColons(data.colons, data.skin);
				};
				src = src.replace(/^.\//, '');
			};
			if (d.iconImage) {
				src = commonStore.imageUrl(d.iconImage, this.radius(d) * 2);
			};
			if (!src) {
				console.log(d.id, d.name, d.type, d.layout);
				src = 'img/space.svg';
			};
			return src;
		})

		const link = group.append('g')
		.attr('stroke', '#eae9e0')
		.attr('stroke-opacity', 1)
		.attr('stroke-width', 1)
		.selectAll('line')
		.data(edges)
		.join('line')

		const el = group.append('g')
		.attr('stroke', '#fff')
		.attr('stroke-width', 1)
		.selectAll('g')
		.data(nodes)
		.join('g')
		.style('cursor', 'pointer')
		.on('click', (e: any, d: any) => {
			DataUtil.objectOpenPopup(d);
		})
		.on('mouseenter', function (e: any, d: any) {
			d3.select(this).select('#bg').style('fill', BG1);
		})
		.on('mouseleave', function (e: any, d: any) {
			d3.select(this).select('#bg').style('fill', BG0);
		})
		.call(this.drag(simulation));

		function zoom ({ transform }) {
			group.attr('transform', transform);
  		};

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
		const r = Math.max(8, Math.min(20, (this.weights[d.id].source + this.weights[d.id].target) / 2));
		return r;
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
			//d.fx = null;
			//d.fy = null;
		};

		return d3.drag()
		.on('start', dragStart)
		.on('drag', dragMove)
		.on('end', dragEnd);
	};
	
});

export default PopupGraph;