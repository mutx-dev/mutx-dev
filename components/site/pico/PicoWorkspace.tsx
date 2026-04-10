'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import {
  PICO_LEVELS,
  PICO_LESSON_MAP,
  PICO_LESSONS,
  PICO_TRACKS,
} from '@/lib/pico/content'
import {
  PICO_PLAN_FEATURES,
  PICO_STORAGE_KEY,
  canAskTutorQuestion,
  completeLesson,
  countCompletedLessonsForTrack,
  createInitialWorkspaceState,
  ensureWorkspaceState,
  getNextLesson,
  getUnlockedLessons,
  queueApproval,
  recordManualRun,
  recordTutorQuestion,
  registerOfficeHours,
  resolveAlert,
  resolveApproval,
  setAlertChannel,
  setApprovalGateEnabled,
  setMonthlyBudget,
  setPlan,
  shareProject,
  startLesson,
  updateWorkspaceProfile,
  type PicoPlan,
  type PicoWorkspaceState,
} from '@/lib/pico/state'
import { answerTutorQuestion } from '@/lib/pico/tutor'

import styles from './PicoWorkspace.module.css'

type TabId = 'academy' | 'tutor' | 'autopilot' | 'support'

type TutorResponse = {
  answer: string
  recommendedLessonIds: string[]
  escalate: boolean
  escalationReason?: string
} | null

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'academy', label: 'Academy' },
  { id: 'tutor', label: 'Tutor' },
  { id: 'autopilot', label: 'Autopilot' },
  { id: 'support', label: 'Support' },
]

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not yet'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function trackLessonCount(trackId: string) {
  return PICO_LESSONS.filter((lesson) => lesson.trackId === trackId).length
}

