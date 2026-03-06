export const EXERCISES = [
  // Chest
  'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
  'Dumbbell Fly', 'Cable Fly', 'Push Up', 'Chest Dip',
  // Back
  'Deadlift', 'Barbell Row', 'Pull Up', 'Lat Pulldown',
  'Seated Cable Row', 'Single Arm Dumbbell Row', 'Face Pull',
  // Shoulders
  'Overhead Press', 'Dumbbell Shoulder Press', 'Lateral Raise',
  'Front Raise', 'Rear Delt Fly', 'Shrug',
  // Arms
  'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl',
  'Tricep Pushdown', 'Skull Crusher', 'Close Grip Bench Press',
  'Overhead Tricep Extension', 'Dips',
  // Legs
  'Squat', 'Front Squat', 'Leg Press', 'Romanian Deadlift',
  'Leg Curl', 'Leg Extension', 'Calf Raise', 'Hack Squat',
  'Bulgarian Split Squat', 'Lunge',
  // Core
  'Plank', 'Crunch', 'Sit Up', 'Leg Raise', 'Russian Twist',
  'Ab Wheel Rollout', 'Cable Crunch',
  // Cardio
  'Running', 'Cycling', 'Rowing Machine', 'Jump Rope', 'Swimming',
  'Stair Master', 'Elliptical',
]

export const WORKOUT_PRESETS_DEFAULT = [
  {
    name: 'Push Day',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, weight: 80 },
      { name: 'Incline Bench Press', sets: 3, reps: 10, weight: 60 },
      { name: 'Overhead Press', sets: 3, reps: 10, weight: 50 },
      { name: 'Lateral Raise', sets: 3, reps: 15, weight: 12 },
      { name: 'Tricep Pushdown', sets: 3, reps: 12, weight: 30 },
    ]
  },
  {
    name: 'Pull Day',
    exercises: [
      { name: 'Deadlift', sets: 4, reps: 5, weight: 120 },
      { name: 'Pull Up', sets: 3, reps: 8, weight: 0 },
      { name: 'Barbell Row', sets: 3, reps: 10, weight: 70 },
      { name: 'Lat Pulldown', sets: 3, reps: 12, weight: 60 },
      { name: 'Barbell Curl', sets: 3, reps: 12, weight: 35 },
    ]
  },
  {
    name: 'Leg Day',
    exercises: [
      { name: 'Squat', sets: 4, reps: 8, weight: 100 },
      { name: 'Romanian Deadlift', sets: 3, reps: 10, weight: 80 },
      { name: 'Leg Press', sets: 3, reps: 12, weight: 150 },
      { name: 'Leg Curl', sets: 3, reps: 12, weight: 45 },
      { name: 'Calf Raise', sets: 4, reps: 15, weight: 60 },
    ]
  }
]

export function searchExercises(query, limit = 6) {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase()
  return EXERCISES.filter(e => e.toLowerCase().includes(q)).slice(0, limit)
}
