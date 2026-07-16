import express from 'express';

const router = express.Router();

// Helper: Simple Linear Regression fit
function fitLinearRegression(x, y) {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }
  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const c = (sumY - m * sumX) / n;
  return { m, c };
}

router.post('/', async (req, res) => {
  try {
    const { expenses = [], budgets = [], savings_goals = [], days_to_predict = 7 } = req.body;

    // 1. Group daily totals
    const dailySums = {};
    expenses.forEach(exp => {
      if (exp.date) {
        const dStr = exp.date.split('T')[0];
        dailySums[dStr] = (dailySums[dStr] || 0.0) + parseFloat(exp.amount || 0);
      }
    });

    const sortedDates = Object.keys(dailySums).sort();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let startOffsetDate = today;
    if (sortedDates.length > 0) {
      startOffsetDate = new Date(sortedDates[0]);
    } else {
      startOffsetDate = new Date();
      startOffsetDate.setDate(today.getDate() - 7);
    }

    const startOffsetTime = startOffsetDate.getTime();
    const getDaysDiff = (dateStr) => {
      const diffMs = new Date(dateStr).getTime() - startOffsetTime;
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    };

    let X_reg = [];
    let y_reg = [];

    Object.keys(dailySums).forEach(dStr => {
      const daysDiff = getDaysDiff(dStr);
      X_reg.push(daysDiff);
      y_reg.push(dailySums[dStr]);
    });

    // Handle minimal entries by filling default values
    if (X_reg.length < 3) {
      const avgVal = y_reg.length > 0 ? y_reg.reduce((a, b) => a + b, 0) / y_reg.length : 150.0;
      X_reg = [0, 1, 2];
      y_reg = [avgVal * 0.9, avgVal, avgVal * 1.1];
    }

    const { m: slope, c: intercept } = fitLinearRegression(X_reg, y_reg);

    const forecast = [];
    const daysSinceStartForToday = getDaysDiff(todayStr);

    for (let i = 1; i <= days_to_predict; i++) {
      const predDay = daysSinceStartForToday + i;
      const val = slope * predDay + intercept;
      forecast.push(parseFloat(Math.max(20.0, val).toFixed(2)));
    }

    const tomorrowPredicted = forecast[0];

    // 2. Category Forecast (Next 30 Days)
    const categorySums = {};
    expenses.forEach(exp => {
      if (exp.category) {
        categorySums[exp.category] = (categorySums[exp.category] || 0.0) + parseFloat(exp.amount || 0);
      }
    });

    const activeDaysSpan = Math.max(7, daysSinceStartForToday + 1);
    const categoryForecast = [];
    const mitigationStrategies = [];

    // Map monthly budgets
    const budgetLimits = {};
    budgets.forEach(b => {
      if (b.period === 'Monthly') {
        budgetLimits[b.category] = parseFloat(b.amount || 0);
      }
    });

    const globalMonthlyBudget = budgetLimits['All'] || 12000.0;

    Object.keys(categorySums).forEach(cat => {
      const total = categorySums[cat];
      const dailyAvg = total / activeDaysSpan;
      const predicted30 = parseFloat((dailyAvg * 30.0).toFixed(2));

      const limit = budgetLimits[cat] || {
        Food: 4000.0,
        Entertainment: 2500.0,
        Books: 1500.0,
        Transport: 1200.0,
        Shopping: 2000.0
      }[cat] || 2000.0;

      const percentage = Math.round(Math.min(100.0, (predicted30 / limit) * 100));

      if (budgetLimits[cat] && predicted30 > limit) {
        mitigationStrategies.push(
          `Your predicted monthly spending on ${cat} (${predicted30.toFixed(0)} INR) is projected to exceed its budget limit of ${limit.toFixed(0)} INR by ${(predicted30 - limit).toFixed(0)} INR.`
        );
      }

      categoryForecast.push({
        category: cat,
        predicted: predicted30,
        percentage
      });
    });

    categoryForecast.sort((a, b) => b.predicted - a.predicted);

    // 3. Savings Goals Feasibility
    const monthlyAllowance = globalMonthlyBudget > 0 ? globalMonthlyBudget * 1.25 : 15000.0;
    const totalSpending30 = Object.values(dailySums).reduce((a, b) => a + b, 0);
    const averageDailySpending = totalSpending30 / activeDaysSpan;
    const dailySavingsRate = Math.max(30.0, (monthlyAllowance / 30.0) - averageDailySpending);

    const goalPredictions = [];
    savings_goals.forEach(goal => {
      const remaining = Math.max(0.0, parseFloat(goal.targetAmount || 0) - parseFloat(goal.currentAmount || 0));
      const goalDeadline = new Date(goal.deadline);
      const daysLeft = Math.max(1, Math.floor((goalDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      if (remaining === 0.0) {
        goalPredictions.push({
          title: goal.title,
          probability: 100.0,
          predicted_date: todayStr,
          days_needed: 0.0,
          status: 'Completed'
        });
      } else {
        const daysNeeded = remaining / dailySavingsRate;
        const predictedDate = new Date();
        predictedDate.setDate(today.getDate() + Math.ceil(daysNeeded));
        const predictedDateStr = predictedDate.toISOString().split('T')[0];

        let status = 'On track';
        let prob = 85.0;

        if (daysNeeded <= daysLeft) {
          prob = Math.min(99.0, 85.0 + (daysLeft - daysNeeded) * 0.5);
        } else {
          prob = Math.max(10.0, 85.0 * (daysLeft / daysNeeded));
          status = prob > 45.0 ? 'Behind' : 'At Risk';
          const extraDaily = (remaining / daysLeft) - dailySavingsRate;
          mitigationStrategies.push(
            `To hit your '${goal.title}' deadline (${goal.deadline.split('T')[0]}), you need to save an extra ${extraDaily.toFixed(0)} INR per day.`
          );
        }

        goalPredictions.push({
          title: goal.title,
          probability: parseFloat(prob.toFixed(1)),
          predicted_date: predictedDateStr,
          days_needed: parseFloat(daysNeeded.toFixed(1)),
          status
        });
      }
    });

    const predictedMonthlyTotal = averageDailySpending * 30.0;
    let risk = 'Low';
    let budgetProbability = 90.0;

    if (predictedMonthlyTotal > globalMonthlyBudget) {
      mitigationStrategies.push(
        `Your overall monthly spending is on pace to reach ${predictedMonthlyTotal.toFixed(0)} INR, exceeding your Monthly budget limit of ${globalMonthlyBudget.toFixed(0)} INR. Deploy budget limits or complete saving challenges.`
      );
      risk = predictedMonthlyTotal > globalMonthlyBudget * 1.15 ? 'High' : 'Medium';
      budgetProbability = Math.max(10.0, 90.0 - ((predictedMonthlyTotal / globalMonthlyBudget) - 1.0) * 150);
    } else {
      budgetProbability = Math.min(99.0, 95.0 + ((globalMonthlyBudget - predictedMonthlyTotal) / globalMonthlyBudget) * 20);
    }

    if (slope > 25.0) {
      risk = 'High';
    } else if (slope > 10.0 && risk === 'Low') {
      risk = 'Medium';
    }

    if (mitigationStrategies.length === 0) {
      mitigationStrategies.push('Your saving discipline is robust. Keep it up!');
      mitigationStrategies.push('Great job tracking your daily expenses! Try setting custom budget alerts.');
    } else if (mitigationStrategies.length < 3) {
      mitigationStrategies.push('Consider reviewing your non-essential categories to create a larger savings cushion.');
    }

    res.json({
      tomorrow_predicted: parseFloat(tomorrowPredicted.toFixed(2)),
      forecast,
      overspending_risk: risk,
      budget_probability: parseFloat(budgetProbability.toFixed(1)),
      category_forecast: categoryForecast,
      goal_predictions: goalPredictions,
      mitigation_strategies: mitigationStrategies
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
