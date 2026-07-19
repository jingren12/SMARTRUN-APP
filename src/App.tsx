import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
  import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid } from 'recharts'
import { useT, useLang } from './i18n/context'

// ─── Types ───────────────────────────────────────────────
type Tab = 'home' | 'run' | 'aicoach' | 'robot' | 'profile'

interface Weather { temp: number; condition: string; aqi: number; aqiLevel: string; humidity: number; windSpeed: number }
interface PlanSegment { type: string; duration: number; pace: string; note: string }
interface TrainingPlan { type: string; title: string; description: string; duration: number; distance: number; intensity: string; calories: number; segments: PlanSegment[] }
interface RunSession { id: string; date: string; distance: number; duration: number; pace: string; calories: number; avgHeartRate: number; routeName: string; completed: boolean }
interface RobotStatus { connected: boolean; battery: number; distance: number; mode: string; uwbSignal: number; lidarStatus: string; speed: number; temperature: number; storage: number; firmwareVersion: string }
interface Achievement { id: string; title: string; icon: string; unlocked: boolean; date?: string }
interface GrowthData { week: string; distance: number; pace: number; heartRate: number }
interface TrendData { month: string; distance: number; runs: number }
interface HRZone { zone: string; range: string; percent: number; color: string }

// ─── Mock Data ────────────────────────────────────────────
const weather: Weather = { temp: 22, condition: '多云', aqi: 42, aqiLevel: '优', humidity: 65, windSpeed: 12 }

const todayPlan: TrainingPlan = {
  type: 'endurance', title: '晨间有氧耐力跑',
  description: '低心率有氧基础训练，保持心率区间2-3，注重跑步经济性',
  duration: 45, distance: 7.5, intensity: 'moderate', calories: 520,
  segments: [
    { type: 'warmup', duration: 8, pace: '6:30', note: '慢跑热身，动态拉伸' },
    { type: 'run', duration: 30, pace: '5:20', note: '有氧巡航，心率145-160' },
    { type: 'sprint', duration: 2, pace: '4:00', note: '3组200m短冲' },
    { type: 'cooldown', duration: 5, pace: '6:30', note: '慢跑冷身，拉伸' },
  ],
}

const recentRuns: RunSession[] = [
  { id: '1', date: '07/03', distance: 8.2, duration: 42, pace: '5:07', calories: 580, avgHeartRate: 158, routeName: '滨江公园', completed: true },
  { id: '2', date: '07/02', distance: 6.5, duration: 35, pace: '5:23', calories: 460, avgHeartRate: 152, routeName: '城市绿道', completed: true },
  { id: '3', date: '07/01', distance: 10.0, duration: 52, pace: '5:12', calories: 720, avgHeartRate: 162, routeName: '环湖路线', completed: true },
  { id: '4', date: '06/30', distance: 5.0, duration: 28, pace: '5:36', calories: 350, avgHeartRate: 145, routeName: '小区周边', completed: true },
  { id: '5', date: '06/29', distance: 12.5, duration: 65, pace: '5:12', calories: 890, avgHeartRate: 165, routeName: '山地越野', completed: true },
]

const robot: RobotStatus = {
  connected: true, battery: 87, distance: 3.2, mode: 'follow', uwbSignal: 92,
  lidarStatus: 'active', speed: 2.5, temperature: 38, storage: 45, firmwareVersion: 'v2.4.1',
}

const growthData: GrowthData[] = [
  { week: 'W1', distance: 25, pace: 5.8, heartRate: 162 },
  { week: 'W2', distance: 32, pace: 5.6, heartRate: 158 },
  { week: 'W3', distance: 28, pace: 5.7, heartRate: 160 },
  { week: 'W4', distance: 38, pace: 5.5, heartRate: 155 },
  { week: 'W5', distance: 42, pace: 5.3, heartRate: 152 },
  { week: 'W6', distance: 45, pace: 5.2, heartRate: 150 },
  { week: 'W7', distance: 40, pace: 5.4, heartRate: 153 },
  { week: 'W8', distance: 48, pace: 5.1, heartRate: 148 },
]

const trendData: TrendData[] = [
  { month: '1月', distance: 120, runs: 18 },
  { month: '2月', distance: 95, runs: 14 },
  { month: '3月', distance: 145, runs: 22 },
  { month: '4月', distance: 168, runs: 25 },
  { month: '5月', distance: 155, runs: 23 },
  { month: '6月', distance: 180, runs: 26 },
]

const hrZones: HRZone[] = [
  { zone: 'Z1', range: '110-130', percent: 8, color: '#4a9eff' },
  { zone: 'Z2', range: '130-150', percent: 42, color: '#00ff88' },
  { zone: 'Z3', range: '150-170', percent: 35, color: '#ffd60a' },
  { zone: 'Z4', range: '170-185', percent: 12, color: '#ff6b35' },
  { zone: 'Z5', range: '185+', percent: 3, color: '#ff3b5c' },
]

const achievements: Achievement[] = [
  { id: 'a1', title: '初出茅庐', icon: '🌟', unlocked: true, date: '2026-01-15' },
  { id: 'a2', title: '百公里俱乐部', icon: '🏃', unlocked: true, date: '2026-03-20' },
  { id: 'a3', title: '连续两周', icon: '🔥', unlocked: true, date: '2026-06-01' },
  { id: 'a4', title: '速度突破', icon: '⚡', unlocked: true, date: '2026-06-28' },
  { id: 'a5', title: '机器人伙伴', icon: '🤖', unlocked: true, date: '2026-04-01' },
  { id: 'a6', title: '半马挑战', icon: '🎯', unlocked: false },
  { id: 'a7', title: '月度200km', icon: '💪', unlocked: false },
  { id: 'a8', title: '完美一周', icon: '✨', unlocked: false },
]

