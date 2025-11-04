import React, { forwardRef, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, ChatCounter, Icon } from 'Component';
import { I, J, U, S, translate } from 'Lib';

const WidgetObject = observer(forwardRef<{}, I.WidgetComponent>((props, ref) => {

	const { parent, onContext } = props;
	const { space } = S.Common;
	const subId = `widget-${parent.id}`;
	const nodeRef = useRef(null);

	const getRecords = () => {
		let records = [];

		switch (parent.id) {
			case J.Constant.widgetId.unread: {
				records = S.Record.getRecords(J.Constant.subId.chat).filter(it => {
					const counters = S.Chat.getChatCounters(space, it.id);
					return (counters.messageCounter > 0) || (counters.mentionCounter > 0);
				});
				break;
			};

			case J.Constant.widgetId.type: {
				records = S.Record.getTypes().filter(it => {
					if (U.Subscription.fileTypeKeys().includes(it.uniqueKey)) {
						return S.Record.getRecordIds(U.Subscription.typeCheckSubId(it.uniqueKey), '').length > 0;
					};

					return !U.Object.isInSystemLayouts(it.recommendedLayout) && (it.uniqueKey != J.Constant.typeKey.template);
				});
				break;
			};
		};

		return records;
	};

	const onContextHandler = (e: any, item: any): void => {
		e.preventDefault();
		e.stopPropagation();

		const node = $(nodeRef.current);
		const element = node.find(`#item-${item.id}`);
		const more = element.find('.icon.more');

		onContext({ node: element, element: more, withElement: true, subId, objectId: item.id });
	};

	const Item = (item: any) => {
		const isChat = U.Object.isChatLayout(item.recommendedLayout || item.layout);

		let counters = { mentionCounter: 0, messageCounter: 0 };
		if (isChat) {
			counters = S.Chat.getChatCounters(space, item.id);
		};

		return (
			<div id={`item-${item.id}`} className="item">
				<div className="side left" onClick={e => U.Object.openEvent(e, item)}>
					<IconObject object={item} />
					<ObjectName object={item} />
				</div>
				<div className="side right">
					<ChatCounter {...counters} />
					<div className="buttons">
						<Icon 
							className="more" 
							tooltipParam={{ text: translate('widgetOptions') }} 
							onMouseDown={e => onContextHandler(e, item)} 
						/>
					</div>
				</div>
			</div>
		);
	};

	const records = getRecords();

	return (
		<div ref={nodeRef} className="items">
			{records.map(item => <Item key={item.id} {...item} />)}
		</div>
	);

}));

export default WidgetObject;