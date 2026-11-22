import { describe, it, expect } from "vitest";
import { 
  calculatePm25SubIndex, 
  calculatePm10SubIndex, 
  getCpcbCategory, 
  getCategoryMetadata 
} from "./aqi-calculator";

describe("AQI Breakpoints & CPCB Classification", () => {
  it("correctly calculates PM2.5 sub-index for clean air", () => {
    // 15 ug/m3 should be around 25 in Good range (0-30 -> 0-50)
    const sub = calculatePm25SubIndex(15);
    expect(sub).toBeGreaterThanOrEqual(20);
    expect(sub).toBeLessThanOrEqual(30);
    expect(getCpcbCategory(sub)).toBe("Good");
  });

  it("correctly calculates PM2.5 sub-index for moderate pollution", () => {
    // 75 ug/m3 falls in 60.1 - 90 -> 101 - 200
    const sub = calculatePm25SubIndex(75);
    expect(sub).toBeGreaterThanOrEqual(140);
    expect(sub).toBeLessThanOrEqual(160);
    expect(getCpcbCategory(sub)).toBe("Moderate");
  });

  it("correctly calculates PM2.5 sub-index for severe winter smog", () => {
    // 350 ug/m3 falls well into Severe (250+ -> 401 - 500+)
    const sub = calculatePm25SubIndex(350);
    expect(sub).toBeGreaterThanOrEqual(401);
    expect(getCpcbCategory(sub)).toBe("Severe");
  });

  it("correctly calculates PM10 sub-index", () => {
    // 175 ug/m3 falls in 100.1 - 250 -> 101 - 200
    const sub = calculatePm10SubIndex(175);
    expect(sub).toBeGreaterThanOrEqual(145);
    expect(sub).toBeLessThanOrEqual(155);
    expect(getCpcbCategory(sub)).toBe("Moderate");
  });

  it("maps categories and accessible metadata correctly", () => {
    expect(getCpcbCategory(45)).toBe("Good");
    expect(getCpcbCategory(85)).toBe("Satisfactory");
    expect(getCpcbCategory(160)).toBe("Moderate");
    expect(getCpcbCategory(250)).toBe("Poor");
    expect(getCpcbCategory(340)).toBe("Very Poor");
    expect(getCpcbCategory(475)).toBe("Severe");

    const severeMeta = getCategoryMetadata("Severe");
    expect(severeMeta.badgeBg).toBe("bg-red-900");
    expect(severeMeta.badgeText).toBe("text-white");
    expect(severeMeta.cpcbRange).toBe("401 - 500+");
  });
});
