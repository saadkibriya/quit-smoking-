import React, { useState } from 'react';
import { UserPlan, Entry, ChatMessage, OtherHabit } from '../../types';
import { Sound } from '../../data/sound';
import { Storage } from '../../data/storage';
import { WHO_MEDICINES, DOCTOR_SAFETY_CHECKLIST, RED_FLAG_CRISIS_ALERTS, DISCLAIMER_FOOTER } from '../../content/doctorContent';
import { SYMPTOM_CARDS, DAY_BY_DAY_GUIDE, getNormalGuideForDay } from '../../content/withdrawalGuide';
import { ACADEMIC_SOURCES } from '../../content/sources';
import { calculateDependenceScore, calculateCurrentStreak, calculateSmokeFreeDays, toLocalDateString } from '../../domain/calculations';
import { getToneMessage } from '../../domain/rulesEngine';
import { askGeminiCoach } from '../../domain/aiCoach';
import { generateCharacterCertificateMarkdown } from '../../domain/markdownReport';
import {
  Sun,
  Moon,
  Laptop,
  ShieldAlert,
  RotateCcw,
  BookOpen,
  MessageSquare,
  Sparkles,
  ListTodo,
  Activity,
  HeartPulse,
  Apple,
  Bed,
  Settings,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  Database,
  Trash2,
  Phone,
  FileText,
  Lock,
  Plus,
  Send,
  Sliders,
  Award,
  Key,
  Check,
} from 'lucide-react';

interface ToolkitTabProps {
  plan: UserPlan;
  entries: Entry[];
  chatMessages: ChatMessage[];
  currentTheme: 'DAY' | 'NIGHT';
  onUpdatePlan: (plan: UserPlan) => void;
  onOpenSos: () => void;
  onOpenSlipRecovery: () => void;
  onRedoOnboarding: () => void;
  onSaveChatMessage: (msg: ChatMessage) => void;
  onClearChat: () => void;
  onOpenWidgetSimulator: () => void;
}

