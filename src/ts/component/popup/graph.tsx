import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, Util, DataUtil, SmileUtil, translate } from 'ts/lib';
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

	render () {
		return (
			<div>
				<div id="graph" />
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

			this.init(data);
			Util.deleteFolderRecursive(message.path);
		});
	};

	init ({ edges, nodes }) {
		edges = edges.map(d => Object.create(d));
  		nodes = nodes.map(d => Object.create(d));

		const { getId } = this.props;
		const { root } = blockStore;
		const obj = $(`#${getId()} #innerWrap`);
		const node = $(ReactDOM.findDOMNode(this));
		const width = obj.width();
		const height = obj.height();
		const transform = d3.zoomIdentity.translate(-width / 2, -height / 2).scale(2);
		const zoom = d3.zoom().scaleExtent([ 1, 8 ]).on('zoom', onZoom);

		let group: any = null;
		let weights: any = {};

		for (let item of nodes) {
			weights[item.id] = {
				source: edges.filter((it: any) => { return it.source == item.id; }).length,
				target: edges.filter((it: any) => { return it.target == item.id; }).length,
			};
		};

		nodes = nodes.map((d: any) => {
			const type = dbStore.getObjectType(d.type);

			d.type = type ? type.name : translate('defaultNamePage');
			d.layout = Number(d.layout) || 0;
			d.name = d.name || translate('defaultNamePage');
			d.radius = Math.max(5, Math.min(10, weights[d.id].source));

			if (d.id == root) {
				d.radius = 15;
			};
			return d;
		});

  		const simulation = d3.forceSimulation(nodes)
		.force('link', d3.forceLink(edges).id(d => d.id).distance(10))
		.force('charge', d3.forceManyBody().strength(-20))
		.force('center', d3.forceCenter(width / 2, height / 2))
		.force('collision', d3.forceCollide(nodes).radius(d => d.radius * 1.5));

		const svg = d3.select("#graph").append('svg')
		.attr('viewBox', [ 0, 0, width, height ])
		.attr('width', width)
    	.attr('height', height)
		.call(zoom)
		.call(zoom.transform, transform);

		group = svg.append('g')
		.attr('transform', transform)
		.call(d3.drag().on('drag', (e: any, d: any) => {
			d3.select(this)
			.attr('cx', d.x = e.x)
			.attr('cy', d.y = e.y);
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

		const link = group.append('g')
		.attr('stroke', BG0)
		.attr('stroke-opacity', 1)
		.attr('stroke-width', 0.5)
		.selectAll('line')
		.data(edges)
		.join('line');

		const el = group.append('g')
		.selectAll('g')
		.data(nodes)
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
				`<b>Type</b>: ${d.type}`,
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
					simulation.alphaTarget(0.3).restart();
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
					simulation.alphaTarget(0);
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

		const rn = nodes.find((d: any) => { return d.id == root; });

		simulation.on('tick', () => {
			rn.x = width / 2;
          	rn.y = height / 2;

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

		node.find('#graph').append(svg.node());
	};

});

export default PopupGraph;