import React, { forwardRef, useState, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Icon, ObjectName, IconObject } from 'Component';
import { I, C, S, Relation, translate, keyboard } from 'Lib';

const SidebarSectionTypeConflict = observer(forwardRef<{}, I.SidebarSectionComponent>((props, ref) => {

	const { space } = S.Common;
	const { rootId, object, onChange } = props;
	const [ dummy, setDummy ] = useState(0);
	const [ conflictIds, setConflictIds ] = useState([]);

	const forceUpdate = () => {
		setDummy(dummy + 1);
	};

	const load = () => {
		C.ObjectTypeListConflictingRelations(rootId, space, (message) => {
			if (message.error.code) {
				return;
			};

			setConflictIds(message.conflictRelationIds
				.map(id => S.Record.getRelationById(id))
				.filter(it => it && !Relation.isSystem(it.relationKey))
				.map(it => it.id)
			);
		});
	};

	const getItems = () => {
		const relations = Relation.getArrayValue(object.recommendedRelations).concat(Relation.getArrayValue(object.recommendedFeaturedRelations));

		return conflictIds
			.filter(it => !relations.includes(it))
			.map(id => S.Record.getRelationById(id));
	};

	const onMore = (e: React.MouseEvent, item: any) => {
		const { x, y } = keyboard.mouse.page;
		const node = $(`#conflict-${rootId}-${item.id}`);

		S.Menu.open('select', {
			rect: { width: 0, height: 0, x: x + 4, y },
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: () => node.addClass('hover'),
			onClose: () => node.removeClass('hover'),
			data: {
				options: [
					{ id: 'addToType', name: translate('sidebarRelationLocalAddToCurrentType') },
				],
				onSelect: (e, option) => {
					switch (option.id) {
						case 'addToType': {
							const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);

							onChange({ recommendedRelations: recommendedRelations.concat([ item.id ]) });
							break;
						};
					};
				},
			},
		});
	};

	const onQuestion = () => {
		S.Popup.open('confirm', {
			data: {
				title: translate('popupConfirmLocalFieldsTitle'),
				textConfirm: translate('commonAdd'),
				colorCancel: 'blank',
				onConfirm: () => {
					const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);

					onChange({ recommendedRelations: recommendedRelations.concat(conflictIds) });
				},
			},
		});
	};

	useEffect(() => load(), []);

	useImperativeHandle(ref, () => ({
		forceUpdate,
		load,
		getItems,
		onMore,
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
					<div key={i} id={`conflict-${rootId}-${item.id}`} className="item" onContextMenu={e => onMore(e, item)}>
						<div className="side left">
							<IconObject object={item} />
							<ObjectName object={item} />
						</div>
						<div className="side right">
							<Icon className="more" onClick={e => onMore(e, item)} />
						</div>
					</div>
				))}
			</div>
		</div>
	);

}));

export default SidebarSectionTypeConflict;