export function PicoWorkspace() {
  const [state, setState] = useState<PicoWorkspaceState | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('academy')
  const [question, setQuestion] = useState('')
  const [tutorResponse, setTutorResponse] = useState<TutorResponse>(null)
  const [runSummary, setRunSummary] = useState('Verified a live run from the current lesson')
  const [runCost, setRunCost] = useState('1.5')
  const [budgetInput, setBudgetInput] = useState('25')
  const [approvalAction, setApprovalAction] = useState('Send an outbound lead follow-up')
  const [approvalReason, setApprovalReason] = useState('This touches a real user and should stop for a human yes.')
  const [workspaceName, setWorkspaceName] = useState('')
  const [agentName, setAgentName] = useState('')
  const [interfaceName, setInterfaceName] = useState('')
  const [focusTrackId, setFocusTrackId] = useState<'track-a' | 'track-b' | 'track-c' | 'track-d' | 'track-e'>('track-a')

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PICO_STORAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as PicoWorkspaceState) : null
      const nextState = ensureWorkspaceState(parsed)
      setState(nextState)
      setBudgetInput(String(nextState.autopilot.monthlyBudget))
      setWorkspaceName(nextState.workspaceName)
      setAgentName(nextState.autopilot.agentName)
      setInterfaceName(nextState.autopilot.interfaceName)
      setFocusTrackId(nextState.focusTrackId)
    } catch {
      const nextState = createInitialWorkspaceState()
      setState(nextState)
    }
  }, [])

  const persistState = (nextState: PicoWorkspaceState) => {
    setState(nextState)
    window.localStorage.setItem(PICO_STORAGE_KEY, JSON.stringify(nextState))
  }

  const resetWorkspace = () => {
    const nextState = createInitialWorkspaceState()
    persistState(nextState)
    setTutorResponse(null)
    setQuestion('')
    setBudgetInput(String(nextState.autopilot.monthlyBudget))
    setWorkspaceName(nextState.workspaceName)
    setAgentName(nextState.autopilot.agentName)
    setInterfaceName(nextState.autopilot.interfaceName)
    setFocusTrackId(nextState.focusTrackId)
  }

  const exportAudit = () => {
    if (!state) return
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'picomutx-audit.json'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const currentState = state ?? createInitialWorkspaceState()
  const nextLesson = getNextLesson(currentState)
  const unlockedLessons = getUnlockedLessons(currentState)
  const currentLevel = PICO_LEVELS.find((level) => level.id === currentState.currentLevelId) ?? PICO_LEVELS[0]
  const openAlerts = currentState.autopilot.alerts.filter((alert) => alert.status === 'open')
  const pendingApprovals = currentState.autopilot.approvals.filter((approval) => approval.status === 'pending')
  const completedLessonCount = currentState.completedLessonIds.length
  const lessonCompletionRate = Math.round((completedLessonCount / PICO_LESSONS.length) * 100)

  const recommendedLessons = useMemo(
    () => tutorResponse?.recommendedLessonIds.map((lessonId) => PICO_LESSON_MAP[lessonId]).filter(Boolean) ?? [],
    [tutorResponse],
  )

  const saveProfile = () => {
    if (!state) return
    persistState(
      updateWorkspaceProfile(state, {
        workspaceName,
        agentName,
        interfaceName,
        focusTrackId,
      }),
    )
  }

  const askTutor = () => {
    if (!state || !canAskTutorQuestion(state)) return
    const nextState = recordTutorQuestion(state)
    persistState(nextState)
    setTutorResponse(answerTutorQuestion(question, nextState))
  }

  if (!state) {
    return <div className={styles.loading}>Loading PicoMUTX workspace...</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>PicoMUTX beta workspace</p>
          <h1 className={styles.title}>Build one useful agent. Track it. Control it.</h1>
          <p className={styles.subtitle}>
            This is the narrow honest loop: academy, tutor, and a manual-first autopilot so you can stop operating blind.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/" className={styles.secondaryButton}>
            Back to landing
          </Link>
          <button className={styles.primaryButton} onClick={exportAudit} type="button">
            Export audit JSON
          </button>
        </div>
      </div>

      <section className={styles.heroGrid}>
        <div className={styles.heroCard}>
          <p className={styles.statLabel}>Workspace</p>
          <h2>{state.workspaceName}</h2>
          <p className={styles.muted}>Focused track: {PICO_TRACKS.find((track) => track.id === state.focusTrackId)?.title}</p>
          <div className={styles.statsRow}>
            <div>
              <span className={styles.statValue}>{state.xp}</span>
              <span className={styles.statLabel}>XP</span>
            </div>
            <div>
              <span className={styles.statValue}>{completedLessonCount}/{PICO_LESSONS.length}</span>
              <span className={styles.statLabel}>Lessons</span>
            </div>
            <div>
              <span className={styles.statValue}>{lessonCompletionRate}%</span>
              <span className={styles.statLabel}>Complete</span>
            </div>
          </div>
        </div>

        <div className={styles.heroCard}>
          <p className={styles.statLabel}>Current level</p>
          <h2>Level {currentLevel.id} — {currentLevel.title}</h2>
          <p className={styles.muted}>{currentLevel.objective}</p>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>{PICO_PLAN_FEATURES[state.plan].name}</span>
            {state.badges.map((badge) => (
              <span className={styles.badge} key={badge}>{badge}</span>
            ))}
          </div>
        </div>

        <div className={styles.heroCard}>
          <p className={styles.statLabel}>Next move</p>
          <h2>{nextLesson?.title ?? 'All lessons complete'}</h2>
          <p className={styles.muted}>{nextLesson?.validationStep ?? 'You have cleared the current path. Export the pattern and ship it.'}</p>
          <div className={styles.metaList}>
            <span>Runs logged: {state.autopilot.runCount}</span>
            <span>Open alerts: {openAlerts.length}</span>
            <span>Pending approvals: {pendingApprovals.length}</span>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.kicker}>Onboarding</p>
            <h2>Define the workspace once</h2>
          </div>
          <button className={styles.ghostButton} onClick={resetWorkspace} type="button">
            Reset workspace
          </button>
        </div>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Workspace name</span>
            <input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Agent name</span>
            <input value={agentName} onChange={(event) => setAgentName(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Primary interface</span>
            <input value={interfaceName} onChange={(event) => setInterfaceName(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Focus track</span>
            <select value={focusTrackId} onChange={(event) => setFocusTrackId(event.target.value as typeof focusTrackId)}>
              {PICO_TRACKS.map((track) => (
                <option key={track.id} value={track.id}>{track.title}</option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.inlineActions}>
          <button className={styles.primaryButton} onClick={saveProfile} type="button">
            Save workspace profile
          </button>
          <span className={styles.note}>State persists in this browser so you can keep moving without a full auth dependency.</span>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.kicker}>Plan gating</p>
            <h2>Internal plan flags, ready for billing later</h2>
          </div>
        </div>
        <div className={styles.planGrid}>
          {(Object.keys(PICO_PLAN_FEATURES) as PicoPlan[]).map((plan) => {
            const features = PICO_PLAN_FEATURES[plan]
            const active = state.plan === plan
            return (
              <button
                key={plan}
                className={`${styles.planCard} ${active ? styles.planCardActive : ''}`}
                onClick={() => persistState(setPlan(state, plan))}
                type="button"
              >
                <div className={styles.planHeader}>
                  <h3>{features.name}</h3>
                  {active ? <span className={styles.badge}>Active</span> : null}
                </div>
                <p>{features.note}</p>
                <ul>
                  <li>{features.maxTutorQuestions} tutor questions</li>
                  <li>{features.monitoredAgents} monitored agents</li>
                  <li>{features.retentionDays} day retention</li>
                  <li>{features.approvalGates} approval gates</li>
                </ul>
              </button>
            )
          })}
        </div>
      </section>

      <div className={styles.tabRow}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'academy' ? (
        <section className={styles.stack}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Level map</p>
                <h2>Progression with real artifacts</h2>
              </div>
            </div>
            <div className={styles.levelGrid}>
              {PICO_LEVELS.map((level) => (
                <article className={styles.levelCard} key={level.id}>
                  <p className={styles.levelIndex}>Level {level.id}</p>
                  <h3>{level.title}</h3>
                  <p>{level.objective}</p>
                  <ul>
                    <li>Outcome: {level.projectOutcome}</li>
                    <li>Completion: {level.completionState}</li>
                    <li>Reward: {level.xpReward} XP + {level.badge}</li>
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Tracks</p>
                <h2>Project-based paths</h2>
              </div>
            </div>
            <div className={styles.trackGrid}>
              {PICO_TRACKS.map((track) => {
                const completed = countCompletedLessonsForTrack(state, track.id)
                const total = trackLessonCount(track.id)
                return (
                  <article className={styles.trackCard} key={track.id}>
                    <div className={styles.trackHeader}>
                      <h3>{track.title}</h3>
                      <span className={styles.badge}>{completed}/{total}</span>
                    </div>
                    <p>{track.intro}</p>
                    <ul>
                      {track.checklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className={styles.note}>Next path: {track.nextRecommendedPath}</p>
                  </article>
                )
              })}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Lessons</p>
                <h2>12 shippable tutorials</h2>
              </div>
            </div>
            <div className={styles.lessonList}>
              {PICO_LESSONS.map((lesson) => {
                const isUnlocked = unlockedLessons.some((item) => item.id === lesson.id)
                const isStarted = state.startedLessonIds.includes(lesson.id)
                const isCompleted = state.completedLessonIds.includes(lesson.id)
                return (
                  <article className={styles.lessonCard} key={lesson.id}>
                    <div className={styles.lessonHeader}>
                      <div>
                        <p className={styles.kicker}>Level {lesson.levelId} — {PICO_TRACKS.find((track) => track.id === lesson.trackId)?.title}</p>
                        <h3>{lesson.title}</h3>
                      </div>
                      <div className={styles.badgeRow}>
                        <span className={styles.badge}>{lesson.duration}</span>
                        <span className={styles.badge}>{lesson.xpReward} XP</span>
                        <span className={styles.badge}>
                          {isCompleted ? 'Completed' : isStarted ? 'In progress' : isUnlocked ? 'Ready' : 'Locked'}
                        </span>
                      </div>
                    </div>
                    <p>{lesson.objective}</p>
                    <div className={styles.lessonMetaGrid}>
                      <div>
                        <h4>Expected result</h4>
                        <p>{lesson.expectedResult}</p>
                      </div>
                      <div>
                        <h4>Validation</h4>
                        <p>{lesson.validationStep}</p>
                      </div>
                      <div>
                        <h4>Artifact</h4>
                        <p>{lesson.artifact}</p>
                      </div>
                      <div>
                        <h4>Prerequisites</h4>
                        <p>{lesson.prerequisites.join(', ')}</p>
                      </div>
                    </div>
                    <div className={styles.lessonBodyGrid}>
                      <div>
                        <h4>Steps</h4>
                        <ol>
                          {lesson.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <h4>Troubleshooting</h4>
                        <ul>
                          {lesson.troubleshooting.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.secondaryButton}
                        disabled={!isUnlocked || isCompleted}
                        onClick={() => persistState(startLesson(state, lesson.id))}
                        type="button"
                      >
                        {isCompleted ? 'Completed' : isStarted ? 'Restart notes' : 'Start tutorial'}
                      </button>
                      <button
                        className={styles.primaryButton}
                        disabled={!isUnlocked || isCompleted}
                        onClick={() => persistState(completeLesson(state, lesson.id))}
                        type="button"
                      >
                        Mark complete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'tutor' ? (
        <section className={styles.stack}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Grounded tutor</p>
                <h2>Ask the product, not the void</h2>
              </div>
              <span className={styles.badge}>
                {PICO_PLAN_FEATURES[state.plan].maxTutorQuestions - state.tutorQuestionsUsed} questions left
              </span>
            </div>
            <p className={styles.note}>
              Tutor answers are grounded in the shipped PicoMUTX lessons. Risky questions escalate instead of bluffing.
            </p>
            <label className={styles.field}>
              <span>Your question</span>
              <textarea
                rows={5}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder='Example: Why does my VPS run die after I disconnect from SSH?'
              />
            </label>
            <div className={styles.inlineActions}>
              <button
                className={styles.primaryButton}
                disabled={!canAskTutorQuestion(state)}
                onClick={askTutor}
                type="button"
              >
                Ask tutor
              </button>
              <span className={styles.note}>
                If the question touches security, billing, or destructive actions, the tutor will tell you to escalate.
              </span>
            </div>
          </div>

          {tutorResponse ? (
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.kicker}>Tutor response</p>
                  <h2>{tutorResponse.escalate ? 'Human escalation recommended' : 'Do this next'}</h2>
                </div>
              </div>
              <p>{tutorResponse.answer}</p>
              {tutorResponse.escalationReason ? (
                <p className={styles.note}>Reason: {tutorResponse.escalationReason}</p>
              ) : null}
              {recommendedLessons.length > 0 ? (
                <div className={styles.recommendationGrid}>
                  {recommendedLessons.map((lesson) => (
                    <article className={styles.recommendationCard} key={lesson.id}>
                      <h3>{lesson.title}</h3>
                      <p>{lesson.validationStep}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'autopilot' ? (
        <section className={styles.stack}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Manual-first autopilot</p>
                <h2>Real event flow, no fake dashboard theater</h2>
              </div>
            </div>
            <p className={styles.note}>
              Beta mode uses manual run check-ins and explicit controls until the live agent connector is wired. That is slower than magic. It is also honest.
            </p>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Run summary</span>
                <input value={runSummary} onChange={(event) => setRunSummary(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Cost delta</span>
                <input value={runCost} onChange={(event) => setRunCost(event.target.value)} inputMode='decimal' />
              </label>
              <label className={styles.field}>
                <span>Monthly budget</span>
                <input value={budgetInput} onChange={(event) => setBudgetInput(event.target.value)} inputMode='decimal' />
              </label>
            </div>
            <div className={styles.inlineActions}>
              <button
                className={styles.primaryButton}
                onClick={() => persistState(recordManualRun(state, { summary: runSummary, costDelta: Number(runCost) }))}
                type='button'
              >
                Log run
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => persistState(setMonthlyBudget(state, Number(budgetInput)))}
                type='button'
              >
                Save threshold
              </button>
            </div>
            <div className={styles.metricsGrid}>
              <article className={styles.metricCard}>
                <span className={styles.statLabel}>Last activity</span>
                <strong>{formatDate(state.autopilot.lastActivityAt)}</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.statLabel}>Monthly usage</span>
                <strong>{state.autopilot.monthlyUsage.toFixed(2)}</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.statLabel}>Monthly budget</span>
                <strong>{state.autopilot.monthlyBudget.toFixed(2)}</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.statLabel}>Run count</span>
                <strong>{state.autopilot.runCount}</strong>
              </article>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Alerts and gates</p>
                <h2>Thresholds, channels, approvals</h2>
              </div>
            </div>
            <div className={styles.controlGrid}>
              <label className={styles.toggleRow}>
                <input
                  checked={state.autopilot.alertChannels.email}
                  onChange={(event) => persistState(setAlertChannel(state, 'email', event.target.checked))}
                  type='checkbox'
                />
                <span>Email alerts</span>
              </label>
              <label className={styles.toggleRow}>
                <input
                  checked={state.autopilot.alertChannels.webhook}
                  disabled={!PICO_PLAN_FEATURES[state.plan].webhookAlerts}
                  onChange={(event) => persistState(setAlertChannel(state, 'webhook', event.target.checked))}
                  type='checkbox'
                />
                <span>Webhook alerts {PICO_PLAN_FEATURES[state.plan].webhookAlerts ? '' : '(Pro only)'}</span>
              </label>
              <label className={styles.toggleRow}>
                <input
                  checked={state.autopilot.approvalGateEnabled}
                  disabled={PICO_PLAN_FEATURES[state.plan].approvalGates < 1}
                  onChange={(event) => persistState(setApprovalGateEnabled(state, event.target.checked))}
                  type='checkbox'
                />
                <span>Default risky-action approval gate</span>
              </label>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Risky action</span>
                <input value={approvalAction} onChange={(event) => setApprovalAction(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Why this needs approval</span>
                <input value={approvalReason} onChange={(event) => setApprovalReason(event.target.value)} />
              </label>
            </div>
            <div className={styles.inlineActions}>
              <button
                className={styles.secondaryButton}
                disabled={!state.autopilot.approvalGateEnabled}
                onClick={() => persistState(queueApproval(state, { action: approvalAction, reason: approvalReason }))}
                type='button'
              >
                Queue risky action
              </button>
            </div>

            <div className={styles.twoColumnGrid}>
              <div className={styles.listCard}>
                <h3>Open alerts</h3>
                {openAlerts.length === 0 ? <p className={styles.note}>No open alerts. Good. Keep it that way.</p> : null}
                {openAlerts.map((alert) => (
                  <div className={styles.timelineItem} key={alert.id}>
                    <div>
                      <strong>{alert.title}</strong>
                      <p>{alert.detail}</p>
                      <span className={styles.note}>{formatDate(alert.createdAt)} • {alert.severity}</span>
                    </div>
                    <button className={styles.ghostButton} onClick={() => persistState(resolveAlert(state, alert.id))} type='button'>
                      Resolve
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.listCard}>
                <h3>Pending approvals</h3>
                {pendingApprovals.length === 0 ? <p className={styles.note}>No approvals waiting.</p> : null}
                {pendingApprovals.map((approval) => (
                  <div className={styles.timelineItem} key={approval.id}>
                    <div>
                      <strong>{approval.action}</strong>
                      <p>{approval.reason}</p>
                      <span className={styles.note}>{formatDate(approval.createdAt)}</span>
                    </div>
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => persistState(resolveApproval(state, approval.id, 'approved'))}
                        type='button'
                      >
                        Approve
                      </button>
                      <button
                        className={styles.ghostButton}
                        onClick={() => persistState(resolveApproval(state, approval.id, 'denied'))}
                        type='button'
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Audit trail</p>
                <h2>Append-only event history</h2>
              </div>
            </div>
            <div className={styles.timeline}>
              {state.events.map((event) => (
                <article className={styles.timelineItem} key={event.id}>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                    <span className={styles.note}>{formatDate(event.createdAt)}</span>
                  </div>
                  <div className={styles.eventMeta}>
                    <span>{event.kind}</span>
                    {event.xpDelta ? <span>+{event.xpDelta} XP</span> : null}
                    {typeof event.costDelta === 'number' && event.costDelta > 0 ? <span>+{event.costDelta.toFixed(2)} cost</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'support' ? (
        <section className={styles.stack}>
          <div className={styles.twoColumnGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.kicker}>Support lanes</p>
                  <h2>Agent help without community fluff</h2>
                </div>
              </div>
              <ul className={styles.supportList}>
                <li>Use the grounded tutor for exact next steps tied to lessons.</li>
                <li>Use manual telemetry to record what changed before asking for help.</li>
                <li>Escalate destructive, legal, billing, or security issues to a human immediately.</li>
              </ul>
              <div className={styles.inlineActions}>
                <button className={styles.secondaryButton} onClick={() => persistState(registerOfficeHours(state))} type='button'>
                  {state.officeHoursRegistered ? 'Office hours booked' : 'Book office hours'}
                </button>
                <button className={styles.primaryButton} onClick={() => persistState(shareProject(state))} type='button'>
                  {state.projectShared ? 'Project shared' : 'Share project pattern'}
                </button>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.kicker}>Human escalation</p>
                  <h2>Use a human when the blast radius is real</h2>
                </div>
              </div>
              <p className={styles.note}>
                Include the exact command, environment, error, last known good state, and what you already tried. Anything less is a treasure hunt.
              </p>
              <div className={styles.inlineActions}>
                <Link href='https://mutx.dev/contact' className={styles.primaryButton} target='_blank'>
                  Escalate to human support
                </Link>
                <Link href='/' className={styles.secondaryButton}>
                  Return to Pico landing
                </Link>
              </div>
            </article>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.kicker}>Release notes</p>
                <h2>What this beta already ships</h2>
              </div>
            </div>
            <div className={styles.recommendationGrid}>
              <article className={styles.recommendationCard}>
                <h3>Academy core</h3>
                <p>Seven levels, five tracks, and twelve tutorials with outcomes, validation, and troubleshooting.</p>
              </article>
              <article className={styles.recommendationCard}>
                <h3>Grounded tutor</h3>
                <p>Tutor answers are lesson-grounded and risk-aware. It escalates instead of hallucinating courage.</p>
              </article>
              <article className={styles.recommendationCard}>
                <h3>Autopilot beta</h3>
                <p>Manual telemetry, budget thresholds, alerts, approvals, and exportable audit history.</p>
              </article>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
