// src/lib/Strategy.js
export const sortLoansByStrategy = (loans, strategy, sortConfig) => {

    // console.log("sortLoansByStrategy called with:");
    // console.log("Loans:", loans);
    // console.log("Strategy:", strategy);
    // console.log("SortConfig:", sortConfig);


    const getSortableValue = (loan, key) => {
        switch (key) {
            case 'monthlyInterest':
                const monthlyInterestRate = parseFloat(loan.annualInterestRate) / 12 / 100;
                return parseFloat(loan.loanAmount) * monthlyInterestRate;
            default:
                return loan[key];
        }
    };

    return [...loans].sort((a, b) => {
        let aValue = getSortableValue(a, sortConfig.key);
        let bValue = getSortableValue(b, sortConfig.key);

        // Strategy-based sorting logic
        switch (strategy) {
            case 'Smart': // Smart (Priority + Avalanche + Snowball)
                if (a.priority !== b.priority) {
                    return a.priority - b.priority; // Sort by priority first
                } else if (a.annualInterestRate !== b.annualInterestRate) {
                    return b.annualInterestRate - a.annualInterestRate; // Then by highest interest rate
                } else {
                    return a.loanAmount - b.loanAmount; // Finally by lowest loan amount
                }
            case 'Avalanche': // Avalanche (Highest Interest First)
                return b.annualInterestRate - a.annualInterestRate; // Higher interest rate first
            case 'Snowball': // Snowball (Lowest Balance First)
                return a.loanAmount - b.loanAmount; // Lower loan amount first
            case 'Highest Priority': // Highest Priority First
                return a.priority - b.priority; // Higher priority first
            case 'Lowest Priority': // Lowest Priority First
                return b.priority - a.priority; // Lower priority first
            default: // Default (Recommended)
                // Handle the default sort using the sortConfig
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
        }
    });

};




