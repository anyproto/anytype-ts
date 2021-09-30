import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, crumbs, Util, history } from 'ts/lib';
import { RouteComponentProps } from 'react-router';
import { HeaderMainGraph as Header, Graph, Label, Drag, Filter, Checkbox } from 'ts/component';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	matchPopup?: any;
};

const Constant = require('json/constant.json');
const $ = require('jquery');

const PageMainGraph = observer(class PageMainGraph extends React.Component<Props, {}> {

	data: any = {
		nodes: [],
		edges: [],
	};
	refHeader: any = null;
	refGraph: any = null;

	render () {
		const { isPopup } = this.props;
		const rootId = this.getRootId();

		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />
				<div className="sides">
					<div className="side left">
						<Graph 
							ref={(ref: any) => { this.refGraph = ref; }} 
							rootId={rootId} 
							data={this.data}
							{...this.props} 
						/>
					</div>
					<div className="side right">
						{this.refGraph ? (
							<React.Fragment>
								<div className="section">
									<div className="name">Filter</div>
									<div className="item">
										<Filter onChange={(v: string) => {
											this.refGraph.forceProps.filter = v ? new RegExp(Util.filterFix(v), 'gi') : '';
											this.refGraph.updateProps();
										}} />
									</div>
								</div>

								<div className="section">
									<div className="name">Center</div>
									<div className="item">
										<Label id="center-x" text={`X: ${this.refGraph.forceProps.center.x}`} />
										<Drag value={this.refGraph.forceProps.center.x} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.center.x = v; 
											this.updateLabel('center-x', `X: ${Math.ceil(v * 100) + '%'}`);
											this.refGraph.updateForces();
										}} />

										<Label id="center-y" text={`Y: ${this.refGraph.forceProps.center.y}`} />
										<Drag value={this.refGraph.forceProps.center.y} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.center.y = v; 
											this.updateLabel('center-y', `Y: ${Math.ceil(v * 100) + '%'}`);
											this.refGraph.updateForces();
										}} />
									</div>
								</div>

								<div className="section">
									<div className="name">
										<Checkbox value={this.refGraph.forceProps.charge.enabled} onChange={(e: any, v: any) => {
											this.refGraph.forceProps.charge.enabled = v;
											this.refGraph.updateForces();
										}} />
										Charge
									</div>
									<div className="item">
										<Label id="charge-strength" text={`Strength: ${this.refGraph.forceProps.charge.strength}`} />
										<Drag value={(this.refGraph.forceProps.charge.strength + 200) / 250} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.charge.strength = v * 250 - 200; 
											this.updateLabel('charge-strength', `Strength: ${Math.ceil(v * 250 - 200)}`);
											this.refGraph.updateForces();
										}} />
									</div>

									<div className="item">
										<Label id="charge-distanceMin" text={`Distance Min: ${this.refGraph.forceProps.charge.distanceMin}`} />
										<Drag value={this.refGraph.forceProps.charge.distanceMin / 50} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.charge.distanceMin = v * 50;
											this.updateLabel('charge-distanceMin', `Distance Min: ${Math.ceil(v * 50)}`);
											this.refGraph.updateForces();
										}} />
									</div>

									<div className="item">
										<Label id="charge-distanceMax" text={`Distance Max: ${this.refGraph.forceProps.charge.distanceMax}`} />
										<Drag value={this.refGraph.forceProps.charge.distanceMax / 2000} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.charge.distanceMax = v * 2000;
											this.updateLabel('charge-distanceMax', `Distance Max: ${Math.ceil(v * 2000)}`);
											this.refGraph.updateForces();
										}} />
									</div>
								</div>

								<div className="section">
									<div className="name">
										<Checkbox value={this.refGraph.forceProps.collide.enabled} onChange={(e: any, v: any) => {
											this.refGraph.forceProps.collide.enabled = v;
											this.refGraph.updateForces();
										}} />
										Collide
									</div>
									<div className="item">
										<Label id="collide-strength" text={`Strength: ${this.refGraph.forceProps.collide.strength}`} />
										<Drag value={this.refGraph.forceProps.collide.strength / 2} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.collide.strength = v * 2; 
											this.updateLabel('collide-strength', `Strength: ${Math.ceil(v * 2 * 1000) / 1000}`);
											this.refGraph.updateForces();
										}} />
									</div>

									<div className="item">
										<Label id="collide-radius" text={`Radius: ${this.refGraph.forceProps.collide.radius}`} />
										<Drag value={this.refGraph.forceProps.collide.radius / 5} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.collide.radius = v * 5;
											this.updateLabel('collide-radius', `Radius: ${Math.ceil(v * 5 * 1000) / 1000}`);
											this.refGraph.updateForces();
										}} />
									</div>

									<div className="item">
										<Label id="collide-iterations" text={`Iterations: ${this.refGraph.forceProps.collide.iterations}`} />
										<Drag value={this.refGraph.forceProps.collide.iterations / 10} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.collide.iterations = v * 10;
											this.updateLabel('collide-iterations', `Iterations: ${Math.ceil(v * 10)}`);
											this.refGraph.updateForces();
										}} />
									</div>
								</div>

								<div className="section">
									<div className="name">
										<Checkbox value={this.refGraph.forceProps.forceX.enabled} onChange={(e: any, v: any) => {
											this.refGraph.forceProps.forceX.enabled = v;
											this.refGraph.updateForces();
										}} />
										Force X
									</div>

									<div className="item">
										<Label id="forceX-strengh" text={`Strength: ${this.refGraph.forceProps.forceX.strength}`} />
										<Drag value={this.refGraph.forceProps.forceX.strength} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.forceX.strengh = v;
											this.updateLabel('forceX-strengh', `Strength: ${Math.ceil(v * 1000) / 1000}`);
											this.refGraph.updateForces();
										}} />
									</div>

									<div className="item">
										<Label id="forceX-x" text={`X: ${this.refGraph.forceProps.forceX.x}`} />
										<Drag value={this.refGraph.forceProps.forceX.x} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.forceX.x = v;
											this.updateLabel('forceX-x', `X: ${Math.ceil(v * 1000) / 1000}`);
											this.refGraph.updateForces();
										}} />
									</div>
								</div>

								<div className="section">
									<div className="name">
										<Checkbox value={this.refGraph.forceProps.forceY.enabled} onChange={(e: any, v: any) => {
											this.refGraph.forceProps.forceY.enabled = v;
											this.refGraph.updateForces();
										}} />
										Force Y
									</div>

									<div className="item">
										<Label id="forceY-strengh" text={`Strength: ${this.refGraph.forceProps.forceY.strength}`} />
										<Drag value={this.refGraph.forceProps.forceY.strength} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.forceY.strengh = v;
											this.updateLabel('forceY-strengh', `Strength: ${Math.ceil(v * 1000) / 1000}`);
											this.refGraph.updateForces();
										}} />
									</div>

									<div className="item">
										<Label id="forceY-x" text={`Y: ${this.refGraph.forceProps.forceY.y}`} />
										<Drag value={this.refGraph.forceProps.forceY.y} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.forceY.y = v;
											this.updateLabel('forceY-y', `Y: ${Math.ceil(v * 1000) / 1000}`);
											this.refGraph.updateForces();
										}} />
									</div>
								</div>

								<div className="section">
									<div className="name">
										<Checkbox value={this.refGraph.forceProps.link.enabled} onChange={(e: any, v: any) => {
											this.refGraph.forceProps.link.enabled = v;
											this.refGraph.updateForces();
										}} />
										Link
									</div>

									<div className="item">
										<Label id="link-distance" text={`Distance: ${this.refGraph.forceProps.link.distance}`} />
										<Drag value={this.refGraph.forceProps.link.distance / 100} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.link.distance = v * 100;
											this.updateLabel('link-distance', `Distance: ${Math.ceil(v * 100)}`);
											this.refGraph.updateForces();
										}} />
									</div>

									<div className="item">
										<Label id="link-strength" text={`Strength: ${this.refGraph.forceProps.link.strength}`} />
										<Drag value={this.refGraph.forceProps.link.strength} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.link.strength = v; 
											this.updateLabel('link-strength', `Strength: ${Math.ceil(v * 1000) / 1000}`);
											this.refGraph.updateForces();
										}} />
									</div>

									<div className="item">
										<Label id="link-iterations" text={`Iterations: ${this.refGraph.forceProps.link.iterations}`} />
										<Drag value={this.refGraph.forceProps.link.iterations / 10} onMove={(e: any, v: number) => { 
											this.refGraph.forceProps.link.iterations = v * 10;
											this.updateLabel('link-iterations', `Iterations: ${Math.ceil(v * 10)}`);
											this.refGraph.updateForces();
										}} />
									</div>
								</div>

								<div className="section">
									<div className="name">Flags</div>
									<div className="item">
										<Checkbox value={this.refGraph.forceProps.orphans} onChange={(e: any, v: any) => {
											this.refGraph.forceProps.orphans = v;
											this.refGraph.updateProps();
										}} />
										Show orphans
									</div>
									<div className="item">
										<Checkbox value={this.refGraph.forceProps.markers} onChange={(e: any, v: any) => {
											this.refGraph.forceProps.markers = v;
											this.refGraph.updateProps();
										}} />
										Show markers
									</div>
									<div className="item">
										<Checkbox value={this.refGraph.forceProps.labels} onChange={(e: any, v: any) => {
											this.refGraph.forceProps.labels = v;
											this.refGraph.updateProps();
										}} />
										Show labels
									</div>
									<div className="item">
										<Checkbox value={this.refGraph.forceProps.links} onChange={(e: any, v: any) => {
											this.refGraph.forceProps.links = v;
											this.refGraph.updateProps();
										}} />
										Show links
									</div>
									<div className="item">
										<Checkbox value={this.refGraph.forceProps.relations} onChange={(e: any, v: any) => {
											this.refGraph.forceProps.relations = v;
											this.refGraph.updateProps();
										}} />
										Show relations
									</div>
								</div>
							</React.Fragment>
						) : ''}
						</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		this.load();

		crumbs.addPage(this.getRootId());
	};

	componentDidUpdate () {
		this.resize();
	};

	load () {
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

			this.data.edges = message.edges.filter(d => { return d.source !== d.target; });
			this.data.nodes = message.nodes;
			
			this.forceUpdate();
			this.refGraph.init();
		});
	};

	updateLabel (id: string, text: string) {
		const node = $(ReactDOM.findDOMNode(this));
		node.find(`#${id}`).text(text);
	};

	resize () {
		const { isPopup } = this.props;
		
		if (isPopup) {
			const obj = $('#popupPage .content');
			obj.css({ minHeight: 'unset', height: '100%' });
		};
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

});

export default PageMainGraph;