import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from './components/ConfirmModal';

describe('ConfirmModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <ConfirmModal
        isOpen={false}
        title="Test Title"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders when isOpen is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />
    );
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('calls onCancel when Cancel button is clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  test('calls onConfirm when Delete button is clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  test('calls onCancel when clicking the overlay', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={false}
      />
    );
    
    const overlay = screen.getByText('Delete Item').closest('.modal-overlay');
    fireEvent.click(overlay);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('shows "Deleting..." when isDeleting is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={true}
      />
    );
    
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  test('disables buttons when isDeleting is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={true}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    const deleteButton = screen.getByText('Deleting...');
    
    expect(cancelButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });
});
