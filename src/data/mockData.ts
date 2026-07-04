import type {
  WeatherData, TrainingPlan, RunSession, LiveRunMetrics, RobotStatus,
  AICoachData, TrainingReport, UserProfile, RoutePoint,
} from './types';

export const mockWeather: WeatherData = {
  temp: 22,
  condition: 'cloudy',
  aqi: 42,
  aqiLevel: 'good',
  humidity: 65,
  windSpeed: 12,
  icon: 'cloud.sun',
};

export const mockTodayPlan: TrainingPlan = {
  type: 'endurance',
  title: '晨间有氧耐力跑',
  description: '低心率有氧基础训练，保持心率区间 2-3，注重跑步经济性',
  duration: 45,
  distance: 7.5,
  intensity: 'moderate',
  calories: 520,
  segments: [
    { type: 'warmup', duration: 8, pace: '6:30', note: '慢跑热身，动态拉伸' },
    { type: 'run', duration: 30, pace: '5:20', note: '有氧巡航，心率 145-160' },
    { type: 'sprint', duration: 2, pace: '4:00', note: '3组 200m 短冲' },
    { type: 'cooldown', duration: 5, pace: '6:30', note: '慢跑冷身，拉伸' },
  ],
};

export const mockAICoach: AICoachData = {
  todayAdvice: '今日空气质量良好，适合户外训练。注意控制心率在区间2，保持节奏稳定。',
  recoveryScore: 82,
  fatigueLevel: 35,
  weeklyMileage: 42.5,
  monthlyDistance: 168.3,
  improvement: 12,
  formScore: 78,
  enduranceScore: 85,
  speedScore: 72,
  suggestions: [
    { type: 'pace', message: '建议保持 5:20-5:30 配速，避免起步过快', priority: 'info' },
    { type: 'hydration', message: '训练前补充 300ml 水，途中每 15 分钟补水', priority: 'info' },
    { type: 'form', message: '注意步频提升至 180spm，减少触地时间', priority: 'warning' },
  ],
};

export const mockRecentRuns: RunSession[] = [
  { id: '1', date: '2026-07-03', distance: 8.2, duration: 42, pace: '5:07', calories: 580, avgHeartRate: 158, routeName: '滨江公园', completed: true },
  { id: '2', date: '2026-07-02', distance: 6.5, duration: 35, pace: '5:23', calories: 460, avgHeartRate: 152, routeName: '城市绿道', completed: true },
  { id: '3', date: '2026-07-01', distance: 10.0, duration: 52, pace: '5:12', calories: 720, avgHeartRate: 162, routeName: '环湖路线', completed: true },
  { id: '4', date: '2026-06-30', distance: 5.0, duration: 28, pace: '5:36', calories: 350, avgHeartRate: 145, routeName: '小区周边', completed: true },
  { id: '5', date: '2026-06-29', distance: 12.5, duration: 65, pace: '5:12', calories: 890, avgHeartRate: 165, routeName: '山地越野', completed: true },
];

export const mockRobotStatus: RobotStatus = {
  connected: true,
  battery: 87,
  distance: 3.2,
  mode: 'follow',
  uwbSignal: 92,
  lidarStatus: 'active',
  speed: 2.5,
  temperature: 38,
  storage: 45,
  firmwareVersion: 'v2.4.1',
};

export const mockLiveRunMetrics: LiveRunMetrics = {
  distance: 3.85,
  duration: 22,
  pace: '5:18',
  avgPace: '5:22',
  heartRate: 156,
  cadence: 176,
  elevation: 28,
  calories: 275,
  elapsedTime: 1320,
  splitTime: 318,
};

export const mockTrainingReport: TrainingReport = {
  date: '2026-07-03',
  summary: '本次训练完成度 95%，配速稳定，心率控制在目标区间。步频略有偏低，建议加强节奏训练。',
  highlights: ['最后 2km 配速提升至 4:55', '心率区间 2 占比 78%', '垂直振幅优化 5%'],
  improvements: ['步频偏低（176 vs 目标 180）', '触地时间偏长（240ms）', '补给时机需优化'],
  aiScore: 87,
  formAnalysis: '跑步经济性良好，上体保持稳定，但髋关节伸展不足。建议加入臀肌激活训练。',
  nextSteps: '明日建议：45分钟恢复跑 + 核心训练。注意补充蛋白质和电解质。',
};

