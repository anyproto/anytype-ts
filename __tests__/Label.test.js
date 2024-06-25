import renderer from 'react-test-renderer';
import { Label } from '../src/ts/component';

it ('changes the class when hovered', () => {
	const component = renderer.create(
		<Label text="Test" />,
	);
	let tree = component.toJSON();
	expect(tree).toMatchSnapshot();

	// manually trigger the callback
	renderer.act(() => {
		tree.props.load();
	});
	// re-rendering
	tree = component.toJSON();
	expect(tree).toMatchSnapshot();

	// manually trigger the callback
	renderer.act(() => {
		tree.props.onMouseLeave();
	});
	// re-rendering
	tree = component.toJSON();
	expect(tree).toMatchSnapshot();
});