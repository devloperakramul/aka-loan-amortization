
interface Loan {
    id: string;
    loanStartDate: Date;
    loanName: string;
    loanAmount: number;
    annualInterestRate: number;
    emiAmount: number;
    priority: number;
    minimumPay: number;
}

interface ScheduleEntry {
    id: string;
    loanName: string;
    date: Date;
    loanAmount: string;
    interestPart: string;
    principalPart: string;
    minimumPay: string;
    balance: string;
    snowBall: string;
    payment: string;
    remainingBalance: string;
}

interface SortConfig {
    key: keyof Loan;
    direction: 'ascending' | 'descending';
}


const calculateAmortization = (loans: Loan[], monthlyBudget: number, strategy: string, sortConfig: SortConfig): ScheduleEntry[] => {
    if (!loans.length) {
        return [];
    }

    loans = loans.map(loan => ({
        ...loan,
        loanStartDate: new Date(loan.loanStartDate)
    }));

    const schedule: ScheduleEntry[] = [];
    let iterations = 0;


    const calculateMonthlyInterest = (openingBalance: number, loan: Loan) => openingBalance * (loan.annualInterestRate / 1200);

    const sortLoans = (loans: Loan[], strategy: string, sortConfig: SortConfig) => {
        const sortedLoans = [...loans];
        let strategyName = 'Default';

        switch (strategy) {
            case 'Smart':
                sortedLoans.sort((a, b) =>
                    a.priority - b.priority ||
                    b.annualInterestRate - a.annualInterestRate ||
                    a.loanAmount - b.loanAmount
                );
                strategyName = 'Smart Pay';
                break;
            case 'Avalanche':
                sortedLoans.sort((a, b) => b.annualInterestRate - a.annualInterestRate);
                strategyName = 'Avalanche High Interest';
                break;
            case 'Snowball':
                sortedLoans.sort((a, b) => a.loanAmount - b.loanAmount);
                strategyName = 'Small Balance';
                break;
            case 'Highest Priority':
                sortedLoans.sort((a, b) => a.priority - b.priority);
                strategyName = 'Highest Priority';
                break;
            case 'Lowest Priority':
                sortedLoans.sort((a, b) => b.priority - a.priority);
                strategyName = 'Lowest Priority';
                break;
            case 'No Strategy':
                if (sortConfig) {
                    sortedLoans.sort((a, b) => {
                        const valueA = a[sortConfig.key];
                        const valueB = b[sortConfig.key];

                        if (typeof valueA === 'number' && typeof valueB === 'number') {
                            return sortConfig.direction === 'ascending' ? valueA - valueB : valueB - valueA;
                        } else if (typeof valueA === 'string' && typeof valueB === 'string') {
                            return sortConfig.direction === 'ascending'
                                ? valueA.localeCompare(valueB)
                                : valueB.localeCompare(valueA);
                        } else {
                            return 0;
                        }
                    });
                } else {
                    throw new Error("SortConfig is required for manual sorting.");
                }
                break;
            default:
                throw new Error("Unknown sorting strategy.");
        }

        return { sortedLoans, strategyName };
    };

    const findOldestLoan = (loans: Loan[]) => {
        if (!loans.length) throw new Error("No loans available.");
        return loans.reduce((oldestLoan, currentLoan) => currentLoan.loanStartDate.getTime() < oldestLoan.loanStartDate.getTime() ? currentLoan : oldestLoan, loans[0]);
    };

    const processSnowballLoan = (loan: Loan, currentMonthBudget: number, strategyName: string): { updatedLoan: Loan; updatedBudget: number } => {
        const openingBalance = loan.loanAmount;
        if (openingBalance <= 0) {
            return { updatedLoan: loan, updatedBudget: currentMonthBudget };
        }
        if (currentMonthBudget <= 0) {
            return { updatedLoan: loan, updatedBudget: currentMonthBudget };
        }
        const payment = Math.min(currentMonthBudget, openingBalance);
        const principalPart = payment;
        currentMonthBudget -= principalPart;
        loan.loanAmount = openingBalance - principalPart;

        schedule.push({
            id: loan.id,
            loanName: `*${strategyName}: ${loan.loanName}`,
            date: new Date(loan.loanStartDate),
            loanAmount: openingBalance.toFixed(2),
            interestPart: '',
            principalPart: principalPart.toFixed(2),
            minimumPay: '',
            balance: loan.loanAmount.toFixed(2),
            snowBall: principalPart.toFixed(2),
            payment: payment.toFixed(2),
            remainingBalance: ''
        });
        return { updatedLoan: loan, updatedBudget: currentMonthBudget };
    };

    const processLoanPayment = (loan: Loan, currentMonthBudget: number, count: number): { updatedLoan: Loan | null, updatedBudget: number } => {
        const openingBalance = loan.loanAmount;

        if (openingBalance <= 0) {
            return { updatedLoan: loan, updatedBudget: currentMonthBudget };
        }

        const interest = calculateMonthlyInterest(openingBalance, loan);
        const payment = Math.min(currentMonthBudget, loan.minimumPay, openingBalance + interest);
        const principal = payment - interest;

        loan.loanAmount = openingBalance - principal;
        currentMonthBudget -= payment;

        schedule.push({
            id: loan.id,
            loanName: `${count} ${loan.loanName}`,
            date: new Date(loan.loanStartDate),
            loanAmount: openingBalance.toFixed(2),
            interestPart: interest.toFixed(2),
            principalPart: principal.toFixed(2),
            minimumPay: loan.minimumPay.toFixed(2),
            balance: loan.loanAmount.toFixed(2),
            snowBall: '',
            payment: payment.toFixed(2),
            remainingBalance: '',
        });

        return { updatedLoan: loan, updatedBudget: currentMonthBudget };
    };

    function filterLoansByMonth(loans: Loan[], currentMonth: number): Loan[] {
        return loans.filter(({ loanStartDate, loanAmount }) => loanAmount > 0 && loanStartDate.getMonth() === currentMonth);
    }

    function updateLoanStartDates(loans: Loan[]): Loan[] {
        return loans.map(loan => {
            const newDate = new Date(loan.loanStartDate.getTime());
            const originalMonth = newDate.getMonth();
            newDate.setMonth(originalMonth + 1);
            if (newDate.getMonth() !== (originalMonth + 1) % 12) {
                newDate.setDate(0);
            }

            return {
                ...loan,
                loanStartDate: newDate
            };
        });
    }


    loans.forEach(loan => {
        schedule.push({
            id: loan.id,
            date: new Date(loan.loanStartDate),
            loanName: `New Loan: ${loan.loanName} Start`,
            minimumPay: '',
            interestPart: '',
            principalPart: (0 - loan.loanAmount).toFixed(2),
            balance: loan.loanAmount.toFixed(2),
            loanAmount: '',
            snowBall: '',
            payment: '',
            remainingBalance: ''
        });
    });

    while (loans.some(loan => loan.loanAmount > 0) && iterations < 10000) {
        const oldestLoanDate = findOldestLoan(loans).loanStartDate;
        const currentMonth = (new Date(oldestLoanDate).getMonth() + 1) % 12;
        const loansForExtraPay: Loan[] = []
        let currentMonthBudget = monthlyBudget;
        const dateUpdatedLoans = updateLoanStartDates(loans);
        const filteredLoans = filterLoansByMonth(dateUpdatedLoans, currentMonth);
        const { sortedLoans } = sortLoans(filteredLoans, strategy, sortConfig);
        let count0 = 0;
        sortedLoans.forEach((loan) => {

            const { updatedLoan, updatedBudget } = processLoanPayment(loan, currentMonthBudget, count0);
            currentMonthBudget = updatedBudget;

            if (updatedLoan) {
                loansForExtraPay.push({
                    ...updatedLoan,
                });
            }
            count0++
        });

        const { sortedLoans: snowBallLoan, strategyName: SnowName } = sortLoans(loansForExtraPay, strategy, sortConfig);

        let count: number = 0
        snowBallLoan.forEach(loan => {
            const { updatedLoan, updatedBudget } = processSnowballLoan(loan, currentMonthBudget, `${SnowName} ${count}`);
            currentMonthBudget = updatedBudget;
            if (updatedLoan) {
                loans = loans.map((loan) => (loan.id === updatedLoan.id ? updatedLoan : loan))
                    .filter((loan) => loan.loanAmount > 0);
            }
            count++
        });

        iterations++;
    }

    const SortedSchedule = schedule.sort((a: ScheduleEntry, b: ScheduleEntry) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remainingBalance = 0;
    const finalData = SortedSchedule.map(item => {
        const principal = parseFloat(item.principalPart);
        remainingBalance -= principal;
        if (remainingBalance < 0.1) remainingBalance = 0;
        return {
            ...item,
            remainingBalance: remainingBalance.toFixed(2)
        };
    });

    return finalData;
};

export default calculateAmortization;
