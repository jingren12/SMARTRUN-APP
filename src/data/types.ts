export type Tab = 'home' | 'run' | 'aicoach' | 'robot' | 'profile';

export interface WeatherData {
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
  aqi: number;
  aqiLevel: 'good' | 'moderate' | 'unhealthy' | 'hazardous';
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface TrainingPlan {
  type: string;
  title: string;
  description: string;
  duration: number;
  distance: number;
  intensity: 'easy' | 'moderate' | 'hard';
  calories: number;
  segments: PlanSegment[];
}

export interface PlanSegment {
  type: 'warmup' | 'run' | 'sprint' | 'cooldown';
  duration: number;
  pace: string;
  note: string;
}

export interface RunSession {
  id: string;
  date: string;
  distance: number;
  duration: number;
  pace: string;
  calories: number;
  avgHeartRate: number;
  routeName: string;
  completed: boolean;
}

export interface LiveRunMetrics {
  distance: number;
  duration: number;
  pace: string;
  avgPace: string;
  heartRate: number;
  cadence: number;
  elevation: number;
  calories: number;
  elapsedTime: number;
  splitTime: number;
}

export interface RobotStatus {
  connected: boolean;
  battery: number;
  distance: number;
  mode: 'follow' | 'supply' | 'return' | 'idle' | 'patrol';
  uwbSignal: number;
  lidarStatus: 'active' | 'standby' | 'error';
  speed: number;
  temperature: number;
  storage: number;
  firmwareVersion: string;
}

export interface AICoachData {
  todayAdvice: string;
  recoveryScore: number;
  fatigueLevel: number;
  weeklyMileage: number;
  monthlyDistance: number;
  improvement: number;
  formScore: number;
  enduranceScore: number;
  speedScore: number;
  suggestions: AISuggestion[];
}

export interface AISuggestion {
  type: 'pace' | 'hydration' | 'form' | 'rest' | 'nutrition';
  message: string;
  priority: 'info' | 'warning' | 'critical';
}

export interface TrainingReport {
  date: string;
  summary: string;
  highlights: string[];
  improvements: string[];
  aiScore: number;
  formAnalysis: string;
  nextSteps: string;
}

export interface UserProfile {
  name: string;
  level: number;
  levelTitle: string;
  totalDistance: number;
  robotDistance: number;
  streakDays: number;
  aiScore: number;
  avatar: string;
  membership: 'free' | 'plus' | 'pro';
  achievements: Achievement[];
  recentVideos: string[];
  equipment: EquipmentItem[];
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
  date?: string;
}

export interface EquipmentItem {
  name: string;
  type: 'shoes' | 'watch' | 'robot' | 'clothing';
  distance?: number;
  image: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
}