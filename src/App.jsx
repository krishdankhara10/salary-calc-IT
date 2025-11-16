import React, { useState } from 'react';

function App() {
  const [isThisMonth, setIsThisMonth] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calculationMode, setCalculationMode] = useState('day'); // 'day' or 'time'
  
  // Day-based
  const [usedOnePaid, setUsedOnePaid] = useState(false);
  const [usedTwoPaid, setUsedTwoPaid] = useState(false);
  const [usedExtra, setUsedExtra] = useState(false);
  const [extraDays, setExtraDays] = useState(0);

  // Time-based
  const [paidLeaveDays, setPaidLeaveDays] = useState(0);
  const [paidLeaveHours, setPaidLeaveHours] = useState(0);
  const [paidLeaveMinutes, setPaidLeaveMinutes] = useState(0);
  const [extraLeaveDays, setExtraLeaveDays] = useState(0);
  const [extraLeaveHours, setExtraLeaveHours] = useState(0);
  const [extraLeaveMinutes, setExtraLeaveMinutes] = useState(0);

  const [salary, setSalary] = useState(0);
  const [result, setResult] = useState(null);

  const handleDayCheckboxChange = (type) => {
    if (type === 'one') {
      setUsedOnePaid(!usedOnePaid);
      setUsedTwoPaid(false);
      setUsedExtra(false);
      setExtraDays(0);
    } else if (type === 'two') {
      setUsedTwoPaid(!usedTwoPaid);
      setUsedOnePaid(false);
      setUsedExtra(false);
      setExtraDays(0);
    } else if (type === 'extra') {
      setUsedExtra(!usedExtra);
      setUsedOnePaid(false);
      setUsedTwoPaid(false);
    }
  };

  const resetTimeInputs = () => {
    setPaidLeaveDays(0);
    setPaidLeaveHours(0);
    setPaidLeaveMinutes(0);
    setExtraLeaveDays(0);
    setExtraLeaveHours(0);
    setExtraLeaveMinutes(0);
  };

  const resetDayInputs = () => {
    setUsedOnePaid(false);
    setUsedTwoPaid(false);
    setUsedExtra(false);
    setExtraDays(0);
  };

  const calculateSalary = () => {
    const now = new Date();
    let start, end;

    if (isThisMonth) {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      if (!startDate || !endDate) {
        alert('Please select start and end dates.');
        return;
      }
      start = new Date(startDate);
      end = new Date(endDate);
      if (start > end) {
        alert('Start date cannot be after end date.');
        return;
      }
    }

    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    let sundays = 0;
    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() === 0) sundays++;
      current.setDate(current.getDate() + 1);
    }

    const baseWorkingDays = totalDays - sundays;
    const minutesPerDay = 9 * 60; // 540 minutes
    const baseMinutes = baseWorkingDays * minutesPerDay;

    const baseSalary = parseFloat(salary);
    if (baseSalary <= 0 || baseWorkingDays <= 0) {
      alert('Invalid salary or no working days.');
      return;
    }

    const perMinuteRate = baseSalary / baseMinutes;

    let usedPaidMinutes = 0;
    let extraMinutes = 0;
    let unusedPaidDays = 0;

    if (calculationMode === 'day') {
      let usedPaidDays = 0;
      if (usedExtra) {
        usedPaidDays = 2;
        extraMinutes = (parseInt(extraDays) || 0) * minutesPerDay;
      } else if (usedTwoPaid) {
        usedPaidDays = 2;
      } else if (usedOnePaid) {
        usedPaidDays = 1;
      }
      usedPaidMinutes = usedPaidDays * minutesPerDay;
      unusedPaidDays = 2 - usedPaidDays;
    } else {
      // Time-based
      const paidLeaveTotalMinutes = 
        (parseInt(paidLeaveDays) || 0) * minutesPerDay +
        (parseInt(paidLeaveHours) || 0) * 60 +
        (parseInt(paidLeaveMinutes) || 0);

      const extraLeaveTotalMinutes = 
        (parseInt(extraLeaveDays) || 0) * minutesPerDay +
        (parseInt(extraLeaveHours) || 0) * 60 +
        (parseInt(extraLeaveMinutes) || 0);

      // Max paid leave: 2 days = 1080 minutes
      if (paidLeaveTotalMinutes > 2 * minutesPerDay) {
        alert('Paid leave cannot exceed 2 days (1080 minutes).');
        return;
      }

      usedPaidMinutes = paidLeaveTotalMinutes;
      unusedPaidDays = Math.floor((2 * minutesPerDay - usedPaidMinutes) / minutesPerDay);
      extraMinutes = extraLeaveTotalMinutes;
    }

    const effectiveMinutes = baseMinutes + (unusedPaidDays * minutesPerDay) - extraMinutes;
    const inHand = perMinuteRate * effectiveMinutes;

    setResult({
      baseSalary,
      baseWorkingDays,
      baseMinutes,
      usedPaidMinutes,
      extraMinutes,
      unusedPaidDays,
      inHand: inHand.toFixed(2),
      calculationMode,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-lg w-full text-white border border-cyan-500 border-opacity-20">
        <h1 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
          IT Salary Calculator
        </h1>
        
        {/* This Month Toggle */}
        <div className="mb-6 bg-blue-800 bg-opacity-40 p-4 rounded-lg">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isThisMonth}
              onChange={() => setIsThisMonth(!isThisMonth)}
              className="w-5 h-5 text-cyan-400 bg-blue-700 border-0 rounded focus:ring-0"
            />
            <span className="text-lg font-medium">Calculate for this month</span>
          </label>
        </div>

        {/* Date Pickers */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isThisMonth}
            className={`p-3 rounded-lg bg-blue-800 bg-opacity-60 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 transition ${isThisMonth ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isThisMonth}
            className={`p-3 rounded-lg bg-blue-800 bg-opacity-60 text-white placeholder-gray-300 focus:ring-2 focus:ring-cyan-400 transition ${isThisMonth ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder="End Date"
          />
        </div>

        {/* Calculation Mode Radio */}
        <div className="mb-6 bg-blue-800 bg-opacity-40 p-5 rounded-lg">
          <p className="text-sm font-semibold mb-3 text-cyan-200">Leave Input Mode</p>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="day"
                checked={calculationMode === 'day'}
                onChange={() => {
                  setCalculationMode('day');
                  resetTimeInputs();
                }}
                className="w-4 h-4 text-cyan-400 bg-blue-700 focus:ring-0"
              />
              <span>Day-based</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="time"
                checked={calculationMode === 'time'}
                onChange={() => {
                  setCalculationMode('time');
                  resetDayInputs();
                }}
                className="w-4 h-4 text-cyan-400 bg-blue-700 focus:ring-0"
              />
              <span>Time-based (D:H:M)</span>
            </label>
          </div>
        </div>

        {/* Day-based Inputs */}
        {calculationMode === 'day' && (
          <div className="mb-6 space-y-3 bg-blue-800 bg-opacity-30 p-5 rounded-lg">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={usedOnePaid}
                onChange={() => handleDayCheckboxChange('one')}
                className="w-5 h-5 text-cyan-400 rounded focus:ring-0"
              />
              <span>Used 1 paid leave</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={usedTwoPaid}
                onChange={() => handleDayCheckboxChange('two')}
                className="w-5 h-5 text-cyan-400 rounded focus:ring-0"
              />
              <span>Used 2 paid leaves</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={usedExtra}
                onChange={() => handleDayCheckboxChange('extra')}
                className="w-5 h-5 text-cyan-400 rounded focus:ring-0"
              />
              <span>Used extra leaves</span>
            </label>

            {usedExtra && (
              <input
                type="number"
                value={extraDays}
                onChange={(e) => setExtraDays(e.target.value)}
                min="1"
                placeholder="Extra days"
                className="mt-2 p-3 rounded-lg bg-blue-700 bg-opacity-60 text-white w-full focus:ring-2 focus:ring-cyan-400"
              />
            )}
          </div>
        )}

        {/* Time-based Inputs */}
        {calculationMode === 'time' && (
          <div className="mb-6 space-y-5 bg-blue-800 bg-opacity-30 p-5 rounded-lg">
            <div>
              <p className="text-sm font-semibold mb-2 text-cyan-200">Paid Leave Used (max 2 days)</p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={paidLeaveDays}
                  onChange={(e) => setPaidLeaveDays(e.target.value)}
                  min="0"
                  max="2"
                  placeholder="D"
                  className="p-3 text-center rounded-lg bg-blue-700 bg-opacity-60 text-white focus:ring-2 focus:ring-cyan-400"
                />
                <input
                  type="number"
                  value={paidLeaveHours}
                  onChange={(e) => setPaidLeaveHours(e.target.value)}
                  min="0"
                  max="23"
                  placeholder="H"
                  className="p-3 text-center rounded-lg bg-blue-700 bg-opacity-60 text-white focus:ring-2 focus:ring-cyan-400"
                />
                <input
                  type="number"
                  value={paidLeaveMinutes}
                  onChange={(e) => setPaidLeaveMinutes(e.target.value)}
                  min="0"
                  max="59"
                  placeholder="M"
                  className="p-3 text-center rounded-lg bg-blue-700 bg-opacity-60 text-white focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2 text-cyan-200">Extra Leave Taken</p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={extraLeaveDays}
                  onChange={(e) => setExtraLeaveDays(e.target.value)}
                  min="0"
                  placeholder="D"
                  className="p-3 text-center rounded-lg bg-blue-700 bg-opacity-60 text-white focus:ring-2 focus:ring-cyan-400"
                />
                <input
                  type="number"
                  value={extraLeaveHours}
                  onChange={(e) => setExtraLeaveHours(e.target.value)}
                  min="0"
                  max="23"
                  placeholder="H"
                  className="p-3 text-center rounded-lg bg-blue-700 bg-opacity-60 text-white focus:ring-2 focus:ring-cyan-400"
                />
                <input
                  type="number"
                  value={extraLeaveMinutes}
                  onChange={(e) => setExtraLeaveMinutes(e.target.value)}
                  min="0"
                  max="59"
                  placeholder="M"
                  className="p-3 text-center rounded-lg bg-blue-700 bg-opacity-60 text-white focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Salary Input */}
        <div className="mb-6">
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="Enter monthly salary (e.g., 27000)"
            className="p-4 rounded-lg bg-blue-800 bg-opacity-60 text-white w-full text-lg focus:ring-2 focus:ring-cyan-400 transition placeholder-gray-300"
          />
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateSalary}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg"
        >
          Calculate Salary
        </button>

        {/* Result */}
        {result && (
          <div className="mt-8 p-6 bg-blue-800 bg-opacity-40 rounded-lg border border-cyan-400 border-opacity-30 space-y-3 text-cyan-100">
            <p className="text-lg">
              <strong>Base Salary:</strong> ₹{result.baseSalary} for {result.baseWorkingDays} working days ({result.baseMinutes} minutes)
            </p>
            <p>
              <strong>Paid Leave Used:</strong> {result.usedPaidMinutes} minutes
              {result.unusedPaidDays > 0 && ` → ${result.unusedPaidDays} day(s) added as overtime`}
            </p>
            <p>
              <strong>Extra Leave:</strong> {result.extraMinutes} minutes deducted
            </p>
            <p className="text-2xl font-bold text-cyan-300 mt-4">
              In-Hand Salary: ₹{result.inHand}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;