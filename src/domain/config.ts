/** All adaptive and scheduling parameters live here. Changes take effect for future plans. */
export const CONFIG = {
 bonusThresholdSeconds:180, bonusMinRoundSeconds:30, planVersion:2, scoringVersion:2, dailySeconds:600, defaultMinutes:8,
 minGames:3,maxGames:5,transitionSeconds:5,practiceSeconds:150,
 adaptation:{window:5,cooldown:3,minAccuracyUp:.90,lowAccuracy:.60,upScore:.86,lowScore:.56,speedUp:1.05,maxMeanHints:1,minCompleted:4,difficultStreak:3},
 weights:{accuracy:.55,speed:.15,hints:.10,completion:.20},
 reference:{schulte:40,sudoku:80,twentyfour:65,memory:50,sokoban:60,numbers:30,patterns:50,reaction:24},
} as const;
