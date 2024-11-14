import * as React from 'react';
import { observer } from 'mobx-react';
import { Select } from 'Component';
import { I, S, keyboard, Relation, Dataview } from 'Lib';

interface Props extends I.ViewComponent, I.ViewRelation {
	rootId?: string;
	block?: I.Block;
};

interface State {
	isEditing: boolean;
	result: any;
};

const FootCell = observer(class FootCell extends React.Component<Props, State> {

	state = {
		isEditing: false,
		result: null,
	};

	constructor (props: Props) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { relationKey, block } = this.props;
		const { isEditing, result } = this.state;
		const relation = S.Record.getRelationByKey(relationKey);
		
		if (!relation) {
			return null;
		};

		const cn = [ 'cellFoot', `cell-key-${this.props.relationKey}`, Relation.className(relation.format) ];
		const options = Relation.formulaByType(relation.format);

		return (
			<div 
				id={Relation.cellId('foot', relationKey, '')} 
				className={cn.join(' ')}
				onClick={() => this.setEditing(true)}
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}
			>
				<div className="cellContent">
					<div className="flex">
						{isEditing ? (
							<Select 
								id={`grid-foot-select-${relationKey}-${block.id}`} 
								value="" 
								options={options} 
								onChange={id => this.onChange(id)}
							/>
						) : result}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount (): void {
	};

	componentDidUpdate (): void {
	};

	setEditing (isEditing: boolean): void {
		this.setState({ isEditing });
	};

	onChange (id: string): void {
		const { rootId, block, relationKey } = this.props;
		const result = Dataview.getFormulaResult(rootId, block.id, relationKey, Number(id) || 0);

		this.setState({ isEditing: false, result });
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