export type Lang = 'zh' | 'en';

export interface Translations {
  // ─── Navigation ───
  nav: {
    home: string;
    training: string;
    aicoach: string;
    robot: string;
    profile: string;
  };

  // ─── Home Page ───
  home: {
    greeting: string;
    readyQuestion: string;
    robotConnected: string;
    aqi: string;
    todayTraining: string;
    start: string;
    todayPlan: string;
    intensity: Record<'easy' | 'moderate' | 'hard', string>;
    stats: { distance: string; duration: string; calories: string; pace: string };
    trainingStatus: string;
    recoveryIndex: string;
    outOf: string;
    recoveryGood: string;
    recoverySuggestion: string;
    fatigueLevel: string;
    fatigueLow: string;
    fatigueSuggestion: string;
    thisWeek: string;
    weekDays: string[];
    daysStreak: (n: number) => string;
    keepGoing: string;
    recentRuns: string;
    viewAll: string;
    viewLess: string;
    party: string;
    createParty: string;
    partyMembers: string;
    shareStats: string;
    scheduleRun: string;
    scheduledRun: string;
    noPartyYet: string;
    noPartyHint: string;
    inviteHint: string;
    aiSuggestionTitle: string;
    aiSuggestionBody: string;
    planTitles: Record<string, string>;
    planDescriptions: Record<string, string>;
    segmentNotes: Record<string, string>;
    aqiLevels: Record<string, string>;
  };

  // ─── Run Page ───
  run: {
    followMode: string;
    chooseRoute: string;
    lastTraining: string;
    trainingGoal: string;
    goalTypes: { distance: string; duration: string; pace: string; free: string };
    startTraining: string;
    // Active run
    follow: string;
    currentPace: string;
    distanceRun: string;
    aiRealtime: string;
    aiRealtimeText: string;
    metrics: { duration: string; distance: string; heartRate: string; cadence: string };
    sos: string;
  };

  // ─── AI Coach Page ───
  aicoach: {
    title: string;
    subtitle: string;
    todayAdvice: string;
    todayAdviceBody: string;
    overallScore: string;
    vsLastWeek: (pct: number) => string;
    runningTech: string;
    cadenceNeedsWork: string;
    enduranceIndex: string;
    weeklyMileage: string;
    monthlyStats: string;
    hrZoneDist: string;
    primaryZone: string;
    aiQa: string;
    askPlaceholder: string;
    qPrefix: string;
    aPrefix: string;
    qaQuestions: Record<string, string>;
    qaAnswers: Record<string, string>;
  };

  // ─── Robot Page ───
  robot: {
    title: string;
    firmware: string;
    connected: string;
    labels: { distance: string; speed: string; temperature: string; storage: string };
    connectionStatus: string;
    signalLabels: { uwb: string; lidar: string; gps: string };
    lidarActive: string;
    lidarStandby: string;
    gpsStrong: string;
    workMode: string;
    modes: Record<'follow' | 'supply' | 'patrol' | 'return', { label: string; desc: string }>;
    remoteControl: string;
    deviceSettings: string;
    settings: { ota: { label: string; desc: string }; selfCheck: { label: string; desc: string }; calibrate: { label: string; desc: string }; reset: { label: string; desc: string } };
  };

  // ─── Profile Page ───
  profile: {
    name: string;
    plusMember: string;
    levelTitle: (level: number, title: string) => string;
    nextLevel: (level: number) => string;
    levelProgress: { zero: string; goal: string; targetKm: number };
    statLabels: { totalDist: string; robotDist: string; streak: string; aiScore: string };
    achievements: string;
    equipment: string;
    settings: string;
    settingItems: { friends: string; membership: string; videos: string; album: string; system: string };
    equipmentItems: Record<string, { type: string }>;
    // Language toggle
    language: string;
    langZh: string;
    langEn: string;
    achievementTitles: Record<string, string>;
  };

  // ─── Training Plan Segments ───
  segments: Record<'warmup' | 'run' | 'sprint' | 'cooldown', string>;

  // ─── Route Names ───
  routes: Record<string, string>;

