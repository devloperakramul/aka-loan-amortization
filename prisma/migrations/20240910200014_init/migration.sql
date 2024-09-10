-- CreateTable
CREATE TABLE "Loan" (
    "id" SERIAL NOT NULL,
    "loanName" TEXT NOT NULL DEFAULT 'Loan',
    "loanAmount" DOUBLE PRECISION NOT NULL,
    "annualInterestRate" DOUBLE PRECISION NOT NULL,
    "emiAmount" DOUBLE PRECISION DEFAULT 0,
    "loanStartDate" TIMESTAMP(3),
    "priority" INTEGER DEFAULT 0,
    "minimumPay" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);
