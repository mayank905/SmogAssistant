"use client";

import React, { useState, useEffect } from "react";
import { 
  HouseholdMember, 
  DayScheduleItem, 
  HouseholdRole, 
  INITIAL_HOUSEHOLD_MEMBERS 
} from "@/types/household";
import { CommuteMode } from "@/types/context";
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Clock,
  MapPin,
  HeartPulse,
  CheckCircle2,
  RotateCcw,
  Car,
  Bike,
  Footprints,
  Bus,
  Train,
  Plus,
  X,
  ChevronRight,
} from "lucide-react";

const STORAGE_KEY = "smogassistant_household_members";

const COMMON_HEALTH_CONDITIONS = [
  "Asthma",
  "Dust Allergy",
  "COPD",
  "Hypertension",
  "Cardiovascular Disease",
  "Chronic Bronchitis",
  "Allergic Rhinitis",
  "Pregnancy",
  "Senior Fragility",
  "None",
];

const COMMUTE_MODE_CONFIG: Record<
  CommuteMode,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  "two-wheeler": { label: "Two-Wheeler (Motorbike/Scooter)", icon: Bike, color: "text-amber-600 bg-amber-50" },
  "car-petrol": { label: "Petrol / Diesel Car", icon: Car, color: "text-rose-600 bg-rose-50" },
  "car-ev": { label: "Electric Vehicle (EV)", icon: Car, color: "text-emerald-600 bg-emerald-50" },
  "bus": { label: "Public / School Bus", icon: Bus, color: "text-blue-600 bg-blue-50" },
  "metro": { label: "Metro Rail / Subway", icon: Train, color: "text-indigo-600 bg-indigo-50" },
  "bicycle": { label: "Bicycle / Cycle", icon: Bike, color: "text-teal-600 bg-teal-50" },
  "walking": { label: "Walking / Foot", icon: Footprints, color: "text-lime-600 bg-lime-50" },
};

interface HouseholdScheduleManagerProps {
  initialMembers?: HouseholdMember[];
  onMembersChange?: (members: HouseholdMember[]) => void;
  className?: string;
}