// ─── Shared Components ────────────────────────────────────

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 h-[48px] text-white/80 text-xs font-semibold">
      <span className="font-mono">9:41</span>
      <div className="flex items-center gap-2">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><rect x="0.5" y="0.5" width="14" height="11" rx="2" stroke="currentColor" strokeOpacity="0.4"/><rect x="2" y="2.5" width="11" height="7" rx="1" fill="currentColor" fillOpacity="0.3"/><rect x="2" y="2.5" width="7" height="7" rx="1" fill="currentColor"/></svg>
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><path d="M7 3C8.5 3 10 4 10 6C10 8 8.5 9 7 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M7 0C10 0 13 3 13 6C13 9 10 12 7 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/><circle cx="7" cy="6" r="1.5" fill="currentColor"/></svg>
        <span className="font-mono font-bold">100%</span>
      </div>
    </div>
  )
}

function ProgressRing({ pct, size = 64, stroke = 4, color = '#00ff88', bg = '#2a2a40', children }: { pct: number; size?: number; stroke?: number; color?: string; bg?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off = circ - (pct / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90"><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke}/><motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} initial={{strokeDashoffset: circ}} animate={{strokeDashoffset: off}} transition={{duration:1.2,ease:'easeOut'}}/></svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

function GlassCard({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.div whileTap={onClick ? { scale: 0.97 } : undefined} onClick={onClick} className={`rounded-2xl bg-[#1a1a2e]/60 backdrop-blur-xl border border-[#2a2a40]/40 ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      {children}
    </motion.div>
  )
}

function SectionH({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-white text-[17px] font-semibold tracking-tight">{title}</h2>
      {action && <span className="text-neon text-[13px] font-medium">{action}</span>}
    </div>
  )
}

function Badge({ children, color = '#00ff88', className = '' }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${className}`} style={{ borderColor: `${color}30`, backgroundColor: `${color}10`, color }}>
      {children}
    </div>
  )
}

// ─── Navigation ───────────────────────────────────────────

function NavBar({ active, onChange, hidden }: { active: Tab; onChange: (t: Tab) => void; hidden: boolean }) {
  const t = useT()
  if (hidden) return null
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'home', label: t.nav.home, icon: 'M3 10l9-7 9 7v11H3V10zM9 21V12h6v9' },
    { key: 'run', label: t.nav.training, icon: 'M12 5a2 2 0 100 4 2 2 0 000-4zM5 21l3-7 4 2 3-6 3 2M19 10l-4 8' },
    { key: 'aicoach', label: t.nav.aicoach, icon: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' },
    { key: 'robot', label: t.nav.robot, icon: 'M4 6h16v14H4V6zM9 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM15 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM9 6V4a3 3 0 016 0v2' },
    { key: 'profile', label: t.nav.profile, icon: 'M12 8a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 3.6-8 8-8s8 3 8 8' },
  ]
  return (
    <motion.nav initial={{ y: 100 }} animate={{ y: 0 }} className="absolute bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom,4px)]">
      <div className="glass mx-3 mb-2 rounded-[28px] px-2 py-1.5 flex items-center justify-around">
        {tabs.map(tab => {
          const a = active === tab.key
          return (
            <button key={tab.key} onClick={() => onChange(tab.key)} className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-0">
              {a && <motion.div layoutId="nav-ind" className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-neon" transition={{type:'spring',stiffness:500,damping:30}}/>}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={a ? 'text-neon' : 'text-[#6b6b8d]'}>
                {tab.icon.split('M').map((seg, i) => seg ? <path key={i} d={`M${seg}`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={a && i < 2 ? 'currentColor' : 'none'} fillOpacity={a ? '0.15' : '0'} /> : null)}
              </svg>
              <span className={`text-[10px] font-medium ${a ? 'text-neon font-semibold' : 'text-[#6b6b8d]'}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </motion.nav>
  )
}

function PageWrap({ tab, children }: { tab: Tab; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: [0.16,1,0.3,1] }} className="absolute inset-0">
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Page: Home ────────────────────────────────────────────

function Home() {
  const t = useT()
  const streakDays = 18
  const recoveryScore = 82
  const weekDays = t.home.weekDays
  const todayIdx = new Date().getDay() - 1 || 6

  return (
    <div className="h-full flex flex-col">
      <StatusBar />
      <div className="flex-1 overflow-y-auto px-4 pb-[90px] scrollable">
        {/* Header */}
        <div className="flex items-center justify-between mt-1 mb-4">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-[28px] font-bold text-white tracking-tight">{t.home.greeting}</motion.h1>
            <p className="text-[13px] text-[#a0a0b8] mt-0.5">{t.home.readyQuestion}</p>
          </div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon/30 to-accent-blue/30 border border-neon/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-neon"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-neon rounded-full border-2 border-[#0a0a0f] pulse-glow" />
          </motion.div>
        </div>

        {/* Robot Status + Weather */}
        <div className="flex items-center gap-2 mb-5">
          <Badge color="#00ff88">
            <span className="w-1.5 h-1.5 rounded-full bg-neon pulse-glow" />
            {t.home.robotConnected}{robot.battery}%
          </Badge>
          <Badge color="#4a9eff">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
            {t.home.aqi}{weather.aqi} · {t.home.aqiLevels[weather.aqiLevel] ?? weather.aqiLevel}
          </Badge>
        </div>

        {/* Start Training CTA */}
        <motion.button whileTap={{ scale: 0.97 }} className="w-full mb-5 relative overflow-hidden rounded-2xl bg-gradient-to-r from-neon/20 via-neon/10 to-transparent border border-neon/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-[15px] font-semibold">{t.home.todayTraining}</div>
              <div className="text-[#a0a0b8] text-[12px] mt-0.5">{t.home.planTitles[todayPlan.title] ?? todayPlan.title} · {todayPlan.distance}{t.units.km}</div>
            </div>
            <div className="flex items-center gap-2 bg-neon/20 rounded-xl px-4 py-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neon"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span className="text-neon text-[13px] font-semibold">{t.home.start}</span>
            </div>
          </div>
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 rounded-full blur-3xl" />
        </motion.button>

        {/* Today's Plan Detail */}
        <SectionH title={t.home.todayPlan} />
        <GlassCard className="p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neon"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span className="text-white text-[15px] font-semibold">{t.home.planTitles[todayPlan.title] ?? todayPlan.title}</span>
            </div>
            <Badge color={todayPlan.intensity === 'easy' ? '#00ff88' : todayPlan.intensity === 'moderate' ? '#ffd60a' : '#ff6b35'}>{t.home.intensity[todayPlan.intensity as 'easy' | 'moderate' | 'hard']}</Badge>
          </div>
          <p className="text-[#a0a0b8] text-[13px] leading-relaxed mb-3">{t.home.planDescriptions[todayPlan.description] ?? todayPlan.description}</p>
          <div className="stats-grid mb-3">
            {[
              { label: t.home.stats.distance, value: todayPlan.distance, unit: t.units.km },
              { label: t.home.stats.duration, value: todayPlan.duration, unit: t.units.min },
              { label: t.home.stats.calories, value: todayPlan.calories, unit: t.units.kcal },
              { label: t.home.stats.pace, value: '5:20', unit: t.units.perKm },
            ].map(s => (
              <div key={s.label} className="bg-[#252540]/50 rounded-xl p-2.5 text-center">
                <div className="text-white text-lg font-bold">{s.value}</div>
                <div className="text-[#6b6b8d] text-[10px]">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Segments */}
          <div className="space-y-1.5">
            {todayPlan.segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#252540]/30 rounded-xl px-3 py-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${seg.type === 'warmup' ? 'bg-accent-blue/20 text-accent-blue' : seg.type === 'run' ? 'bg-neon/20 text-neon' : seg.type === 'sprint' ? 'bg-accent-orange/20 text-accent-orange' : 'bg-accent-purple/20 text-accent-purple'}`}>
                  {t.segments[seg.type as 'warmup' | 'run' | 'sprint' | 'cooldown']}
                </div>
                <div className="flex-1">
                  <div className="text-white text-[13px] font-medium">{t.home.segmentNotes[seg.note] ?? seg.note}</div>
                  <div className="text-[#6b6b8d] text-[11px]">{seg.duration}{t.units.min} · {seg.pace}{t.units.perKm}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recovery + AI Coach */}
        <SectionH title={t.home.trainingStatus} />
        <div className="flex gap-3 mb-5">
          <GlassCard className="flex-1 p-4">
            <div className="text-[#a0a0b8] text-[11px] font-medium uppercase tracking-wide mb-2">{t.home.recoveryIndex}</div>
            <ProgressRing pct={recoveryScore} size={72} color="#00ff88">
              <div className="text-center">
                <div className="text-white text-lg font-bold">{recoveryScore}</div>
                <div className="text-[#6b6b8d] text-[9px]">{t.home.outOf}</div>
              </div>
            </ProgressRing>
            <div className="text-center mt-2">
              <div className="text-neon text-[11px] font-medium">{t.home.recoveryGood}</div>
              <div className="text-[#6b6b8d] text-[10px]">{t.home.recoverySuggestion}</div>
            </div>
          </GlassCard>
          <GlassCard className="flex-1 p-4">
            <div className="text-[#a0a0b8] text-[11px] font-medium uppercase tracking-wide mb-2">{t.home.fatigueLevel}</div>
            <ProgressRing pct={35} size={72} color="#4a9eff">
              <div className="text-center">
                <div className="text-white text-lg font-bold">35</div>
                <div className="text-[#6b6b8d] text-[9px]">{t.home.outOf}</div>
              </div>
            </ProgressRing>
            <div className="text-center mt-2">
              <div className="text-accent-blue text-[11px] font-medium">{t.home.fatigueLow}</div>
              <div className="text-[#6b6b8d] text-[10px]">{t.home.fatigueSuggestion}</div>
            </div>
          </GlassCard>
        </div>

        {/* Weekly Streak */}
        <SectionH title={t.home.thisWeek} />
        <GlassCard className="p-4 mb-5">
          <div className="flex items-center justify-around mb-2">
            {weekDays.map((d, i) => (
              <div key={d} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-[#6b6b8d]">{d}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= todayIdx ? 'bg-neon/20 text-neon' : 'bg-[#252540]/50 text-[#4a4a6a]'}`}>
                  {i <= todayIdx ? '✓' : '—'}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 pt-3 border-t border-[#2a2a40]/50">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-white text-[15px] font-bold">{t.home.daysStreak(streakDays)}</div>
              <div className="text-[#6b6b8d] text-[11px]">{t.home.keepGoing}</div>
            </div>
          </div>
        </GlassCard>

        {/* Recent Runs */}
        <SectionH title={t.home.recentRuns} action={t.home.viewAll} />
        <div className="space-y-2 mb-5">
          {recentRuns.slice(0, 3).map(r => (
            <GlassCard key={r.id} onClick={() => {}} className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neon"><circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 21l3-7 4 2 3-6 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white text-[14px] font-semibold">{t.routes[r.routeName] ?? r.routeName}</span>
                  <span className="text-[#6b6b8d] text-[11px]">{r.date}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[12px] text-[#a0a0b8]">{r.distance}{t.units.km}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-[#4a4a6a]" />
                  <span className="text-[12px] text-[#a0a0b8]">{r.pace}{t.units.perKm}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-[#4a4a6a]" />
                  <span className="text-[12px] text-[#a0a0b8]">{r.duration}{t.units.min}</span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#4a4a6a]"><polyline points="9 6 15 12 9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </GlassCard>
          ))}
        </div>

        {/* AI Suggestion */}
        <GlassCard className="p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-purple/20 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent-purple"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div className="text-white text-[13px] font-medium mb-0.5">{t.home.aiSuggestionTitle}</div>
              <p className="text-[#a0a0b8] text-[12px] leading-relaxed">{t.home.aiSuggestionBody}</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

// ─── Page: Run ────────────────────────────────────────────

function RunPage() {
  const t = useT()
  const [active, setActive] = useState(false)

  if (!active) {
    return (
      <div className="h-full flex flex-col">
        <StatusBar />
        <div className="flex-1 overflow-y-auto px-4 pb-[90px] scrollable">
          {/* Hero Map Preview */}
          <div className="relative rounded-3xl overflow-hidden mb-5 mt-2 h-52 bg-gradient-to-br from-smartrun-700 to-smartrun-600 border border-smartrun-500/40">
            {/* Simulated map */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #2a2a40 1px, transparent 1px), radial-gradient(circle at 70% 30%, #2a2a40 1px, transparent 1px)', backgroundSize: '30px 30px, 20px 20px' }} />
            {/* Route path */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 200">
              <path d="M30,160 Q80,40 140,90 T230,60 T310,120" fill="none" stroke="#00ff88" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.7" />
              <circle cx="30" cy="160" r="4" fill="#00ff88" />
              <circle cx="310" cy="120" r="4" fill="#ff6b35" />
              {/* Robot marker */}
              <circle cx="140" cy="90" r="6" fill="#4a9eff" stroke="#0a0a0f" strokeWidth="2" />
              {/* Runner marker */}
              <circle cx="200" cy="74" r="5" fill="#00ff88" stroke="#0a0a0f" strokeWidth="2" />
            </svg>
            <div className="absolute bottom-3 left-3 glass rounded-xl px-3 py-1.5">
              <span className="text-white text-[11px] font-medium">{t.routes['滨江公园']} · 7.5{t.units.km}</span>
            </div>
            <div className="absolute top-3 right-3 glass rounded-xl px-2.5 py-1">
              <span className="text-neon text-[10px] font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon pulse-glow" />{t.run.followMode}</span>
            </div>
          </div>

          {/* Route Selection */}
          <SectionH title={t.run.chooseRoute} />
          <div className="flex gap-2 mb-5 overflow-x-auto scrollable pb-1">
            {['滨江公园 7.5km', '城市绿道 5km', '环湖路线 10km', '山地越野 12km'].map(r => (
              <button key={r} className="shrink-0 glass rounded-2xl px-4 py-3 border border-[#2a2a40]/40 hover:border-neon/30 transition-colors">
                <div className="text-white text-[13px] font-medium whitespace-nowrap">{t.routes[r] ?? r}</div>
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <SectionH title={t.run.lastTraining} />
          <div className="stats-grid mb-5">
            {[
              { label: t.run.metrics.distance, value: '8.2', unit: t.units.km },
              { label: t.run.metrics.duration, value: '42', unit: t.units.min },
              { label: t.home.stats.pace, value: '5:07', unit: t.units.perKm },
              { label: t.run.metrics.heartRate, value: '158', unit: t.units.bpm },
            ].map(s => (
              <GlassCard key={s.label} className="p-3 text-center">
                <div className="text-white text-xl font-bold">{s.value}</div>
                <div className="text-[#6b6b8d] text-[10px] mt-0.5">{s.label}</div>
              </GlassCard>
            ))}
          </div>

          {/* Goal Setting */}
          <GlassCard className="p-4 mb-5">
            <div className="text-white text-[15px] font-semibold mb-3">{t.run.trainingGoal}</div>
            <div className="flex gap-3">
              {([
                { key: 'distance', label: t.run.goalTypes.distance },
                { key: 'duration', label: t.run.goalTypes.duration },
                { key: 'pace', label: t.run.goalTypes.pace },
                { key: 'free', label: t.run.goalTypes.free },
              ] as const).map(g => (
                <button key={g.key} className={`flex-1 rounded-xl py-2.5 text-center text-[13px] font-medium transition-all ${g.key === 'distance' ? 'bg-neon/20 text-neon border border-neon/30' : 'bg-[#252540]/50 text-[#a0a0b8] border border-transparent'}`}>{g.label}</button>
              ))}
            </div>
          </GlassCard>

          {/* Start Button */}
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActive(true)} className="w-full mb-8 py-4 rounded-2xl bg-neon text-black font-bold text-[17px] tracking-tight shadow-lg shadow-neon/20">
            {t.run.startTraining}
          </motion.button>
        </div>
      </div>
    )
  }

  // ─── Active Run Mode ──────────────────────────────────────
  return (
    <div className="h-full bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={() => setActive(false)} className="text-white/60 text-xs p-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex items-center gap-2">
          <Badge color="#00ff88" className="!px-2"><span className="w-1 h-1 rounded-full bg-neon pulse-glow" />{t.run.follow}</Badge>
          <Badge color="#ffd60a" className="!px-2">🤖 {robot.distance}{t.units.m}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <ProgressRing pct={robot.battery} size={28} stroke={3} color="#00ff88" bg="#2a2a40">
            <span className="text-[8px] font-bold text-white">{robot.battery}</span>
          </ProgressRing>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 40% 50%, #1a2a1a 1px, transparent 1px), radial-gradient(circle at 60% 30%, #1a1a2a 1px, transparent 1px)', backgroundSize: '25px 25px, 18px 18px' }} />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 393 320">
          <path d="M20,280 Q80,150 160,200 T240,120 T320,220 T360,180" fill="none" stroke="#00ff88" strokeWidth="2" strokeDasharray="5 3" opacity="0.5" />
          <circle cx="160" cy="200" r="7" fill="#4a9eff" stroke="#000" strokeWidth="2" />
          <circle cx="200" cy="176" r="6" fill="#00ff88" stroke="#000" strokeWidth="2" />
          {/* Pace overlay */}
          <div className="absolute top-3 left-3 glass rounded-xl px-3 py-2">
            <div className="text-[#a0a0b8] text-[10px]">{t.run.currentPace}</div>
            <div className="text-white text-xl font-bold font-mono">5:18</div>
          </div>
          <div className="absolute top-3 right-3 glass rounded-xl px-3 py-2 text-right">
            <div className="text-[#a0a0b8] text-[10px]">{t.run.distanceRun}</div>
            <div className="text-white text-xl font-bold">3.85{t.units.km}</div>
          </div>
        </svg>

        {/* AI Voice Suggestion */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-4 left-4 right-4">
          <GlassCard className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center shrink-0 pulse-glow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent-purple"><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="1.5"/><path d="M19 10v2a7 7 0 01-14 0v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div className="flex-1">
              <div className="text-white text-[12px] font-medium">{t.run.aiRealtime}</div>
              <p className="text-[#a0a0b8] text-[11px] leading-relaxed">{t.run.aiRealtimeText}</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Bottom metrics */}
      <div className="glass rounded-t-[28px] px-4 pt-3 pb-[env(safe-area-inset-bottom,20px)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <div className="text-[#6b6b8d] text-[10px]">{t.run.metrics.duration}</div>
            <div className="text-white text-lg font-bold font-mono">22:00</div>
          </div>
          <div className="text-center">
            <div className="text-[#6b6b8d] text-[10px]">{t.run.metrics.distance}</div>
            <div className="text-white text-lg font-bold font-mono">3.85</div>
          </div>
          <div className="text-center">
            <div className="text-[#6b6b8d] text-[10px]">{t.run.metrics.heartRate}</div>
            <div className="text-accent-orange text-lg font-bold font-mono">156</div>
          </div>
          <div className="text-center">
            <div className="text-[#6b6b8d] text-[10px]">{t.run.metrics.cadence}</div>
            <div className="text-white text-lg font-bold font-mono">176</div>
          </div>
        </div>

        {/* Control bar */}
        <div className="flex items-center justify-around pb-2">
          <button className="w-10 h-10 rounded-full bg-[#252540]/50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/60"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
          <button className="w-14 h-14 rounded-full bg-accent-red/90 flex items-center justify-center shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
          <button className="w-10 h-10 rounded-full bg-[#252540]/50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/60"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
        </div>
      </div>

      {/* SOS */}
      <motion.button whileTap={{ scale: 0.9 }} className="absolute top-16 right-4 w-10 h-10 rounded-full bg-accent-red/90 flex items-center justify-center shadow-lg shadow-accent-red/30">
        <span className="text-white text-[10px] font-bold">{t.run.sos}</span>
      </motion.button>
    </div>
  )
}

// ─── Page: AI Coach ─────────────────────────────────────

function AICoach() {
  const t = useT()
  return (
    <div className="h-full flex flex-col">
      <StatusBar />
      <div className="flex-1 overflow-y-auto px-4 pb-[90px] scrollable">
        {/* Header */}
        <div className="flex items-center justify-between mt-1 mb-5">
          <div>
            <motion.h1 initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} className="text-[28px] font-bold text-white tracking-tight">{t.aicoach.title}</motion.h1>
            <p className="text-[#a0a0b8] text-[13px] mt-0.5">{t.aicoach.subtitle}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-purple/30 to-accent-blue/30 border border-accent-purple/20 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-accent-purple"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </div>

        {/* AI Today Advice */}
        <GlassCard className="p-4 mb-5 bg-gradient-to-r from-accent-purple/10 to-transparent">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-purple/20 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-accent-purple"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            <div>
              <div className="text-white text-[14px] font-semibold mb-1">{t.aicoach.todayAdvice}</div>
              <p className="text-[#a0a0b8] text-[12px] leading-relaxed">{t.aicoach.todayAdviceBody}</p>
            </div>
          </div>
        </GlassCard>

        {/* Score Cards */}
        <div className="flex gap-3 mb-5">
          <GlassCard className="flex-1 p-4 text-center">
            <ProgressRing pct={82} size={64} color="#00ff88">
              <div className="text-white text-sm font-bold">82</div>
            </ProgressRing>
            <div className="text-white text-[11px] font-medium mt-2">{t.aicoach.overallScore}</div>
            <div className="text-[#6b6b8d] text-[10px]">{t.aicoach.vsLastWeek(5)}</div>
          </GlassCard>
          <GlassCard className="flex-1 p-4 text-center">
            <ProgressRing pct={78} size={64} color="#4a9eff">
              <div className="text-white text-sm font-bold">78</div>
            </ProgressRing>
            <div className="text-white text-[11px] font-medium mt-2">{t.aicoach.runningTech}</div>
            <div className="text-[#6b6b8d] text-[10px]">{t.aicoach.cadenceNeedsWork}</div>
          </GlassCard>
          <GlassCard className="flex-1 p-4 text-center">
            <ProgressRing pct={85} size={64} color="#ffd60a">
              <div className="text-white text-sm font-bold">85</div>
            </ProgressRing>
            <div className="text-white text-[11px] font-medium mt-2">{t.aicoach.enduranceIndex}</div>
            <div className="text-[#6b6b8d] text-[10px]">{t.aicoach.vsLastWeek(3)}</div>
          </GlassCard>
        </div>

        {/* Weekly Mileage Chart */}
        <SectionH title={t.aicoach.weeklyMileage} />
        <GlassCard className="p-4 mb-5">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs><linearGradient id="mileGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00ff88" stopOpacity="0.3"/><stop offset="100%" stopColor="#00ff88" stopOpacity="0"/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" />
                <XAxis dataKey="week" tick={{fill:'#6b6b8d',fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#6b6b8d',fontSize:10}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid #2a2a40',borderRadius:12,fontSize:12}} labelStyle={{color:'white'}} />
                <Area type="monotone" dataKey="distance" stroke="#00ff88" fill="url(#mileGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Monthly Trend */}
        <SectionH title={t.aicoach.monthlyStats} />
        <GlassCard className="p-4 mb-5">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" vertical={false} />
                <XAxis dataKey="month" tick={{fill:'#6b6b8d',fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#6b6b8d',fontSize:10}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid #2a2a40',borderRadius:12,fontSize:12}} labelStyle={{color:'white'}} />
                <Bar dataKey="distance" fill="#00ff88" radius={[4,4,0,0]} />
                <Bar dataKey="runs" fill="#4a9eff" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Heart Rate Zones */}
        <SectionH title={t.aicoach.hrZoneDist} />
        <GlassCard className="p-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <ProgressRing pct={65} size={72} color="#00ff88">
                <div className="text-center">
                  <div className="text-white text-sm font-bold">Z2</div>
                  <div className="text-[#6b6b8d] text-[8px]">{t.aicoach.primaryZone}</div>
                </div>
              </ProgressRing>
            </div>
            <div className="flex-1 space-y-2">
              {hrZones.map(z => (
                <div key={z.zone} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#6b6b8d] w-5">{z.zone}</span>
                  <div className="flex-1 h-2 rounded-full bg-[#2a2a40] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${z.percent}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ backgroundColor: z.color }} />
                  </div>
                  <span className="text-[10px] text-[#a0a0b8] w-6 text-right">{z.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* AI Chat */}
        <SectionH title={t.aicoach.aiQa} />
        <GlassCard className="p-4 mb-6">
          <div className="flex items-center gap-3 bg-[#252540]/50 rounded-2xl px-4 py-3 mb-3">
            <input placeholder={t.aicoach.askPlaceholder} className="flex-1 bg-transparent text-white text-[13px] outline-none placeholder:text-[#4a4a6a]" />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neon"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          </div>
          <div className="space-y-2">
            {[
              { q: '如何提高步频？', a: '建议每周加入2次节奏跑，使用节拍器设置在180bpm。' },
              { q: '今天适合高强度训练吗？', a: '恢复指数82，疲劳度35，适合中等强度训练。' },
            ].map((item, i) => (
              <div key={i} className="bg-[#252540]/30 rounded-xl p-3">
                <div className="text-white text-[12px] font-medium mb-1">{t.aicoach.qPrefix}{item.q}</div>
                <div className="text-[#a0a0b8] text-[12px]">{t.aicoach.aPrefix}{item.a}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

// ─── Page: Robot ──────────────────────────────────────────

function RobotPage() {
  const t = useT()
  const modes = [
    { key: 'follow', label: t.robot.modes.follow.label, icon: '🚶', desc: t.robot.modes.follow.desc, color: '#00ff88', active: true },
    { key: 'supply', label: t.robot.modes.supply.label, icon: '💧', desc: t.robot.modes.supply.desc, color: '#4a9eff', active: false },
    { key: 'patrol', label: t.robot.modes.patrol.label, icon: '📷', desc: t.robot.modes.patrol.desc, color: '#ffd60a', active: false },
    { key: 'return', label: t.robot.modes.return.label, icon: '🏠', desc: t.robot.modes.return.desc, color: '#ff6b35', active: false },
  ]

  return (
    <div className="h-full flex flex-col">
      <StatusBar />
      <div className="flex-1 overflow-y-auto px-4 pb-[90px] scrollable">
        {/* Header */}
        <div className="flex items-center justify-between mt-1 mb-4">
          <div>
            <motion.h1 initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} className="text-[28px] font-bold text-white tracking-tight">{t.robot.title}</motion.h1>
            <p className="text-[#a0a0b8] text-[13px] mt-0.5">{t.robot.firmware}{robot.firmwareVersion}</p>
          </div>
          <Badge color="#00ff88">
            <span className="w-1.5 h-1.5 rounded-full bg-neon pulse-glow" />
            {t.robot.connected}
          </Badge>
        </div>

        {/* Robot 3D Card */}
        <GlassCard className="p-5 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-neon/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-5">
            <ProgressRing pct={robot.battery} size={80} stroke={5} color="#00ff88">
              <div className="text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-neon mx-auto mb-0.5"><rect x="4" y="6" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="13" r="1.5" fill="currentColor"/><circle cx="15" cy="13" r="1.5" fill="currentColor"/><path d="M9 6V4a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5"/></svg>
                <div className="text-white text-lg font-bold">{robot.battery}%</div>
              </div>
            </ProgressRing>
            <div className="flex-1 space-y-2">
              {[
                { label: t.robot.labels.distance, value: `${robot.distance}${t.units.m}` },
                { label: t.robot.labels.speed, value: `${robot.speed}${t.units.ms}` },
                { label: t.robot.labels.temperature, value: `${robot.temperature}${t.units.celsius}` },
                { label: t.robot.labels.storage, value: `${robot.storage}%` },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[#a0a0b8] text-[12px]">{s.label}</span>
                  <span className="text-white text-[13px] font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Signal Status */}
        <SectionH title={t.robot.connectionStatus} />
        <GlassCard className="p-4 mb-5">
          <div className="flex gap-4">
            {[
              { label: t.robot.signalLabels.uwb, value: `${robot.uwbSignal}%`, color: '#00ff88', icon: '📡' },
              { label: t.robot.signalLabels.lidar, value: robot.lidarStatus === 'active' ? t.robot.lidarActive : t.robot.lidarStandby, color: '#4a9eff', icon: '🔍' },
              { label: t.robot.signalLabels.gps, value: t.robot.gpsStrong, color: '#ffd60a', icon: '🛰️' },
            ].map(s => (
              <div key={s.label} className="flex-1 bg-[#252540]/50 rounded-xl p-3 text-center">
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="text-white text-[11px] font-semibold">{s.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Mode Selection */}
        <SectionH title={t.robot.workMode} />
        <div className="grid grid-cols-2 gap-3 mb-5">
          {modes.map(m => (
            <motion.button key={m.key} whileTap={{ scale: 0.97 }} className={`rounded-2xl p-4 border text-left transition-all ${m.active ? 'border-neon/30 bg-neon/10' : 'border-[#2a2a40]/40 bg-[#1a1a2e]/40'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{m.icon}</span>
                <span className={`text-sm font-semibold ${m.active ? 'text-neon' : 'text-white'}`}>{m.label}</span>
              </div>
              <p className="text-[#a0a0b8] text-[11px]">{m.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Remote Control */}
        <SectionH title={t.robot.remoteControl} />
        <GlassCard className="p-4 mb-5">
          <div className="flex items-center justify-center gap-6 py-2">
            <div />
            <button className="w-12 h-12 rounded-full bg-[#252540]/50 flex items-center justify-center text-white/60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <div />
            <div />
          </div>
          <div className="flex items-center justify-center gap-6">
            <button className="w-12 h-12 rounded-full bg-[#252540]/50 flex items-center justify-center text-white/60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="w-14 h-14 rounded-full bg-neon/20 flex items-center justify-center text-neon border border-neon/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
            </button>
            <button className="w-12 h-12 rounded-full bg-[#252540]/50 flex items-center justify-center text-white/60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 6 15 12 9 18"/></svg>
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 py-2">
            <button className="w-12 h-12 rounded-full bg-[#252540]/50 flex items-center justify-center text-white/60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div />
            <button className="w-12 h-12 rounded-full bg-[#252540]/50 flex items-center justify-center text-white/60">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="18 9 12 15 6 9"/></svg>
            </button>
          </div>
        </GlassCard>

        {/* Settings */}
        <SectionH title={t.robot.deviceSettings} />
        <div className="space-y-2 mb-6">
          {[
            { label: t.robot.settings.ota.label, icon: '⬆️', desc: t.robot.settings.ota.desc },
            { label: t.robot.settings.selfCheck.label, icon: '🔧', desc: t.robot.settings.selfCheck.desc },
            { label: t.robot.settings.calibrate.label, icon: '🎯', desc: t.robot.settings.calibrate.desc },
            { label: t.robot.settings.reset.label, icon: '🔄', desc: t.robot.settings.reset.desc },
          ].map(s => (
            <GlassCard key={s.label} className="p-3 flex items-center gap-3">
              <span className="text-lg">{s.icon}</span>
              <div className="flex-1">
                <div className="text-white text-[13px] font-medium">{s.label}</div>
                <div className="text-[#6b6b8d] text-[11px]">{s.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#4a4a6a]"><polyline points="9 6 15 12 9 18" stroke="currentColor" strokeWidth="2"/></svg>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page: Profile ────────────────────────────────────────

function Profile() {
  const t = useT()
  const { lang, setLang } = useLang()
  return (
    <div className="h-full flex flex-col">
      <StatusBar />
      <div className="flex-1 overflow-y-auto px-4 pb-[90px] scrollable">
        {/* Header */}
        <div className="flex items-center gap-4 mt-2 mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-gradient-to-br from-neon/30 to-accent-blue/30 border border-neon/20 flex items-center justify-center">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-neon"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-white text-[22px] font-bold tracking-tight">{t.profile.name}</h1>
              <Badge color="#ffd60a">{t.profile.plusMember}</Badge>
            </div>
            <p className="text-[#a0a0b8] text-[13px] mt-0.5">{t.profile.levelTitle(12, '白银跑者')} · Lv.12</p>
          </div>
        </div>

        {/* Level Progress */}
        <GlassCard className="p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-[13px] font-semibold">Lv.12 {t.profile.levelTitle(12, '白银跑者')}</span>
            <span className="text-[#6b6b8d] text-[11px]">{t.profile.nextLevel(13)}</span>
          </div>
          <div className="h-2 rounded-full bg-[#2a2a40] overflow-hidden mb-1">
            <motion.div initial={{ width: 0 }} animate={{ width: '68%' }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-neon to-accent-blue" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#6b6b8d]">
            <span>{t.profile.levelProgress.zero}</span>
            <span>{t.profile.levelProgress.goal}</span>
            <span>486 {t.units.km}</span>
          </div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="stats-grid mb-5">
          {[
            { label: t.profile.statLabels.totalDist, value: '486', unit: t.units.km, color: '#00ff88', icon: '🏃' },
            { label: t.profile.statLabels.robotDist, value: '320', unit: t.units.km, color: '#4a9eff', icon: '🤖' },
            { label: t.profile.statLabels.streak, value: '18', unit: t.units.days, color: '#ffd60a', icon: '🔥' },
            { label: t.profile.statLabels.aiScore, value: '82', unit: t.home.outOf, color: '#accent-purple', icon: '🧠' },
          ].map(s => (
            <GlassCard key={s.label} className="p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#a0a0b8] text-[10px] uppercase tracking-wide">{s.label}</span>
                <span>{s.icon}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[#6b6b8d] text-[10px]">{s.unit}</span>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Achievements */}
        <SectionH title={t.profile.achievements} action={t.home.viewAll} />
        <div className="flex gap-2 overflow-x-auto scrollable pb-1 mb-5">
          {achievements.map(a => (
            <div key={a.id} className={`shrink-0 w-20 rounded-2xl p-3 text-center ${a.unlocked ? 'bg-neon/10 border border-neon/20' : 'bg-[#1a1a2e]/40 border border-[#2a2a40]/30 opacity-50'}`}>
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="text-white text-[10px] font-medium">{a.title}</div>
            </div>
          ))}
        </div>

        {/* Equipment */}
        <SectionH title={t.profile.equipment} />
        <div className="space-y-2 mb-5">
          {[
            { name: 'Nike Vaporfly 3', type: t.profile.equipmentItems['Nike Vaporfly 3'].type, dist: `320${t.units.km}`, icon: '👟' },
            { name: 'Apple Watch Ultra 2', type: t.profile.equipmentItems['Apple Watch Ultra 2'].type, icon: '⌚' },
            { name: 'SmartRun X1', type: t.profile.equipmentItems['SmartRun X1'].type, dist: `320${t.units.km}`, icon: '🤖' },
          ].map(e => (
            <GlassCard key={e.name} className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#252540]/50 flex items-center justify-center text-lg">{e.icon}</div>
              <div className="flex-1">
                <div className="text-white text-[13px] font-semibold">{e.name}</div>
                <div className="text-[#6b6b8d] text-[11px]">{e.type}{e.dist ? ` · ${e.dist}` : ''}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#4a4a6a]"><polyline points="9 6 15 12 9 18" stroke="currentColor" strokeWidth="2"/></svg>
            </GlassCard>
          ))}
        </div>

        {/* Settings */}
        <SectionH title={t.profile.settings} />
        <div className="space-y-2 mb-6">
          {/* Language Toggle */}
          <GlassCard className="p-3 flex items-center gap-3 mb-2">
            <span className="text-lg">🌐</span>
            <span className="flex-1 text-white text-[13px] font-medium">{t.profile.language}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setLang('zh')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${lang === 'zh' ? 'bg-neon/20 text-neon' : 'bg-[#252540]/50 text-[#6b6b8d]'}`}
              >
                {t.profile.langZh}
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${lang === 'en' ? 'bg-neon/20 text-neon' : 'bg-[#252540]/50 text-[#6b6b8d]'}`}
              >
                {t.profile.langEn}
              </button>
            </div>
          </GlassCard>
          {[
            { label: t.profile.settingItems.friends, icon: '👥' },
            { label: t.profile.settingItems.membership, icon: '⭐' },
            { label: t.profile.settingItems.videos, icon: '🎬' },
            { label: t.profile.settingItems.album, icon: '🖼️' },
            { label: t.profile.settingItems.system, icon: '⚙️' },
          ].map(s => (
            <GlassCard key={s.label} className="p-3 flex items-center gap-3">
              <span className="text-lg">{s.icon}</span>
              <span className="flex-1 text-white text-[13px] font-medium">{s.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#4a4a6a]"><polyline points="9 6 15 12 9 18" stroke="currentColor" strokeWidth="2"/></svg>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const inRun = false

  return (
    <div className="relative w-full h-full bg-[#0a0a0f] overflow-hidden">
      <PageWrap tab={tab}>
        {tab === 'home' && <Home />}
        {tab === 'run' && <RunPage />}
        {tab === 'aicoach' && <AICoach />}
        {tab === 'robot' && <RobotPage />}
        {tab === 'profile' && <Profile />}
      </PageWrap>
      <NavBar active={tab} onChange={setTab} hidden={inRun} />
    </div>
  )
}