import { describe, it, expect } from "vitest";
import {
  INITIAL_HOUSEHOLD_MEMBERS,
  DEFAULT_HOUSEHOLD_ADVICE,
  HouseholdMember,
  CombinedHouseholdAdvice,
  MemberPersonalAdvice,
} from "@/types/household";
import { HouseholdScheduleManager } from "@/components/HouseholdScheduleManager";
import { HouseholdAdviceCard } from "@/components/HouseholdAdviceCard";

describe("Household Types & Initial Benchmark Profiles", () => {
  it("initializes three required benchmark members", () => {
    expect(INITIAL_HOUSEHOLD_MEMBERS).toHaveLength(3);

    const child = INITIAL_HOUSEHOLD_MEMBERS.find((m) => m.role === "child");
    const parent = INITIAL_HOUSEHOLD_MEMBERS.find((m) => m.role === "parent");
    const elderly = INITIAL_HOUSEHOLD_MEMBERS.find((m) => m.role === "elderly");

    expect(child).toBeDefined();
    expect(parent).toBeDefined();
    expect(elderly).toBeDefined();

    // Verify child with asthma
    expect(child?.name).toContain("Aarav");
    expect(child?.age).toBeLessThan(18);
    expect(child?.healthConditions.some((c) => c.toLowerCase().includes("asthma"))).toBe(true);
    expect(child?.schedule.length).toBeGreaterThanOrEqual(2);

    // Verify commuting parent
    expect(parent?.name).toContain("Rajesh");
    expect(parent?.age).toBeGreaterThanOrEqual(18);
    expect(parent?.schedule.some((s) => s.commuteMode === "two-wheeler")).toBe(true);

    // Verify elderly grandparent
    expect(elderly?.name).toContain("Kamla");
    expect(elderly?.age).toBeGreaterThanOrEqual(60);
    expect(
      elderly?.healthConditions.some(
        (c) => c.toLowerCase().includes("hypertension") || c.toLowerCase().includes("copd") || c.toLowerCase().includes("bronchitis")
      )
    ).toBe(true);
    expect(elderly?.schedule.some((s) => s.activity.toLowerCase().includes("walk"))).toBe(true);
  });

  it("ensures each member has structured schedule items with required fields", () => {
    INITIAL_HOUSEHOLD_MEMBERS.forEach((member: HouseholdMember) => {
      expect(member.id).toBeTruthy();
      expect(member.name).toBeTruthy();
      expect(member.age).toBeGreaterThan(0);
      expect(Array.isArray(member.healthConditions)).toBe(true);
      expect(Array.isArray(member.schedule)).toBe(true);

      member.schedule.forEach((item) => {
        expect(item.id).toBeTruthy();
        expect(item.time).toBeTruthy();
        expect(item.activity).toBeTruthy();
        expect(item.locationName).toBeTruthy();
        expect(item.commuteMode).toBeTruthy();
        expect(item.durationMinutes).toBeGreaterThan(0);
      });
    });
  });

  it("validates Combined Household Strategy structure", () => {
    const combined: CombinedHouseholdAdvice = DEFAULT_HOUSEHOLD_ADVICE.combinedStrategy;
    expect(combined).toBeDefined();
    expect(combined.purifierRuntimeHours).toBeTruthy();
    expect(combined.windowSealing).toBeTruthy();
    expect(combined.familyTransitSync).toBeTruthy();
    expect(combined.purifierSchedule?.peakHours).toBeTruthy();
    expect(combined.purifierSchedule?.targetRooms.length).toBeGreaterThan(0);
    expect(combined.transitSyncRecommendations?.length).toBeGreaterThan(0);
  });

  it("validates Personalized Member Advice tabs and schedule shifts", () => {
    const memberAdviceList: MemberPersonalAdvice[] = DEFAULT_HOUSEHOLD_ADVICE.memberAdvice;
    expect(memberAdviceList.length).toBe(3);

    memberAdviceList.forEach((adv) => {
      expect(adv.memberId).toBeTruthy();
      expect(adv.memberName).toBeTruthy();
      expect(adv.individualRiskScore).toBeGreaterThanOrEqual(0);
      expect(adv.individualRiskScore).toBeLessThanOrEqual(100);
      expect(["Low", "Moderate", "High", "Critical"]).toContain(adv.riskLevel);
      expect(adv.ageSpecificPrecautions.length).toBeGreaterThan(0);
      expect(adv.maskRecommendation).toBeTruthy();
      expect(adv.scheduleShifts.length).toBeGreaterThan(0);

      adv.scheduleShifts.forEach((shift) => {
        expect(shift.activity).toBeTruthy();
        expect(shift.originalTime).toBeTruthy();
        expect(shift.proposedTime).toBeTruthy();
        expect(shift.reason).toBeTruthy();
        expect(shift.exposureReductionPct).toBeGreaterThan(0);
      });
    });
  });

  it("exports valid React component definitions", () => {
    expect(HouseholdScheduleManager).toBeDefined();
    expect(typeof HouseholdScheduleManager).toBe("function");

    expect(HouseholdAdviceCard).toBeDefined();
    expect(typeof HouseholdAdviceCard).toBe("function");
  });
});
