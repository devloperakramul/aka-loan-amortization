"use client";

import { useState, useEffect } from 'react';
import LoanForm from '@/components/LoanForm';
import Link from 'next/link';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { sortLoansByStrategy } from '@/lib/strategy';

interface Loan {
  id: string;
  loanName: string;
  loanAmount: number;
  annualInterestRate?: number;
  emiAmount: number;
  loanStartDate: Date;
  priority: number;
  minimumPay: number;
}

const Home = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const [strategy, setStrategy] = useState('2s');
  const [totalLoan, setTotalLoan] = useState<number>(0);
  const [totalMonthlyInterest, setTotalMonthlyInterest] = useState(0);
  const [totalMinimumMonthlyPay, setTotalMinimumMonthlyPay] = useState(0);
  const [totalEMI, setTotalEMI] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetError, setBudgetError] = useState('');
  const [budgetErrorClass, setBudgetErrorClass] = useState('');


  useEffect(() => {
    const fetchLoans = async (): Promise<void> => {
      try {
        const response = await fetch('/api/loans');
        const { data } = await response.json();
        setLoans(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchLoans();

    const savedBudget = localStorage.getItem('monthlyBudget');
    const savedStrategy = localStorage.getItem('strategy');
    if (savedBudget) {
      setMonthlyBudget(parseFloat(savedBudget));
    }
    if (savedStrategy) {
      setStrategy(savedStrategy);
    }

  }, []);

  useEffect(() => {
    const totalLoan: number = loans.reduce((sum, loan) => sum + +loan.loanAmount, 0);
    const totalInterest = loans.reduce((sum, loan) => sum + (loan.annualInterestRate !== undefined ? calculateMonthlyInterest(loan.annualInterestRate, loan.loanAmount) : 0), 0);
    const totalMinPay = loans.reduce((sum, loan) => sum + +loan.minimumPay, 0);
    const totalEmi = loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
    setTotalLoan(totalLoan);
    setTotalMonthlyInterest(totalInterest);
    setTotalMinimumMonthlyPay(totalMinPay);
    setTotalEMI(totalEmi);
  }, [loans]);

  const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const monthlyBudget = parseFloat(event.target.value);
    setMonthlyBudget(monthlyBudget);
    localStorage.setItem('monthlyBudget', monthlyBudget.toString());

    const errorMessages: Record<string, string> = {
      insufficientBudget: '⚠️ Insufficient Budget: Your budget is less than the total monthly interest. Please increase your budget to cover the interest.',
      budgetBetweenInterestAndMinimum: "⚠️ Warning: Your budget is between the total monthly interest and the minimum payment. Aim to budget above the minimum payment for a healthier financial situation. ONLY SMART 'Avalanche' STRATEGIE CAN SAVE YOU",
      budgetBelowEMI: '⚠️ Caution: Your budget is below the total EMI amount. Consider increasing your budget to avoid tight financial situations.',
      budgetEqualsEMI: '✅ Great! Your budget matches the total EMI amount perfectly. Keep it up!',
      budgetExceedsEMI: '🎉 Excellent! Your budget exceeds the total EMI amount. You’re in a good position.',
    };

    if (monthlyBudget < totalMonthlyInterest) {
      setBudgetError(errorMessages.insufficientBudget);
      setBudgetErrorClass('text-red-700 text-xl font-bold');
    } else if (monthlyBudget >= totalMonthlyInterest && monthlyBudget < totalMinimumMonthlyPay) {
      setBudgetError(errorMessages.budgetBetweenInterestAndMinimum);
      setBudgetErrorClass('text-yellow-700 text-xl font-bold');
    } else if (monthlyBudget >= totalMinimumMonthlyPay && monthlyBudget < totalEMI) {
      setBudgetError(errorMessages.budgetBelowEMI);
      setBudgetErrorClass('text-yellow-700 text-xl font-semibold');
    } else if (monthlyBudget === totalEMI) {
      setBudgetError(errorMessages.budgetEqualsEMI);
      setBudgetErrorClass('text-green-600 text-xl font-bold');
    } else if (monthlyBudget > totalEMI) {
      setBudgetError(errorMessages.budgetExceedsEMI);
      setBudgetErrorClass('text-green-600 text-xl font-bold');
    } else {
      setBudgetError('');
      setBudgetErrorClass('');
    }
  };

  const handleStrategyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStrategy = event.target.value;
    setStrategy(selectedStrategy);
    localStorage.setItem('strategy', selectedStrategy);
  };

  const openModal = (loan: Loan | null = null) => {
    setCurrentLoan(loan);
    setIsEditing(loan !== null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLoan(null);
    setIsEditing(false);
  };

  const saveLoan = async (loan: Loan) => {
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing && currentLoan ? `/api/loans/${currentLoan.id}` : '/api/loans';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loan),
      });

      const result = await response.json();
      if (response.ok) {
        const updatedLoans = isEditing
          ? loans.map((item) => (item.id === currentLoan?.id ? result : item))
          : [...loans, result.result];
        setLoans(updatedLoans);
        closeModal();
      }
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  };

  const deleteLoan = async (loanId: string) => {
    try {
      await fetch(`/api/loans/${loanId}`, { method: 'DELETE' });
      setLoans((prevLoans) => prevLoans.filter((loan) => loan.id !== loanId));
    } catch (error) {
      console.error(error);
    }
  };

  const formatDate = (dateString: string): string => {
    const formattingOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    };

    return new Date(dateString).toLocaleDateString(undefined, formattingOptions);
  };

  const calculateMonthlyInterest = (annualInterest: number, principal: number): number => (
    (annualInterest / 12 / 100) * principal
  );

  const handleSort = (newKey: typeof sortConfig.key) => {
    const newDirection = sortConfig.key === newKey && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    setSortConfig({ key: newKey, direction: newDirection });
    localStorage.setItem('sortConfig', JSON.stringify({ key: newKey, direction: newDirection }));
  };

  const handlePriorityChange = async (loanId: string, newPriority: number): Promise<void> => {
    try {
      const response = await fetch(`/api/loans/${loanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (!response.ok) {
        throw new Error('Failed to update loan priority');
      }

      setLoans(loans.map((loan) => (loan.id === loanId ? { ...loan, priority: newPriority } : loan)));
    } catch (error) {
      console.error('Error updating loan priority:', error);
    }
  };

  const handleMinimumPayChange = async (loanId: string, newMinimumPay: number) => {
    const response = await fetch(`/api/loans/${loanId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minimumPay: newMinimumPay }),
    });

    if (!response.ok) {
      throw new Error('Failed to update minimum pay');
    }

    setLoans(
      loans.map((loan) => (loan.id === loanId ? { ...loan, minimumPay: newMinimumPay } : loan))
    );
  };

  const sortedLoans = sortLoansByStrategy(loans, strategy, sortConfig);

  return (
    <>
      <div className="w-full max-w-full overflow-x-auto">
        <div className="flex justify-between px-12">
          <h2 className="text-2xl font-bold mb-4">Loan List</h2>
          <div className="mb-4">
            <label htmlFor="budget" className="mr-2 pl-8">Monthly Budget:</label>
            <input
              id="budget"
              type="number"
              value={monthlyBudget}
              onChange={handleBudgetChange}
              className="border border-gray-300 p-2 rounded"
            />
            {budgetError && <p className={`${budgetErrorClass} mt-0 absolute `}>{budgetError}</p>}
          </div>
          <div className="mb-4"> <button
            onClick={() => openModal()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4"
          >
            Add Loan
          </button> </div>
          <div className="mb-4 content-center">
            <label htmlFor="strategy" className="mr-2 pl-8">Strategy:</label>
            <select
              id="strategy"
              value={strategy}
              onChange={handleStrategyChange}
              className="border border-gray-300 p-2 rounded">
              <option value="No Strategy">No Strategy (Not Recommended) </option>
              <option value="Smart">Smart ( Priority + Avalanche + Snowball)</option>
              <option value="Avalanche">Avalanche (Highest Interest First)</option>
              <option value="Snowball">Snowball (Lowest Balance First)</option>
              <option value="Highest Priority">Highest Priority First </option>
              <option value="Lowest Priority">Lowest Priority First </option>
            </select>
            <p className='text-center ml-20'>Lower numbers indicate higher priority</p>
          </div>
        </div>
        <div>
          <table className="min-w-full bg-white border text-sm break-normal">
            <thead>
              <tr>
                <th className="border px-4 py-2 w-16">#</th>
                <th className="border px-4 py-2 w-56 cursor-pointer" onClick={() => handleSort('loanName')}>
                  Loan Name
                  {sortConfig.key === 'loanName' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 w-30 cursor-pointer" onClick={() => handleSort('loanAmount')}>
                  Loan Amount
                  {sortConfig.key === 'loanAmount' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('annualInterestRate')}>
                  Interest Rate
                  {sortConfig.key === 'annualInterestRate' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('monthlyInterest')}>
                  Monthly Interest Amount
                  {sortConfig.key === 'monthlyInterest' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('emiAmount')}>
                  EMI Amount
                  {sortConfig.key === 'emiAmount' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('minimumPay')}>
                  Minimum Monthly Pay
                  {sortConfig.key === 'minimumPay' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('loanStartDate')}>
                  Start Date
                  {sortConfig.key === 'loanStartDate' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('priority')}>
                  Priority
                  {sortConfig.key === 'priority' ? (
                    sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />
                  ) : <FaSort className="inline ml-2" />}
                </th>
                <th className="border px-4 py-2 w-44">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedLoans.map((loan) => (
                <tr key={loan.id}>
                  <td className="border px-4 py-2">{loan.id}</td>
                  <td className="border px-4 py-2">
                    <Link href={`/loans/${loan.id}`}>{loan.loanName}</Link>
                  </td>
                  <td className="border px-4 py-2">{loan.loanAmount}</td>
                  <td className="border px-4 py-2">{loan.annualInterestRate}</td>
                  <td className="border px-4 py-2">
                    {calculateMonthlyInterest(loan.annualInterestRate, loan.loanAmount).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">{loan.emiAmount}</td>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      value={loan.minimumPay}
                      onChange={(e) => handleMinimumPayChange(loan.id, Number(e.target.value))}
                      className="w-full border border-gray-300 p-1 rounded"
                    />
                  </td>
                  <td className="border px-4 py-2">{formatDate(loan.loanStartDate)}</td>
                  <td className="border px-4 py-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => handlePriorityChange(loan.id, Math.max(Number(loan.priority) - 1, -10))}
                        className="text-gray-500 hover:text-blue-600 bg-gray-200 p-2 rounded-l-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5" />
                        </svg>
                      </button>
                      <input
                        type="text"
                        value={loan.priority}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value >= -10 && value <= 20) {
                            handlePriorityChange(loan.id, value);
                          }
                        }}
                        className="w-20 border border-gray-300 rounded-md text-center py-2 mx-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="-50"
                        max="50"
                      />
                      <button
                        onClick={() => handlePriorityChange(loan.id, Math.min(Number(loan.priority) + 1, 20))}
                        className="text-gray-500 hover:text-blue-600 bg-gray-200 p-2 rounded-r-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7H5" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="border px-4 py-2 w-36">
                    <button onClick={() => openModal(loan)} className="bg-yellow-500 text-white px-2 py-1 rounded-md mr-2 w-14 break-keep">Edit</button>
                    <button onClick={() => deleteLoan(loan.id)} className="bg-red-500 text-white px-2 py-1 rounded-md w-14 break-keep">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td>Total</td>
                <td />
                <td>{totalLoan}</td>
                <td />
                <td>{totalMonthlyInterest.toFixed(2)}</td>
                <td>{totalEMI.toFixed(2)}</td>
                <td>{totalMinimumMonthlyPay.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>

        </div>
      </div>
      {isModalOpen && (
        <LoanForm
          loan={currentLoan}
          onSave={saveLoan}
          onClose={closeModal}
        />
      )}
    </>
  );
}

export default Home;




