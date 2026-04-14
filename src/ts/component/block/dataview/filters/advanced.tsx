import React, { forwardRef } from 'react';
import { Icon, Label } from 'Component';
import * as I from 'Interface';

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

const DataviewFilterAdvanced = forwardRef<{}, Props>((props, ref) => {

	const { filter, readonly, onOver, onClick, onContextMenu } = props;
	const { id } = filter;
	const ruleCount = filter.nestedFilters?.length || 1;
	const cn = [ 'filterItem', 'isAdvanced', 'withValue' ];

	if (Relation.isFilterActive(filter)) {
		cn.push('isActive');
	};

	if (readonly) {
		cn.push('isReadonly');
	};

	const label = U.String.sprintf(translate('commonCountRules'), ruleCount, U.Common.plural(ruleCount, translate('pluralRule')));

	return (
		<div
			id={`item-${id}`}
			className={cn.join(' ')}
			onMouseEnter={onOver}
			onClick={onClick}
			onContextMenu={onContextMenu}
		>
			<Icon name="control/dataview/advanced" className="filterIcon advanced" />
			<div className="content">
				<Label className="name" text={label} />
			</div>
		</div>
	);

});

export default DataviewFilterAdvanced;
