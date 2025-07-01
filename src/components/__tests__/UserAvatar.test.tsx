import { render, screen } from '@testing-library/react';
import { UserAvatar } from '../UserAvatar';
import { User } from '../../types';

const mockUser: User = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  isOnline: true,
  lastSeen: new Date(),
  status: 'online',
};

describe('UserAvatar', () => {
  it('renders user initials when no photo URL', () => {
    const userWithoutPhoto = { ...mockUser, photoURL: undefined };

    render(<UserAvatar user={userWithoutPhoto} />);

    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('shows online status indicator when user is online', () => {
    render(<UserAvatar user={mockUser} showOnlineStatus={true} />);

    const avatar = screen.getByRole('img', { hidden: true });
    expect(avatar.parentElement).toHaveClass('relative');
  });

  it('applies correct size classes', () => {
    render(<UserAvatar user={mockUser} size="large" />);

    const avatarContainer = screen.getByText('TU').parentElement;
    expect(avatarContainer).toHaveClass('w-16', 'h-16');
  });
});
