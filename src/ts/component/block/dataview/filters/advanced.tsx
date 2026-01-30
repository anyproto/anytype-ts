import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, U, translate } from 'Lib';
import { Icon, Label } from 'Component';

interface FilterWithRelation extends I.Filter {
	relation: any;
};

interface Props {
	subId: string;
	filter: FilterWithRelation;
	readonly?: boolean;
	onOver?: (e: any) => void;
	onClick?: (e: any) => void;
	onRemove?: (e: any) => void;
	onContextMenu?: (e: React.MouseEvent) => void;
};

const DataviewFilterAdvanced = observer(forwardRef<{}, Props>((props, ref) => {

	const { filter, readonly, onOver, onClick, onRemove, onContextMenu } = props;
	const { id } = filter;

	const ruleCount = filter.nestedFilters?.length || 1;
	const cn = [ 'filterItem', 'isAdvanced', 'withValue' ];

	if (readonly) {
		cn.push('isReadonly');
	};

	const label = `${ruleCount} ${U.Common.plural(ruleCount, translate('pluralRule'))}`;

	return (
		<div
			id={`item-${id}`}
			className={cn.join(' ')}
			onMouseEnter={onOver}
			onClick={onClick}
			onContextMenu={onContextMenu}
		>
			<Icon className="advanced" />
			<div className="content">
				<Label className="name" text={label} />
			</div>
			<Icon className="delete" onClick={onRemove} />
		</div>
	);

}));

export default DataviewFilterAdvanced;
