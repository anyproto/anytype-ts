import * as React from 'react';
import { observer } from 'mobx-react';
import { Select } from 'Component';
import { I, S, C, U, keyboard, Relation, Dataview, analytics } from 'Lib';

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
	refSelect = null;

	state = {
		isEditing: false,
		result: null,
	};

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
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
			return <div />;
		};

		// Subscriptions
		const viewRelation = view.getRelation(relationKey);
		if (!viewRelation || (viewRelation.formulaType == I.FormulaType.None)) {
			return <div />;
		};

		const cn = [ 'cellFoot', `cell-key-${relationKey}` ];
		const sections = U.Menu.getFormulaSections(relationKey);
		const option = Relation.formulaByType(relation.format).find(it => it.id == String(viewRelation.formulaType));
		const subId = S.Record.getSubId(rootId, block.id);
		const records = S.Record.getRecords(subId, [ relationKey ], true);

		records.forEach(record => {
			const value = record[relationKey];
		});

		return (
			<div 
				ref={ref => this.node = ref}
				id={Relation.cellId('foot', relationKey, '')} 
				className={cn.join(' ')}
				onClick={this.onClick}
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}
			>
				<div className="cellContent">
					<div className="flex">
						{isEditing || (result === null) ? (
							<Select 
								ref={ref => this.refSelect = ref}
								id={`grid-foot-select-${relationKey}-${block.id}`} 
								value=""
								onChange={() => this.refSelect.setValue('')}
								options={sections}
								arrowClassName="light"
								menuParam={{
									onOpen: this.onOpen,
									onClose: this.onClose,
									subIds: [ 'select2' ],
									data: {
										noScroll: true, 
										noVirtualisation: true,
										onOver: this.onOver,
									},
								}}
							/>
						) : ''}
						{!isEditing && option && (result !== null) ? (
							<div className="result">
								<span className="name">{option.short || option.name}</span>
								{result}
							</div>
						) : ''}
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

	calculate () {
		const { rootId, block, relationKey, getView, isInline } = this.props;
		const view = getView();
		const viewRelation = view.getRelation(relationKey);
		const subId = isInline ? [ rootId, block.id, 'total' ].join('-') : S.Record.getSubId(rootId, block.id);
		const result = Dataview.getFormulaResult(subId, viewRelation);

		if (this.state.result !== result) {
			this.state.result = result;
			this.setState({ result });
		};
	};

	setEditing (v: boolean): void {
		this.setState({ isEditing: v });
	};

	onClick (e: any) {
		this.setState({ isEditing: true }, () => {
			window.setTimeout(() => this.refSelect.show(e), 10);
		});
	};

	onOpen (context: any): void {
		const { rootId, relationKey } = this.props;
		const relation = S.Record.getRelationByKey(relationKey);
		const object = S.Detail.get(rootId, rootId, []);

		this.menuContext = context;
		window.setTimeout(() => this.onMouseEnter(), 10);

		analytics.event('ClickGridFormula', { format: relation.format, objectType: object.type });
	};

	onClose () {
		$(`.cellKeyHover`).removeClass('cellKeyHover');
	};

	onOver (e: any, item: any) {
		if (!this.menuContext) {
			return;
		};

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
					rebind: this.menuContext.ref?.rebind,
					onSelect: (e: any, item: any) => {
						this.onChange(item.id);
						this.menuContext.close();
						this.setEditing(false);
					},
				}
			});
		});
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
		});

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