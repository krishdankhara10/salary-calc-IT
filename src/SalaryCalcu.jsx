import React, { useState, useEffect } from "react";

function SalaryCalculator() {
  const [isThisMonth, setIsThisMonth] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [calculationMode, setCalculationMode] = useState("time");
  const [darkMode, setDarkMode] = useState(false);

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

  const [salary, setSalary] = useState("");
  const [result, setResult] = useState(null);
  const [isFullMonth, setIsFullMonth] = useState(false);

  // Theme classes
  const theme = {
    background: darkMode
      ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      : "bg-gradient-to-br from-cyan-50 via-white to-blue-50",
    card: darkMode
      ? "bg-gray-800 border-cyan-500/20"
      : "bg-white border-cyan-200",
    text: darkMode ? "text-white" : "text-gray-800",
    textSecondary: darkMode ? "text-gray-300" : "text-gray-600",
    accent: "text-cyan-600",
    input: darkMode
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-800 placeholder-gray-500",
    button:
      "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700",
    section: darkMode
      ? "bg-gray-700/50 border-cyan-500/20"
      : "bg-cyan-50/50 border-cyan-200",
    result: darkMode
      ? "bg-gradient-to-br from-gray-800 to-gray-700 border-cyan-500/30"
      : "bg-gradient-to-br from-white to-cyan-50 border-cyan-200",
  };

  // Get current month name for display
  const getCurrentMonthName = () => {
    const now = new Date();
    return now.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Set default dates for current month
  useEffect(() => {
    if (isThisMonth) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(lastDay.toISOString().split("T")[0]);
      setIsFullMonth(true);
    }
  }, [isThisMonth]);

  // Check if custom date range is a full month
  useEffect(() => {
    if (!isThisMonth && startDate && endDate) {
      checkIfFullMonth(startDate, endDate);
    }
  }, [isThisMonth, startDate, endDate]);

  const checkIfFullMonth = (start, end) => {
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    
    // Get first day of start date month
    const firstDayOfMonth = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
    // Get last day of start date month
    const lastDayOfMonth = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + 1, 0);
    
    // Check if start date is first day of month and end date is last day of same month
    const isStartFirstDay = startDateObj.getDate() === 1;
    const isEndLastDay = endDateObj.getDate() === lastDayOfMonth.getDate();
    const isSameMonth = startDateObj.getMonth() === endDateObj.getMonth() && 
                       startDateObj.getFullYear() === endDateObj.getFullYear();
    
    setIsFullMonth(isStartFirstDay && isEndLastDay && isSameMonth);
  };

  // Helper function to get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper function to get sundays in month
  const getSundaysInMonth = (year, month) => {
    let sundays = 0;
    const daysInMonth = getDaysInMonth(year, month);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === 0) {
        sundays++;
      }
    }
    return sundays;
  };

  // Calculate working days between two dates
  const calculateWorkingDays = (start, end) => {
    let workingDays = 0;
    let current = new Date(start);
    
    while (current <= end) {
      // Exclude Sundays (0 is Sunday)
      if (current.getDay() !== 0) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  };

  // Calculate salary proportion for custom date range
  const calculateProportionalSalary = (start, end, monthlySalary) => {
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();
    const endMonth = end.getMonth();
    const endYear = end.getFullYear();

    let totalProportionalSalary = 0;

    // If date range is within same month
    if (startMonth === endMonth && startYear === endYear) {
      const totalDaysInMonth = getDaysInMonth(startYear, startMonth);
      const sundaysInMonth = getSundaysInMonth(startYear, startMonth);
      const totalWorkingDaysInMonth = totalDaysInMonth - sundaysInMonth;
      
      const workingDaysInRange = calculateWorkingDays(start, end);
      
      totalProportionalSalary = (monthlySalary / totalWorkingDaysInMonth) * workingDaysInRange;
    } else {
      // Handle multiple months
      let current = new Date(start);
      
      while (current <= end) {
        const currentMonth = current.getMonth();
        const currentYear = current.getFullYear();
        
        // Get first and last day of current month in range
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        
        const rangeStart = current > monthStart ? current : monthStart;
        const rangeEnd = end < monthEnd ? end : monthEnd;
        
        const totalDaysInMonth = getDaysInMonth(currentYear, currentMonth);
        const sundaysInMonth = getSundaysInMonth(currentYear, currentMonth);
        const totalWorkingDaysInMonth = totalDaysInMonth - sundaysInMonth;
        
        const workingDaysInMonthRange = calculateWorkingDays(rangeStart, rangeEnd);
        const monthlyProportion = (monthlySalary / totalWorkingDaysInMonth) * workingDaysInMonthRange;
        
        totalProportionalSalary += monthlyProportion;
        
        // Move to next month
        current = new Date(currentYear, currentMonth + 1, 1);
      }
    }
    
    return totalProportionalSalary;
  };

  const handleDayCheckboxChange = (type) => {
    if (type === "one") {
      setUsedOnePaid(!usedOnePaid);
      setUsedTwoPaid(false);
      setUsedExtra(false);
      setExtraDays(0);
    } else if (type === "two") {
      setUsedTwoPaid(!usedTwoPaid);
      setUsedOnePaid(false);
      setUsedExtra(false);
      setExtraDays(0);
    } else if (type === "extra") {
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
        alert("Please select start and end dates.");
        return;
      }
      start = new Date(startDate);
      end = new Date(endDate);
      if (start > end) {
        alert("Start date cannot be after end date.");
        return;
      }
    }

    const baseSalary = parseFloat(salary);
    if (!baseSalary || baseSalary <= 0) {
      alert("Please enter a valid salary amount.");
      return;
    }

    // Calculate total days and sundays in the range
    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    let sundays = 0;
    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() === 0) sundays++;
      current.setDate(current.getDate() + 1);
    }

    const baseWorkingDays = totalDays - sundays;
    const minutesPerDay = 9 * 60;

    let proportionalSalary;
    let usedPaidMinutes = 0;
    let extraMinutes = 0;
    let unusedPaidDays = 0;
    let finalSalary = 0;

    if (isThisMonth || isFullMonth) {
      // For current month OR full month custom range - apply paid leave logic
      const baseMinutes = baseWorkingDays * minutesPerDay;
      const perMinuteRate = baseSalary / baseMinutes;
      
      if (calculationMode === "day") {
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
        const paidLeaveTotalMinutes =
          (parseInt(paidLeaveDays) || 0) * minutesPerDay +
          (parseInt(paidLeaveHours) || 0) * 60 +
          (parseInt(paidLeaveMinutes) || 0);

        const extraLeaveTotalMinutes =
          (parseInt(extraLeaveDays) || 0) * minutesPerDay +
          (parseInt(extraLeaveHours) || 0) * 60 +
          (parseInt(extraLeaveMinutes) || 0);

        if (paidLeaveTotalMinutes > 2 * minutesPerDay) {
          alert("Paid leave cannot exceed 2 days (1080 minutes).");
          return;
        }

        usedPaidMinutes = paidLeaveTotalMinutes;
        unusedPaidDays = Math.floor(
          (2 * minutesPerDay - usedPaidMinutes) / minutesPerDay
        );
        extraMinutes = extraLeaveTotalMinutes;
      }

      const effectiveMinutes = baseMinutes + unusedPaidDays * minutesPerDay - extraMinutes;
      finalSalary = perMinuteRate * effectiveMinutes;

      setResult({
        baseSalary,
        baseWorkingDays,
        baseMinutes,
        usedPaidMinutes,
        extraMinutes,
        unusedPaidDays,
        inHand: Math.round(finalSalary),
        calculationMode,
        totalDays,
        sundays,
        perMinuteRate: perMinuteRate.toFixed(2),
        effectiveMinutes: Math.round(effectiveMinutes),
        monthName: isThisMonth ? getCurrentMonthName() : getMonthName(start),
        isCustomRange: !isThisMonth,
        isFullMonth: true,
        proportionalBase: Math.round(baseSalary),
        deduction: Math.round(baseSalary - finalSalary),
      });
    } else {
      // For partial month custom range - proportional calculation with leave deductions
      proportionalSalary = calculateProportionalSalary(start, end, baseSalary);
      
      // Apply leave deductions for partial range
      let deduction = 0;
      const dailyRate = baseSalary / baseWorkingDays;

      if (calculationMode === "day") {
        let paidLeaveDaysUsed = 0;
        if (usedExtra) {
          paidLeaveDaysUsed = 2;
          deduction += (parseInt(extraDays) || 0) * dailyRate;
        } else if (usedTwoPaid) {
          paidLeaveDaysUsed = 2;
        } else if (usedOnePaid) {
          paidLeaveDaysUsed = 1;
        }
        
        // Only deduct if paid leaves are exceeded (for partial months, we calculate proportion of 2 days)
        const allowedPaidDays = 2 * (baseWorkingDays / (getDaysInMonth(start.getFullYear(), start.getMonth()) - getSundaysInMonth(start.getFullYear(), start.getMonth())));
        if (paidLeaveDaysUsed > allowedPaidDays) {
          deduction += (paidLeaveDaysUsed - allowedPaidDays) * dailyRate;
        }
      } else {
        const paidLeaveTotalMinutes =
          (parseInt(paidLeaveDays) || 0) * minutesPerDay +
          (parseInt(paidLeaveHours) || 0) * 60 +
          (parseInt(paidLeaveMinutes) || 0);

        const extraLeaveTotalMinutes =
          (parseInt(extraLeaveDays) || 0) * minutesPerDay +
          (parseInt(extraLeaveHours) || 0) * 60 +
          (parseInt(extraLeaveMinutes) || 0);

        // Convert to days for deduction calculation
        const paidLeaveDaysUsed = paidLeaveTotalMinutes / minutesPerDay;
        const extraLeaveDaysUsed = extraLeaveTotalMinutes / minutesPerDay;

        // Calculate allowed paid leave proportion for this period
        const totalWorkingDaysInMonth = getDaysInMonth(start.getFullYear(), start.getMonth()) - getSundaysInMonth(start.getFullYear(), start.getMonth());
        const allowedPaidDays = 2 * (baseWorkingDays / totalWorkingDaysInMonth);

        if (paidLeaveDaysUsed > allowedPaidDays) {
          deduction += (paidLeaveDaysUsed - allowedPaidDays) * dailyRate;
        }
        
        deduction += extraLeaveDaysUsed * dailyRate;
      }

      finalSalary = Math.max(0, proportionalSalary - deduction);

      setResult({
        baseSalary,
        baseWorkingDays,
        baseMinutes: baseWorkingDays * minutesPerDay,
        usedPaidMinutes: calculationMode === "day" ? 
          (usedOnePaid ? minutesPerDay : usedTwoPaid ? 2 * minutesPerDay : usedExtra ? 2 * minutesPerDay : 0) : 
          (parseInt(paidLeaveDays) || 0) * minutesPerDay + (parseInt(paidLeaveHours) || 0) * 60 + (parseInt(paidLeaveMinutes) || 0),
        extraMinutes: calculationMode === "day" ? 
          (usedExtra ? (parseInt(extraDays) || 0) * minutesPerDay : 0) : 
          (parseInt(extraLeaveDays) || 0) * minutesPerDay + (parseInt(extraLeaveHours) || 0) * 60 + (parseInt(extraLeaveMinutes) || 0),
        unusedPaidDays: calculationMode === "day" ? 
          (usedOnePaid ? 1 : usedTwoPaid ? 0 : usedExtra ? 0 : 2) : 
          Math.max(0, 2 - ((parseInt(paidLeaveDays) || 0) + ((parseInt(paidLeaveHours) || 0) + (parseInt(paidLeaveMinutes) || 0) / 60) / 9)),
        inHand: Math.round(finalSalary),
        calculationMode,
        totalDays,
        sundays,
        perMinuteRate: (baseSalary / (baseWorkingDays * minutesPerDay)).toFixed(2),
        effectiveMinutes: Math.round(baseWorkingDays * minutesPerDay),
        monthName: getCustomRangeDisplay(start, end),
        isCustomRange: true,
        isFullMonth: false,
        proportionalBase: Math.round(proportionalSalary),
        deduction: Math.round(deduction),
      });
    }
  };

  const resetCalculator = () => {
    setSalary("");
    setResult(null);
    resetDayInputs();
    resetTimeInputs();
  };

  const getMonthName = (date) => {
    if (!date) return "--";
    const dateObj = new Date(date);
    return dateObj.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  const getCustomRangeDisplay = (start, end) => {
    if (!start || !end) return "--";
    const startStr = start.toLocaleDateString();
    const endStr = end.toLocaleDateString();
    return `${startStr} to ${endStr}`;
  };

  const getPeriodDisplay = () => {
    if (isThisMonth) {
      return getCurrentMonthName();
    } else if (startDate && endDate) {
      return getCustomRangeDisplay(new Date(startDate), new Date(endDate));
    }
    return "--";
  };

  return (
    <div
      className={`min-h-screen ${theme.background} py-8 px-4 transition-colors duration-300 [font-family:"verdana"]`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="w-10"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              IT Salary Calculator
            </h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-20 md:w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                darkMode
                  ? "bg-cyan-600 text-white"
                  : "bg-cyan-100 text-cyan-600"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
          <p className={`text-lg ${theme.textSecondary}`}>
            Calculate your salary with precision using minute-based calculations
          </p>
          {isThisMonth && (
            <div
              className={`mt-2 inline-block px-3 py-1 rounded-full text-sm ${
                darkMode
                  ? "bg-cyan-900 text-cyan-300"
                  : "bg-cyan-100 text-cyan-700"
              }`}
            >
              Currently calculating for:{" "}
              <strong>{getCurrentMonthName()}</strong>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div
            className={`rounded-2xl shadow-xl p-6 border-2 ${theme.card} transition-all duration-300`}
          >
            {/* Month Toggle */}
            <div className={`mb-6 p-4 rounded-xl border ${theme.section}`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${theme.text}`}>
                  Calculation Period
                </span>
                <label className="relative inline-flex items-center cursor-pointer w-full sm:w-auto">
                  <input
                    type="checkbox"
                    checked={isThisMonth}
                    onChange={() => setIsThisMonth(!isThisMonth)}
                    className="sr-only peer"
                  />
                  <div
                    className={`
    flex-shrink-0
    w-11 h-6 sm:w-14 sm:h-7 
    rounded-full peer 
    ${darkMode ? "bg-gray-600" : "bg-gray-300"}
    peer-focus:ring-2 sm:peer-focus:ring-4 
    peer-focus:ring-cyan-300/50
    peer-checked:after:translate-x-full 
    peer-checked:after:border-white 
    after:content-[''] after:absolute after:top-0.5 
    after:left-[2px] sm:after:left-[4px] 
    after:bg-white after:border-gray-300 
    after:border after:rounded-full 
    after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 
    after:transition-all 
    peer-checked:bg-cyan-600
    transition-colors duration-200
  `}
                  ></div>
                  <span
                    className={`
    ml-2 sm:ml-3 
    text-xs sm:text-sm 
    font-medium ${theme.text}
    whitespace-nowrap
  `}
                  >
                    {isThisMonth ? "This Month" : "Custom Range"}
                  </span>
                </label>
              </div>
              {isThisMonth ? (
                <p className={`text-sm mt-2 ${theme.textSecondary}`}>
                  Calculating for{" "}
                  <span className="text-cyan-600 font-semibold">
                    {getCurrentMonthName()}
                  </span>
                  {" "}(Full Month - Paid Leave Logic Applied)
                </p>
              ) : (
                <p className={`text-sm mt-2 ${theme.textSecondary}`}>
                  {isFullMonth ? (
                    <span className="text-green-600 font-semibold">
                      ✓ Full Month Selected - Paid Leave Applied
                    </span>
                  ) : (
                    <span className="text-orange-600">
                      ⚠ Partial Month - Proportional Calculation
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Date Pickers */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isThisMonth}
                  className={`w-full p-3 rounded-xl border-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all ${
                    theme.input
                  } ${isThisMonth ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme.text}`}
                >
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isThisMonth}
                  className={`w-full p-3 rounded-xl border-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all ${
                    theme.input
                  } ${isThisMonth ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>
            </div>

            {/* Calculation Mode */}
            <div className={`mb-6 p-5 rounded-xl border ${theme.section}`}>
              <p className={`text-sm font-semibold mb-3 ${theme.text}`}>
                Leave Input Mode
              </p>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="day"
                    checked={calculationMode === "day"}
                    onChange={() => {
                      setCalculationMode("day");
                      resetTimeInputs();
                    }}
                    className="w-4 h-4 text-cyan-600 focus:ring-2 focus:ring-cyan-300"
                  />
                  <span className={theme.text}>Day-based</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="time"
                    checked={calculationMode === "time"}
                    onChange={() => {
                      setCalculationMode("time");
                      resetDayInputs();
                    }}
                    className="w-4 h-4 text-cyan-600 focus:ring-2 focus:ring-cyan-300"
                  />
                  <span className={theme.text}>Time-based (D:H:M)</span>
                </label>
              </div>
            </div>

            {/* Show leave inputs only for full months */}
            {(isThisMonth || isFullMonth) && (
              <>
                {/* Day-based Inputs */}
                {calculationMode === "day" && (
                  <div
                    className={`mb-6 space-y-4 p-5 rounded-xl border ${theme.section}`}
                  >
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={usedOnePaid}
                        onChange={() => handleDayCheckboxChange("one")}
                        className="w-5 h-5 text-cyan-600 rounded focus:ring-2 focus:ring-cyan-300 transition"
                      />
                      <span
                        className={`group-hover:text-cyan-600 transition-colors ${theme.text}`}
                      >
                        Used 1 paid leave
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={usedTwoPaid}
                        onChange={() => handleDayCheckboxChange("two")}
                        className="w-5 h-5 text-cyan-600 rounded focus:ring-2 focus:ring-cyan-300 transition"
                      />
                      <span
                        className={`group-hover:text-cyan-600 transition-colors ${theme.text}`}
                      >
                        Used 2 paid leaves
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={usedExtra}
                        onChange={() => handleDayCheckboxChange("extra")}
                        className="w-5 h-5 text-cyan-600 rounded focus:ring-2 focus:ring-cyan-300 transition"
                      />
                      <span
                        className={`group-hover:text-cyan-600 transition-colors ${theme.text}`}
                      >
                        Used extra leaves
                      </span>
                    </label>

                    {usedExtra && (
                      <div className="mt-3 animate-fadeIn">
                        <label
                          className={`block text-sm font-medium mb-2 ${theme.text}`}
                        >
                          Extra Leave Days
                        </label>
                        <input
                          type="number"
                          value={extraDays}
                          onChange={(e) => setExtraDays(e.target.value)}
                          min="1"
                          placeholder="Number of extra days"
                          className={`w-full p-3 rounded-xl border-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all ${theme.input}`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Time-based Inputs */}
                {calculationMode === "time" && (
                  <div
                    className={`mb-6 space-y-6 p-5 rounded-xl border ${theme.section}`}
                  >
                    <div>
                      <p className={`text-sm font-semibold mb-3 ${theme.text}`}>
                        Paid Leave Used{" "}
                        <span className="text-cyan-600">(max 2 days)</span>
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {["Days", "Hours", "Minutes"].map((label, index) => (
                          <div key={label}>
                            <label
                              className={`block text-xs font-medium mb-1 text-center ${theme.textSecondary}`}
                            >
                              {label}
                            </label>
                            <input
                              type="number"
                              value={
                                [paidLeaveDays, paidLeaveHours, paidLeaveMinutes][
                                  index
                                ]
                              }
                              onChange={(e) => {
                                const setters = [
                                  setPaidLeaveDays,
                                  setPaidLeaveHours,
                                  setPaidLeaveMinutes,
                                ];
                                setters[index](e.target.value);
                              }}
                              min="0"
                              max={
                                label === "Days"
                                  ? "2"
                                  : label === "Hours"
                                  ? "23"
                                  : "59"
                              }
                              placeholder="0"
                              className={`w-full p-3 text-center rounded-xl border-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all ${theme.input}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className={`text-sm font-semibold mb-3 ${theme.text}`}>
                        Extra Leave Taken
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {["Days", "Hours", "Minutes"].map((label, index) => (
                          <div key={label}>
                            <label
                              className={`block text-xs font-medium mb-1 text-center ${theme.textSecondary}`}
                            >
                              {label}
                            </label>
                            <input
                              type="number"
                              value={
                                [
                                  extraLeaveDays,
                                  extraLeaveHours,
                                  extraLeaveMinutes,
                                ][index]
                              }
                              onChange={(e) => {
                                const setters = [
                                  setExtraLeaveDays,
                                  setExtraLeaveHours,
                                  setExtraLeaveMinutes,
                                ];
                                setters[index](e.target.value);
                              }}
                              min="0"
                              max={label === "Hours" ? "23" : "59"}
                              placeholder="0"
                              className={`w-full p-3 text-center rounded-xl border-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all ${theme.input}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Show message for partial months */}
            {!isThisMonth && !isFullMonth && (
              <div className={`mb-6 p-4 rounded-xl border ${theme.section} bg-orange-50 border-orange-200`}>
                <p className={`text-sm text-orange-700`}>
                  <strong>Note:</strong> For partial month ranges, leave deductions are calculated proportionally based on working days.
                </p>
              </div>
            )}

            {/* Salary Input */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                Monthly Salary (₹)
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Enter your monthly salary (e.g., 10000)"
                className={`w-full p-4 rounded-xl border-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-lg transition-all ${theme.input}`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={calculateSalary}
                className={`flex-1 ${theme.button} text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg`}
              >
                Calculate Salary
              </button>
              <button
                onClick={resetCalculator}
                className={`flex-1 ${
                  darkMode
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-gray-200 hover:bg-gray-300"
                } text-gray-800 font-bold py-4 px-6 rounded-xl transition-all duration-300`}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div
            className={`rounded-2xl shadow-xl p-6 border-2 ${theme.result} transition-all duration-300`}
          >
            <h2 className={`text-2xl font-bold mb-6 text-center ${theme.text}`}>
              Salary Calculation Results
            </h2>

            <div className="space-y-6">
              {/* Period Information */}
              <div className={`p-4 rounded-xl border ${theme.section}`}>
                <h3
                  className={`text-lg font-semibold mb-3 ${theme.text} border-b pb-2`}
                >
                  Period Information
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Period", value: getPeriodDisplay() },
                    {
                      label: "Range Type",
                      value: result ? 
                        (result.isFullMonth ? "Full Month" : "Partial Range") : 
                        (isThisMonth || isFullMonth ? "Full Month" : "Partial Range"),
                    },
                    {
                      label: "Total Days",
                      value: result ? `${result.totalDays} days` : "--",
                    },
                    {
                      label: "Sundays",
                      value: result ? `${result.sundays} days` : "--",
                    },
                    {
                      label: "Working Days",
                      value: result ? `${result.baseWorkingDays} days` : "--",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className={theme.textSecondary}>{item.label}:</span>
                      <span className={`font-medium ${theme.text}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Information - Only show for full months */}
              {(isThisMonth || isFullMonth) && (
                <div className={`p-4 rounded-xl border ${theme.section}`}>
                  <h3
                    className={`text-lg font-semibold mb-3 ${theme.text} border-b pb-2`}
                  >
                    Leave Details
                  </h3>
                  <div className="space-y-2">
                    {[
                      {
                        label: "Paid Leave Used",
                        value: result
                          ? `${result.usedPaidMinutes} minutes`
                          : "--",
                        color: theme.text,
                      },
                      {
                        label: "Extra Leave",
                        value: result ? `-${result.extraMinutes} minutes` : "--",
                        color: "text-red-500",
                      },
                      {
                        label: "Unused Paid Days",
                        value: result ? `+${result.unusedPaidDays} days` : "--",
                        color: "text-green-500",
                      },
                      {
                        label: "Input Mode",
                        value: result ? `${result.calculationMode} based` : "--",
                        color: theme.text,
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className={theme.textSecondary}>{item.label}:</span>
                        <span className={`font-medium ${item.color}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Salary Breakdown */}
              <div className={`p-4 rounded-xl border ${theme.section}`}>
                <h3
                  className={`text-lg font-semibold mb-3 ${theme.text} border-b pb-2`}
                >
                  Salary Breakdown
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      label: "Base Salary",
                      value: result
                        ? `₹${result.baseSalary.toLocaleString()}`
                        : "--",
                    },
                    {
                      label: "Base Minutes",
                      value: result
                        ? `${result.baseMinutes.toLocaleString()} min`
                        : "--",
                    },
                    {
                      label: "Paid per Minute",
                      value: result ? `₹${result.perMinuteRate}` : "--",
                    },
                    ...(result?.isCustomRange && !result?.isFullMonth ? [
                      {
                        label: "Proportional Base",
                        value: result ? `₹${result.proportionalBase.toLocaleString()}` : "--",
                      },
                      {
                        label: "Deductions",
                        value: result ? `-₹${result.deduction.toLocaleString()}` : "--",
                        color: "text-red-500"
                      }
                    ] : []),
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className={theme.textSecondary}>{item.label}:</span>
                      <span className={`font-medium ${item.color || theme.text}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Salary */}
              <div className="text-center p-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl border border-cyan-400">
                <p className="text-white/80 text-sm mb-2">
                  Your In-Hand Salary Will Be
                </p>
                <p className="text-4xl font-bold text-white mb-2">
                  {result ? `₹${result.inHand.toLocaleString()}` : "--"}
                </p>
                <p className="text-white/70 text-sm">
                  {result
                    ? result.isFullMonth 
                      ? `Based on ${result.effectiveMinutes?.toLocaleString()} effective minutes`
                      : `For ${result.totalDays} days (${result.baseWorkingDays} working days)`
                    : "Calculate to see results"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-8 text-sm ${theme.textSecondary}`}>
          <p>
            Built by Krish with React.js • Professional IT Salary Calculator •
            *Terms of {new Date().getFullYear()} Used
          </p>
        </div>
      </div>
    </div>
  );
}

export default SalaryCalculator;