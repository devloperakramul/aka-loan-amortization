// src/lib/Strategy.js
export const sortLoansByStrategy = (loans, strategy, sortConfig) => {
    const getSortableValue = (loan, key) => {
        switch (key) {
            case 'monthlyInterest':
                return loan.loanAmount * (loan.annualInterestRate / 12 / 100);
            default:
                return loan[key];
        }
    };

    return [...loans].sort((a, b) => {
        const aValue = getSortableValue(a, sortConfig.key);
        const bValue = getSortableValue(b, sortConfig.key);

        switch (strategy) {
            case 'Smart':
                return (
                    a.priority - b.priority ||
                    b.annualInterestRate - a.annualInterestRate ||
                    a.loanAmount - b.loanAmount
                );
            case 'Avalanche':
                return b.annualInterestRate - a.annualInterestRate;
            case 'Snowball':
                return a.loanAmount - b.loanAmount;
            case 'Highest Priority':
                return a.priority - b.priority;
            case 'Lowest Priority':
                return b.priority - a.priority;
            default:
                return (
                    (aValue < bValue ? -1 : 1) *
                    (sortConfig.direction === 'ascending' ? 1 : -1)
                );
        }
    });
};