export const ToolkitTab: React.FC<ToolkitTabProps> = ({
  plan,
  entries,
  chatMessages,
  currentTheme,
  onUpdatePlan,
  onOpenSos,
  onOpenSlipRecovery,
  onRedoOnboarding,
  onSaveChatMessage,
  onClearChat,
  onOpenWidgetSimulator,
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Coach chat state
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [weeklyReviewText, setWeeklyReviewText] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState(plan.geminiApiKey || '');
  const [showKeySaved, setShowKeySaved] = useState(false);

  // Health / Doctor notes state
  const [doctorPhone, setDoctorPhone] = useState(plan.supportContact.phone || '');
  const [supportName, setSupportName] = useState(plan.supportContact.name || '');

  // Labs other habit state
  const [otherHabits, setOtherHabits] = useState<OtherHabit[]>(() => Storage.getOtherHabits());
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitUnit, setNewHabitUnit] = useState('');

  // Erase data confirmation
  const [eraseStep, setEraseStep] = useState<0 | 1 | 2>(0);

  const now = Date.now();
  const streak = calculateCurrentStreak(entries, plan.quitStartDate, now);
  const smokeFree = calculateSmokeFreeDays(entries, plan.quitStartDate, now);
  const depScore = calculateDependenceScore(plan.usualPerDay, plan.timeToFirstCigarette);
  const normalGuide = getNormalGuideForDay(smokeFree.completedSmokeFreeDays);

  const toggleSection = (id: string) => {
    Sound.tick();
    setActiveSection(activeSection === id ? null : id);
  };

  // Chat with Gemini coach (capable of updating plan and tracking data!)
  const handleSendCoach = async () => {
    if (!coachInput.trim() || coachLoading) return;

    Sound.tick();
    const userText = coachInput.trim();
    setCoachInput('');

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: Date.now(),
    };
    onSaveChatMessage(userMsg);

    setCoachLoading(true);

    try {
      const coachResp = await askGeminiCoach({
        userMessage: userText,
        plan,
        entries,
        chatHistory: chatMessages,
        userApiKey: plan.geminiApiKey,
      });

      // If AI coach modified plan (e.g. quit date, pack price, triggers, currency)
      if (coachResp.suggestedPlanUpdates) {
        const updated = { ...plan, ...coachResp.suggestedPlanUpdates };
        onUpdatePlan(updated);
        Storage.savePlan(updated);
      }

      onSaveChatMessage({
        id: `msg_reply_${Date.now()}`,
        sender: 'coach',
        text: coachResp.reply,
        timestamp: Date.now(),
        isSafetyAlert: coachResp.isSafetyAlert,
      });
    } catch (err: any) {
      onSaveChatMessage({
        id: `msg_reply_${Date.now()}`,
        sender: 'coach',
        text: 'I hear you. Take a slow, deep breath. Every craving peaks and passes in 3-5 minutes. You are in control.',
        timestamp: Date.now(),
      });
    } finally {
      setCoachLoading(false);
    }
  };

  // Generate weekly review
  const handleGenerateWeeklyReview = async () => {
    Sound.tick();
    setCoachLoading(true);
    try {
      if (plan.aiCoachEnabled) {
        const res = await fetch('/api/gemini/weekly-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coachStyle: plan.coachStyle,
            summaryJson: {
              streakDays: streak.days,
              smokeFreeDays: smokeFree.completedSmokeFreeDays,
              usualPerDay: plan.usualPerDay,
              triggers: plan.triggers,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setWeeklyReviewText(data.review);
          setCoachLoading(false);
          return;
        }
      }
      setWeeklyReviewText(
        `This week you locked in ${smokeFree.completedSmokeFreeDays} smoke-free days. Your top trigger is ${plan.triggers[0] || 'stress'}. Practice your if-then replacement whenever you feel that first morning urge. You are building lasting neural freedom.`
      );
    } catch {
      setWeeklyReviewText(
        `Strong effort this week. You preserved ${smokeFree.completedSmokeFreeDays} smoke-free days and prevented hundreds of toxic chemicals from entering your lungs. Keep your if-then plan ready for upcoming weekend social cues.`
      );
    } finally {
      setCoachLoading(false);
    }
  };

  // Export / Import
  const handleExportMarkdownCertificate = () => {
    Sound.celebrate();
    const md = generateCharacterCertificateMarkdown({
      plan,
      entries,
      attempts: Storage.getAttempts(),
      badges: Storage.getBadges(),
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Unlit_Character_Certificate_${toLocalDateString(Date.now())}.md`;
    a.click();
  };

  const handleExportJson = () => {
    Sound.tick();
    const data = Storage.exportJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unlit_backup_${toLocalDateString(Date.now())}.json`;
    a.click();
  };

  const handleExportCsv = () => {
    Sound.tick();
    const data = Storage.exportCsv();
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unlit_entries_${toLocalDateString(Date.now())}.csv`;
    a.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = Storage.importJson(content);
        if (success) {
          Sound.celebrate();
          alert('Data imported successfully!');
        } else {
          alert('Could not parse backup file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-28 px-4 pt-3">
      {/* 1. Theme Selector (Day / Night / Auto) */}
      <div className="p-4 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-black dark:text-white block">
            Theme Preference
          </span>
          <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
            Strict solid monochrome (No wallpaper colors)
          </span>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full bg-[#E2E2E2] dark:bg-[#262626]">
          {[
            { id: 'DAY', label: 'Day', icon: <Sun className="w-3.5 h-3.5" /> },
            { id: 'NIGHT', label: 'Night', icon: <Moon className="w-3.5 h-3.5" /> },
            { id: 'AUTO', label: 'Auto', icon: <Laptop className="w-3.5 h-3.5" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                Sound.tick();
                onUpdatePlan({ ...plan, themePreference: t.id as any });
              }}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition ${
                plan.themePreference === t.id
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-[#5E5E5E] dark:text-[#A6A6A6]'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. HELP NOW Group */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] px-1">
          Help Now
        </h3>

        <div className="rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] overflow-hidden divide-y divide-[#C4C4C4] dark:divide-[#3D3D3D]">
          {/* Craving SOS Trigger */}
          <button
            onClick={() => {
              Sound.tick();
              onOpenSos();
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E2E2E2] dark:hover:bg-[#262626] transition"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-black dark:text-white" />
              <div>
                <span className="text-xs font-bold text-black dark:text-white block">
                  Craving SOS
                </span>
                <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                  Urge wave timer, paced breathing, and 6 coping tools
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#5E5E5E] dark:text-[#A6A6A6]" />
          </button>

          {/* Slip Recovery Trigger */}
          <button
            onClick={() => {
              Sound.tick();
              onOpenSlipRecovery();
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E2E2E2] dark:hover:bg-[#262626] transition"
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-black dark:text-white" />
              <div>
                <span className="text-xs font-bold text-black dark:text-white block">
                  Slip Recovery
                </span>
                <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                  Log without shame; your smoke-free days still count
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#5E5E5E] dark:text-[#A6A6A6]" />
          </button>

          {/* What's Normal Today Accordion */}
          <div>
            <button
              onClick={() => toggleSection('normal_guide')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E2E2E2] dark:hover:bg-[#262626] transition"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-black dark:text-white" />
                <div>
                  <span className="text-xs font-bold text-black dark:text-white block">
                    What's Normal Today
                  </span>
                  <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Day-by-day withdrawal guide ({normalGuide.phaseLabel})
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#5E5E5E] dark:text-[#A6A6A6] transition-transform ${
                  activeSection === 'normal_guide' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeSection === 'normal_guide' && (
              <div className="p-4 bg-[#FFFFFF] dark:bg-[#000000] border-t border-[#C4C4C4] dark:border-[#3D3D3D] space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
                  <p className="font-bold text-black dark:text-white">
                    Current Phase: {normalGuide.phaseLabel}
                  </p>
                  <p className="text-[#5E5E5E] dark:text-[#A6A6A6] mt-1">
                    {normalGuide.whatsCommon}
                  </p>
                  <p className="italic text-black dark:text-white mt-1.5 font-medium">
                    "{normalGuide.whatToTellYourself}"
                  </p>
                </div>

                <p className="font-bold text-black dark:text-white mt-2">12 Valid Symptoms Reference:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {SYMPTOM_CARDS.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl border border-[#C4C4C4] dark:border-[#3D3D3D]"
                    >
                      <span className="font-bold text-black dark:text-white block">
                        {s.name}
                      </span>
                      <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
                        {s.typicalCourse}
                      </p>
                      <p className="text-[11px] text-black dark:text-white mt-1">
                        <span className="font-semibold">Tip:</span> {s.tip}
                      </p>
                      {s.seeDoctorIf && (
                        <p className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5 font-medium">
                          See doctor if: {s.seeDoctorIf}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. COACH Group */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] px-1">
          Coach (Mentor Mode)
        </h3>

        <div className="rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] overflow-hidden divide-y divide-[#C4C4C4] dark:divide-[#3D3D3D]">
          {/* Talk to Coach Accordion */}
          <div>
            <button
              onClick={() => toggleSection('coach_chat')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E2E2E2] dark:hover:bg-[#262626] transition"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-black dark:text-white" />
                <div>
                  <span className="text-xs font-bold text-black dark:text-white block">
                    Talk to Your Coach
                  </span>
                  <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Warm, motivational interviewing style ({plan.coachStyle})
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#5E5E5E] dark:text-[#A6A6A6] transition-transform ${
                  activeSection === 'coach_chat' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeSection === 'coach_chat' && (
              <div className="p-4 bg-[#FFFFFF] dark:bg-[#000000] border-t border-[#C4C4C4] dark:border-[#3D3D3D] space-y-3">
                {/* Chat Message Thread */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {chatMessages.length === 0 ? (
                    <div className="p-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
                      "Hi! I'm your Unlit coach. Ask me for a fast craving distraction, how to handle after-meal urges, or just say how today is going."
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                          msg.sender === 'user'
                            ? 'ml-auto bg-black text-white dark:bg-white dark:text-black font-medium'
                            : msg.isSafetyAlert
                            ? 'bg-red-100 dark:bg-red-950/50 border border-red-500 text-black dark:text-white font-bold'
                            : 'bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white'
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))
                  )}
                  {coachLoading && (
                    <div className="text-[11px] font-mono text-[#5E5E5E] dark:text-[#A6A6A6] animate-pulse">
                      Coach is reflecting...
                    </div>
                  )}
                </div>

                {/* Input row */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Ask coach or say 'I quit 3 days ago'..."
                    value={coachInput}
                    onChange={(e) => setCoachInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCoach()}
                    className="flex-1 h-11 px-3.5 rounded-full bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs text-black dark:text-white"
                  />
                  <button
                    onClick={handleSendCoach}
                    disabled={!coachInput.trim() || coachLoading}
                    className="w-11 h-11 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-40 active:scale-95 transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Gemini API Key inline configuration */}
                <div className="p-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-black dark:text-white flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      Gemini API Key (Optional for Cloud AI)
                    </span>
                    {showKeySaved && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved!
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Paste Gemini API Key (starts with AIza...)"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-[11px] font-mono text-black dark:text-white"
                    />
                    <button
                      onClick={() => {
                        Sound.celebrate();
                        const updated = { ...plan, geminiApiKey: apiKeyInput.trim() || undefined };
                        onUpdatePlan(updated);
                        Storage.savePlan(updated);
                        setShowKeySaved(true);
                        setTimeout(() => setShowKeySaved(false), 3000);
                      }}
                      className="px-3 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold shrink-0 active:scale-95 transition"
                    >
                      Save Key
                    </button>
                  </div>
                  <p className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Stored locally in your device's private storage. Enables the AI coach to chat, monitor your progress, and adjust your plan on voice/text request.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => {
                      Sound.tick();
                      onClearChat();
                    }}
                    className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] underline hover:text-black dark:hover:text-white"
                  >
                    Clear chat history
                  </button>
                  <span className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Autonomous AI Coach Â· Can update your plan
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Weekly Review Trigger */}
          <div>
            <button
              onClick={() => toggleSection('weekly_review')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E2E2E2] dark:hover:bg-[#262626] transition"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-black dark:text-white" />
                <div>
                  <span className="text-xs font-bold text-black dark:text-white block">
                    Weekly Review
                  </span>
                  <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    4-5 sentences: wins, patterns, tip, and an if-then plan
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#5E5E5E] dark:text-[#A6A6A6] transition-transform ${
                  activeSection === 'weekly_review' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeSection === 'weekly_review' && (
              <div className="p-4 bg-[#FFFFFF] dark:bg-[#000000] border-t border-[#C4C4C4] dark:border-[#3D3D3D] space-y-3 text-xs">
                {weeklyReviewText ? (
                  <div className="p-3.5 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] text-black dark:text-white space-y-2">
                    <p className="font-medium leading-relaxed">{weeklyReviewText}</p>
                  </div>
                ) : (
                  <p className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Ready to generate your personal reflection for this week?
                  </p>
                )}

                <button
                  onClick={handleGenerateWeeklyReview}
                  disabled={coachLoading}
                  className="w-full h-11 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold text-xs active:scale-95 transition"
                >
                  {weeklyReviewText ? 'Regenerate Weekly Review' : 'Generate Weekly Review'}
                </button>
              </div>
            )}
          </div>

          {/* If-Then Plans Accordion */}
          <div>
            <button
              onClick={() => toggleSection('if_then')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E2E2E2] dark:hover:bg-[#262626] transition"
            >
              <div className="flex items-center gap-3">
                <ListTodo className="w-5 h-5 text-black dark:text-white" />
                <div>
                  <span className="text-xs font-bold text-black dark:text-white block">
                    My If-Then Plans
                  </span>
                  <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Implementation intentions for your top triggers
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#5E5E5E] dark:text-[#A6A6A6] transition-transform ${
                  activeSection === 'if_then' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeSection === 'if_then' && (
              <div className="p-4 bg-[#FFFFFF] dark:bg-[#000000] border-t border-[#C4C4C4] dark:border-[#3D3D3D] space-y-2 text-xs">
                {(plan.ifThenPlans || []).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block">
                      Trigger: {p.trigger.replace(/_/g, ' ')}
                    </span>
                    <p className="font-semibold text-black dark:text-white mt-0.5">
                      {p.action}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. HEALTH Group (Doctor Mode) */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] px-1">
          Health & Doctor Corner
        </h3>

        <div className="rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] overflow-hidden divide-y divide-[#C4C4C4] dark:divide-[#3D3D3D]">
          {/* Doctor Corner */}
          <div>
            <button
              onClick={() => toggleSection('doctor_corner')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E2E2E2] dark:hover:bg-[#262626] transition"
            >
              <div className="flex items-center gap-3">
                <HeartPulse className="w-5 h-5 text-black dark:text-white" />
                <div>
                  <span className="text-xs font-bold text-black dark:text-white block">
                    Doctor Corner & WHO Medicines
                  </span>
                  <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Approved medications, drug warnings & quitlines
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#5E5E5E] dark:text-[#A6A6A6] transition-transform ${
                  activeSection === 'doctor_corner' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeSection === 'doctor_corner' && (
              <div className="p-4 bg-[#FFFFFF] dark:bg-[#000000] border-t border-[#C4C4C4] dark:border-[#3D3D3D] space-y-4 text-xs">
                {/* WHO Medications */}
                <div>
                  <h4 className="font-bold text-black dark:text-white mb-2">
                    WHO 2024 Approved Cessation Medicines:
                  </h4>
                  <div className="space-y-2">
                    {WHO_MEDICINES.map((med) => (
                      <div
                        key={med.name}
                        className="p-3 rounded-2xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-black dark:text-white">
                            {med.name}
                          </span>
                          <span className="text-[10px] font-mono border border-current px-2 py-0.5 rounded-full">
                            Evidence: {med.evidenceCert}
                          </span>
                        </div>
                        <p className="text-[#5E5E5E] dark:text-[#A6A6A6] mt-1">{med.description}</p>
                        <p className="text-[11px] font-medium text-black dark:text-white mt-1">
                          {med.whoNote}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CYP1A2 & Safety Checklist */}
                <div className="p-3.5 rounded-2xl bg-[#E2E2E2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D]">
                  <h4 className="font-bold text-black dark:text-white mb-1">
                    Talk to a doctor or pharmacist if:
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    {DOCTOR_SAFETY_CHECKLIST.map((chk, i) => (
                      <li key={i}>
                        <span className="font-bold text-black dark:text-white">â€¢ {chk.condition}: </span>
                        <span>{chk.guidance}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Red Flags Alert */}
                <div className="p-3.5 rounded-2xl border-2 border-black dark:border-white">
                  <h4 className="font-bold text-black dark:text-white mb-1">
                    Emergency Medical Red Flags (Get Help Immediately):
                  </h4>
                  <ul className="space-y-1 text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    {RED_FLAG_CRISIS_ALERTS.map((alert, i) => (
                      <li key={i}>! {alert}</li>
                    ))}
                  </ul>
                </div>

                {/* Saved Contact numbers */}
                <div className="pt-2">
                  <p className="font-bold text-black dark:text-white mb-2">
                    My Saved Doctor / Quitline Number:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Doctor or support phone..."
                      value={doctorPhone}
                      onChange={(e) => setDoctorPhone(e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs text-black dark:text-white font-mono"
                    />
                    <button
                      onClick={() => {
                        Sound.tick();
                        onUpdatePlan({
                          ...plan,
                          supportContact: { name: supportName || 'Doctor/Support', phone: doctorPhone },
                        });
                        alert('Phone saved!');
                      }}
                      className="px-4 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-center text-[#5E5E5E] dark:text-[#A6A6A6] pt-1">
                  {DISCLAIMER_FOOTER}
                </p>
              </div>
            )}
          </div>

          {/* Hunger & Weight Tips */}
          <div>
            <button
              onClick={() => toggleSection('hunger_tips')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E2E2E2] dark:hover:bg-[#262626] transition"
            >
              <div className="flex items-center gap-3">
                <Apple className="w-5 h-5 text-black dark:text-white" />
                <div>
                  <span className="text-xs font-bold text-black dark:text-white block">
                    Hunger & Weight Management
                  </span>
                  <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Clinical evidence from Aubin 2012 BMJ
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#5E5E5E] dark:text-[#A6A6A6] transition-transform ${
                  activeSection === 'hunger_tips' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeSection === 'hunger_tips' && (
              <div className="p-4 bg-[#FFFFFF] dark:bg-[#000000] border-t border-[#C4C4C4] dark:border-[#3D3D3D] space-y-2 text-xs">
                <p className="font-semibold text-black dark:text-white">
                  Normal Biological Course:
                </p>
                <p className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                  Aubin et al. 2012 (BMJ meta-analysis) found untreated quitters gain 4.67 kg on average at 12 months (1.12 kg at 1 month, 2.85 kg at 3 months). 16% lose weight, and 13% gain over 10 kg.
                </p>
                <p className="font-bold text-black dark:text-white mt-2">Doctor's Perspective:</p>
                <p className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                  Gaining a few kilograms carries a negligible fraction of the cardiovascular danger of smoking. Never postpone quitting over weight worries.
                </p>
                <p className="font-semibold text-black dark:text-white mt-1">Practical Tactics:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[#5E5E5E] dark:text-[#A6A6A6]">
                  <li>Hydrate with ice water when oral cravings hit.</li>
                  <li>Prepare crunchy, low-calorie substitutes (celery, carrots, sunflower seeds).</li>
                  <li>Daily light walking accelerates metabolic resting rate.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Sleep Tips */}
          <div>
            <button
              onClick={() => toggleSection('sleep_tips')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#E2E2E2] dark:hover:bg-[#262626] transition"
            >
              <div className="flex items-center gap-3">
                <Bed className="w-5 h-5 text-black dark:text-white" />
                <div>
                  <span className="text-xs font-bold text-black dark:text-white block">
                    Sleep & Dream Tips
                  </span>
                  <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Handling vivid dreams and sleep latency
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#5E5E5E] dark:text-[#A6A6A6] transition-transform ${
                  activeSection === 'sleep_tips' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {activeSection === 'sleep_tips' && (
              <div className="p-4 bg-[#FFFFFF] dark:bg-[#000000] border-t border-[#C4C4C4] dark:border-[#3D3D3D] space-y-2 text-xs">
                <p className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                  Vivid dreams about smoking are an established psychological sign of withdrawal. They do not mean you will smoke in waking life.
                </p>
                <p className="font-semibold text-black dark:text-white">Caffeine interaction:</p>
                <p className="text-[#5E5E5E] dark:text-[#A6A6A6]">
                  Nicotine accelerates caffeine breakdown. Once you stop smoking, a regular cup of coffee remains in your bloodstream twice as long. Cut afternoon caffeine to restore normal REM sleep.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. MY PLAN & ONBOARDING RESET */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] px-1">
          My Plan & Configuration
        </h3>

        <div className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#5E5E5E] dark:text-[#A6A6A6] block">Mode:</span>
              <span className="font-bold text-black dark:text-white">{plan.mode}</span>
            </div>
            <div>
              <span className="text-[#5E5E5E] dark:text-[#A6A6A6] block">Quit Date:</span>
              <span className="font-bold text-black dark:text-white">
                {new Date(plan.quitStartDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[#5E5E5E] dark:text-[#A6A6A6] block">Baseline per day:</span>
              <span className="font-bold text-black dark:text-white">{plan.usualPerDay} cigarettes</span>
            </div>
            <div>
              <span className="text-[#5E5E5E] dark:text-[#A6A6A6] block">Pack price:</span>
              <span className="font-bold text-black dark:text-white">
                {plan.currency}{plan.packPrice} ({plan.cigarettesPerPack}/pack)
              </span>
            </div>
            <div>
              <span className="text-[#5E5E5E] dark:text-[#A6A6A6] block">Dependence Score:</span>
              <span className="font-bold text-black dark:text-white">{depScore.label}</span>
            </div>
            <div>
              <span className="text-[#5E5E5E] dark:text-[#A6A6A6] block">Coach Style:</span>
              <span className="font-bold text-black dark:text-white">{plan.coachStyle}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                Sound.tick();
                onRedoOnboarding();
              }}
              className="w-full h-11 rounded-full border border-[#C4C4C4] dark:border-[#3D3D3D] text-xs font-semibold text-black dark:text-white hover:bg-[#E2E2E2] dark:hover:bg-[#262626] transition active:scale-95"
            >
              Redo Onboarding Questionnaire
            </button>
          </div>
        </div>
      </section>

      {/* 6. HOME-SCREEN WIDGET SIMULATOR TRIGGER */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] px-1">
          Android Home-Screen Widgets
        </h3>

        <div className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] space-y-2">
          <p className="text-xs text-[#5E5E5E] dark:text-[#A6A6A6]">
            Unlit features 8+ standalone Glance widgets. Preview and test quick logging and timers in the interactive launcher sandbox:
          </p>
          <button
            onClick={() => {
              Sound.tick();
              onOpenWidgetSimulator();
            }}
            className="w-full h-11 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold text-xs active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <Sliders className="w-4 h-4" />
            <span>Open Home-Screen Widget Simulator</span>
          </button>
        </div>
      </section>

      {/* 7. ADVANCED (Collapsed by default) */}
      <section className="space-y-2">
        <button
          onClick={() => {
            Sound.tick();
            setAdvancedOpen(!advancedOpen);
          }}
          className="w-full p-4 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-black dark:text-white" />
            <div>
              <span className="text-xs font-bold text-black dark:text-white block">
                Advanced Settings & Data
              </span>
              <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                Backup, export/import, demo data, and Labs
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#5E5E5E] dark:text-[#A6A6A6] transition-transform ${
              advancedOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {advancedOpen && (
          <div className="p-5 rounded-3xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D] space-y-4 text-xs animate-in fade-in duration-150">
            {/* Export and Import */}
            <div>
              <span className="font-bold text-black dark:text-white block mb-1">
                Data Portability & Character Dossier
              </span>
              <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mb-2.5">
                Export your full progress dossier in Markdown (.md) to share with external AI models (ChatGPT, Claude, Gemini) or download raw JSON/CSV backups.
              </p>

              {/* Character Certificate Export Button */}
              <button
                onClick={handleExportMarkdownCertificate}
                className="w-full h-11 px-4 mb-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-[11px] flex items-center justify-center gap-2 active:scale-95 transition shadow-xs"
              >
                <Award className="w-4 h-4" />
                <span>Export Character Certificate (.md Report)</span>
              </button>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={handleExportJson}
                  className="h-10 px-3 rounded-xl border border-[#C4C4C4] dark:border-[#3D3D3D] font-semibold text-[11px] flex items-center justify-center gap-1.5 hover:bg-[#F2F2F2] dark:hover:bg-[#141414]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  className="h-10 px-3 rounded-xl border border-[#C4C4C4] dark:border-[#3D3D3D] font-semibold text-[11px] flex items-center justify-center gap-1.5 hover:bg-[#F2F2F2] dark:hover:bg-[#141414]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="mt-2">
                <label className="w-full h-10 px-3 rounded-xl border border-dashed border-[#C4C4C4] dark:border-[#3D3D3D] font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#F2F2F2] dark:hover:bg-[#141414]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import JSON Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* AI Coach Privacy & Settings */}
            <div className="pt-2 border-t border-[#C4C4C4] dark:border-[#3D3D3D]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-black dark:text-white block">
                    Gemini AI Coach
                  </span>
                  <span className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    Runs on Spark free-tier; offline fallback always active
                  </span>
                </div>
                <button
                  onClick={() => {
                    Sound.tick();
                    onUpdatePlan({ ...plan, aiCoachEnabled: !plan.aiCoachEnabled });
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    plan.aiCoachEnabled ? 'bg-black dark:bg-white' : 'bg-[#C4C4C4] dark:bg-[#3D3D3D]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white dark:bg-black absolute top-1 transition-transform ${
                      plan.aiCoachEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* What Coach Sees JSON Inspector */}
              <div className="mt-2 p-3 rounded-xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] block mb-1">
                  What the coach sees (Strict telemetry minimum):
                </span>
                <pre className="text-[9px] font-mono text-black dark:text-white overflow-x-auto">
                  {JSON.stringify(
                    {
                      mode: plan.mode,
                      streakDays: streak.days,
                      smokeFreeDaysTotal: smokeFree.completedSmokeFreeDays,
                      topTriggers: plan.triggers,
                      reasons: plan.reasons,
                      coachStyle: plan.coachStyle,
                    },
                    null,
                    2
                  )}
                </pre>
                <p className="text-[9px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-1">
                  Never sent: your name, photos, contacts, notes or health answers.
                </p>
              </div>
            </div>

            {/* Labs: Track another habit */}
            <div className="pt-2 border-t border-[#C4C4C4] dark:border-[#3D3D3D]">
              <span className="font-bold text-black dark:text-white block mb-1">
                Labs: Track Another Habit
              </span>
              <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mb-2">
                Apply Unlit's slip-friendly engine to alcohol, sugar, or scrolling.
              </p>

              {otherHabits.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] flex items-center justify-between my-1"
                >
                  <div>
                    <span className="font-bold text-black dark:text-white">{h.name}</span>
                    <span className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6] ml-2">
                      Goal: {h.dailyGoal} {h.unit}/day
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const updated = otherHabits.filter((item) => item.id !== h.id);
                      setOtherHabits(updated);
                      Storage.saveOtherHabits(updated);
                    }}
                    className="text-red-500 hover:opacity-70"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Habit (e.g. Alcohol)"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="flex-1 h-9 px-2.5 rounded-xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-[11px]"
                />
                <input
                  type="text"
                  placeholder="Unit (e.g. Drinks)"
                  value={newHabitUnit}
                  onChange={(e) => setNewHabitUnit(e.target.value)}
                  className="w-24 h-9 px-2.5 rounded-xl bg-[#F2F2F2] dark:bg-[#262626] border border-[#C4C4C4] dark:border-[#3D3D3D] text-[11px]"
                />
                <button
                  onClick={() => {
                    if (!newHabitName.trim()) return;
                    Sound.tick();
                    const newHabit: OtherHabit = {
                      id: `habit_${Date.now()}`,
                      name: newHabitName.trim(),
                      unit: newHabitUnit.trim() || 'units',
                      costPerUnit: 5,
                      dailyGoal: 0,
                      createdAt: new Date().toISOString(),
                    };
                    const updated = [...otherHabits, newHabit];
                    setOtherHabits(updated);
                    Storage.saveOtherHabits(updated);
                    setNewHabitName('');
                    setNewHabitUnit('');
                  }}
                  className="px-3 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Demo Data Generator */}
            <div className="pt-2 border-t border-[#C4C4C4] dark:border-[#3D3D3D]">
              <span className="font-bold text-black dark:text-white block mb-1">
                Demo Data for Evaluators
              </span>
              <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mb-2">
                Instantly populate 60 days of realistic history, cravings beaten, and milestone badges to test all charts and widgets.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    Sound.celebrate();
                    Storage.loadDemo();
                    alert('60-day demo data loaded! Explore the Journey and Today screens.');
                  }}
                  className="flex-1 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs active:scale-95 transition"
                >
                  Load 60-Day Demo Data
                </button>
              </div>
            </div>

            {/* Erase All Data with 2 Confirmations */}
            <div className="pt-2 border-t border-red-300 dark:border-red-900">
              <span className="font-bold text-red-600 dark:text-red-400 block mb-1">
                Danger Zone: Erase All Data
              </span>
              {eraseStep === 0 && (
                <button
                  onClick={() => setEraseStep(1)}
                  className="h-9 px-3 rounded-xl border border-red-400 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Erase All Data on Device
                </button>
              )}
              {eraseStep === 1 && (
                <div className="space-y-1">
                  <p className="text-[11px] text-red-600 font-bold">
                    Are you sure? This cannot be undone.
                  </p>
                  <button
                    onClick={() => setEraseStep(2)}
                    className="h-9 px-3 rounded-xl bg-red-600 text-white text-xs font-bold mr-2"
                  >
                    Yes, continue erase
                  </button>
                  <button
                    onClick={() => setEraseStep(0)}
                    className="h-9 px-3 rounded-xl border border-[#C4C4C4] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {eraseStep === 2 && (
                <div className="space-y-1">
                  <p className="text-[11px] text-red-600 font-bold">
                    Final confirmation: Erase everything now?
                  </p>
                  <button
                    onClick={() => {
                      Sound.doubleTick();
                      Storage.clearAllData();
                      setEraseStep(0);
                      window.location.reload();
                    }}
                    className="h-9 px-4 rounded-xl bg-red-700 text-white text-xs font-black mr-2"
                  >
                    Permanently Delete Everything
                  </button>
                  <button
                    onClick={() => setEraseStep(0)}
                    className="h-9 px-3 rounded-xl border border-[#C4C4C4] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 8. ABOUT Group */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E5E5E] dark:text-[#A6A6A6] px-1">
          About & Science Sources
        </h3>

        <div className="p-5 rounded-3xl bg-[#F2F2F2] dark:bg-[#141414] border border-[#C4C4C4] dark:border-[#3D3D3D] space-y-3 text-xs">
          <div>
            <h4 className="font-bold text-black dark:text-white">
              Unlit: Free, Private, Offline-First
            </h4>
            <p className="text-[11px] text-[#5E5E5E] dark:text-[#A6A6A6] mt-0.5">
              Built on peer-reviewed clinical research. No accounts, no paywall, no tracking SDKs. All data stays strictly on your phone.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-black dark:text-white mb-1.5">
              Verified Scientific Citations:
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {ACADEMIC_SOURCES.map((src, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#C4C4C4] dark:border-[#3D3D3D]"
                >
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-black dark:text-white underline block"
                  >
                    {src.title} ({src.year})
                  </a>
                  <p className="text-[10px] text-[#5E5E5E] dark:text-[#A6A6A6]">
                    {src.authors} Â· {src.journal}
                  </p>
                  <p className="text-[10px] text-black dark:text-white mt-1">
                    {src.takeaway}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-center text-[#5E5E5E] dark:text-[#A6A6A6] pt-1">
            {DISCLAIMER_FOOTER}
          </p>
        </div>
      </section>
    </div>
  );
};
