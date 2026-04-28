import { render, screen } from '@testing-library/react';
import Globe3D from './Globe3D';

describe('Globe3D', () => {
  test('renders the fallback preview in test environment', () => {
    render(<Globe3D />);

    expect(screen.getByTestId('globe-fallback')).toBeInTheDocument();
    expect(screen.getByText('3D globe preview')).toBeInTheDocument();
    expect(screen.getByText('0 plotted markers')).toBeInTheDocument();
  });

  test('shows the number of plotted markers in the fallback', () => {
    render(
      <Globe3D
        markers={[
          { lat: 34.0522, lng: -118.2437, src: 'la.png', label: 'Los Angeles' },
          { lat: 29.7604, lng: -95.3698, src: 'houston.png', label: 'Houston' },
        ]}
      />
    );

    expect(screen.getByText('2 plotted markers')).toBeInTheDocument();
  });

  test('applies the provided className to the fallback container', () => {
    render(<Globe3D className="custom-globe" />);

    expect(screen.getByTestId('globe-fallback')).toHaveClass('globe-fallback', 'custom-globe');
  });
});