export const mockUserProfile: UserProfile = {
  name: '跑者',
  level: 12,
  levelTitle: '白银跑者',
  totalDistance: 486,
  robotDistance: 320,
  streakDays: 18,
  aiScore: 82,
  avatar: '',
  membership: 'plus',
  achievements: [
    { id: 'a1', title: '初出茅庐', icon: '🌟', unlocked: true, date: '2026-01-15' },
    { id: 'a2', title: '百公里俱乐部', icon: '🏃', unlocked: true, date: '2026-03-20' },
    { id: 'a3', title: '连续两周', icon: '🔥', unlocked: true, date: '2026-06-01' },
    { id: 'a4', title: '速度突破', icon: '⚡', unlocked: true, date: '2026-06-28' },
    { id: 'a5', title: '机器人伙伴', icon: '🤖', unlocked: true, date: '2026-04-01' },
    { id: 'a6', title: '半马挑战', icon: '🎯', unlocked: false },
    { id: 'a7', title: '月度 200km', icon: '💪', unlocked: false },
    { id: 'a8', title: '完美一周', icon: '✨', unlocked: false },
  ],
  recentVideos: ['video1.mp4', 'video2.mp4'],
  equipment: [
    { name: 'Nike Vaporfly 3', type: 'shoes', distance: 320, image: '' },
    { name: 'Apple Watch Ultra 2', type: 'watch', image: '' },
    { name: 'SmartRun X1', type: 'robot', distance: 320, image: '' },
  ],
};

export const mockRoutePoints: RoutePoint[] = Array.from({ length: 50 }, (_, i) => ({
  lat: 31.2304 + Math.sin(i * 0.3) * 0.008,
  lng: 121.4737 + Math.cos(i * 0.3) * 0.008,
}));

export const mockAISuggestions = [
  { message: '保持节奏，还有 2km 完成目标', time: '18:30' },
  { message: '注意补水，建议小口慢饮', time: '19:45' },
  { message: '心率偏高，适当降低配速', time: '20:15' },
  { message: '调整呼吸，三步一吸两步一呼', time: '21:00' },
  { message: '最后 1km，可以稍微提速', time: '22:30' },
  { message: '训练即将完成，准备冷身拉伸', time: '24:00' },
];

export const mockGrowthData = [
  { week: 'W1', distance: 25, pace: 5.8, heartRate: 162 },
  { week: 'W2', distance: 32, pace: 5.6, heartRate: 158 },
  { week: 'W3', distance: 28, pace: 5.7, heartRate: 160 },
  { week: 'W4', distance: 38, pace: 5.5, heartRate: 155 },
  { week: 'W5', distance: 42, pace: 5.3, heartRate: 152 },
  { week: 'W6', distance: 45, pace: 5.2, heartRate: 150 },
  { week: 'W7', distance: 40, pace: 5.4, heartRate: 153 },
  { week: 'W8', distance: 48, pace: 5.1, heartRate: 148 },
];

export const mockTrendData = [
  { month: '1月', distance: 120, runs: 18 },
  { month: '2月', distance: 95, runs: 14 },
  { month: '3月', distance: 145, runs: 22 },
  { month: '4月', distance: 168, runs: 25 },
  { month: '5月', distance: 155, runs: 23 },
  { month: '6月', distance: 180, runs: 26 },
];

export const mockHeartRateZones = [
  { zone: 'Z1', range: '110-130', percent: 8, color: '#4a9eff' },
  { zone: 'Z2', range: '130-150', percent: 42, color: '#00ff88' },
  { zone: 'Z3', range: '150-170', percent: 35, color: '#ffd60a' },
  { zone: 'Z4', range: '170-185', percent: 12, color: '#ff6b35' },
  { zone: 'Z5', range: '185+', percent: 3, color: '#ff3b5c' },
];