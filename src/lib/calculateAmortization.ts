
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

interface LoanWithPosition extends Loan {
    position: string;
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

    loans = loans.map(loan => ({
        ...loan,
        loanStartDate: new Date(loan.loanStartDate)
    }));



    const schedule: ScheduleEntry[] = [];
    let preSameMonth: LoanWithPosition[] = [];
    const forwardBalances: { [key: string]: number } = {};
    let countForLoop = 0;
    let currentMonthBudget = monthlyBudget;
    // const maxIterations = 50;
    let iterations = 0;
    let ForLoopIterations = 0;
    let principalPart = 0;

    function addOneMonth(date: Date) {
        const newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
    }

    const calculateMonthlyInterest = (openingBalance: number, loan: Loan) => {
        const monthlyInterestRate = loan.annualInterestRate / 12 / 100;
        return openingBalance * monthlyInterestRate;
    };

    const sortLoans = (loans: LoanWithPosition[], strategy: string, sortConfig: SortConfig) => {
        let SnowName = '';
        let snowBallLoan = null;

        switch (strategy) {
            case 'Smart':
                snowBallLoan = loans.slice().sort((a, b) => {
                    if (a.priority !== b.priority) return a.priority - b.priority;
                    if (a.annualInterestRate !== b.annualInterestRate) return b.annualInterestRate - a.annualInterestRate;
                    return a.loanAmount - b.loanAmount;
                });
                SnowName = 'Smart Pay';
                break;
            case 'Avalanche':
                snowBallLoan = loans.slice().sort((a, b) => b.annualInterestRate - a.annualInterestRate);
                SnowName = 'Avalanche High Interest';
                break;
            case 'Snowball':
                snowBallLoan = loans.slice().sort((a, b) => a.loanAmount - b.loanAmount);
                SnowName = 'Small Balance';
                break;
            case 'Highest Priority':
                snowBallLoan = loans.slice().sort((a, b) => a.priority - b.priority);
                SnowName = 'Highest Priority';
                break;
            case 'Lowest Priority':
                snowBallLoan = loans.slice().sort((b, a) => a.priority - b.priority);
                SnowName = 'Lowest Priority';
                break;
            case 'No Strategy':
                if (sortConfig) {
                    snowBallLoan = loans.slice().sort((a, b) => {
                        const valueA = a[sortConfig.key];
                        const valueB = b[sortConfig.key];


                        if (typeof valueA === 'number' && typeof valueB === 'number') {
                            return sortConfig.direction === 'ascending' ? valueA - valueB : valueB - valueA;
                        }


                        if (typeof valueA === 'string' && typeof valueB === 'string') {
                            return sortConfig.direction === 'ascending'
                                ? valueA.localeCompare(valueB)
                                : valueB.localeCompare(valueA);
                        }


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




    const processSnowballLoan = (snowBallLoan: Loan, snowBallBudget: number, SnowName: string) => {

        principalPart = Math.min(snowBallBudget, snowBallLoan.loanAmount);

        snowBallBudget -= principalPart;
        const openingBalance = snowBallLoan.loanAmount;
        const balance = snowBallLoan.loanAmount - principalPart;

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
        return { snowBallBudget, doneLoan: snowBallLoan };
    };

    let earliestDate = findOldestLoan(loans).loanStartDate;

    let currentMonth = new Date(earliestDate).getMonth();

    const setOpeningBalance = (loan: Loan) => {
        let openingBalance = loan.loanAmount;
        // const forwardBalance = getForwardBalance(loan.id);
        // if (forwardBalance !== null) {
        // openingBalance = forwardBalance;
        // }
        return openingBalance;
    };


    const processLoanPayment = (loan: LoanWithPosition, currentMonthBudget: number): { updatedLoan: LoanWithPosition | null, updatedBudget: number } => {



        const openingBalance = setOpeningBalance(loan);

        if (openingBalance <= 0) {
            return { updatedLoan: null, updatedBudget: currentMonthBudget };
        }


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
            remainingBalance: loan.position,
        });

        return { updatedLoan: { ...loan }, updatedBudget: currentMonthBudget };
    };


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


    while (loans.some(loan => loan.loanAmount > 0) && iterations < 50) {
        earliestDate = findOldestLoan(loans).loanStartDate;


        console.log(' ')
        console.log(' ')
        console.log('Step 1:********************************************************************************while')
        // console.log('earliestdate :', earliestDate.toISOString().split('T')[0], ', currentMonth :', currentMonth, ',new Date(earliestDate).getMonth():', new Date(earliestDate).getMonth())
        console.log('while:', iterations, ', for:', countForLoop)

        for (let i = loans.length - 1; i >= 0 && ForLoopIterations < 100; i--) {


            console.log(' ')
            console.log('Step 2:+++++++++++++++++++++++++++++++++++++++++++++++++++++++ while >for')
            console.log('earliestdate :', earliestDate.toISOString().split('T')[0], ', currentMonth :', currentMonth, ',new Date(earliestDate).getMonth():', new Date(earliestDate).getMonth(), ', loans[i] Month', loans[i].loanStartDate.getMonth())
            console.log(loans[i].loanName, loans[i].loanStartDate.toISOString().split('T')[0], loans[i].loanAmount)
            console.log('while:', iterations, ', for:', countForLoop,)
            console.log(' ')


            if (loans[i].loanStartDate.toISOString().split('T')[0] === earliestDate.toISOString().split('T')[0]) {

                const loan = loans[i];
                // loan.loanStartDate = addOneMonth(loan.loanStartDate);


                console.log('Step 3:+++++++++++++++++++++++++++++++++++++++++++++ while >for > if')
                console.log('earliestdate :', earliestDate.toISOString().split('T')[0], ', currentMonth :', currentMonth, ',new Date(earliestDate).getMonth():', new Date(earliestDate).getMonth(), ', loan Month', loan.loanStartDate.getMonth())
                console.log(loan.loanName, loan.loanStartDate.toISOString().split('T')[0], loan.loanAmount)
                console.log('while:', iterations, ', for:', countForLoop, 'loan month updated')

                console.log(' ')

                if (new Date(earliestDate).getMonth() == currentMonth) {

                    //
                    //

                    console.log('Step 4-A: if fffffffffffffffffffffffffffffffffff while >for > if > if')
                    console.log('earliestdate :', earliestDate.toISOString().split('T')[0], ', currentMonth :', currentMonth, ',new Date(earliestDate).getMonth():', new Date(earliestDate).getMonth(), ', loan Month', loan.loanStartDate.getMonth())
                    console.log(loan.loanName, loan.loanStartDate.toISOString().split('T')[0], loan.loanAmount)
                    console.log('while:', iterations, ', for:', countForLoop)


                    const position = `${iterations} , ${countForLoop} , if`;

                    if (loan) {
                        preSameMonth.push({
                            ...loan,
                            position: position
                        });

                    }



                    // console.log(preSameMonth.map(loan => ({ loanName: loan.loanName, loanStartDate: loan.loanStartDate.toISOString().split('T')[0], loanAmount: loan.loanAmount })));
                    console.table(preSameMonth)
                    // loan.loanStartDate = addOneMonth(loan.loanStartDate); //test temporary

                } else {


                    // let sameMonth = preSameMonth.filter(loan => loan.loanAmount > 0);
                    let sameMonth = []
                    sameMonth = preSameMonth;

                    // console.log('************** else')
                    // console.table(sameMonth)


                    preSameMonth = [];
                    currentMonthBudget = monthlyBudget;
                    currentMonth = new Date(earliestDate).getMonth();

                    const position = `${iterations} , ${countForLoop} , else`;

                    // if (loan) {
                    //     preSameMonth.push({
                    //         ...loan,
                    //         position: position
                    //     });
                    // }

                    console.log('Step 4-B: else eeeeeeeeeeeeeee while >for > if > if')
                    console.log('earliestdate :', earliestDate.toISOString().split('T')[0], ', currentMonth :', currentMonth, ',new Date(earliestDate).getMonth():', new Date(earliestDate).getMonth(), ', loan Month', loan.loanStartDate.getMonth())
                    console.log(loan.loanName, loan.loanStartDate.toISOString().split('T')[0], loan.loanAmount)
                    console.log('while:', iterations, ', for:', countForLoop)

                    console.log('**************preSameMonth else')
                    console.table(preSameMonth)
                    console.log(' ')
                    console.log('**************sameMonth else')
                    console.table(sameMonth)


                    const afterSameMonth: LoanWithPosition[] = [];

                    const { snowBallLoan } = sortLoans(sameMonth, strategy, sortConfig);

                    snowBallLoan.forEach((loan) => {

                        const { updatedLoan, updatedBudget } = processLoanPayment(loan, currentMonthBudget);
                        currentMonthBudget = updatedBudget;

                        if (updatedLoan) {
                            afterSameMonth.push({ ...updatedLoan });
                        }
                    });



                    while (currentMonthBudget > 0 && afterSameMonth.some(loan => loan.loanAmount > 0)) {

                        const { snowBallLoan, SnowName } = sortLoans(afterSameMonth, strategy, sortConfig);

                        const { snowBallBudget, doneLoan } = processSnowballLoan(snowBallLoan[0], currentMonthBudget, SnowName); // i want to use doneLoan below

                        currentMonthBudget = snowBallBudget;

                        // doneLoan.loanStartDate = addOneMonth(doneLoan.loanStartDate);

                        if (doneLoan.loanAmount > 0) {
                            loans[i] = doneLoan;
                        }
                        else {
                            loans.splice(i, 1)[0]
                        }



                    }



                }
            }
            countForLoop++;
            ForLoopIterations++
        }
        countForLoop = 0
        iterations++;
    }

    schedule.sort((a: ScheduleEntry, b: ScheduleEntry) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // let remainingBalance = 0;
    // const finalData = schedule.map(item => {
    //     let principal = parseFloat(item.principalPart);
    //     remainingBalance -= principal;
    //     if (remainingBalance < 0.1) remainingBalance = 0;
    //     return {
    //         ...item,
    //         remainingBalance: remainingBalance.toFixed(2)
    //     };
    // });

    // return finalData;
    return schedule
};

export default calculateAmortization;
