import { useState, useEffect, useCallback, useRef, type ReactNode, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
  import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid } from 'recharts'
import { useT, useLang } from './i18n/context'
import type { AuthMode, AuthErrorCode } from './data/types'
import { apiSignUp, apiSignIn, apiGetAccounts, apiGetInvites, apiSendInvite, apiAcceptInvite, apiDeclineInvite, apiGetTeam, apiDisbandTeam, apiCreateScheduledRun, apiGetScheduledRuns, apiSetRsvp, apiCancelScheduledRun, apiLeaveTeam, apiToggleStats, apiAskAi } from './api/client'
import type { ApiAccount, ApiInvite, ApiScheduledRun } from './api/client'
import { saveSession, getToken, getAccount, clearSession } from './api/session'
import { getProgress, addXp, calcLevelProgress } from './progress/progress'
import type { TeamData } from './team/team'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Types ───────────────────────────────────────────────
type Tab = 'home' | 'run' | 'aicoach' | 'robot' | 'profile'

type Session = { id: string; email: string; displayName: string }

// Non-standard Chromium event for the install prompt — not in lib.dom
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

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

function SectionH({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-white text-[17px] font-semibold tracking-tight">{title}</h2>
      {action && <button onClick={onAction} className="text-neon text-[13px] font-medium">{action}</button>}
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

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  const t = useT()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-[300px] rounded-2xl bg-[#1a1a2e] border border-[#2a2a40]/50 p-5 shadow-2xl"
      >
        <div className="text-center">
          <div className="text-white text-[16px] font-semibold mb-1">{t.home.confirmTitle}</div>
          <p className="text-[#a0a0b8] text-[14px] mb-5">{message}</p>
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onCancel}
              className="flex-1 rounded-xl bg-[#252540]/50 text-[#a0a0b8] py-2.5 text-[14px] font-semibold"
            >
              {t.home.cancel}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-accent-red/20 border border-accent-red/30 text-accent-red py-2.5 text-[14px] font-semibold"
            >
              {t.home.confirmYes}
            </motion.button>
          </div>
        </div>
      </motion.div>
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

function Home({ session, token, onStartTraining }: { session: Session; token: string; onStartTraining?: () => void }) {
  const t = useT()
  const streakDays = 18
  const [showAllRuns, setShowAllRuns] = useState(false)
  const recoveryScore = 82
  const weekDays = t.home.weekDays
  const todayIdx = new Date().getDay() - 1 || 6
  const [team, setTeam] = useState<TeamData | null>(null)
  const [teamLoading, setTeamLoading] = useState(true)
  const [invites, setInvites] = useState<ApiInvite[]>([])
  const [showSentFeedback, setShowSentFeedback] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

  const [scheduledRuns, setScheduledRuns] = useState<ApiScheduledRun[]>([])
  const [showScheduleOverlay, setShowScheduleOverlay] = useState(false)
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [schedLocation, setSchedLocation] = useState('')
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false)
  const [scheduleFormError, setScheduleFormError] = useState('')
  const [showStatsOverlay, setShowStatsOverlay] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'leave' | 'disband' | 'cancelRun' | null>(null)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [cancelRunId, setCancelRunId] = useState('')

  // Poll team data every 15s so members see live changes
  useEffect(() => {
    if (!token || !team) return
    const interval = setInterval(() => {
      apiGetTeam(token).then(r => {
        if (r.ok && r.data.team) setTeam(r.data.team as unknown as TeamData)
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [token, team?.id])

  const refreshScheduledRuns = useCallback(() => {
    if (!team) { setScheduledRuns([]); return }
    apiGetScheduledRuns(token, team.id).then(r => {
      if (r.ok) setScheduledRuns(r.data.runs)
    })
  }, [token, team])

  const handleConfirmSchedule = async () => {
    if (!schedDate || !schedTime || !schedLocation.trim() || !team) return
    setScheduleSubmitting(true)
    const result = await apiCreateScheduledRun(token, team.id, schedDate, schedTime, schedLocation.trim())
    if (result.ok) {
      setShowScheduleOverlay(false)
      setSchedDate('')
      setSchedTime('')
      setSchedLocation('')
      setScheduleFormError('')
      refreshScheduledRuns()
    } else {
      setScheduleFormError(result.error === 'not_team_member' ? '不是你所在的队伍' : t.home.scheduleError)
    }
    setScheduleSubmitting(false)
  }

  const handleRsvp = async (runId: string, status: 'going' | 'not_going') => {
    const result = await apiSetRsvp(token, runId, status)
    if (result.ok) refreshScheduledRuns()
  }

  const handleCancelRun = async (runId: string) => {
    await apiCancelScheduledRun(token, runId)
    refreshScheduledRuns()
  }

  const confirmCancelRun = (runId: string) => {
    setCancelRunId(runId)
    setConfirmMessage(t.home.confirmCancelRun)
    setConfirmAction('cancelRun')
  }

  const refreshInvites = useCallback(() => {
    apiGetInvites(token).then(r => {
      if (r.ok) setInvites(r.data.invites)
    })
  }, [token])

  useEffect(() => {
    setTeamLoading(true)
    apiGetTeam(token).then(r => {
      if (r.ok && r.data.team) setTeam(r.data.team as unknown as TeamData)
      setTeamLoading(false)
    }).catch(() => setTeamLoading(false))
  }, [token])

  useEffect(() => { refreshInvites() }, [refreshInvites])

  useEffect(() => { refreshScheduledRuns() }, [refreshScheduledRuns])

  const [creating, setCreating] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [customMemberName, setCustomMemberName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [otherAccounts, setOtherAccounts] = useState<ApiAccount[]>([])

  useEffect(() => {
    apiGetAccounts(token).then(r => {
      if (r.ok) setOtherAccounts(r.data.accounts.filter(a => a.id !== session.id))
    })
  }, [token, session.id])

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return
    if (selectedMembers.length === 0 && !customMemberName.trim()) return
    const allNames = [...selectedMembers]
    if (!allNames.includes(session.displayName)) {
      allNames.unshift(session.displayName)
    }
    if (customMemberName.trim()) {
      const trimmed = customMemberName.trim()
      const exists = otherAccounts.some(a => a.displayName.toLowerCase() === trimmed.toLowerCase())
      if (!exists) {
        setInviteError(`"${trimmed}" 不存在，无法邀请`)
        return
      }
      allNames.push(trimmed)
    }
    for (const name of allNames) {
      if (name === session.displayName) continue
      const account = otherAccounts.find(a => a.displayName === name)
      if (account) {
        const result = await apiSendInvite(token, account.id, teamName.trim())
        if (!result.ok) {
          setInviteError(result.error === 'already_on_team' ? `"${name}" 已在队伍中` : result.error === 'team_full' ? '队伍已满，最多30人' : '发送邀请失败')
          return
        }
      }
    }
    const teamResult = await apiGetTeam(token)
    if (teamResult.ok && teamResult.data.team) {
      setTeam(teamResult.data.team as unknown as TeamData)
    }
    refreshInvites()
    setShowSentFeedback(true)
    setTimeout(() => setShowSentFeedback(false), 3000)
    setCreating(false)
    setTeamName('')
    setSelectedMembers([])
    setCustomMemberName('')
  }

  const handleDeleteTeam = async () => {
    await apiDisbandTeam(token)
    setTeam(null)
  }

  const handleLeaveTeam = async () => {
    if (!team) return
    await apiLeaveTeam(token)
    setTeam(null)
  }

  const confirmDeleteTeam = () => {
    setConfirmMessage(t.home.confirmDisband)
    setConfirmAction('disband')
  }

  const confirmLeaveTeam = () => {
    setConfirmMessage(t.home.confirmLeave)
    setConfirmAction('leave')
  }

  const handleAcceptInvite = async (invite: ApiInvite) => {
    const result = await apiAcceptInvite(token, invite.id)
    if (result.ok && result.data.team) {
      setTeam(result.data.team as unknown as TeamData)
    }
    refreshInvites()
  }

  const handleDeclineInvite = async (invite: ApiInvite) => {
    await apiDeclineInvite(token, invite.id)
    refreshInvites()
  }

  const handleInviteMembers = async () => {
    if (selectedMembers.length === 0) return
    if (!team) return
    if (team.members.length >= 30) { setInviteError('队伍已满，最多30人'); return }
    for (const name of selectedMembers) {
      const account = otherAccounts.find(a => a.displayName === name)
      if (account) {
        const result = await apiSendInvite(token, account.id, team.name, team.id)
        if (!result.ok) {
          setInviteError(result.error === 'already_on_team' ? `"${name}" 已在队伍中` : result.error === 'team_full' ? '队伍已满，最多30人' : '发送邀请失败')
          return
        }
      }
    }
    setShowInviteForm(false)
    setShowSentFeedback(true)
    setTimeout(() => setShowSentFeedback(false), 3000)
    setSelectedMembers([])
  }

  const toggleMember = (name: string) => {
    setSelectedMembers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
    setInviteError('')
  }

  return (
    <>
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
            <div className="w-24 h-12 rounded-xl overflow-hidden border border-white/10 bg-[#f7f4f0]">
              <img src="/logo.png" alt="EOS - Evolve. Outrun. Shine." className="w-full h-full object-cover" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon rounded-full border-2 border-[#0a0a0f] pulse-glow" />
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
        <motion.button whileTap={{ scale: 0.97 }} onClick={onStartTraining} className="w-full mb-5 relative overflow-hidden rounded-2xl bg-gradient-to-r from-neon/20 via-neon/10 to-transparent border border-neon/20 p-4">
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
        {/* Party / Team */}
        <SectionH title={t.home.party} />

        {invites.length > 0 && !team && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard className="p-4 mb-4">
              <SectionH title={t.home.pendingInvites} />
              <div className="space-y-2">
                {invites.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 bg-[#252540]/30 rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-[13px] font-medium">{t.home.inviteFrom(inv.fromName)}</div>
                      <div className="text-[#a0a0b8] text-[12px]">{inv.teamName}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAcceptInvite(inv)}
                        className="px-3 py-1.5 rounded-lg bg-neon/20 border border-neon/30 text-neon text-[12px] font-semibold"
                      >
                        {t.home.accept}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeclineInvite(inv)}
                        className="px-3 py-1.5 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-[12px] font-semibold"
                      >
                        {t.home.decline}
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard className="p-4 mb-5">
            {creating ? (
              <>
                {/* ── Create Team Form ── */}
                <div className="mb-3">
                  <label className="text-white text-[13px] font-semibold mb-2 block">{t.home.party}</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => { setTeamName(e.target.value); setInviteError('') }}
                    placeholder={t.home.createTeamName ?? '团队名称'}
                    className="w-full rounded-xl bg-[#252540]/50 border border-[#2a2a40]/50 px-3 py-2 text-white text-[13px] focus:outline-none focus:border-neon/50 placeholder-[#4a4a6a] mb-3"
                  />

                  {/* Available accounts */}
                  {otherAccounts.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[#a0a0b8] text-[11px] font-medium mb-1.5">{t.home.availableUsers ?? '可选成员'}</div>
                      <div className="space-y-1">
                        {otherAccounts.map(a => (
                          <label key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#252540]/30 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(a.displayName)}
                              onChange={() => toggleMember(a.displayName)}
                              className="w-4 h-4 rounded border-[#2a2a40] bg-[#252540] text-neon focus:ring-neon/30"
                            />
                            <div>
                              <div className="text-white text-[13px] font-medium">{a.displayName}</div>
                              <div className="text-[#6b6b8d] text-[11px]">{a.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom member name */}
                  <div className="mb-3">
                    <div className="text-[#a0a0b8] text-[11px] font-medium mb-1.5">{t.home.addMember ?? '添加成员'}</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customMemberName}
                        onChange={e => { setCustomMemberName(e.target.value); setInviteError('') }}
                        placeholder={t.home.memberNamePlaceholder ?? '输入成员名称'}
                        className="flex-1 rounded-xl bg-[#252540]/50 border border-[#2a2a40]/50 px-3 py-2 text-white text-[13px] focus:outline-none focus:border-neon/50 placeholder-[#4a4a6a]"
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-[#2a2a40]/50">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setCreating(false)
                        setTeamName('')
                        setSelectedMembers([])
                        setCustomMemberName('')
                        setInviteError('')
                      }}
                      className="flex-1 rounded-xl bg-[#252540]/50 text-[#a0a0b8] py-2.5 text-[13px] font-semibold"
                    >
                      {t.home.cancelCreate ?? '取消'}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleCreateTeam}
                      className="flex-1 rounded-xl bg-neon/20 border border-neon/30 text-neon py-2.5 text-[13px] font-semibold"
                    >
                      {t.home.sendInvites}
                    </motion.button>
                  </div>
                  {inviteError && (
                    <p className="text-accent-red text-[12px] mt-2 text-center" role="alert">{inviteError}</p>
                  )}
                </div>
              </>
            ) : team ? (
              showInviteForm ? (
                <>
                  {/* ── Invite Friends Form ── */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent-purple"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M15 18c.2-2 1.8-3.5 4-3.5 1.7 0 3 1 3 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                      <div>
                        <div className="text-white text-[15px] font-semibold leading-tight">{team.name}</div>
                        <div className="text-[#6b6b8d] text-[11px] mt-0.5">{t.home.partyMembers} · {team.members.length}</div>
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowInviteForm(false)} className="text-[#a0a0b8] text-[11px] font-medium">
                      {t.home.cancelCreate ?? '取消'}
                    </motion.button>
                  </div>

                  {/* Member limit check */}
                  {team.members.length >= 30 ? (
                    <div className="text-[#ff6b35] text-[12px] text-center py-3">队伍已满（最多30人）</div>
                  ) : (
                    <>
                      {/* Available accounts (exclude already invited) */}
                      {otherAccounts.filter(a => !team.members.some(m => m.userId === a.id)).length > 0 ? (
                        <div className="mb-3">
                          <div className="text-[#a0a0b8] text-[11px] font-medium mb-1.5">{t.home.availableUsers ?? '可选成员'}</div>
                          <div className="space-y-1">
                            {otherAccounts.filter(a => !team.members.some(m => m.userId === a.id)).map(a => (
                              <label key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#252540]/30 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedMembers.includes(a.displayName)}
                                  onChange={() => toggleMember(a.displayName)}
                                  className="w-4 h-4 rounded border-[#2a2a40] bg-[#252540] text-neon focus:ring-neon/30"
                                />
                                <div>
                                  <div className="text-white text-[13px] font-medium">{a.displayName}</div>
                                  <div className="text-[#6b6b8d] text-[11px]">{a.email}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[#a0a0b8] text-[12px] text-center py-3">{t.home.noInvites ?? '暂无可邀请的成员'}</div>
                      )}
                    </>
                  )}

                  {/* Send button */}
                  <div className="flex gap-2 pt-2 border-t border-[#2a2a40]/50">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowInviteForm(false)}
                      className="flex-1 rounded-xl bg-[#252540]/50 text-[#a0a0b8] py-2.5 text-[13px] font-semibold"
                    >
                      {t.home.cancelCreate ?? '取消'}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleInviteMembers}
                      disabled={selectedMembers.length === 0}
                      className="flex-1 rounded-xl bg-neon/20 border border-neon/30 text-neon py-2.5 text-[13px] font-semibold disabled:opacity-40"
                    >
                      {t.home.sendInvites}
                    </motion.button>
                  </div>
                  {inviteError && (
                    <p className="text-accent-red text-[12px] mt-2 text-center" role="alert">{inviteError}</p>
                  )}
                </>
              ) : (
                <>
                  {/* ── Existing Team Display ── */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent-purple"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M15 18c.2-2 1.8-3.5 4-3.5 1.7 0 3 1 3 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                      <div>
                        <div className="text-white text-[15px] font-semibold leading-tight">{team.name}</div>
                        <div className="text-[#6b6b8d] text-[11px] mt-0.5">{t.home.partyMembers} · {team.members.length}</div>
                      </div>
                    </div>
                    {team.createdBy === session.id ? (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={confirmDeleteTeam} className="text-accent-red text-[11px] font-medium">
                        {t.home.deleteTeam ?? '解散团队'}
                      </motion.button>
                    ) : (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={confirmLeaveTeam} className="text-accent-red text-[11px] font-medium">
                        {t.home.leaveTeam ?? '退出队伍'}
                      </motion.button>
                    )}
                  </div>

                  {/* Scheduled runs */}
                  {scheduledRuns.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {scheduledRuns.map(run => (
                        <div key={run.id} className="rounded-xl bg-accent-orange/10 border border-accent-orange/20 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent-orange"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 14l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span className="text-white text-[13px] font-semibold">{run.date} · {run.time}</span>
                            </div>
                            {run.createdBy === session.id && (
                              <button onClick={() => confirmCancelRun(run.id)} className="text-accent-red text-[11px] font-medium">{t.home.cancelRun}</button>
                            )}
                          </div>
                          <div className="text-[#a0a0b8] text-[12px] mb-2">{run.location} · {t.home.inviteFrom(run.createdByName)}</div>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 text-[11px]">
                              <span className="text-neon">{run.goingCount} {t.home.going}</span>
                              <span className="text-accent-red">{run.notGoingCount} {t.home.notGoing}</span>
                            </div>
                            <div className="flex gap-1.5">
                              {(() => {
                                const myRsvp = run.rsvps.find(r => r.accountId === session.id)
                                return (
                                  <>
                                    <motion.button whileTap={{ scale: 0.95 }}
                                      onClick={() => handleRsvp(run.id, 'going')}
                                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold border ${myRsvp?.status === 'going' ? 'bg-neon/20 border-neon/30 text-neon' : 'bg-[#252540]/50 border-[#2a2a40] text-[#a0a0b8]'}`}
                                    >
                                      {t.home.going}
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.95 }}
                                      onClick={() => handleRsvp(run.id, 'not_going')}
                                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold border ${myRsvp?.status === 'not_going' ? 'bg-accent-red/20 border-accent-red/30 text-accent-red' : 'bg-[#252540]/50 border-[#2a2a40] text-[#a0a0b8]'}`}
                                    >
                                      {t.home.notGoing}
                                    </motion.button>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Members list */}
                  <div className="space-y-1.5 mb-3">
                    {[...team.members].sort((a, b) => {
    if (team.createdBy && a.userId === team.createdBy) return -1
    if (team.createdBy && b.userId === team.createdBy) return 1
    return 0
  }).map((m, i) => (
                      <div key={m.name} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${i % 2 === 0 ? 'bg-[#252540]/30' : 'bg-transparent'}`}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon/40 to-accent-blue/40 border border-white/10 flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white text-[13px] font-medium truncate">{m.name}</span>
                            {team.createdBy && m.userId === team.createdBy && (
                              <Badge color="#00ff88" className="!px-1.5 !py-0 text-[9px]">{t.home.captain}</Badge>
                            )}
                            {(m.status === 'pending' || (!m.status && m.userId && m.userId !== session.id)) && (
                              <Badge color="#ff6b35" className="!px-1.5 !py-0 text-[9px]">{t.home.pendingStatus}</Badge>
                            )}
                          </div>
                          {(m as unknown as { statsShared?: boolean }).statsShared ? (
                            <div className="text-[#a0a0b8] text-[11px] mt-0.5">{m.weeklyDist}{t.units.km} · {t.home.stats.distance}</div>
                          ) : (
                            <div className="text-[#6b6b8d] text-[11px] mt-0.5">—</div>
                          )}
                        </div>
                        {(m as unknown as { statsShared?: boolean }).statsShared ? (
                          <div className="text-right shrink-0">
                            <div className="text-neon text-[13px] font-semibold font-mono">{m.avgPace}</div>
                            <div className="text-[#6b6b8d] text-[10px]">{t.units.perKm}</div>
                          </div>
                        ) : (
                          <div className="text-right shrink-0">
                            <div className="text-[#6b6b8d] text-[13px] font-semibold font-mono">—</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2.5 pt-3 border-t border-[#2a2a40]/50">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowStatsOverlay(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue py-2.5 text-[12px] font-semibold"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent-blue"><circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8.2 10.7l7.6-3.4M8.2 13.3l7.6 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      {t.home.shareStats}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setShowScheduleOverlay(true); setSchedDate(''); setSchedTime(''); setSchedLocation(''); setScheduleFormError('') }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-neon/10 border border-neon/20 text-neon py-2.5 text-[12px] font-semibold"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neon"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 14l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {t.home.scheduleRun}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setShowInviteForm(true); setSelectedMembers([]); setInviteError('') }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple py-2.5 text-[12px] font-semibold"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent-purple"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><line x1="23" y1="11" x2="23" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="20" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      {t.home.inviteFriends}
                    </motion.button>
                  </div>

                  {/* Invite hint */}
                  <div className="text-center text-[#6b6b8d] text-[11px] mt-3">{t.home.inviteHint}</div>
                </>
              )
            ) : teamLoading ? (
              <div className="text-center py-6">
                <div className="text-[#6b6b8d] text-[12px]">…</div>
              </div>
            ) : (
              <>
                {/* ── No Team / Create CTA ── */}
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-purple/20 mx-auto flex items-center justify-center mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent-purple"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M15 18c.2-2 1.8-3.5 4-3.5 1.7 0 3 1 3 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  <div className="text-white text-[15px] font-semibold mb-1">{t.home.noPartyYet}</div>
                  <div className="text-[#a0a0b8] text-[12px] mb-4">{t.home.noPartyHint}</div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCreating(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-accent-purple/20 border border-accent-purple/30 text-accent-purple px-5 py-2.5 text-[13px] font-semibold"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent-purple"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    {t.home.createParty}
                  </motion.button>
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>

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
        <SectionH title={t.home.recentRuns} action={showAllRuns ? t.home.viewLess : t.home.viewAll} onAction={() => setShowAllRuns(prev => !prev)} />
        <div className="space-y-2 mb-5">
          {(showAllRuns ? recentRuns : recentRuns.slice(0, 3)).map(r => (
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

        {showSentFeedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <GlassCard className="p-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neon"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="text-white text-[13px] font-medium">{t.home.sentInvite}</span>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Schedule overlay */}
      {showScheduleOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[360px] mx-4"
          >
            <GlassCard className="p-5">
              <div className="text-white text-[17px] font-semibold mb-4">{t.home.scheduleTitle}</div>

              {scheduleFormError && (
                <div className="text-accent-red text-[12px] mb-3" role="alert">{scheduleFormError}</div>
              )}

              <label className="text-[#a0a0b8] text-[11px] font-medium uppercase tracking-wide mb-1.5 block">{t.home.selectDateTime}</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => { setSchedDate(e.target.value); setScheduleFormError('') }}
                  className="flex-1 bg-[#252540] border border-[#2a2a40] rounded-xl px-3 py-2.5 text-white text-[13px] focus:outline-none focus:border-neon/50"
                />
                <input
                  type="time"
                  value={schedTime}
                  onChange={e => { setSchedTime(e.target.value); setScheduleFormError('') }}
                  className="flex-1 bg-[#252540] border border-[#2a2a40] rounded-xl px-3 py-2.5 text-white text-[13px] focus:outline-none focus:border-neon/50"
                />
              </div>

              <label className="text-[#a0a0b8] text-[11px] font-medium uppercase tracking-wide mb-1.5 block">{t.home.selectLocation}</label>
              <input
                type="text"
                value={schedLocation}
                onChange={e => { setSchedLocation(e.target.value); setScheduleFormError('') }}
                placeholder={t.home.locationPlaceholder}
                className="w-full bg-[#252540] border border-[#2a2a40] rounded-xl px-3 py-2.5 text-white text-[13px] placeholder:text-[#6b6b8d] focus:outline-none focus:border-neon/50 mb-4"
              />

              <div className="flex gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowScheduleOverlay(false); setScheduleFormError('') }}
                  className="flex-1 rounded-xl bg-[#252540] border border-[#2a2a40] text-[#a0a0b8] py-2.5 text-[13px] font-semibold"
                >
                  {t.home.cancel}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirmSchedule}
                  disabled={scheduleSubmitting}
                  className="flex-1 rounded-xl bg-neon/20 border border-neon/30 text-neon py-2.5 text-[13px] font-semibold disabled:opacity-50"
                >
                  {scheduleSubmitting ? '…' : t.home.confirmSchedule}
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
    {showStatsOverlay && team && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setShowStatsOverlay(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-[340px] rounded-2xl bg-[#1a1a2e] border border-[#2a2a40]/50 p-5 shadow-2xl max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-[17px] font-semibold">{t.home.statsOverlay}</h2>
            <button onClick={() => setShowStatsOverlay(false)} className="text-[#6b6b8d] p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="space-y-2 mb-4">
            {team.members.map(m => {
              const isSelf = m.userId === session.id
              const shared = (m as unknown as { statsShared?: boolean }).statsShared
              return (
                <div key={m.name} className="flex items-center gap-3 rounded-xl bg-[#252540]/30 p-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon/40 to-accent-blue/40 border border-white/10 flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[13px] font-medium">{m.name}{isSelf && <span className="text-neon text-[10px] ml-1">({t.home.myStats})</span>}</div>
                    <div className="flex gap-2 mt-1">
                      {shared ? (
                        <>
                          <span className="text-[#a0a0b8] text-[11px]">{m.weeklyDist}{t.units.km} · {t.home.weeklyDistance}</span>
                          <span className="text-[#a0a0b8] text-[11px]">{m.avgPace} · {t.units.perKm}</span>
                        </>
                      ) : (
                        <span className="text-[#6b6b8d] text-[11px]">—</span>
                      )}
                    </div>
                  </div>
                  {isSelf && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        const result = await apiToggleStats(token)
                        if (result.ok) {
                          const teamResult = await apiGetTeam(token)
                          if (teamResult.ok && teamResult.data.team) setTeam(teamResult.data.team as unknown as TeamData)
                        }
                      }}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold ${shared ? 'bg-neon/20 border border-neon/30 text-neon' : 'bg-[#252540]/70 border border-[#2a2a40]/50 text-[#a0a0b8]'}`}
                    >
                      {shared ? t.home.hideMyStats : t.home.shareMyStats}
                    </motion.button>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    )}
    {confirmAction && (
      <ConfirmDialog
        message={confirmMessage}
        onConfirm={() => {
          const action = confirmAction
          setConfirmAction(null)
          if (action === 'disband') handleDeleteTeam()
          else if (action === 'leave') handleLeaveTeam()
          else if (action === 'cancelRun' && cancelRunId) handleCancelRun(cancelRunId)
        }}
        onCancel={() => setConfirmAction(null)}
      />
    )}
  </>
  )
}

// ─── Page: Run ────────────────────────────────────────────

interface Place { id: string; lat: number; lng: number }
const PLACES: Record<string, Place> = {
  home: { id: 'home', lat: 31.2304, lng: 121.4737 },
  company: { id: 'company', lat: 31.2397, lng: 121.4998 },
  park: { id: 'park', lat: 31.2462, lng: 121.5045 },
  lake: { id: 'lake', lat: 31.2186, lng: 121.5532 },
  gym: { id: 'gym', lat: 31.1843, lng: 121.4388 },
  school: { id: 'school', lat: 31.2001, lng: 121.4333 },
}

function RunMap({ startId, endId }: { startId: string; endId: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const start = PLACES[startId]
    const end = PLACES[endId]
    if (!start || !end) return
    const map = L.map(ref.current, { zoomControl: false, attributionControl: true })
    mapRef.current = map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    const pts: L.LatLngExpression[] = [[start.lat, start.lng], [end.lat, end.lng]]
    L.polyline(pts, { color: '#00ff88', weight: 4, opacity: 0.9, dashArray: '8 6' }).addTo(map)
    L.circleMarker([start.lat, start.lng], { radius: 8, color: '#00ff88', fillColor: '#00ff88', fillOpacity: 1 }).addTo(map).bindPopup('Start')
    L.circleMarker([end.lat, end.lng], { radius: 8, color: '#ff6b35', fillColor: '#ff6b35', fillOpacity: 1 }).addTo(map).bindPopup('Finish')
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] })
    setReady(true)
    return () => { map.remove(); mapRef.current = null }
  }, [startId, endId])
  return (
    <div className="absolute inset-0 z-0">
      <div ref={ref} className="absolute inset-0 leaflet-dark" />
      {!ready && <div className="absolute inset-0 z-10 flex items-center justify-center"><span className="text-white/40 text-xs">Loading map…</span></div>}
    </div>
  )
}

function RunPage({ session }: { session: Session }) {
  const t = useT()
  const [active, setActive] = useState(false)
  const [xpFeedback, setXpFeedback] = useState<string | null>(null)
  const [startId, setStartId] = useState<string | null>(null)
  const [endId, setEndId] = useState<string | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [endHint, setEndHint] = useState(false)

  const handleStart = () => {
    if (!startId || !endId || startId === endId) {
      setRouteError(t.run.selectRouteFirst)
      return
    }
    setRouteError(null)
    const result = addXp(session.id, 100)
    setXpFeedback(t.run.xpGained(100, result.level))
    setActive(true)
    setTimeout(() => setXpFeedback(null), 3000)
  }

  if (!active) {
return (
    <>
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
          <div className="mb-3">
            <div className="text-[#a0a0b8] text-[11px] mb-2">{t.run.selectStart}</div>
            <div className="flex gap-2 overflow-x-auto scrollable pb-1">
              {Object.keys(PLACES).map(id => (
                <button
                  key={id}
                  onClick={() => { setStartId(id); setRouteError(null); setEndHint(false) }}
                  className={`shrink-0 rounded-2xl px-4 py-2 text-[12px] font-medium transition-all ${startId === id ? 'bg-neon/20 text-neon border border-neon/30' : 'bg-[#252540]/50 text-[#a0a0b8] border border-transparent'}`}
                >
                  {t.run.places[id]}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-5">
            <div className="text-[#a0a0b8] text-[11px] mb-2">{t.run.selectEnd}</div>
            <div className="flex gap-2 overflow-x-auto scrollable pb-1">
              {Object.keys(PLACES).map(id => (
                <button
                  key={id}
                  onClick={() => {
                    if (startId && id === startId) { setEndHint(true); return }
                    setEndId(id)
                    setRouteError(null)
                    setEndHint(false)
                  }}
                  className={`shrink-0 rounded-2xl px-4 py-2 text-[12px] font-medium transition-all ${endId === id ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/30' : 'bg-[#252540]/50 text-[#a0a0b8] border border-transparent'}`}
                >
                  {t.run.places[id]}
                </button>
              ))}
            </div>
            {endHint && <div className="text-accent-red text-[11px] mt-1">{t.run.selectRouteFirst}</div>}
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
          {routeError && <div className="text-accent-red text-[11px] mb-2 text-center">{routeError}</div>}
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleStart} className="w-full mb-8 py-4 rounded-2xl bg-neon text-black font-bold text-[17px] tracking-tight shadow-lg shadow-neon/20">
            {t.run.startTraining}
          </motion.button>
        </div>
    </div>
    </>
  )
}

  // ─── Active Run Mode ──────────────────────────────────────
  return (
    <div className="h-full bg-black flex flex-col">
      {/* XP Toast */}
      {xpFeedback && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-16 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div className="glass rounded-xl px-4 py-2 text-neon text-[13px] font-semibold shadow-lg">{xpFeedback}</div>
        </motion.div>
      )}
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
        {startId && endId && <RunMap startId={startId} endId={endId} />}

        {/* Pace overlay */}
        <div className="absolute top-3 left-3 z-10 glass rounded-xl px-3 py-2">
          <div className="text-[#a0a0b8] text-[10px]">{t.run.currentPace}</div>
          <div className="text-white text-xl font-bold font-mono">5:18</div>
        </div>
        <div className="absolute top-3 right-3 z-10 glass rounded-xl px-3 py-2 text-right">
          <div className="text-[#a0a0b8] text-[10px]">{t.run.distanceRun}</div>
          <div className="text-white text-xl font-bold">3.85{t.units.km}</div>
        </div>

        {/* AI Voice Suggestion */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-4 left-4 right-4 z-10">
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

function AICoach({ token }: { token: string }) {
  const t = useT()
  const [inputValue, setInputValue] = useState('')
  const [asking, setAsking] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([
    { q: '如何提高步频？', a: '建议每周加入2次节奏跑，使用节拍器设置在180bpm。' },
    { q: '今天适合高强度训练吗？', a: '恢复指数82，疲劳度35，适合中等强度训练。' },
  ])

  const getLocalResponse = (question: string): string => {
    const q = question.toLowerCase()
    if (q.includes('步频') || q.includes('cadence') || q.includes('步幅')) return '步频建议维持在170-180spm。可以每周加入1-2次高步频训练，使用节拍器辅助。注意步频提高时保持自然呼吸节奏。'
    if (q.includes('配速') || q.includes('pace') || q.includes('速度')) return '配速提升需要渐进原则：每周总距离增幅不超过10%。间歇跑（400m-800m重复）和节奏跑（20-40分钟阈值配速）是有效手段。'
    if (q.includes('心率') || q.includes('heart')) return '有氧基础训练心率建议维持在 zone2（130-150bpm）。高强度训练时心率可达 zone4-5，但每周高强度不超过总跑量的20%。'
    if (q.includes('恢复') || q.includes('recovery') || q.includes('休息')) return '恢复指数82，状态良好。建议每跑4-5天安排1天主动恢复（慢跑或交叉训练）。充足的睡眠和营养补充同样重要。'
    if (q.includes('呼吸') || q.includes('breath') || q.includes('喘')) return '推荐"三步一吸、两步一呼"的呼吸节奏。高强度时切换为"两步一吸、一步一呼"。保持腹式呼吸，避免浅胸式呼吸。'
    if (q.includes('拉伸') || q.includes('stretch') || q.includes('热身')) return '跑前动态热身：高抬腿、后踢腿、开合跳各30秒。跑后静态拉伸：重点放松小腿、股四头肌和髂胫束，每个动作保持20-30秒。'
    if (q.includes('膝盖') || q.includes('knee') || q.includes('受伤') || q.includes('injury')) return '跑步膝通常由股四头肌力量不足或跑量增加过快引起。建议：加强靠墙静蹲和单腿训练，控制周跑量增幅<10%，选择缓冲良好的跑鞋。'
    if (q.includes('跑鞋') || q.includes('shoe') || q.includes('装备')) return '跑鞋建议每600-800km更换。日常训练选择缓震型（如亚瑟士Nimbus系列），速度训练选择轻量竞速型。注意脚型选择：内翻/外翻对应支撑/缓震。'
    if (q.includes('马拉松') || q.includes('marathon') || q.includes('半马')) return '马拉松备赛周期通常16-20周。每周包含：1次间歇跑、1次节奏跑、1次长距离（LSD），其余为轻松跑。长距离每周递增不超过2km。赛前3周开始减量。'
    if (q.includes('补给') || q.includes('补') || q.includes('water') || q.includes('能量')) return '跑步超过60分钟需要补给。每20-30分钟补水100-150ml。长距离（90min+）每小时补充30-60g碳水化合物（能量胶或运动饮料）。'
    if (q.includes('力量') || q.includes('strength') || q.includes('核心')) return '每周安排2次力量训练对跑者有益：深蹲、弓步、硬拉锻炼下肢；平板支撑、鸟狗式锻炼核心。力量训练安排在跑后或单独日进行。'
    return '感谢提问！可以试试问关于：步频、配速、心率、恢复、呼吸、拉伸、膝盖保护、跑鞋选择、马拉松备赛、跑步补给、力量训练等方面的问题。'
  }

  const handleSend = async () => {
    const q = inputValue.trim()
    if (!q || asking) return
    setAsking(true)
    const result = await apiAskAi(token, q)
    if (result.ok) {
      setChatHistory(prev => [...prev, { q, a: result.data.answer }])
    } else {
      setChatHistory(prev => [...prev, { q, a: getLocalResponse(q) }])
    }
    setAsking(false)
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend()
  }

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
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.aicoach.askPlaceholder}
              className="flex-1 bg-transparent text-white text-[13px] outline-none placeholder:text-[#4a4a6a]"
            />
            <button onClick={handleSend} disabled={asking} className="text-neon p-1 disabled:opacity-40">
              {asking ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin text-neon"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" opacity="0.25"/><path d="M20 12a8 8 0 0 0-8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z" strokeLinejoin="round"/></svg>
              )}
            </button>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {[...chatHistory].reverse().map((item, i) => (
              <div key={chatHistory.length - i} className="bg-[#252540]/30 rounded-xl p-3">
                <div className="text-white text-[12px] font-medium mb-1"><span className="text-neon">Q: </span>{item.q}</div>
                <div className="text-[#a0a0b8] text-[12px]"><span className="text-accent-purple">A: </span>{item.a}</div>
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

function Profile({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const t = useT()
  const { lang, setLang } = useLang()
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  const progress = getProgress(session.id)
  const levelInfo = calcLevelProgress(progress.xp)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    if (standalone) {
      setInstalled(true)
      return
    }
    const onBip = (e: Event) => {
      e.preventDefault()
      setInstallEvt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installEvt) return
    await installEvt.prompt()
    const choice = await installEvt.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    setInstallEvt(null)
  }
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
              <h1 className="text-white text-[22px] font-bold tracking-tight">{session.displayName}</h1>
              <Badge color="#ffd60a">{t.profile.plusMember}</Badge>
            </div>
            <p className="text-[#a0a0b8] text-[13px] mt-0.5">{session.email}</p>
          </div>
        </div>

        {/* Level Progress */}
        <GlassCard className="p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-[13px] font-semibold">Lv.{progress.level} {t.profile.levelTitle(progress.level)}</span>
            <span className="text-[#6b6b8d] text-[11px]">{t.profile.nextLevel(progress.level + 1)}</span>
          </div>
          <div className="h-2 rounded-full bg-[#2a2a40] overflow-hidden mb-1">
            <motion.div initial={{ width: 0 }} animate={{ width: `${levelInfo.pct}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-neon to-accent-blue" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#6b6b8d]">
            <span>{t.profile.levelProgress.zero}</span>
            <span>{progress.xp} {t.profile.levelProgress.xp}</span>
            <span>{t.profile.runsCount(progress.runCount)}</span>
          </div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="stats-grid mb-5">
          {[
            { label: t.profile.statLabels.totalDist, value: '0', unit: t.units.km, color: '#00ff88', icon: '🏃' },
            { label: t.profile.statLabels.robotDist, value: '0', unit: t.units.km, color: '#4a9eff', icon: '🤖' },
            { label: t.profile.statLabels.streak, value: '0', unit: t.units.days, color: '#ffd60a', icon: '🔥' },
            { label: t.profile.statLabels.aiScore, value: '0', unit: t.home.outOf, color: '#8b5cf6', icon: '🧠' },
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
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {achievements.map(a => (
            <div key={a.id} className={`shrink-0 w-20 rounded-2xl p-3 text-center ${a.unlocked ? 'bg-neon/10 border border-neon/20' : 'bg-[#1a1a2e]/40 border border-[#2a2a40]/30 opacity-50'}`}>
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="text-white text-[10px] font-medium">{t.profile.achievementTitles[a.title] ?? a.title}</div>
            </div>
          ))}
        </div>

        {/* Equipment */}
        <SectionH title={t.profile.equipment} />
        <div className="space-y-2 mb-5">
          {[
            { name: 'Nike Vaporfly 3', type: t.profile.equipmentItems['Nike Vaporfly 3'].type, dist: `320${t.units.km}`, icon: '👟' },
            { name: 'Apple Watch Ultra 2', type: t.profile.equipmentItems['Apple Watch Ultra 2'].type, icon: '⌚' },
            { name: 'eos X1', type: t.profile.equipmentItems['eos X1'].type, dist: `320${t.units.km}`, icon: '🤖' },
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
          {installEvt && !installed && (
            <GlassCard className="p-3 flex items-center gap-3 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neon shrink-0"><path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <div className="flex-1 min-w-0">
                <div className="text-white text-[13px] font-medium">{t.profile.installApp}</div>
                <div className="text-[#6b6b8d] text-[11px] truncate">{t.profile.installHint}</div>
              </div>
              <button onClick={handleInstall} className="px-3 py-1.5 rounded-lg bg-neon text-[#0a0a0f] text-[12px] font-semibold active:scale-95 transition-transform">
                {t.profile.installApp}
              </button>
            </GlassCard>
          )}
          {installed && (
            <GlassCard className="p-3 flex items-center gap-3 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neon shrink-0"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="flex-1 text-white text-[13px] font-medium">{t.profile.installed}</span>
            </GlassCard>
          )}
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
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red py-3 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-accent-red/40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-accent-red" aria-hidden="true">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 17l-5-5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {t.profile.logout}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ─── Auth Screen ───────────────────────────────────────────

function AuthScreen({ onAuthed }: { onAuthed: (token: string, account: Session) => void }) {
  const t = useT()
  const { lang, setLang } = useLang()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const errorMsg = errorCode === null ? null : t.auth.errors[errorCode]
  const errorId = 'auth-error'
  const emailId = 'auth-email'
  const passwordId = 'auth-password'
  const nameId = 'auth-name'
  const isSignup = mode === 'signup'

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return
    setErrorCode(null)
    setSubmitting(true)
    try {
      const result = isSignup
        ? await apiSignUp(email, password, displayName)
        : await apiSignIn(email, password)
      if (result.ok) {
        saveSession(result.data.sessionToken, result.data.account)
        onAuthed(result.data.sessionToken, result.data.account)
      } else {
        setErrorCode(result.error as AuthErrorCode)
      }
    } catch {
      setErrorCode('network_error')
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setPassword('')
    setErrorCode(null)
  }

  return (
    <div className="relative w-full h-full bg-[#0a0a0f] overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center px-5 py-6">
        <motion.form
          onSubmit={handleSubmit}
          noValidate
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[360px] glass rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="w-12 h-9 rounded-lg overflow-hidden border border-white/10 bg-[#f7f4f0] shrink-0">
              <img src="/logo.png" alt="eos" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setLang('zh')}
                aria-pressed={lang === 'zh'}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${lang === 'zh' ? 'bg-neon/20 text-neon' : 'bg-[#252540]/50 text-[#a0a0b8]'}`}
              >
                {t.profile.langZh}
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${lang === 'en' ? 'bg-neon/20 text-neon' : 'bg-[#252540]/50 text-[#a0a0b8]'}`}
              >
                {t.profile.langEn}
              </button>
            </div>
          </div>

          <div className="mb-5">
            <div className="text-white text-[22px] font-bold tracking-tight">{t.auth.brandTitle}</div>
            <div className="text-[#a0a0b8] text-[12px] mt-1">{t.auth.brandSubtitle}</div>
          </div>

          <div className="flex gap-1 mb-4 bg-[#252540]/50 rounded-xl p-1">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              aria-pressed={mode === 'signin'}
              className={`flex-1 rounded-lg py-2 text-[12px] font-semibold transition-all ${mode === 'signin' ? 'bg-neon/20 text-neon' : 'text-[#a0a0b8]'}`}
            >
              {t.auth.signIn}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              aria-pressed={mode === 'signup'}
              className={`flex-1 rounded-lg py-2 text-[12px] font-semibold transition-all ${mode === 'signup' ? 'bg-neon/20 text-neon' : 'text-[#a0a0b8]'}`}
            >
              {t.auth.signUp}
            </button>
          </div>

          <div className="space-y-3">
            {isSignup && (
              <div>
                <label htmlFor={nameId} className="block text-[#a0a0b8] text-[11px] font-medium uppercase tracking-wide mb-1.5">
                  {t.auth.fields.name}
                </label>
                <input
                  id={nameId}
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setErrorCode(null) }}
                  aria-invalid={errorCode === 'invalid_display_name'}
                  aria-describedby={errorCode === 'invalid_display_name' ? errorId : undefined}
                  placeholder={t.auth.placeholders.name}
                  className="w-full bg-[#252540]/50 border border-[#2a2a40] rounded-xl px-4 py-2.5 text-white text-[13px] outline-none placeholder:text-[#4a4a6a] focus:border-neon/50 focus:ring-2 focus:ring-neon/20"
                />
              </div>
            )}
            <div>
              <label htmlFor={emailId} className="block text-[#a0a0b8] text-[11px] font-medium uppercase tracking-wide mb-1.5">
                {t.auth.fields.email}
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorCode(null) }}
                aria-invalid={errorCode === 'invalid_email' || errorCode === 'email_taken' || errorCode === 'invalid_credentials'}
                aria-describedby={errorCode === 'invalid_email' || errorCode === 'email_taken' || errorCode === 'invalid_credentials' ? errorId : undefined}
                placeholder={t.auth.placeholders.email}
                className="w-full bg-[#252540]/50 border border-[#2a2a40] rounded-xl px-4 py-2.5 text-white text-[13px] outline-none placeholder:text-[#4a4a6a] focus:border-neon/50 focus:ring-2 focus:ring-neon/20"
              />
            </div>
            <div>
              <label htmlFor={passwordId} className="block text-[#a0a0b8] text-[11px] font-medium uppercase tracking-wide mb-1.5">
                {t.auth.fields.password}
              </label>
              <input
                id={passwordId}
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorCode(null) }}
                aria-invalid={errorCode === 'invalid_password' || errorCode === 'invalid_credentials'}
                aria-describedby={errorCode === 'invalid_password' || errorCode === 'invalid_credentials' ? errorId : undefined}
                placeholder={t.auth.placeholders.password}
                className="w-full bg-[#252540]/50 border border-[#2a2a40] rounded-xl px-4 py-2.5 text-white text-[13px] outline-none placeholder:text-[#4a4a6a] focus:border-neon/50 focus:ring-2 focus:ring-neon/20"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={submitting}
            className="w-full mt-4 py-3 rounded-xl bg-neon text-[#0a0a0f] font-bold text-[15px] tracking-tight focus:outline-none focus:ring-2 focus:ring-neon/40 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? '…' : isSignup ? t.auth.submit.signUp : t.auth.submit.signIn}
          </motion.button>

          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            className={`mt-2 text-[12px] ${errorMsg === undefined || errorMsg === null ? 'invisible' : 'text-accent-red'}`}
          >
            {errorMsg ?? ' '}
          </div>

          <button
            type="button"
            onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
            className="w-full mt-3 text-[#a0a0b8] text-[12px] hover:text-neon transition-colors"
          >
            {isSignup ? t.auth.switch.toSignIn : t.auth.switch.toSignUp}
          </button>
        </motion.form>
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const account = getAccount()
    const t = getToken()
    return t && account ? account : null
  })
  const [token, setToken] = useState<string | null>(() => getToken())
  const [tab, setTab] = useState<Tab>('home')
  const inRun = false

  const [logoutConfirm, setLogoutConfirm] = useState(false)

  const handleStartTraining = () => setTab('run')

  const handleAuth = (newToken: string, account: Session) => {
    setToken(newToken)
    setSession(account)
  }

  const handleLogout = () => {
    clearSession()
    setToken(null)
    setSession(null)
    setTab('home')
    setLogoutConfirm(false)
  }

  if (session === null || token === null) {
    return <AuthScreen onAuthed={handleAuth} />
  }

  return (
    <div className="relative w-full h-full bg-[#0a0a0f] overflow-hidden">
      <PageWrap tab={tab}>
        {tab === 'home' && <Home session={session} token={token} onStartTraining={handleStartTraining} />}
        {tab === 'run' && <RunPage session={session} />}
        {tab === 'aicoach' && <AICoach token={token} />}
        {tab === 'robot' && <RobotPage />}
        {tab === 'profile' && <Profile session={session} onLogout={() => setLogoutConfirm(true)} />}
      </PageWrap>
      <NavBar active={tab} onChange={setTab} hidden={inRun} />
      {logoutConfirm && (
        <ConfirmDialog
          message="确定退出登录？"
          onConfirm={handleLogout}
          onCancel={() => setLogoutConfirm(false)}
        />
      )}
    </div>
  )
}
