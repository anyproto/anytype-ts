import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { Label, Button, IconObject, ObjectName } from 'Component';
import { I, translate } from 'Lib';

const NotificationInvite = observer(class NotificationInvite extends React.Component<I.NotificationComponent, {}> {

	node = null;

	render () {
		const { item, onButton } = this.props;
		const { type } = item;
		const buttons = [
			{ id: 'inviteAccept', text: 'Accept' },
			{ id: 'inviteReject', text: 'Reject' },
		];

		return (
			<div ref={ref => this.node = ref}>
				<Label text={translate(`notification${type}Text`)} />

				<div className="buttons">
					{buttons.map((item: any, i: number) => (
						<Button key={i} color="blank" className="c28" {...item} onClick={e => onButton(e, item.id)} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		const { item } = this.props;
		const { object, subject } = item;
		const node = $(this.node);
		const objectEl = node.find('#object');
		const subjectEl = node.find('#subject');

		const Element = (item: any) => (
			<React.Fragment>
				<IconObject object={item} size={16} />
				<ObjectName object={item} />
			</React.Fragment>
		);

		ReactDOM.render(<Element {...object} />, objectEl.get(0));
		ReactDOM.render(<Element {...subject} />, subjectEl.get(0));
	};
	
});

export default NotificationInvite;