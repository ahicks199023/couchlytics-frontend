import React from 'react';
import { formatFinancialData } from '../../utils/financialDisplay';

interface TeamFinancialsProps {
  team: {
    name: string;
    financials?: {
      salaryCap: string | number;
      usedCapSpace: string | number;
      availableCapSpace: string | number;
      deadCapSpace: string | number;
    };
  };
  currentUserId: number;
  isUserTeam: boolean;
}

const TeamFinancials: React.FC<TeamFinancialsProps> = ({ team, isUserTeam }) => {
  const financials = formatFinancialData(team, isUserTeam);
  
  return (
    <div className="team-financials">
      <h4 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-3">
        {team.name} Financials
      </h4>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="financial-item">
          <label className="text-gray-300 text-sm">Salary Cap:</label>
          <span className="value text-white font-medium">{financials.salaryCap}</span>
        </div>
        
        <div className="financial-item">
          <label className="text-gray-300 text-sm">Used Cap:</label>
          <span className={`value font-medium ${financials.isCalculated ? 'text-blue-400' : 'text-gray-400 italic'}`}>
            {financials.usedCap}
          </span>
        </div>
        
        <div className="financial-item">
          <label className="text-gray-300 text-sm">Available Cap:</label>
          <span className={`value font-medium ${financials.isCalculated ? 'text-blue-400' : 'text-gray-400 italic'}`}>
            {financials.availableCap}
          </span>
        </div>
        
        <div className="financial-item">
          <label className="text-gray-300 text-sm">Dead Cap:</label>
          <span className={`value font-medium ${financials.isCalculated ? 'text-blue-400' : 'text-gray-400 italic'}`}>
            {financials.deadCap}
          </span>
        </div>
      </div>
      
      {!financials.isCalculated && (
        <div className="financial-note">
          <small className="text-xs text-amber-600">
            💡 Financial details only calculated for your team to improve performance
          </small>
        </div>
      )}
    </div>
  );
};

export default TeamFinancials;
