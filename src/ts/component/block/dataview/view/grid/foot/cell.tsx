import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, C, U, keyboard, Relation, Dataview, analytics, translate, Preview } from 'Lib';

interface Props extends I.ViewComponent, I.ViewRelation {
	rootId?: string;
	block?: I.Block;
};

interface State {
	result: any;
};

const FootCell = observer(class FootCell extends React.Component<Props, State> {

	node = null;
	menuContext = null;

	state = {
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
		this.onSelect = this.onSelect.bind(this);
	};

	render () {
		const { relationKey, rootId, block, getView } = this.props;
		const { result } = this.state;
		const relation = S.Record.getRelationByKey(relationKey);
		const view = getView();

		if (!relation || !view) {
			return <div />;
		};

		// Subscriptions
		const viewRelation = view.getRelation(relationKey);
		if (!viewRelation) {
			return <div />;
		};

		const cn = [ 'cellFoot', `cell-key-${relationKey}` ];
		const option: any = this.getOption() || {};
		const name = option.short || option.name || '';
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
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}
			>
				<div className="cellContent" onClick={this.onSelect}>
					<div className="flex">
						{viewRelation.formulaType == I.FormulaType.None ? (
							<div className="select">
								<div className="name">{translate('commonCalculate')}</div>
								<Icon className="arrow light" />
							</div>
						) : (
							<div className="result">
								<span className="name">{name}</span>
								<span className="value">{result}</span>
							</div>
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

	calculate () {
		const { rootId, block, relationKey, getView, isInline } = this.props;
		const view = getView();
		if (!view) {
			return;
		};

		const viewRelation = view.getRelation(relationKey);
		if (!viewRelation) {
			return;
		};

		const subId = isInline ? [ rootId, block.id, 'total' ].join('-') : S.Record.getSubId(rootId, block.id);
		const result = Dataview.getFormulaResult(subId, viewRelation);

		if (this.state.result !== result) {
			this.state.result = result;
			this.setState({ result });
		};
	};

	getOption (): any {
		const { relationKey, getView } = this.props;
		const view = getView();

		if (!view) {
			return null;
		};

		const viewRelation = view.getRelation(relationKey);
		if (!viewRelation) {
			return null;
		};

		const relation = S.Record.getRelationByKey(relationKey);
		if (!relation) {
			return null;
		};

		return Relation.formulaByType(relationKey, relation.format).find(it => it.id == String(viewRelation.formulaType));
	};

	onSelect (e: any) {
		const { relationKey } = this.props;
		const id = Relation.cellId('foot', relationKey, '');
		const options = U.Menu.getFormulaSections(relationKey);

		S.Menu.closeAll([], () => {
			S.Menu.open('select', {
				element: `#${id}`,
				horizontal: I.MenuDirection.Center,
				onOpen: this.onOpen,
				onClose: this.onClose,
				subIds: [ 'select2' ],
				data: {
					options,
					noScroll: true, 
					noVirtualisation: true,
					onOver: this.onOver,
					onSelect: (e: any, item: any) => {
						this.onChange(item.id);
					},
				}
			});
		});

		Preview.tooltipHide();
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
		const options = Relation.formulaByType(relationKey, relation.format).filter(it => it.section == item.id);

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
		if (keyboard.isDragging) {
			return;
		};

		const node = $(this.node);

		node.addClass('hover');

		const { result } = this.state;
		if ((result === null) || S.Menu.isOpen()) {
			return;
		};

		const option: any = this.getOption() || {};
		const name = option.short || option.name || '';

		const t = Preview.tooltipCaption(name, result);
		if (t) {
			Preview.tooltipShow({ text: t, element: node, typeY: I.MenuDirection.Top });
		};
	};

	onMouseLeave () {
		$(this.node).removeClass('hover');
		Preview.tooltipHide();
	};

});

export default FootCell;