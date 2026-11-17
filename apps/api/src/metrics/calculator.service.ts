import { Injectable } from '@nestjs/common';

type Sex = 'male' | 'female';
type Activity = 'sedentary' | 'moderate' | 'active';
type Climate = 'cool' | 'temperate' | 'hot';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

@Injectable()
export class CalculatorService {
  /**
   * Calculate BMI (Body Mass Index)
   */
  calculateBMI(weightKg: number, heightCm: number): {
    bmi: number;
    category: 'underweight' | 'normal' | 'overweight' | 'obese';
  } {
    const heightM = heightCm / 100;
    const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

    let category: 'underweight' | 'normal' | 'overweight' | 'obese';
    if (bmi < 18.5) category = 'underweight';
    else if (bmi < 25) category = 'normal';
    else if (bmi < 30) category = 'overweight';
    else category = 'obese';

    return { bmi, category };
  }

  /**
   * Calculate BMR using Mifflin-St Jeor Equation
   */
  calculateBMR(
    weightKg: number,
    heightCm: number,
    ageYears: number,
    sex: Sex,
  ): number {
    if (sex === 'female') {
      return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  }

  /**
   * Calculate TDEE (Total Daily Energy Expenditure)
   */
  calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    } as const;

    return Math.round(bmr * multipliers[activityLevel]);
  }

  /**
   * Calculate daily water need (30-35 ml/kg baseline with modifiers)
   */
  calculateDailyWaterNeed(
    weightKg: number,
    activity: Activity,
    climate: Climate,
  ): number {
    const base = weightKg * 33; // 33 ml per kg baseline (average of 30-35)
    const activityMultiplier = {
      sedentary: 1.0,
      moderate: 1.15,
      active: 1.3,
    }[activity];
    const climateBonus = { cool: 0, temperate: 250, hot: 500 }[climate];

    return Math.round(base * activityMultiplier + climateBonus); // ml/day
  }

  /**
   * Calculate pregnancy due date (Naegele's rule: LMP + 280 days)
   */
  calculateDueDate(lmpDate: Date): Date {
    const dueDate = new Date(lmpDate);
    dueDate.setDate(dueDate.getDate() + 280);
    return dueDate;
  }

  /**
   * Calculate pregnancy week from LMP
   */
  calculatePregnancyWeek(lmpDate: Date): number {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lmpDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
  }

  /**
   * Calculate cycle prediction, ovulation, fertile window & current phase
   */
  calculateCycleEstimate(params: {
    lastPeriodDate: string;
    cycleLength?: number;
    periodLength?: number;
  }) {
    const cycleLength = Math.min(45, Math.max(20, Math.round(params.cycleLength || 28)));
    const periodLength = Math.min(10, Math.max(2, Math.round(params.periodLength || 5)));

    const lmp = new Date(params.lastPeriodDate);
    lmp.setHours(0, 0, 0, 0);

    const addDays = (base: Date, days: number) => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d;
    };

    const upcomingCycles = [0, 1, 2].map((index) => {
      const start = addDays(lmp, (index + 1) * cycleLength);
      const end = addDays(start, periodLength - 1);
      const ovulation = addDays(start, -14);
      const fertileStart = addDays(ovulation, -5);
      const fertileEnd = addDays(ovulation, 1);
      return {
        cycleNumber: index + 1,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ovulationDate: ovulation.toISOString(),
        fertileStart: fertileStart.toISOString(),
        fertileEnd: fertileEnd.toISOString(),
      };
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
    const currentCycleDay = diffDays >= 0 ? (diffDays % cycleLength) + 1 : 1;

    const ovulationDay = Math.max(7, cycleLength - 14);
    let currentPhase: 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATION' | 'LUTEAL' = 'FOLLICULAR';
    if (currentCycleDay <= periodLength) {
      currentPhase = 'MENSTRUAL';
    } else if (currentCycleDay >= ovulationDay - 1 && currentCycleDay <= ovulationDay + 1) {
      currentPhase = 'OVULATION';
    } else if (currentCycleDay > ovulationDay + 1) {
      currentPhase = 'LUTEAL';
    }

    const currentCycleOvulation = addDays(lmp, ovulationDay - 1);
    const currentFertileStart = addDays(currentCycleOvulation, -5);
    const currentFertileEnd = addDays(currentCycleOvulation, 1);

    return {
      cycleLength,
      periodLength,
      lastPeriodDate: lmp.toISOString(),
      currentCycleDay,
      currentPhase,
      nextPeriodDate: upcomingCycles[0].startDate,
      ovulationDate: currentCycleOvulation.toISOString(),
      fertileWindow: {
        start: currentFertileStart.toISOString(),
        end: currentFertileEnd.toISOString(),
      },
      upcomingCycles,
    };
  }

  /**
   * Calculate gestational age & trimester from LMP or Due Date
   */
  calculatePregnancyEstimate(params: { lmpDate?: string; dueDate?: string }) {
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    let lmp: Date;
    let due: Date;

    if (params.lmpDate) {
      lmp = new Date(params.lmpDate);
      lmp.setHours(0, 0, 0, 0);
      due = new Date(lmp.getTime() + 280 * MS_PER_DAY);
    } else if (params.dueDate) {
      due = new Date(params.dueDate);
      due.setHours(0, 0, 0, 0);
      lmp = new Date(due.getTime() - 280 * MS_PER_DAY);
    } else {
      lmp = new Date();
      lmp.setHours(0, 0, 0, 0);
      due = new Date(lmp.getTime() + 280 * MS_PER_DAY);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const elapsedDays = Math.max(0, Math.min(294, Math.floor((today.getTime() - lmp.getTime()) / MS_PER_DAY)));
    const weeks = Math.floor(elapsedDays / 7);
    const days = elapsedDays % 7;
    const daysRemaining = Math.max(0, Math.ceil((due.getTime() - today.getTime()) / MS_PER_DAY));
    const trimester = weeks <= 13 ? 1 : weeks <= 26 ? 2 : 3;
    const progressPercentage = Math.min(100, Math.max(0, Math.round((elapsedDays / 280) * 100)));

    return {
      lmpDate: lmp.toISOString(),
      dueDate: due.toISOString(),
      weeks,
      days,
      totalDays: elapsedDays,
      daysRemaining,
      trimester,
      progressPercentage,
    };
  }
}
