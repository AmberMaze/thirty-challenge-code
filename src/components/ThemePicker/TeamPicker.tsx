import { useAtom, useAtomValue } from 'jotai';
import { useState, useEffect, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion } from 'framer-motion';
import { getAllTeams, searchTeams, type Team } from '@/utils/teamUtils';
import { selectedTeamAtom, teamPaletteAtom, themeAtom, applyThemePalette } from '@/state/themeAtoms';
import { extractSvgColors } from '@/lib/svgColors';
import { isArabicAtom } from '@/state/languageAtoms';

interface TeamPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TeamItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    teams: Team[];
    selectedTeam: { id: string; name: string; logoUrl: string } | null;
    onSelectTeam: (team: Team) => void;
    isArabic: boolean;
  };
}

/**
 * Virtualized team picker component with search functionality
 * Displays team logos in a scrollable list with lazy loading
 */
export default function TeamPicker({ isOpen, onClose }: TeamPickerProps) {
  const [search, setSearch] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  
  const [selectedTeam, setSelectedTeam] = useAtom(selectedTeamAtom);
  const [, setTeamPalette] = useAtom(teamPaletteAtom);
  const [, setTheme] = useAtom(themeAtom);
  const isArabic = useAtomValue(isArabicAtom);

  // Load teams on mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const allTeams = await getAllTeams();
        setTeams(allTeams);
      } catch (error) {
        console.error('Failed to load teams:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadTeams();
    }
  }, [isOpen]);

  // Filter teams based on search
  const filteredTeams = useMemo(() => {
    return searchTeams(teams, search);
  }, [teams, search]);

  // Handle team selection
  const handleSelectTeam = async (team: Team) => {
    setExtracting(true);
    
    try {
      // Get logo URL
      const logoUrl = typeof team.logoPath === 'function' 
        ? await team.logoPath() 
        : team.logoPath;

      // Extract colors from logo
      const palette = await extractSvgColors(logoUrl);
      
      // Update atoms
      setSelectedTeam({
        id: team.name,
        name: team.displayName,
        logoUrl
      });
      setTeamPalette(palette);
      setTheme('team');
      
      // Apply palette to CSS variables
      applyThemePalette(palette);
      
      onClose();
    } catch (error) {
      console.error('Failed to extract team colors:', error);
    } finally {
      setExtracting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold text-white ${isArabic ? 'font-arabic' : ''}`}>
              Select Team
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams..."
              className={`w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-400 ${isArabic ? 'font-arabic' : ''}`}
            />
            <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
          </div>
        </div>

        {/* Team List */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-white">Loading teams...</div>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-slate-400">No teams found</div>
            </div>
          ) : (
            <List
              height={400}
              width="100%"
              itemCount={filteredTeams.length}
              itemSize={80}
              itemData={{
                teams: filteredTeams,
                selectedTeam,
                onSelectTeam: handleSelectTeam,
                isArabic
              }}
            >
              {TeamItem}
            </List>
          )}
        </div>

        {/* Loading Overlay */}
        {extracting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
            <div className="bg-slate-800 rounded-lg p-6 text-white text-center">
              <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-2"></div>
              <div>Extracting colors...</div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * Individual team item component for virtualized list
 */
function TeamItem({ index, style, data }: TeamItemProps) {
  const { teams, selectedTeam, onSelectTeam, isArabic } = data;
  const team = teams[index];
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  // Load logo URL
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const url = typeof team.logoPath === 'function' 
          ? await team.logoPath() 
          : team.logoPath;
        setLogoUrl(url);
      } catch (error) {
        console.error('Failed to load logo:', error);
        setImageError(true);
      }
    };

    loadLogo();
  }, [team]);

  const isSelected = selectedTeam?.id === team.name;

  return (
    <div style={style} className="px-4">
      <button
        onClick={() => onSelectTeam(team)}
        className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
          isSelected
            ? 'border-green-400 bg-green-400/10'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
        }`}
      >
        {/* Team Logo */}
        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          {logoUrl && !imageError ? (
            <img
              src={logoUrl}
              alt={team.displayName}
              className="w-10 h-10 object-contain"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-white text-xl">⚽</span>
          )}
        </div>

        {/* Team Name */}
        <div className="flex-1 text-left">
          <div className={`font-medium text-white ${isArabic ? 'font-arabic' : ''}`}>
            {team.displayName}
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
            <span className="text-black text-sm">✓</span>
          </div>
        )}
      </button>
    </div>
  );
}