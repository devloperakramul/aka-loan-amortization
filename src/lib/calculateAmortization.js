const calculateAmortization = (loans, monthlyBudget, strategy, sortConfig) => {
    if (!loans.length) {
        return [];
    }

    // Convert loan start date to Date object
    loans = loans.map(loan => ({
        ...loan,
        loanStartDate: new Date(loan.loanStartDate)
    }));

    console.log(JSON.stringify(loans, null, 2));

    // *****************helpers******************************
    let schedule = [];
    let preSameMonth = [];
    let forwardBalances = {};

    let countForLoop = 0;
    let currentMonthBudget = monthlyBudget;
    let maxIterations = 10000;
    let iterations = 0;
    let payment = 0;
    let principalPart = 0;
    let openingBalance = 0;
    let interestAmount = 0;

    // Helper function to add a day to a date
    function addOneDay(date) {
        let newDate = new Date(date);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
    }

    // Helper function to add a month to a date
    function addOneMonth(date) {
        let newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
    }

    // Helper function to calculate monthly interest
    const calculateMonthlyInterest = (openingBalance, loan) => {
        const monthlyInterestRate = loan.annualInterestRate / 12 / 100;
        return openingBalance * monthlyInterestRate;
    };

    // Helper functions to find the required loan based on the strategy
    const findSmartestInterestLoan = (loans) => {
        return loans.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            } else if (a.annualInterestRate !== b.annualInterestRate) {
                return b.annualInterestRate - a.annualInterestRate;
            } else {
                return a.loanAmount - b.loanAmount;
            }
        })[0];
    };

    const findHighestInterestLoan = (loans) => loans.reduce((max, loan) => loan.annualInterestRate > max.annualInterestRate ? loan : max, loans[0]);
    const findLowestBalanceLoan = (loans) => loans.reduce((min, loan) => loan.loanAmount < min.loanAmount ? loan : min, loans[0]);
    const findHighestPriorityLoan = (loans) => loans.reduce((min, loan) => loan.priority < min.priority ? loan : min, loans[0]);
    const findLowestPriorityLoan = (loans) => loans.reduce((max, loan) => loan.priority > max.priority ? loan : max, loans[0]);

    // Sorting function using sortConfig
    const manualSort = (loans, sortConfig) => {
        return loans.sort((a, b) => {
            const valueA = a[sortConfig.key];
            const valueB = b[sortConfig.key];
            return sortConfig.direction === 'ascending' ? valueA - valueB : valueB - valueA;
        });
    };

    // Helper function to find the oldest loan
    const findOldestLoan = (loans) => {
        if (!loans.length) return null;
        return loans.reduce((oldestLoan, currentLoan) => currentLoan.loanStartDate < oldestLoan.loanStartDate ? currentLoan : oldestLoan);
    };

    // Helper function to get the forward balance
    const getForwardBalance = (loanId) => forwardBalances[loanId] !== undefined ? forwardBalances[loanId] : null;

    // Process snowball loans
    const processSnowballLoan = (snowBallLoan, snowBallBudget, SnowName) => {
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

    const setOpeningBalance = (loan) => {
        let openingBalance = loan.loanAmount;
        const forwardBalance = getForwardBalance(loan.id);
        if (forwardBalance !== null) {
            openingBalance = forwardBalance;
        }
        return openingBalance;
    };

    // **************************main******************************
    loans.forEach(loan => {
        schedule.push({
            id: loan.id,
            date: new Date(loan.loanStartDate),
            loanName: `New Loan: ${loan.loanName} Start`,
            minimumPay: '',
            interestPart: '',
            principalPart: 0 - loan.loanAmount.toFixed(2),
            balance: loan.loanAmount.toFixed(2),
            remainingBudget: '',
        });
    });

    while (loans.some(loan => loan.loanAmount > 0) && iterations < maxIterations) {
        earliestDate = findOldestLoan(loans).loanStartDate;

        for (let i = loans.length - 1; i >= 0; i--) {
            countForLoop++;

            if (loans[i].loanStartDate.toISOString().split('T')[0] === earliestDate.toISOString().split('T')[0]) {
                let loan = loans.splice(i, 1)[0];
                loan.loanStartDate = addOneMonth(loan.loanStartDate);

                if (new Date(earliestDate).getMonth() == currentMonth) {
                    openingBalance = setOpeningBalance(loan);
                    interestAmount = calculateMonthlyInterest(openingBalance, loan);

                    payment = Math.min(currentMonthBudget, loan.minimumPay, openingBalance + interestAmount);
                    principalPart = payment - interestAmount;
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
                        remainingBalance: `${iterations} , ${countForLoop} ,if`
                    });

                    preSameMonth.push({ ...loan });
                } else {
                    let sameMonth = preSameMonth.filter(loan => loan.loanAmount > 0);
                    let snowBallBudget = currentMonthBudget;

                    //*******************snowBall start*********************************
                    let SnowName;
                    while (snowBallBudget > 0 && sameMonth.some(loan => loan.loanAmount > 0)) {
                        let snowBallLoan;
                        switch (strategy) {
                            case '2s':
                                snowBallLoan = findSmartestInterestLoan(sameMonth);
                                SnowName = 'Smart Pay';
                                break;
                            case '3a':
                                snowBallLoan = findHighestInterestLoan(sameMonth);
                                SnowName = 'Avalanche High Interest';
                                break;
                            case '4s':
                                snowBallLoan = findLowestBalanceLoan(sameMonth);
                                SnowName = 'Small Balance';
                                break;
                            case '5h':
                                snowBallLoan = findHighestPriorityLoan(sameMonth);
                                SnowName = 'Highest Priority';
                                break;
                            case '6l':
                                snowBallLoan = findLowestPriorityLoan(sameMonth);
                                SnowName = 'Lowest Priority';
                                break;
                            case '1n':
                                snowBallLoan = manualSort(sameMonth, sortConfig)[0];
                                SnowName = 'Default';
                                break;
                            default:
                                throw new Error('Invalid strategy provided.');
                        }

                        // Pay off current loan with the snowball budget
                        snowBallBudget = processSnowballLoan(snowBallLoan, snowBallBudget, SnowName);

                        // Remove fully paid loans from the sameMonth array
                        sameMonth = sameMonth.filter(loan => loan.loanAmount > 0);
                    }
                    //*******************snowBall end*********************************

                    preSameMonth = [];
                    currentMonthBudget = monthlyBudget;
                    currentMonth = new Date(earliestDate).getMonth();

                    openingBalance = setOpeningBalance(loan);
                    interestAmount = calculateMonthlyInterest(openingBalance, loan);
                    payment = Math.min(currentMonthBudget, loan.minimumPay, openingBalance + interestAmount);
                    principalPart = payment - interestAmount;
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
                        test: 'else',
                        remainingBalance: `${iterations} , ${countForLoop} , else`
                    });

                    preSameMonth.push({ ...loan });
                }

                if (loan.loanAmount > 0) {
                    loans.push(loan);
                }
            }
        }

        iterations++;
    }

    schedule.sort((a, b) => new Date(a.date) - new Date(b.date));

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

    console.log(JSON.stringify(schedule, null, 2));
    return finalData;
};

export default calculateAmortization;