  // ─── Unit labels ───
  units: {
    km: string;
    min: string;
    kcal: string;
    perKm: string;
    bpm: string;
    m: string;
    ms: string;
    celsius: string;
    days: string;
  };
}

const zh: Translations = {
  nav: {
    home: '首页',
    training: '训练',
    aicoach: 'AI教练',
    robot: '机器人',
    profile: '我的',
  },
  home: {
    greeting: '早安, 跑者',
    readyQuestion: '准备好今天的训练了吗？',
    robotConnected: '机器人已连接 · ',
    aqi: 'AQI ',
    todayTraining: '今日训练',
    start: '开始',
    todayPlan: '今日训练计划',
    intensity: { easy: '轻松', moderate: '中等', hard: '高强度' },
    stats: { distance: '距离', duration: '时长', calories: '消耗', pace: '配速' },
    trainingStatus: '训练状态',
    recoveryIndex: '恢复指数',
    outOf: '/100',
    recoveryGood: '良好',
    recoverySuggestion: '建议中等强度',
    fatigueLevel: '疲劳程度',
    fatigueLow: '较低',
    fatigueSuggestion: '适合训练',
    thisWeek: '本周训练',
    weekDays: ['一', '二', '三', '四', '五', '六', '日'],
    daysStreak: (n: number) => `${n} 天连续训练`,
    keepGoing: '继续保持！',
    recentRuns: '最近训练',
    viewAll: '查看全部',
    viewLess: '收起',
    party: '团队',
    createParty: '创建团队',
    partyMembers: '团队成员',
    shareStats: '分享统计',
    scheduleRun: '预约约跑',
    scheduledRun: '已预约约跑',
    noPartyYet: '还没有团队',
    noPartyHint: '创建一个团队，和朋友一起跑！',
    inviteHint: '邀请好友加入团队',
      aiSuggestionTitle: 'AI 教练建议',
      aiSuggestionBody: '今日空气质量良好，适合户外训练。注意控制心率在区间2，保持节奏稳定。建议训练前补充300ml水。',
      planTitles: { '晨间有氧耐力跑': '晨间有氧耐力跑' },
      planDescriptions: { '低心率有氧基础训练，保持心率区间2-3，注重跑步经济性': '低心率有氧基础训练，保持心率区间2-3，注重跑步经济性' },
      segmentNotes: {
        '慢跑热身，动态拉伸': '慢跑热身，动态拉伸',
        '有氧巡航，心率145-160': '有氧巡航，心率145-160',
        '3组200m短冲': '3组200m短冲',
        '慢跑冷身，拉伸': '慢跑冷身，拉伸',
      },
      aqiLevels: { '优': '优' },
  },
  run: {
    followMode: '跟随模式',
    chooseRoute: '选择路线',
    lastTraining: '上次训练',
    trainingGoal: '训练目标',
    goalTypes: { distance: '距离', duration: '时长', pace: '配速', free: '自由' },
    startTraining: '开始训练',
    follow: '跟随',
    currentPace: '当前配速',
    distanceRun: '已跑',
      aiRealtime: 'AI 实时指导',
      aiRealtimeText: '保持节奏，步频提升至180。注意呼吸，三步一吸两步一呼。',
    metrics: { duration: '时长', distance: '距离', heartRate: '心率', cadence: '步频' },
    sos: 'SOS',
  },
  aicoach: {
    title: 'AI 教练',
    subtitle: '你的专属跑步教练',
      todayAdvice: '今日建议',
      todayAdviceBody: '今日空气质量良好，适合户外训练。恢复指数82，建议中等强度有氧跑45分钟。注意控制心率在区间2（130-150bpm）。训练前补充300ml水，携带补给。',
    overallScore: '综合评分',
    vsLastWeek: (pct: number) => `↑ ${pct}% vs 上周`,
    runningTech: '跑步技术',
    cadenceNeedsWork: '步频待提升',
    enduranceIndex: '耐力指数',
    weeklyMileage: '周跑量趋势',
    monthlyStats: '月度统计',
    hrZoneDist: '心率区间分布',
    primaryZone: '主区间',
    aiQa: 'AI 问答',
    askPlaceholder: '向AI教练提问...',
    qPrefix: 'Q: ',
    aPrefix: 'A: ',
    qaQuestions: {
      '如何提高步频？': '如何提高步频？',
      '今天适合高强度训练吗？': '今天适合高强度训练吗？',
    },
    qaAnswers: {
      '建议每周加入2次节奏跑，使用节拍器设置在180bpm。': '建议每周加入2次节奏跑，使用节拍器设置在180bpm。',
      '恢复指数82，疲劳度35，适合中等强度训练。': '恢复指数82，疲劳度35，适合中等强度训练。',
    },
  },
  robot: {
    title: 'SmartRun X1',
    firmware: '固件 ',
    connected: '已连接',
    labels: { distance: '距离', speed: '速度', temperature: '温度', storage: '存储' },
    connectionStatus: '连接状态',
    signalLabels: { uwb: 'UWB', lidar: 'LiDAR', gps: 'GPS' },
    lidarActive: '运行中',
    lidarStandby: '待机',
    gpsStrong: '强信号',
    workMode: '工作模式',
    modes: {
      follow: { label: '跟随模式', desc: '自动跟随跑步者' },
      supply: { label: '补给模式', desc: '携带补给物资' },
      patrol: { label: '自动跟拍', desc: 'AI自动跟拍' },
      return: { label: '返回模式', desc: '自动返回基站' },
    },
    remoteControl: '远程控制',
    deviceSettings: '设备设置',
    settings: {
      ota: { label: 'OTA 升级', desc: '当前版本 v2.4.1' },
      selfCheck: { label: '设备自检', desc: '所有系统运行正常' },
      calibrate: { label: '校准传感器', desc: 'UWB / LiDAR' },
      reset: { label: '重置连接', desc: '重新配对设备' },
    },
  },
  profile: {
    name: '跑者',
    plusMember: 'Plus 会员',
    levelTitle: (_level: number, title: string) => title,
    nextLevel: (level: number) => `下一级: Lv.${level}`,
    levelProgress: { zero: '0 km', goal: '目标 500 km', targetKm: 500 },
    statLabels: { totalDist: '总距离', robotDist: '机器人陪跑', streak: '连续训练', aiScore: 'AI评分' },
    achievements: '成就',
    equipment: '装备管理',
    settings: '设置',
    settingItems: { friends: '好友', membership: '会员中心', videos: '精彩视频', album: '训练相册', system: '系统设置' },
    equipmentItems: {
      'Nike Vaporfly 3': { type: '跑鞋' },
      'Apple Watch Ultra 2': { type: '手表' },
      'SmartRun X1': { type: '机器人' },
    },
    language: '语言',
    langZh: '中文',
    langEn: 'English',
    achievementTitles: {
      '初出茅庐': '初出茅庐',
      '百公里俱乐部': '百公里俱乐部',
      '连续两周': '连续两周',
      '速度突破': '速度突破',
      '机器人伙伴': '机器人伙伴',
      '半马挑战': '半马挑战',
      '月度200km': '月度200km',
      '完美一周': '完美一周',
    },
  },
  segments: { warmup: '热', run: '跑', sprint: '冲', cooldown: '冷' },
  routes: {
    '滨江公园': '滨江公园',
    '城市绿道': '城市绿道',
    '环湖路线': '环湖路线',
    '小区周边': '小区周边',
    '山地越野': '山地越野',
    '滨江公园 7.5km': '滨江公园 7.5km',
    '城市绿道 5km': '城市绿道 5km',
    '环湖路线 10km': '环湖路线 10km',
     '山地越野 12km': '山地越野 12km',
   },
   units: { km: 'km', min: 'min', kcal: 'kcal', perKm: '/km', bpm: 'bpm', m: 'm', ms: 'm/s', celsius: '°C', days: '天' },
 };

