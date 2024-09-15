
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
    remainingBudget: string;
    snowBall: string;
    test: string;
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


    // console.log(JSON.stringify(loans, null, 2));
    console.table(loans);

    // *****************helpers******************************
    let schedule: ScheduleEntry[] = [];
    let preSameMonth = [];
    let forwardBalances: { [key: string]: number } = {};
    let countForLoop = 0;
    let currentMonthBudget = monthlyBudget;
    let maxIterations = 10000;
    let iterations = 0;
    let payment = 0;
    let principalPart = 0;
    let openingBalance = 0;
    let interestAmount = 0;

    // Helper function to add a day to a date
    function addOneDay(date: Date) {
        let newDate = new Date(date);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
    }

    // Helper function to add a month to a date
    function addOneMonth(date: Date) {
        let newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
    }

    // Helper function to calculate monthly interest
    const calculateMonthlyInterest = (openingBalance: number, loan: Loan) => {
        const monthlyInterestRate = loan.annualInterestRate / 12 / 100;
        return openingBalance * monthlyInterestRate;
    };
    ////////////////////////
    const sortLoans = (loans: Loan[], strategy: string, sortConfig: SortConfig) => {
        let SnowName = '';
        let snowBallLoan = null;

        switch (strategy) {
            case '2s':
                snowBallLoan = loans.slice().sort((a, b) => {
                    if (a.priority !== b.priority) return a.priority - b.priority;
                    if (a.annualInterestRate !== b.annualInterestRate) return b.annualInterestRate - a.annualInterestRate;
                    return a.loanAmount - b.loanAmount;
                });
                SnowName = 'Smart Pay';
                break;
            case '3a':
                snowBallLoan = loans.slice().sort((a, b) => b.annualInterestRate - a.annualInterestRate);
                SnowName = 'Avalanche High Interest';
                break;
            case '4s':
                snowBallLoan = loans.slice().sort((a, b) => a.loanAmount - b.loanAmount);
                SnowName = 'Small Balance';
                break;
            case '5h':
                snowBallLoan = loans.slice().sort((a, b) => a.priority - b.priority);
                SnowName = 'Highest Priority';
                break;
            case '6l':
                snowBallLoan = loans.slice().sort((b, a) => a.priority - b.priority);
                SnowName = 'Lowest Priority';
                break;
            case '1n':  // Manual sorting strategy
                if (sortConfig) {
                    snowBallLoan = loans.slice().sort((a, b) => {
                        const valueA = a[sortConfig.key];
                        const valueB = b[sortConfig.key];

                        // Handle numbers
                        if (typeof valueA === 'number' && typeof valueB === 'number') {
                            return sortConfig.direction === 'ascending' ? valueA - valueB : valueB - valueA;
                        }

                        // Handle strings
                        if (typeof valueA === 'string' && typeof valueB === 'string') {
                            return sortConfig.direction === 'ascending'
                                ? valueA.localeCompare(valueB)
                                : valueB.localeCompare(valueA);
                        }

                        // Fallback for unhandled types (do not sort if types are different)
                        return 0;
                    });
                    SnowName = 'Default';
                } else {
                    throw new Error("SortConfig is required for manual sorting.");
                }
                break;
            default:
                throw new Error("Unknown sorting strategy.");
        }

        return { snowBallLoan, SnowName };
    };

    const findOldestLoan = (loans: Loan[]): Loan => {
        if (!loans.length) throw new Error("No loans available.");
        return loans.reduce((oldestLoan, currentLoan) => currentLoan.loanStartDate < oldestLoan.loanStartDate ? currentLoan : oldestLoan);
    };

    // Helper function to get the forward balance
    const getForwardBalance = (loanId: string): number | null => {
        return forwardBalances[loanId] !== undefined ? forwardBalances[loanId] : null;
    };
    // Helper function to process snowball loan
    const processSnowballLoan = (snowBallLoan: Loan, snowBallBudget: number, SnowName: string) => {

        principalPart = Math.min(snowBallBudget, snowBallLoan.loanAmount);

        snowBallBudget -= principalPart;
        let openingBalance = snowBallLoan.loanAmount;
        let balance = snowBallLoan.loanAmount - principalPart;

        snowBallLoan.loanAmount = balance;
        forwardBalances[snowBallLoan.id] = balance;

        schedule.push({
            id: snowBallLoan.id,
            loanName: `****${SnowName}: ${snowBallLoan.loanName}`,
            date: new Date(snowBallLoan.loanStartDate),
            loanAmount: openingBalance.toFixed(2),
            interestPart: '',
            principalPart: principalPart.toFixed(2),
            minimumPay: '',
            balance: balance.toFixed(2),
            remainingBudget: snowBallBudget.toFixed(2),
            snowBall: principalPart.toFixed(2),
            test: 'extrapay',
            remainingBalance: `${iterations} , ${countForLoop} , snowBall`
        });
        return snowBallBudget;
    };

    let earliestDate = findOldestLoan(loans).loanStartDate;

    let currentMonth = new Date(earliestDate).getMonth();

    const setOpeningBalance = (loan: Loan) => {
        let openingBalance = loan.loanAmount;
        const forwardBalance = getForwardBalance(loan.id);
        if (forwardBalance !== null) {
            openingBalance = forwardBalance;
        }
        return openingBalance;
    };

    /////////////////////////
    const processLoanPayment = (loan: Loan, currentMonthBudget: number, iterations: number, countForLoop: number, position: string) => {
        const openingBalance = setOpeningBalance(loan);
        const interestAmount = calculateMonthlyInterest(openingBalance, loan);
        const payment = Math.min(currentMonthBudget, loan.minimumPay, openingBalance + interestAmount);
        const principalPart = payment - interestAmount;
        currentMonthBudget -= payment;
        loan.loanAmount = openingBalance - principalPart;

        schedule.push({
            id: loan.id,
            loanName: loan.loanName,
            date: new Date(loan.loanStartDate),
            loanAmount: openingBalance.toFixed(2),
            interestPart: interestAmount.toFixed(2),
            principalPart: principalPart.toFixed(2),
            minimumPay: loan.minimumPay.toFixed(2),
            balance: loan.loanAmount.toFixed(2),
            remainingBudget: currentMonthBudget.toFixed(2),
            snowBall: '',
            test: 'if statement',
            remainingBalance: `${position}`,
        });

        return { updatedLoan: loan, updatedBudget: currentMonthBudget };
    };

    // **************************main******************************
    loans.forEach(loan => {
        schedule.push({
            id: loan.id,
            date: new Date(loan.loanStartDate),
            loanName: `New Loan: ${loan.loanName} Start`,
            minimumPay: '',
            interestPart: '',
            principalPart: (0 - loan.loanAmount).toFixed(2),
            balance: loan.loanAmount.toFixed(2),
            remainingBudget: '',
            loanAmount: loan.loanAmount.toFixed(2),
            snowBall: '',
            test: '',
            remainingBalance: ''
        });
    });

    while (loans.some(loan => loan.loanAmount > 0) && iterations < maxIterations) {
        earliestDate = findOldestLoan(loans).loanStartDate;
        let remainingLoans = [];

        for (let i = loans.length - 1; i >= 0; i--) {
            countForLoop++;

            if (loans[i].loanStartDate.toISOString().split('T')[0] === earliestDate.toISOString().split('T')[0]) {
                // let loan = loans.splice(i, 1)[0];
                let loan = loans[i];
                loan.loanStartDate = addOneMonth(loan.loanStartDate);

                if (new Date(earliestDate).getMonth() == currentMonth) {

                    let position = `${iterations} , ${countForLoop} , if`;

                    let { updatedLoan, updatedBudget } = processLoanPayment(loan, currentMonthBudget, iterations, countForLoop, position);

                    currentMonthBudget = updatedBudget;

                    preSameMonth.push({ ...updatedLoan, position: position });

                    preSameMonth.push({ ...loan, position: position });

                } else {
                    let sameMonth = preSameMonth.filter(loan => loan.loanAmount > 0);
                    let snowBallBudget = currentMonthBudget;

                    //*******************snowBall start*********************************

                    while (snowBallBudget > 0 && sameMonth.some(loan => loan.loanAmount > 0)) {
                        let { snowBallLoan, SnowName } = sortLoans(sameMonth, strategy, sortConfig);


                        snowBallBudget = processSnowballLoan(snowBallLoan[0], snowBallBudget, SnowName);

                        sameMonth = sameMonth.filter(loan => loan.loanAmount > 0);
                    }

                    //*******************snowBall end*********************************

                    preSameMonth = [];
                    currentMonthBudget = monthlyBudget;
                    currentMonth = new Date(earliestDate).getMonth();

                    let position = `${iterations} , ${countForLoop} , else`;

                    let { updatedLoan, updatedBudget } = processLoanPayment(loan, currentMonthBudget, iterations, countForLoop, position);

                    currentMonthBudget = updatedBudget;

                    preSameMonth.push({ ...updatedLoan, position: position });
                }

                if (loan.loanAmount > 0) {
                    // loans.push(loan);
                    loans[i] = loan;
                    // remainingLoans.push(loan)
                }
                else {
                    loans.splice(i, 1)[0] // can i use splice here?
                }
            }
        }
        // loans = remainingLoans;
        iterations++;
    }

    schedule.sort((a: ScheduleEntry, b: ScheduleEntry) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remainingBalance = 0;
    const finalData = schedule.map(item => {
        let principal = parseFloat(item.principalPart);
        remainingBalance -= principal;
        if (remainingBalance < 0.1) remainingBalance = 0;
        return {
            ...item,
            remainingBalance: remainingBalance.toFixed(2)
        };
    });

    // return finalData;
    return schedule
};

export default calculateAmortization;
