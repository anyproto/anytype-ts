import * as React from 'react';
import { observer } from 'mobx-react';
import { Select } from 'Component';
import { I, S, C, J, keyboard, Relation, Dataview, analytics } from 'Lib';

interface Props extends I.ViewComponent, I.ViewRelation {
	rootId?: string;
	block?: I.Block;
};

interface State {
	isEditing: boolean;
	result: any;
};

const FootCell = observer(class FootCell extends React.Component<Props, State> {

	node = null;
	state = {
		isEditing: false,
		result: null,
	};

	constructor (props: Props) {
		super(props);

		this.onChange = this.onChange.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { relationKey, rootId, block, getView } = this.props;
		const { isEditing, result } = this.state;
		const object = S.Detail.get(rootId, rootId, []);
		const relation = S.Record.getRelationByKey(relationKey);
		const view = getView();

		if (!relation || !view) {
			return null;
		};

		// Subscriptions
		const viewRelation = view.getRelation(relationKey);
		if (!viewRelation) {
			return null;
		};

		const cn = [ 'cellFoot', `cell-key-${relationKey}` ];
		const options = Relation.formulaByType(relation.format);
		const option = options.find(it => it.id == String(viewRelation.formulaType));

		if (viewRelation.formulaType != I.FormulaType.None) {
			const subId = S.Record.getSubId(rootId, block.id);
			const records = S.Record.getRecords(subId, [ relationKey ], true);

			records.forEach(record => {
				const value = record[relationKey];
			});
		};

		return (
			<div 
				ref={ref => this.node = ref}
				id={Relation.cellId('foot', relationKey, '')} 
				className={cn.join(' ')}
				onClick={() => this.setEditing(true)}
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}
			>
				<div className="cellContent">
					<div className="flex">
						{isEditing || (result === null) ? (
							<Select 
								id={`grid-foot-select-${relationKey}-${block.id}`} 
								value={String(viewRelation.formulaType)} 
								options={options}
								onChange={this.onChange}
								arrowClassName="light"
								menuParam={{
									onOpen: () => {
										window.setTimeout(() => $(`.cell-key-${relationKey}`).addClass('cellKeyHover'), 0);

										analytics.event('ClickGridFormula', { format: relation.format, objectType: object.type });
									},
									onClose: () => $(`.cellKeyHover`).removeClass('cellKeyHover'),
									data: { noScroll: true, noVirtualisation: true },
								}}
							/>
						) : (
							<React.Fragment>
								<span className="name">{option.name}</span>
								{result}
							</React.Fragment>
						)}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		this.calculate();
	};

	componentDidUpdate (): void {
		this.calculate();
	};

	setEditing (isEditing: boolean): void {
		this.setState({ isEditing });
	};

	calculate () {
		const { rootId, block, relationKey, getView, isInline } = this.props;
		const view = getView();
		const viewRelation = view.getRelation(relationKey);
		const subId = isInline ? [ rootId, block.id, 'total' ].join('-') : S.Record.getSubId(rootId, block.id);
		const result = Dataview.getFormulaResult(subId, relationKey, viewRelation);

		if (this.state.result !== result) {
			this.state.result = result;
			this.setState({ result });
		};
	};

	onChange (id: string): void {
		const { rootId, block, relationKey, getView } = this.props;
		const view = getView();
		const item = view.getRelation(relationKey);
		const relation = S.Record.getRelationByKey(relationKey);
		const object = S.Detail.get(rootId, rootId, []);

		C.BlockDataviewViewRelationReplace(rootId, block.id, view.id, item.relationKey, { 
			...item, 
			formulaType: Number(id) || 0,
		}, () => this.setEditing(false));

		analytics.event('ChangeGridFormula', { type: id, format: relation.format, objectType: object.type });
	};

	onMouseEnter (): void {
		const { block, relationKey } = this.props;

		if (!keyboard.isDragging) {
			$(`#block-${block.id} .cell-key-${relationKey}`).addClass('cellKeyHover');
		};
	};

	onMouseLeave () {
		$('.cellKeyHover').removeClass('cellKeyHover');
	};

});

export default FootCell;