export const HouseholdScheduleManager: React.FC<HouseholdScheduleManagerProps> = ({
  initialMembers,
  onMembersChange,
  className = "",
}) => {
  const [members, setMembers] = useState<HouseholdMember[]>(() => {
    return initialMembers || INITIAL_HOUSEHOLD_MEMBERS;
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    return (initialMembers && initialMembers[0]?.id) || INITIAL_HOUSEHOLD_MEMBERS[0].id;
  });

  // Modal / Editing states
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<{
    memberId: string;
    item: DayScheduleItem | null;
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<string>("");

  // Form states for Member
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState<HouseholdRole>("other");
  const [memberAge, setMemberAge] = useState<number>(30);
  const [memberConditions, setMemberConditions] = useState<string[]>([]);
  const [newConditionInput, setNewConditionInput] = useState("");
  const [memberSensitivity, setMemberSensitivity] = useState<"low" | "medium" | "high" | "severe">("medium");
  const [memberNotes, setMemberNotes] = useState("");

  // Form states for Schedule Item
  const [scheduleTime, setScheduleTime] = useState("08:00 AM");
  const [scheduleActivity, setScheduleActivity] = useState("");
  const [scheduleLocation, setScheduleLocation] = useState("");
  const [scheduleCommuteMode, setScheduleCommuteMode] = useState<CommuteMode>("metro");
  const [scheduleDuration, setScheduleDuration] = useState<number>(30);
  const [scheduleDistance, setScheduleDistance] = useState<number>(5);
  const [scheduleIsOutdoor, setScheduleIsOutdoor] = useState(true);

  // 1. Initial hydration from localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMembers(parsed);
            if (!parsed.some((m: HouseholdMember) => m.id === selectedMemberId)) {
              setSelectedMemberId(parsed[0].id);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to read household members from localStorage:", e);
    }
  }, []);

  // Escape key listener for accessible modal dismissal
  useEffect(() => {
    if (!isMemberModalOpen && !isScheduleModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMemberModalOpen(false);
        setIsScheduleModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMemberModalOpen, isScheduleModalOpen]);

  // 2. Persist to localStorage whenever members change after initial load
  const persistMembers = (updated: HouseholdMember[]) => {
    setMembers(updated);
    if (onMembersChange) {
      onMembersChange(updated);
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSaveStatus("Saved to localStorage");
        const timer = setTimeout(() => setSaveStatus(""), 2500);
        return () => clearTimeout(timer);
      } catch (e) {
        console.warn("Failed to persist household members to localStorage:", e);
      }
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Reset household members to standard benchmark defaults (Asthmatic Child, Commuter, Grandparent)?")) {
      persistMembers(INITIAL_HOUSEHOLD_MEMBERS);
      setSelectedMemberId(INITIAL_HOUSEHOLD_MEMBERS[0].id);
    }
  };

  // --- Member Actions ---
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberName("");
    setMemberRole("other");
    setMemberAge(25);
    setMemberConditions([]);
    setNewConditionInput("");
    setMemberSensitivity("medium");
    setMemberNotes("");
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: HouseholdMember) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberRole(
      member.role === "child" || member.role === "parent" || member.role === "elderly"
        ? member.role
        : "other"
    );
    setMemberAge(member.age);
    setMemberConditions([...member.healthConditions]);
    setNewConditionInput("");
    setMemberSensitivity(member.sensitivityLevel || "medium");
    setMemberNotes(member.notes || "");
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    if (editingMember) {
      const updated = members.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name: memberName.trim(),
              role: memberRole,
              age: Number(memberAge) || 0,
              healthConditions: memberConditions.length > 0 ? memberConditions : ["None"],
              sensitivityLevel: memberSensitivity,
              notes: memberNotes.trim() || undefined,
            }
          : m
      );
      persistMembers(updated);
    } else {
      const newMember: HouseholdMember = {
        id: `member-${Date.now()}`,
        name: memberName.trim(),
        role: memberRole,
        age: Number(memberAge) || 0,
        healthConditions: memberConditions.length > 0 ? memberConditions : ["None"],
        sensitivityLevel: memberSensitivity,
        notes: memberNotes.trim() || undefined,
        schedule: [],
      };
      const updated = [...members, newMember];
      persistMembers(updated);
      setSelectedMemberId(newMember.id);
    }
    setIsMemberModalOpen(false);
  };

  const handleDeleteMember = (memberId: string) => {
    if (members.length <= 1) {
      alert("A household must have at least one profile member.");
      return;
    }
    const member = members.find((m) => m.id === memberId);
    if (window.confirm(`Are you sure you want to remove "${member?.name}" from household profiling?`)) {
      const updated = members.filter((m) => m.id !== memberId);
      persistMembers(updated);
      if (selectedMemberId === memberId) {
        setSelectedMemberId(updated[0].id);
      }
    }
  };

  // --- Schedule Item Actions ---
  const handleOpenAddSchedule = (memberId: string) => {
    setEditingScheduleItem({ memberId, item: null });
    setScheduleTime("08:00 AM");
    setScheduleActivity("");
    setScheduleLocation("");
    setScheduleCommuteMode("metro");
    setScheduleDuration(30);
    setScheduleDistance(5);
    setScheduleIsOutdoor(true);
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (memberId: string, item: DayScheduleItem) => {
    setEditingScheduleItem({ memberId, item });
    setScheduleTime(item.time);
    setScheduleActivity(item.activity);
    setScheduleLocation(item.locationName);
    setScheduleCommuteMode(item.commuteMode);
    setScheduleDuration(item.durationMinutes);
    setScheduleDistance(item.distanceKm || 0);
    setScheduleIsOutdoor(item.isOutdoor ?? true);
    setIsScheduleModalOpen(true);
  };

  const handleSaveScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheduleItem || !scheduleActivity.trim()) return;

    const { memberId, item } = editingScheduleItem;
    const updated = members.map((m) => {
      if (m.id !== memberId) return m;

      let newSchedule: DayScheduleItem[];
      if (item) {
        // Edit existing
        newSchedule = m.schedule.map((sch) =>
          sch.id === item.id
            ? {
                ...sch,
                time: scheduleTime.trim(),
                activity: scheduleActivity.trim(),
                locationName: scheduleLocation.trim() || "Local Area",
                commuteMode: scheduleCommuteMode,
                durationMinutes: Number(scheduleDuration) || 15,
                distanceKm: Number(scheduleDistance) || 0,
                isOutdoor: scheduleIsOutdoor,
              }
            : sch
        );
      } else {
        // Add new
        const newItem: DayScheduleItem = {
          id: `sch-${Date.now()}`,
          time: scheduleTime.trim(),
          activity: scheduleActivity.trim(),
          locationName: scheduleLocation.trim() || "Local Area",
          commuteMode: scheduleCommuteMode,
          durationMinutes: Number(scheduleDuration) || 15,
          distanceKm: Number(scheduleDistance) || 0,
          isOutdoor: scheduleIsOutdoor,
        };
        newSchedule = [...m.schedule, newItem];
      }

      return {
        ...m,
        schedule: newSchedule,
      };
    });

    persistMembers(updated);
    setIsScheduleModalOpen(false);
  };

  const handleDeleteScheduleItem = (memberId: string, itemId: string) => {
    const updated = members.map((m) => {
      if (m.id !== memberId) return m;
      return {
        ...m,
        schedule: m.schedule.filter((s) => s.id !== itemId),
      };
    });
    persistMembers(updated);
  };

  const toggleCondition = (cond: string) => {
    if (cond === "None") {
      setMemberConditions(["None"]);
      return;
    }
    const filtered = memberConditions.filter((c) => c !== "None");
    if (filtered.includes(cond)) {
      setMemberConditions(filtered.filter((c) => c !== cond));
    } else {
      setMemberConditions([...filtered, cond]);
    }
  };

  const handleAddCustomCondition = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newConditionInput.trim()) {
      e.preventDefault();
      const trimmed = newConditionInput.trim();
      const filtered = memberConditions.filter((c) => c !== "None");
      if (!filtered.includes(trimmed)) {
        setMemberConditions([...filtered, trimmed]);
      }
      setNewConditionInput("");
    }
  };

  const activeMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "child":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Child</span>;
      case "parent":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Commuter / Parent</span>;
      case "elderly":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Elderly Senior</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{role}</span>;
    }
  };

  const getSensitivityBadge = (level?: string) => {
    switch (level) {
      case "severe":
        return <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">High Risk</span>;
      case "high":
        return <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">Elevated</span>;
      case "medium":
        return <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Moderate</span>;
      default:
        return <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Normal</span>;
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-700">
              Household Exposure Profiles
            </span>
            {saveStatus && (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full transition-opacity duration-300">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {saveStatus}
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Multi-Member Schedule & Health Profiler
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure age, clinical vulnerabilities, and daily route transit to generate synchronized household air defense.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Reset to default 3 benchmark members"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddMember}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Member Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {members.map((member) => {
          const isSelected = member.id === selectedMemberId;
          return (
            <div
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`relative cursor-pointer rounded-2xl p-4 border transition-all duration-200 text-left ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {member.name}
                    </span>
                    <span className="text-xs text-slate-500">({member.age} yrs)</span>
                  </div>
                  <div className="mt-1 flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {getRoleBadge(member.role)}
                    {getSensitivityBadge(member.sensitivityLevel)}
                  </div>
                </div>

                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleOpenEditMember(member)}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Edit Member"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Health conditions tags */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {member.healthConditions.map((cond, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                  >
                    {cond}
                  </span>
                ))}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{member.schedule.length} scheduled trips</span>
                </span>
                {isSelected && (
                  <span className="text-indigo-600 font-bold flex items-center text-[11px]">
                    Active View <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Member Detail & Daily Schedule */}
      {activeMember && (
        <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-lg font-black text-slate-900">
                  {activeMember.name}'s Daily Route & Schedule
                </h4>
                {getRoleBadge(activeMember.role)}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {activeMember.notes || `Daily transit, commute windows, and outdoor exposures for ${activeMember.name}.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddSchedule(activeMember.id)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transit / Activity</span>
            </button>
          </div>

          {/* Schedule list */}
          {activeMember.schedule.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No scheduled routines configured</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Add school commutes, office trips, or exercise windows to calculate personalized exposure.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddSchedule(activeMember.id)}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                + Add First Schedule Block
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeMember.schedule.map((item) => {
                const modeConfig = COMMUTE_MODE_CONFIG[item.commuteMode] || {
                  label: item.commuteMode,
                  icon: Car,
                  color: "text-slate-600 bg-slate-100",
                };
                const ModeIcon = modeConfig.icon;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-indigo-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center font-black text-xs text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 mr-1 text-indigo-600" />
                          {item.time}
                        </span>
                        {item.isOutdoor ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Outdoor
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Indoor
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSchedule(activeMember.id, item)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title="Edit Routine"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduleItem(activeMember.id, item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                          title="Delete Routine"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="font-extrabold text-sm text-slate-900 leading-snug">
                        {item.activity}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{item.locationName}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${modeConfig.color}`}>
                        <ModeIcon className="w-3 h-3 mr-1" />
                        {modeConfig.label.split(" ")[0]}
                      </span>
                      <span className="text-slate-500 font-medium text-[11px]">
                        {item.durationMinutes} mins {item.distanceKm ? `• ${item.distanceKm} km` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: Add / Edit Member --- */}
      {isMemberModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="household-member-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 id="household-member-modal-title" className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <HeartPulse className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                <span>{editingMember ? "Edit Household Member" : "Add New Family Member"}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                aria-label="Close family member modal"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    required
                    value={memberAge}
                    onChange={(e) => setMemberAge(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Household Role
                  </label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as HouseholdRole)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="child">Child (School-going / Infant)</option>
                    <option value="parent">Parent / Urban Commuter</option>
                    <option value="elderly">Elderly / Senior Citizen</option>
                    <option value="other">Other Adult / Resident</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sensitivity Assessment
                  </label>
                  <select
                    value={memberSensitivity}
                    onChange={(e) => setMemberSensitivity(e.target.value as "low" | "medium" | "high" | "severe")}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="severe">Severe (High Vulnerability)</option>
                    <option value="high">High (Known Pre-existing condition)</option>
                    <option value="medium">Moderate (General Population)</option>
                    <option value="low">Low (Active / Resilient)</option>
                  </select>
                </div>
              </div>

              {/* Health Conditions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pre-existing Respiratory & Health Conditions
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_HEALTH_CONDITIONS.map((cond) => {
                    const active = memberConditions.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => toggleCondition(cond)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          active
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {cond}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newConditionInput}
                    onChange={(e) => setNewConditionInput(e.target.value)}
                    onKeyDown={handleAddCustomCondition}
                    placeholder="Type custom condition and press Enter..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newConditionInput.trim()) {
                        const trimmed = newConditionInput.trim();
                        const filtered = memberConditions.filter((c) => c !== "None");
                        if (!filtered.includes(trimmed)) {
                          setMemberConditions([...filtered, trimmed]);
                        }
                        setNewConditionInput("");
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical / Exposure Notes
                </label>
                <textarea
                  rows={2}
                  value={memberNotes}
                  onChange={(e) => setMemberNotes(e.target.value)}
                  placeholder="e.g. Uses corticosteroid inhaler; avoids open bus windows."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                >
                  {editingMember ? "Save Changes" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Add / Edit Schedule Item --- */}
      {isScheduleModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="household-schedule-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 id="household-schedule-modal-title" className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                <span>
                  {editingScheduleItem?.item ? "Edit Schedule Routine" : "Add Daily Routine"}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                aria-label="Close schedule routine modal"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveScheduleItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Time Window
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    placeholder="e.g. 07:30 AM or 18:30"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleActivity}
                    onChange={(e) => setScheduleActivity(e.target.value)}
                    placeholder="e.g. School Commute, Morning Jog"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Destination / Location Name
                </label>
                <input
                  type="text"
                  required
                  value={scheduleLocation}
                  onChange={(e) => setScheduleLocation(e.target.value)}
                  placeholder="e.g. Greenwood Primary School, Sector 14 Park"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Commute / Transit Mode
                </label>
                <select
                  value={scheduleCommuteMode}
                  onChange={(e) => setScheduleCommuteMode(e.target.value as CommuteMode)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="two-wheeler">Two-Wheeler (Motorbike / Scooter - Highest Exposure)</option>
                  <option value="car-petrol">Petrol / Diesel Car (High Tailpipe Emission)</option>
                  <option value="car-ev">Electric Vehicle (EV - Low Cabin Exposure)</option>
                  <option value="bus">Public / School Bus</option>
                  <option value="metro">Metro Rail / Subway (Cleanest Transit)</option>
                  <option value="bicycle">Bicycle (High Respiratory Exertion)</option>
                  <option value="walking">Walking / Foot (Pedestrian Exposure)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    required
                    value={scheduleDuration}
                    onChange={(e) => setScheduleDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Distance (Kilometers)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={scheduleDistance}
                    onChange={(e) => setScheduleDistance(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleIsOutdoor}
                    onChange={(e) => setScheduleIsOutdoor(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Activity involves outdoor air exposure (subject to ambient PM2.5)</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                >
                  {editingScheduleItem?.item ? "Update Routine" : "Save Routine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
