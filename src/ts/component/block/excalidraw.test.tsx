import * as React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('mobx-react', () => ({
  observer: (component: any) => component
}));

jest.mock('Lib', () => ({
  translate: (key: string) => key,
  I: {},
  C: {},
  S: { Popup: { open: jest.fn() } },
  U: {}
}));

jest.mock('Component', () => ({
  Icon: () => <div data-testid="mock-icon" />,
  Button: () => <button data-testid="mock-button" />
}));

import BlockExcalidraw from './excalidraw';

describe('BlockExcalidraw', () => {
	it('should render an empty state placeholder when elements are missing', () => {
    const blockMock: any = { id: 'test-block', fields: {} };
		render(<BlockExcalidraw block={blockMock} rootId="test-root" />);

    expect(screen.getByText('Click to draw')).toBeTruthy();
    expect(screen.getByTestId('mock-icon')).toBeTruthy();
	});
});