const en: Translations = {
  nav: {
    home: 'Home',
    training: 'Training',
    aicoach: 'AI Coach',
    robot: 'Robot',
    profile: 'Profile',
  },
  home: {
    greeting: 'Good Morning, Runner',
    readyQuestion: 'Ready for today\'s training?',
    robotConnected: 'Robot Connected · ',
    aqi: 'AQI ',
    todayTraining: 'Today\'s Training',
    start: 'Start',
    todayPlan: 'Today\'s Plan',
    intensity: { easy: 'Easy', moderate: 'Moderate', hard: 'Intense' },
    stats: { distance: 'Distance', duration: 'Duration', calories: 'Calories', pace: 'Pace' },
    trainingStatus: 'Training Status',
    recoveryIndex: 'Recovery',
    outOf: '/100',
    recoveryGood: 'Good',
    recoverySuggestion: 'Moderate intensity advised',
    fatigueLevel: 'Fatigue',
    fatigueLow: 'Low',
    fatigueSuggestion: 'Ready to train',
    thisWeek: 'This Week',
    weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    daysStreak: (n: number) => `${n}-Day Streak`,
    keepGoing: 'Keep going!',
    recentRuns: 'Recent Runs',
    viewAll: 'View All',
    viewLess: 'Collapse',
    party: 'Team',
    createParty: 'Create Team',
    partyMembers: 'Members',
    shareStats: 'Share Stats',
    scheduleRun: 'Schedule Run',
    scheduledRun: 'Scheduled Run',
    noPartyYet: 'No Team Yet',
    noPartyHint: 'Create a team and run with friends!',
    inviteHint: 'Invite friends to join',
      aiSuggestionTitle: 'AI Coach Suggestion',
      aiSuggestionBody: 'Good air quality today — suitable for outdoor training. Stay in heart rate zone 2 and maintain a steady pace. Drink 300ml of water before training.',
      planTitles: { '晨间有氧耐力跑': 'Morning Aerobic Endurance Run' },
      planDescriptions: { '低心率有氧基础训练，保持心率区间2-3，注重跑步经济性': 'Low heart rate aerobic base training. Stay in zone 2-3, focus on running economy.' },
      segmentNotes: {
        '慢跑热身，动态拉伸': 'Jogging warm-up, dynamic stretches',
        '有氧巡航，心率145-160': 'Aerobic cruise, HR 145-160',
        '3组200m短冲': '3×200m sprints',
        '慢跑冷身，拉伸': 'Jogging cool-down, stretching',
      },
      aqiLevels: { '优': 'Excellent' },
  },
  run: {
    followMode: 'Follow Mode',
    chooseRoute: 'Choose Route',
    lastTraining: 'Last Training',
    trainingGoal: 'Training Goal',
    goalTypes: { distance: 'Distance', duration: 'Duration', pace: 'Pace', free: 'Free' },
    startTraining: 'Start Training',
    follow: 'Following',
    currentPace: 'Current Pace',
    distanceRun: 'Distance',
      aiRealtime: 'AI Live Coach',
      aiRealtimeText: 'Maintain your pace — raise cadence to 180 steps/min. Remember to breathe: inhale for 3 steps, exhale for 2 steps.',
    metrics: { duration: 'Duration', distance: 'Distance', heartRate: 'Heart Rate', cadence: 'Cadence' },
    sos: 'SOS',
  },
  aicoach: {
    title: 'AI Coach',
    subtitle: 'Your Personal Running Coach',
      todayAdvice: 'Today\'s Advice',
      todayAdviceBody: 'Good air quality today — suitable for outdoor training. Recovery index 82. Recommended: 45-minute aerobic run at moderate intensity. Keep heart rate in zone 2 (130-150bpm). Drink 300ml water before training and bring supplies.',
    overallScore: 'Overall Score',
    vsLastWeek: (pct: number) => `↑ ${pct}% vs last week`,
    runningTech: 'Running Technique',
    cadenceNeedsWork: 'Cadence needs work',
    enduranceIndex: 'Endurance Index',
    weeklyMileage: 'Weekly Mileage',
    monthlyStats: 'Monthly Stats',
    hrZoneDist: 'Heart Rate Zones',
    primaryZone: 'Primary Zone',
    aiQa: 'AI Q&A',
    askPlaceholder: 'Ask AI Coach...',
    qPrefix: 'Q: ',
    aPrefix: 'A: ',
    qaQuestions: {
      '如何提高步频？': 'How to improve cadence?',
      '今天适合高强度训练吗？': 'Is today suitable for high-intensity training?',
    },
    qaAnswers: {
      '建议每周加入2次节奏跑，使用节拍器设置在180bpm。': 'Add 2 tempo runs per week, use a metronome set at 180bpm.',
      '恢复指数82，疲劳度35，适合中等强度训练。': 'Recovery index 82, fatigue 35 — suitable for moderate intensity training.',
    },
  },
  robot: {
    title: 'SmartRun X1',
    firmware: 'Firmware ',
    connected: 'Connected',
    labels: { distance: 'Distance', speed: 'Speed', temperature: 'Temp', storage: 'Storage' },
    connectionStatus: 'Connection Status',
    signalLabels: { uwb: 'UWB', lidar: 'LiDAR', gps: 'GPS' },
    lidarActive: 'Active',
    lidarStandby: 'Standby',
    gpsStrong: 'Strong Signal',
    workMode: 'Work Mode',
    modes: {
      follow: { label: 'Follow Mode', desc: 'Auto-follow runner' },
      supply: { label: 'Supply Mode', desc: 'Carry supplies' },
      patrol: { label: 'Auto Record', desc: 'AI auto-filming' },
      return: { label: 'Return Mode', desc: 'Auto-return to base' },
    },
    remoteControl: 'Remote Control',
    deviceSettings: 'Device Settings',
    settings: {
      ota: { label: 'OTA Update', desc: 'Current version v2.4.1' },
      selfCheck: { label: 'Self-Check', desc: 'All systems operational' },
      calibrate: { label: 'Calibrate Sensors', desc: 'UWB / LiDAR' },
      reset: { label: 'Reset Connection', desc: 'Re-pair device' },
    },
  },
  profile: {
    name: 'Runner',
    plusMember: 'Plus Member',
    levelTitle: (_level: number, title: string) => {
      const enTitles: Record<string, string> = { '白银跑者': 'Silver Runner', '黄金跑者': 'Gold Runner', '钻石跑者': 'Diamond Runner' };
      return enTitles[title] ?? title;
    },
    nextLevel: (level: number) => `Next: Lv.${level}`,
    levelProgress: { zero: '0 km', goal: 'Goal 500 km', targetKm: 500 },
    statLabels: { totalDist: 'Total Distance', robotDist: 'Robot Distance', streak: 'Streak', aiScore: 'AI Score' },
    achievements: 'Achievements',
    equipment: 'Equipment',
    settings: 'Settings',
    settingItems: { friends: 'Friends', membership: 'Membership', videos: 'Videos', album: 'Album', system: 'System' },
    equipmentItems: {
      'Nike Vaporfly 3': { type: 'Running Shoes' },
      'Apple Watch Ultra 2': { type: 'Watch' },
       'SmartRun X1': { type: 'Robot' },
     },
     language: 'Language',
     langZh: '中文',
    langEn: 'English',
    achievementTitles: {
      '初出茅庐': 'First Steps',
      '百公里俱乐部': '100km Club',
      '连续两周': 'Two-Week Streak',
      '速度突破': 'Speed Breakthrough',
      '机器人伙伴': 'Robot Buddy',
      '半马挑战': 'Half Marathon',
      '月度200km': '200km Month',
      '完美一周': 'Perfect Week',
    },
  },
  segments: { warmup: 'WU', run: 'Run', sprint: 'SP', cooldown: 'CD' },
  routes: {
     '滨江公园': 'Riverside Park',
     '城市绿道': 'City Greenway',
     '环湖路线': 'Lake Loop',
     '小区周边': 'Neighborhood',
     '山地越野': 'Mountain Trail',
     '滨江公园 7.5km': 'Riverside Park 7.5km',
     '城市绿道 5km': 'City Greenway 5km',
     '环湖路线 10km': 'Lake Loop 10km',
     '山地越野 12km': 'Mountain Trail 12km',
   },
   units: { km: 'km', min: 'min', kcal: 'kcal', perKm: '/km', bpm: 'bpm', m: 'm', ms: 'm/s', celsius: '°C', days: 'days' },
 };

export const translations: Record<Lang, Translations> = { zh, en };

export type TranslationKey = keyof Translations;
