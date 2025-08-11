import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimpleKitchenSinkVideoLazy from '../SimpleKitchenSinkVideoLazy';
import type { LobbyParticipant } from '@/state';

// Mock the actual video component to avoid loading Daily SDK in tests
jest.mock('../SimpleKitchenSinkVideo', () => ({
  __esModule: true,
  default: function MockSimpleKitchenSinkVideo() {
    return <div data-testid="simple-kitchen-sink-video">Daily Video Component Loaded</div>;
  },
}));

// Mock the translation hook
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        loadingVideoComponents: 'Loading video components...',
        preparingVideoConnection: 'Preparing video connection...',
      };
      return translations[key] || key;
    },
  }),
}));

describe('SimpleKitchenSinkVideoLazy', () => {
  const mockShowAlertMessage = jest.fn();
  const mockParticipant: LobbyParticipant = {
    id: 'test-player',
    name: 'Test Player',
    type: 'player',
    playerId: 'playerA',
    isConnected: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading fallback initially', async () => {
    render(
      <SimpleKitchenSinkVideoLazy
        gameId="test-game"
        myParticipant={mockParticipant}
        showAlertMessage={mockShowAlertMessage}
      />
    );

    // Should show loading fallback initially
    expect(screen.getByText('Loading video components...')).toBeInTheDocument();
    expect(screen.getByText('Preparing video connection...')).toBeInTheDocument();
  });

  it('should load the actual video component after lazy loading', async () => {
    render(
      <SimpleKitchenSinkVideoLazy
        gameId="test-game"
        myParticipant={mockParticipant}
        showAlertMessage={mockShowAlertMessage}
      />
    );

    // Wait for the lazy component to load
    await waitFor(() => {
      expect(screen.getByTestId('simple-kitchen-sink-video')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show the actual component
    expect(screen.getByText('Daily Video Component Loaded')).toBeInTheDocument();
  });
});