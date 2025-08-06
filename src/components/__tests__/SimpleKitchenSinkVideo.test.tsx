import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SimpleKitchenSinkVideo from '../SimpleKitchenSinkVideo';

// Mock the required dependencies
jest.mock('@/hooks/useGameAtoms', () => ({
  useGameState: () => ({
    gameId: 'test-game-123',
    videoRoomUrl: 'https://test.daily.co/test-room',
    videoRoomCreated: true,
  }),
  useGameActions: () => ({
    generateDailyToken: jest.fn(() => Promise.resolve('mock-token')),
    createVideoRoom: jest.fn(),
    checkVideoRoomExists: jest.fn(),
    setHostConnected: jest.fn(() => Promise.resolve({ success: true })),
    updateVideoRoomState: jest.fn(() => Promise.resolve({ success: true })),
  }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Daily React components
jest.mock('@daily-co/daily-react', () => ({
  DailyProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="daily-provider">{children}</div>,
  useDaily: () => null,
  useParticipantIds: () => [],
  useParticipant: () => null,
  useMeetingState: () => 'left-meeting',
  useLocalParticipant: () => null,
  DailyVideo: () => <div data-testid="daily-video" />,
  DailyAudio: () => <div data-testid="daily-audio" />,
}));

// Mock Daily.js with proper default export
const mockCallObject = {
  destroy: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  localVideo: jest.fn(() => false),
  localAudio: jest.fn(() => false),
  setLocalVideo: jest.fn(),
  setLocalAudio: jest.fn(),
};

jest.mock('@daily-co/daily-js', () => ({
  __esModule: true,
  default: {
    createCallObject: jest.fn(() => mockCallObject),
  },
}));

const mockParticipant = {
  id: 'player',
  name: 'Test Player',
  type: 'player' as const,
  isConnected: true,
};

const mockShowAlert = jest.fn();

describe('SimpleKitchenSinkVideo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders video component without crashing', () => {
    render(
      <SimpleKitchenSinkVideo
        gameId="test-game-123"
        myParticipant={mockParticipant}
        showAlertMessage={mockShowAlert}
        className="test-class"
      />
    );

    // Component should render the video system title
    expect(screen.getByText('dailyVideoSystem')).toBeInTheDocument();
  });

  it('passes correct props to component', () => {
    const { container } = render(
      <SimpleKitchenSinkVideo
        gameId="test-game-123"
        myParticipant={mockParticipant}
        showAlertMessage={mockShowAlert}
        className="test-class"
      />
    );

    // Should have the test class applied
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('displays username field with participant name', () => {
    render(
      <SimpleKitchenSinkVideo
        gameId="test-game-123"
        myParticipant={mockParticipant}
        showAlertMessage={mockShowAlert}
      />
    );

    const usernameInput = screen.getByDisplayValue('Test Player');
    expect(usernameInput).toBeInTheDocument();
  });

  it('displays room URL input field', () => {
    render(
      <SimpleKitchenSinkVideo
        gameId="test-game-123"
        myParticipant={mockParticipant}
        showAlertMessage={mockShowAlert}
      />
    );

    const roomUrlInput = screen.getByPlaceholderText('https://yourdomain.daily.co/room-name');
    expect(roomUrlInput).toBeInTheDocument();
  });
});