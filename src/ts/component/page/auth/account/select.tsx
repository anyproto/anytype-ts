import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, IconUser, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';

interface Profile {
	icon: string;
	name: string;
};

interface Props extends RouteComponentProps<any> {};
interface State {
	list: Profile[];
};

class PageAccountSelect extends React.Component<Props, State> {

	state = {
		list: [ 
			{ icon: '', color: 'grey', name: 'Anton Pronin' }, 
			{ icon: '', color: 'red', name: 'James Simon' }, 
			{ icon: '', color: 'green', name: 'Tony Leung' } 
		]
	};

	constructor (props: any) {
        super(props);

		this.onSelect = this.onSelect.bind(this);
	};
	
	render () {
		const { list } = this.state;
		
		const Item = (item: Profile) => (
			<div className="item" onClick={this.onSelect}>
				<IconUser {...item} />
				<div className="name">{item.name}</div>
			</div>
		);
		
        return (
			<div>
				<Cover num={3} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Choose profile" />
					
					<div className="list">
						{list.map((item, i) => (
							<Item key={i} {...item} />	
						))}
					</div>
				</Frame>
			</div>
		);
    };

	onSelect (e: any) {
		e.preventDefault();
		
		this.props.history.push('/main/index');
	};
	
};

export default PageAccountSelect;