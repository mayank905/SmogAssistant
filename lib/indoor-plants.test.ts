import { describe, it, expect } from "vitest";
import { calculatePlantRequirements, NASA_CLEAN_AIR_PLANTS } from "./indoor-plants";

describe("NASA Clean Air Plant Calculator", () => {
  it("calculates proportional plant density for standard 200 sq ft room", () => {
    const plants = calculatePlantRequirements(200);
    expect(plants.length).toBe(NASA_CLEAN_AIR_PLANTS.length);
    
    const snake = plants.find(p => p.name.includes("Snake"));
    expect(snake?.countNeeded).toBe(2); // 200 / 100 * 1 = 2
  });

  it("scales plant counts up for large 500 sq ft hall", () => {
    const plants = calculatePlantRequirements(500);
    const snake = plants.find(p => p.name.includes("Snake"));
    expect(snake?.countNeeded).toBe(5); // 500 / 100 * 1 = 5
  });
});
