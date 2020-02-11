import * as React from 'react';
import { Emoji } from 'emoji-mart';
import { Input } from 'ts/component';
import { I, Util, keyboard } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

const EmojiData = require('emoji-mart/data/apple.json');

interface Props extends I.Menu {};
interface State {
	filter: string;
};

@observer
class MenuSmile extends React.Component<Props, {}> {

	ref: any = null;
	state = {
		filter: ''
	};

	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onRandom = this.onRandom.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};
	
	render () {
		const { filter } = this.state;
		const sections = this.getSections();
		
		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="items">
					{item.emojis.map((smile: any, i: number) => (
						<div key={i} className="smile" onClick={(e: any) => { this.onSelect(smile); }}>
							<Emoji native={true} emoji={':' + smile + ':'} set="apple" size={24} />
						</div>
					))}
				</div>
			</div>
		);
		
		return (
			<div>
				<div className="head">
					<div className="btn" onClick={this.onRandom}>Random emoji</div>
					<div className="btn dn">Upload image</div>
					<div className="btn" onClick={this.onRemove}>Remove</div>
				</div>
				
				<form className="filter" onSubmit={this.onSubmit}>
					<Input ref={(ref: any) => { this.ref = ref; }} placeHolder="Type to filter..." value={filter} onKeyUp={this.onSubmit} />
				</form>
				
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		keyboard.setFocus(true);
	};
	
	componentDidUpdate () {
		keyboard.setFocus(true);
	};
	
	componentWillUnmount () {
		keyboard.setFocus(false);
	};
	
	getSections () {
		const { filter } = this.state;
		const reg = new RegExp(filter, 'gi');
		
		let sections = Util.objectCopy(EmojiData.categories);
		if (filter) {
			sections = sections.filter((s: any) => {
				s.emojis = (s.emojis || []).filter((c: any) => { return c.match(reg); });
				return s.emojis.length > 0;
			});
		};
		return sections;
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		
		let filter = this.ref.getValue().replace(/[\/\\\*]/g, '');
		this.setState({ filter: filter });
	};
	
	onRandom () {
		this.onSelect(Util.randomSmile().replace(/:/g, ''));
	};
	
	onSelect (id: string) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		commonStore.menuClose(this.props.id);
		onSelect(id);
	};
	
	onRemove () {
		this.onSelect('');
	};
	
};

export default MenuSmile;