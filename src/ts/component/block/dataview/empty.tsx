import * as React from 'react';
import { I } from 'Lib';
import { Label, Button } from 'Component';
import { observer } from 'mobx-react';

const Empty = observer(class Empty extends React.Component<I.ViewEmpty> {

	render () {
		const { blockId, title, description, button, className, onClick } = this.props;
		const id = [ 'dataviewEmpty', blockId ];
		const cn = [ 'dataviewEmpty' ];

		if (className) {
			cn.push(className);
		};

		return (
			<div id={id.join('-')} className={cn.join(' ')}>
				<div className="inner">
					<Label className="name" text={title} />
					<Label className="descr" text={description} />
					{button ? <Button color="blank" className="c28" text={button} onClick={onClick} /> : ''}
				</div>
			</div>
		);
	};

});

export default Empty;