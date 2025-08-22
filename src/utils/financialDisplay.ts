export const formatFinancialData = (team: any, isUserTeam: boolean = false) => {
  if (isUserTeam && team.financials) {
    // User's team - show full financial data
    return {
      salaryCap: team.financials.salaryCap,
      usedCap: team.financials.usedCapSpace,
      availableCap: team.financials.availableCapSpace,
      deadCap: team.financials.deadCapSpace,
      isCalculated: true
    };
  } else {
    // Other teams - show limited data
    return {
      salaryCap: team.financials?.salaryCap || "N/A",
      usedCap: "Not Available",
      availableCap: "Not Available", 
      deadCap: "Not Available",
      isCalculated: false
    };
  }
};

export const shouldShowFinancialDetails = (team: any, currentUserId: number) => {
  return team.user_id === currentUserId;
};
