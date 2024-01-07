/** @format */

import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button } from 'Component';
import { I, UtilCommon, UtilObject } from 'Lib';
import { commonStore } from 'Store';

const NotificationImport = observer(
	class NotificationImport extends React.Component<
		I.NotificationComponent,
		{}
	> {
		render() {
			const { item, onButton } = this.props;
			const { payload, type } = item;
			const { errorCode, spaceId, importType } = payload;
			const object = UtilObject.getSpaceviewBySpaceId(spaceId) || {};

			let buttons = [];
			if (!errorCode && spaceId != commonStore.space) {
				buttons = buttons.concat([
					{ id: 'space', text: 'Go to space' },
				]);
			}

			return (
				<React.Fragment>
					<Title text={UtilCommon.sprintf(item.title, object.name)} />
					<Label text={UtilCommon.sprintf(item.text, object.name)} />

					<div className="buttons">
						{buttons.map((item: any, i: number) => (
							<Button
								key={i}
								color="blank"
								className="c28"
								{...item}
								onClick={e => onButton(e, item.id)}
							/>
						))}
					</div>
				</React.Fragment>
			);
		}
	}
);

export default NotificationImport;
