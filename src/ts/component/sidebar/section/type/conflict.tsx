import React, { forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, ObjectName, IconObject } from 'Component';
import { I, C, S, Relation, translate } from 'Lib';

const SidebarSectionTypeConflict = observer(forwardRef<{}, I.SidebarSectionComponent>((props, ref) => {
	const { space } = S.Common;
	const { rootId, object, onChange } = props;
	const [ conflictIds, setConflictIds ] = useState([]);
	const [ dummy, setDummy ] = useState(0);

	const load = () => {
		C.ObjectTypeListConflictingRelations(rootId, space, (message) => {
			if (!message.error.code) {
				setConflictIds(message.conflictRelationIds);
			};
		});
	};

	const getItems = () => {
		return Relation.getArrayValue(conflictIds).map(key => S.Record.getRelationById(key)).filter(it => it && !Relation.isSystem(it.relationKey));
	};

	const onQuestion = () => {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupConfirmLocalFieldsTitle'),
				text: translate('popupConfirmLocalFieldsText'),
				textConfirm: translate('commonRemove'),
				colorConfirm: 'red',
				colorCancel: 'blank',
				onConfirm: () => {
					// need command?
				},
			},
		});
	};

	useEffect(() => load());

	useImperativeHandle(ref, () => ({
		forceUpdate: () => setDummy(dummy + 1),
		load,
		getItems,
		onQuestion,
	}));

	const items = getItems();

	return (
		<div className="wrap">
			<div className="titleWrap">
				<Title text={translate('sidebarRelationLocal')} />
				<Icon className="question" onClick={onQuestion} />
			</div>

			<div className="items">
				{items.map((item, i) => (
					<div key={i} className="item">
						<div className="side left">
							<IconObject object={item} />
							<ObjectName object={item} />
						</div>
						<div className="side right">
							<Icon className="more" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}));

export default SidebarSectionTypeConflict;
