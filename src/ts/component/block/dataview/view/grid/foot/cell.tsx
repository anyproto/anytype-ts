import * as React from 'react';
import { observer } from 'mobx-react';
import { Select } from 'Component';
import { I, S, C, J, keyboard, Relation, Dataview, analytics, translate } from 'Lib';

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
	menuContext = null;
	state = {
		isEditing: false,
		result: null,
	};

	constructor (props: Props) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onClose = this.onClose.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { relationKey, rootId, block, getView } = this.props;
		const { isEditing, result } = this.state;
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
		const sections = this.getSections();
		const option = Relation.formulaByType(relation.format).find(it => it.id == String(viewRelation.formulaType));

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
								value="-"
								options={sections}
								arrowClassName="light"
								menuParam={{
									onOpen: this.onOpen,
									onClose: this.onClose,
									data: {
										noScroll: true, 
										noVirtualisation: true,
										onOver: this.onOver,
									},
								}}
							/>
						) : (
							<React.Fragment>
								<span className="name">{option.short || option.name}</span>
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

	onOpen (context: any): void {
		const { rootId, relationKey } = this.props;
		const relation = S.Record.getRelationByKey(relationKey);
		const object = S.Detail.get(rootId, rootId, []);

		this.menuContext = context;

		window.setTimeout(() => $(`.cell-key-${relationKey}`).addClass('cellKeyHover'), 10);
		analytics.event('ClickGridFormula', { format: relation.format, objectType: object.type });
	};

	onClose () {
		$(`.cellKeyHover`).removeClass('cellKeyHover');
		this.setEditing(false);
	};

	onOver (e: any, item: any) {
		if (!item.arrow) {
			S.Menu.closeAll([ 'select2' ]);
			return;
		};

		const { rootId, relationKey } = this.props;
		const relation = S.Record.getRelationByKey(relationKey);
		const options = Relation.formulaByType(relation.format).filter(it => it.section == item.id);

		S.Menu.closeAll([ 'select2' ], () => {
			S.Menu.open('select2', {
				component: 'select',
				element: `#${this.menuContext.getId()} #item-${item.id}`,
				offsetX: this.menuContext.getSize().width,
				vertical: I.MenuDirection.Center,
				isSub: true,
				data: {
					rootId,
					options,
					rebind: this.menuContext.ref.rebind,
					onSelect: (e: any, item: any) => {
						this.onChange(item.id);
						this.menuContext.close();
					},
				}
			});
		});
	};

	getSections () {
		const { relationKey } = this.props;
		const relation = S.Record.getRelationByKey(relationKey);
		const options = Relation.formulaByType(relation.format);

		return [
			{ id: I.FormulaSection.None, name: translate('formulaNone') },
		].concat([
			{ id: I.FormulaSection.Count, name: translate('formulaCount'), arrow: true },
			{ id: I.FormulaSection.Percent, name: translate('formulaPercentage'), arrow: true },
			{ id: I.FormulaSection.Math, name: translate('formulaMath'), arrow: true },
			{ id: I.FormulaSection.Date, name: translate('formulaDate'), arrow: true },
		].filter(s => {
			return options.filter(it => it.section == s.id).length;
		})).map(it => ({ ...it, id: String(it.id) }));
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