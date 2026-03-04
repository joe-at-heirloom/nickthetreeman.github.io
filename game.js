(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  canvas.width = 1280;
  canvas.height = 720;
  canvas.style.touchAction = "none";

  const isMobile =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches;

  const TOUCH_BTN_Y = 644;
  const TOUCH_BTN_H = 62;
  const TOUCH_BAR_TOP = 632;

  function vibrate(ms) {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  const WORLD = {
    width: canvas.width,
    height: canvas.height,
    groundY: 620,
  };

  const MAX_LEVEL = 5;
  const MIN_SLASH_SPEED = 170;
  const NICK_GRAVITY = 1280;
  const NICK_JUMP_VELOCITY = 560;
  const NICK_BODY_RADIUS = 30;
  const NICK_QUOTES = [
    "I AM JUAN VALDEZ!",
    "Dangflabbit!",
    "Rabscallion trees don't have a chance around me!",
  ];

  const HAZARD_TYPES = {
    house: {
      w: 118,
      h: 88,
      penalty: 28,
      label: "House",
      body: "#e9d7b1",
      roof: "#a64e36",
    },
    car: {
      w: 90,
      h: 42,
      penalty: 14,
      label: "Car",
      body: "#3e7fb5",
      roof: "#9fc3db",
    },
    oldlady: {
      w: 44,
      h: 72,
      penalty: 100,
      label: "Old Lady",
      body: "#8c6a9b",
      roof: "#d8cfbc",
    },
  };

  const TREE_SPECIES = [
    {
      id: "oak",
      name: "Oak",
      heightMul: [0.86, 1.02],
      radiusMul: [1.08, 1.28],
      deadnessShift: -0.03,
      splayBias: -0.08,
      branchMassMul: 1.2,
      branchLengthMul: 0.94,
      leanRange: 0.028,
      curveRange: 0.17,
      clusterBoost: 0.16,
      lowTierShift: 0.02,
      highTierShift: -0.04,
      trunkColor: "#58402b",
      trunkHighlight: "#775437",
      leafColor: "#3f7f38",
      leafAlt: "#5d9b49",
    },
    {
      id: "cedar",
      name: "Cedar",
      heightMul: [0.92, 1.1],
      radiusMul: [0.92, 1.08],
      deadnessShift: 0.01,
      splayBias: 0.06,
      branchMassMul: 1,
      branchLengthMul: 1.04,
      leanRange: 0.04,
      curveRange: 0.22,
      clusterBoost: 0.08,
      lowTierShift: -0.01,
      highTierShift: 0.02,
      trunkColor: "#4f3a25",
      trunkHighlight: "#6c4d30",
      leafColor: "#2e7555",
      leafAlt: "#4f9e7e",
    },
    {
      id: "poplar",
      name: "Poplar",
      heightMul: [1.04, 1.22],
      radiusMul: [0.76, 0.94],
      deadnessShift: 0.04,
      splayBias: 0.11,
      branchMassMul: 0.9,
      branchLengthMul: 1.15,
      leanRange: 0.055,
      curveRange: 0.3,
      clusterBoost: 0,
      lowTierShift: -0.04,
      highTierShift: 0.05,
      trunkColor: "#463521",
      trunkHighlight: "#60452a",
      leafColor: "#3e8b41",
      leafAlt: "#65b55b",
    },
  ];

  const SKY_PRESETS = {
    sunrise: {
      top: "#7fb2de",
      mid: "#d3ebff",
      bottom: "#f5efd9",
      sun: "rgba(255, 206, 132, 0.58)",
      cloud: "rgba(255, 255, 255, 0.72)",
    },
    storm: {
      top: "#5f7694",
      mid: "#9eb1c8",
      bottom: "#d9e1d1",
      sun: "rgba(242, 230, 191, 0.3)",
      cloud: "rgba(244, 248, 255, 0.52)",
    },
    amber: {
      top: "#669ac7",
      mid: "#d6e6fb",
      bottom: "#fde2b6",
      sun: "rgba(255, 183, 109, 0.52)",
      cloud: "rgba(255, 244, 220, 0.66)",
    },
  };

  const CONTRACTS = [
    {
      id: "main-street",
      title: "Main Street Shift",
      blurb: "steady wind and heavier curbside branches",
      accent: "#9fd5ff",
      ambient: "pollen",
      introCallout: "Morning shift: trim smart and keep trunks off the street.",
      skyPreset: "sunrise",
      windAmp: 0.11,
      windTempo: 0.58,
      windBiasMul: 0.8,
      gustInterval: [8.5, 12.5],
      gustStrength: [0.05, 0.13],
      gustDuration: [1.3, 2.1],
      treeCountDelta: 0,
      bigBranchBoost: 0.08,
      deadnessBoost: 0,
    },
    {
      id: "storm-watch",
      title: "Storm Watch",
      blurb: "volatile gusts and tricky dead pockets",
      accent: "#d5e3ff",
      ambient: "rain",
      introCallout: "Storm watch active: expect violent crosswinds.",
      skyPreset: "storm",
      windAmp: 0.2,
      windTempo: 0.88,
      windBiasMul: 1.22,
      gustInterval: [4.2, 6.2],
      gustStrength: [0.14, 0.3],
      gustDuration: [1.4, 2.6],
      treeCountDelta: 1,
      bigBranchBoost: 0.11,
      deadnessBoost: 0.04,
    },
    {
      id: "golden-hour",
      title: "Golden Hour Rush",
      blurb: "crowded lots and giant upper V branches",
      accent: "#ffe1a8",
      ambient: "firefly",
      introCallout: "Golden hour rush: stylish cuts, zero crashes.",
      skyPreset: "amber",
      windAmp: 0.13,
      windTempo: 0.72,
      windBiasMul: 0.96,
      gustInterval: [6.5, 9.8],
      gustStrength: [0.08, 0.19],
      gustDuration: [1.4, 2.2],
      treeCountDelta: 0,
      bigBranchBoost: 0.2,
      deadnessBoost: 0.02,
    },
  ];

  const DISTRICTS = [
    {
      id: "cedar-hollow",
      name: "Cedar Hollow",
      tagline: "orchard lanes and sleepy porches",
      hillTop: "#77ad6f",
      hillBottom: "#588a52",
      grassTop: "#68a84e",
      grassBottom: "#4d7d39",
      road: "#6f6659",
      roadEdge: "#978a78",
      fence: "rgba(238, 230, 206, 0.4)",
      houseBody: "#e5d6b5",
      houseRoof: "#9e4f37",
      carBody: "#3e7fb5",
      carRoof: "#9fc3db",
    },
    {
      id: "harbor-edge",
      name: "Harbor Edge",
      tagline: "windy blocks by the docks",
      hillTop: "#6fa08f",
      hillBottom: "#4e7a6b",
      grassTop: "#5f965a",
      grassBottom: "#3f6642",
      road: "#5f6268",
      roadEdge: "#8d95a3",
      fence: "rgba(216, 229, 236, 0.36)",
      houseBody: "#d9e3dd",
      houseRoof: "#4b6470",
      carBody: "#4f8db8",
      carRoof: "#b9cfde",
    },
    {
      id: "museum-row",
      name: "Museum Row",
      tagline: "classic estates and old maples",
      hillTop: "#8ea966",
      hillBottom: "#6d834d",
      grassTop: "#7fa84d",
      grassBottom: "#5c7a36",
      road: "#746455",
      roadEdge: "#a79274",
      fence: "rgba(241, 228, 197, 0.45)",
      houseBody: "#e3cfb2",
      houseRoof: "#7f4337",
      carBody: "#4e6fb2",
      carRoof: "#aac2df",
    },
  ];

  const state = {
    mode: "menu",
    level: 1,
    reputation: 100,
    totalCut: 0,
    totalSaved: 0,
    totalDamaged: 0,
    levelReport: null,
    failReason: "",
    activeTier: "low",
    trunkCrashesThisLevel: 0,
    trees: [],
    hazards: [],
    selectedTreeId: null,
    pointer: {
      down: false,
      x: WORLD.width * 0.5,
      y: WORLD.height * 0.35,
      path: [],
      lastSpeed: 0,
      lastTap: null,
    },
    slashEchoes: [],
    chips: [],
    nickX: 220,
    nickY: 0,
    nickVy: 0,
    controlMode: "saw",
    showtime: {
      active: false,
      phase: 0,
      sway: 0,
      armSwing: 0,
      noteTimer: 0.35,
      quoteTimer: 3.8,
    },
    nickSpeech: {
      text: "",
      life: 0,
      maxLife: 0,
    },
    nickQuoteIndex: 0,
    nickNotes: [],
    elapsed: 0,
    contract: CONTRACTS[0],
    district: DISTRICTS[0],
    bossTreeId: null,
    skyPreset: SKY_PRESETS.sunrise,
    flowStreak: 0,
    bestFlow: 0,
    flowTimer: 0,
    lastCutAt: -999,
    windTrails: [],
    crashBursts: [],
    birds: [],
    treeCat: null,
    catGuardWarnAt: -999,
    ambientParticles: [],
    callouts: [],
    lightningFlash: 0,
    camera: {
      x: 0,
      y: 0,
      trauma: 0,
    },
    adrenaline: {
      timer: 0,
      duration: 0,
      sourceTreeId: null,
    },
    levelWind: 0,
    windPhase: 0,
    wind: 0,
    gust: {
      active: false,
      timer: 0,
      duration: 0,
      cooldown: 7,
      dir: 0,
      strength: 0,
    },
  };

  let touchBtnFlash = {};

  function flashTouchBtn(id) {
    touchBtnFlash[id] = 0.18;
  }

  function getTouchButtons() {
    if (!isMobile) return [];
    if (state.mode !== "playing") return [];
    const selected = state.trees.find((t) => t.id === state.selectedTreeId) || null;
    const wedgeDir = selected ? selected.wedge : 0;
    return [
      {
        id: "wedgeL",
        label: "\u25C0",
        sublabel: "WDG",
        x: 20,
        y: TOUCH_BTN_Y,
        w: 82,
        h: TOUCH_BTN_H,
        active: wedgeDir < 0,
        action() {
          if (selected && !selected.fallen) {
            selected.wedge = selected.wedge === -1 ? 0 : -1;
            vibrate(15);
          }
        },
      },
      {
        id: "wedgeR",
        label: "\u25B6",
        sublabel: "WDG",
        x: 110,
        y: TOUCH_BTN_Y,
        w: 82,
        h: TOUCH_BTN_H,
        active: wedgeDir > 0,
        action() {
          if (selected && !selected.fallen) {
            selected.wedge = selected.wedge === 1 ? 0 : 1;
            vibrate(15);
          }
        },
      },
      {
        id: "jump",
        label: "JUMP",
        x: 210,
        y: TOUCH_BTN_Y,
        w: 108,
        h: TOUCH_BTN_H,
        active: false,
        action() {
          jumpNick();
          vibrate(20);
        },
      },
      {
        id: "cutL",
        label: "\u2694 L",
        x: 336,
        y: TOUCH_BTN_Y,
        w: 84,
        h: TOUCH_BTN_H,
        active: false,
        action() {
          if (state.controlMode === "axe") {
            axeChopSelectedTree(-1);
          } else {
            cutSelectedTreeBranch(-1);
          }
          vibrate(25);
        },
      },
      {
        id: "cutR",
        label: "R \u2694",
        x: 428,
        y: TOUCH_BTN_Y,
        w: 84,
        h: TOUCH_BTN_H,
        active: false,
        action() {
          if (state.controlMode === "axe") {
            axeChopSelectedTree(1);
          } else {
            cutSelectedTreeBranch(1);
          }
          vibrate(25);
        },
      },
      {
        id: "tierLow",
        label: "LOW",
        x: 790,
        y: TOUCH_BTN_Y,
        w: 80,
        h: TOUCH_BTN_H,
        active: state.activeTier === "low",
        action() {
          state.activeTier = "low";
          vibrate(10);
        },
      },
      {
        id: "tierHigh",
        label: "HIGH",
        x: 878,
        y: TOUCH_BTN_Y,
        w: 82,
        h: TOUCH_BTN_H,
        active: state.activeTier === "high",
        action() {
          state.activeTier = "high";
          vibrate(10);
        },
      },
      {
        id: "mode",
        label: state.controlMode === "axe" ? "AXE" : "SAW",
        x: 970,
        y: TOUCH_BTN_Y,
        w: 88,
        h: TOUCH_BTN_H,
        active: state.controlMode === "axe",
        action() {
          state.controlMode = state.controlMode === "saw" ? "axe" : "saw";
          addCallout(
            state.controlMode === "axe"
              ? "Axe mode: notch + back-cut the trunk."
              : "Saw mode: cut limbs by side/tier.",
            state.controlMode === "axe" ? "#ffe0ad" : "#d3f4de",
            1.6
          );
          vibrate(15);
        },
      },
      {
        id: "nextTree",
        label: "TREE\u25B6",
        x: 1068,
        y: TOUCH_BTN_Y,
        w: 96,
        h: TOUCH_BTN_H,
        active: false,
        action() {
          cycleSelectedTree(1);
          vibrate(10);
        },
      },
    ];
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function getHazardPenalty(type) {
    return HAZARD_TYPES[type].penalty;
  }

  function choose(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function chooseContract(level) {
    return CONTRACTS[(level - 1) % CONTRACTS.length];
  }

  function chooseDistrict(level) {
    return DISTRICTS[(level - 1) % DISTRICTS.length];
  }

  function chooseSpecies(level) {
    if (level >= 4 && Math.random() < 0.35) {
      return TREE_SPECIES[2];
    }
    if (level >= 2 && Math.random() < 0.4) {
      return TREE_SPECIES[1];
    }
    return choose(TREE_SPECIES);
  }

  function getBranchDurability(branch, treeIsBoss = false) {
    const base =
      0.78 +
      branch.thickness / 8.4 +
      (branch.isBig ? 0.58 : 0) +
      (branch.tier === "high" ? 0.22 : 0) +
      (treeIsBoss ? 0.52 : 0) -
      branch.deadness * 0.28;
    return clamp(base, 0.95, treeIsBoss ? 4.4 : 3.2);
  }

  function createAxePlan(treeIsBoss, height, radius, deadness) {
    const trunkFactor = height / 250 + radius / 15 + (treeIsBoss ? 0.9 : 0);
    const relief = deadness * 0.55;
    const notchNeed = Math.round(clamp(1.35 + trunkFactor - relief, 2, treeIsBoss ? 5 : 4));
    const backNeed = Math.round(
      clamp(1.85 + trunkFactor * 1.08 - relief, 2, treeIsBoss ? 6 : 5)
    );
    return {
      targetSide: 0,
      notchHits: 0,
      backHits: 0,
      notchNeed,
      backNeed,
      stage: "idle",
      flash: 0,
      lastChopAt: -999,
    };
  }

  function shuffled(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function createTree(id, x, level, contract) {
    const species = chooseSpecies(level);
    const height =
      (rand(210, 310) + level * 10) * rand(species.heightMul[0], species.heightMul[1]);
    const radius = rand(14, 24) * rand(species.radiusMul[0], species.radiusMul[1]);
    const deadness = clamp(
      rand(0.05, 0.42) + level * 0.02 + species.deadnessShift + (contract.deadnessBoost || 0),
      0.05,
      0.78
    );
    const deadBias = rand(-1, 1);
    const lean = rand(-species.leanRange, species.leanRange);
    const trunkCurve = rand(-species.curveRange, species.curveRange);
    const branches = [];
    const tiers = [
      { id: "low", baseHeight: rand(0.34 + species.lowTierShift, 0.5 + species.lowTierShift) },
      { id: "high", baseHeight: rand(0.63 + species.highTierShift, 0.84 + species.highTierShift) },
    ];

    let branchIndex = 0;
    for (const tier of tiers) {
      const clusterCount =
        tier.id === "high"
          ? (Math.random() < 0.55 + species.clusterBoost * 0.5 ? 2 : 1)
          : (Math.random() < 0.28 + species.clusterBoost ? 2 : 1);
      for (let cluster = 0; cluster < clusterCount; cluster += 1) {
        const clusterOffset = (cluster - (clusterCount - 1) / 2) * 0.09;
        const anchorRatio = clamp(
          tier.baseHeight + clusterOffset + rand(-0.03, 0.03),
          0.24,
          0.95
        );
        const bigChance =
          0.2 +
          level * 0.06 +
          (tier.id === "high" ? 0.1 : 0.03) +
          cluster * 0.04 +
          (contract.bigBranchBoost || 0);
        const clusterBig = Math.random() < Math.min(0.75, bigChance);
        const baseVOpen =
          rand(0.3, 0.62) + (tier.id === "high" ? 0.05 : 0) + species.splayBias;

        for (const side of [-1, 1]) {
          const isBig = clusterBig && Math.random() < 0.76;
          const branchDeadness = clamp(
            rand(0, 0.72) + deadness * 0.35 + (isBig ? 0.06 : 0),
            0,
            1
          );
          const baseLength = tier.id === "high" ? rand(62, 122) : rand(50, 106);
          const sideVariance = rand(0.92, 1.08);
          const length =
            baseLength *
              sideVariance *
              species.branchLengthMul *
              (isBig ? rand(1.28, 1.58) : rand(0.9, 1.12)) +
            branchDeadness * 16 +
            level * 2;
          const thickness = clamp(
            (length / 26) * rand(0.8, 1.2) * (isBig ? 1.16 : 0.94),
            3.5,
            10.8
          );
          const mass =
            (length / 86) *
            (0.88 + branchDeadness * 1.12) *
            (isBig ? 1.45 : 1) *
            species.branchMassMul;
          const splayAngle = clamp(
            baseVOpen + rand(-0.08, 0.08) - branchDeadness * 0.1,
            0.14,
            0.88
          );

          const branch = {
            id: `${id}-b${branchIndex}`,
            side,
            tier: tier.id,
            cluster,
            isBig,
            mass,
            splayAngle,
            heightRatio: anchorRatio,
            length,
            thickness,
            deadness: branchDeadness,
            cut: false,
          };
          branch.maxHp = getBranchDurability(branch, false);
          branch.hp = branch.maxHp;
          branch.hitFlash = 0;
          branches.push(branch);
          branchIndex += 1;
        }
      }
    }

    return {
      id,
      x,
      baseY: WORLD.groundY,
      height,
      radius,
      deadness,
      deadBias,
      lean,
      trunkCurve,
      species,
      isBoss: false,
      wedge: 0,
      cutCount: 0,
      sway: lean,
      imbalance: 0,
      axeBias: 0,
      axe: createAxePlan(false, height, radius, deadness),
      branches,
      safeDirections: [-1, 1],
      safeDirectionHint: 0,
      falling: false,
      fallen: false,
      angle: 0,
      angularVelocity: 0,
    };
  }

  function createBossTree(id, x, level, contract) {
    const tree = createTree(id, x, level + 1, contract);
    tree.isBoss = true;
    tree.height *= rand(1.26, 1.38);
    tree.radius *= rand(1.18, 1.32);
    tree.deadness = clamp(tree.deadness + rand(0.04, 0.11), 0.08, 0.84);
    tree.deadBias *= 1.28;
    tree.trunkCurve *= 1.3;
    tree.axeBias = 0;
    tree.axe = createAxePlan(true, tree.height, tree.radius, tree.deadness);

    for (const branch of tree.branches) {
      const tierMul = branch.tier === "high" ? 1.2 : 1.08;
      branch.length *= rand(1.1, 1.22) * tierMul;
      branch.thickness = clamp(branch.thickness * rand(1.14, 1.3), 4.5, 15.5);
      branch.mass *= rand(1.24, 1.46) * (branch.tier === "high" ? 1.1 : 1);
      if (branch.tier === "high" && Math.random() < 0.85) {
        branch.isBig = true;
      }
      branch.maxHp = getBranchDurability(branch, true);
      branch.hp = branch.maxHp;
      branch.hitFlash = 0;
    }

    let nextIndex = tree.branches.length;
    const extraTiers = [
      { id: "low", anchor: 0.38, length: [84, 146] },
      { id: "high", anchor: 0.73, length: [102, 176] },
    ];
    for (const tier of extraTiers) {
      for (const side of [-1, 1]) {
        const fanCount = Math.random() < 0.45 ? 3 : 2;
        for (let i = 0; i < fanCount; i += 1) {
          const spread = (i - (fanCount - 1) / 2) * 0.045;
          const branchDeadness = clamp(rand(0.08, 0.74) + tree.deadness * 0.3, 0, 1);
          const length =
            rand(tier.length[0], tier.length[1]) +
            branchDeadness * 18 +
            level * 4;
          const thickness = clamp((length / 25) * rand(0.88, 1.24), 5.2, 15.2);
          const branch = {
            id: `${id}-boss-b${nextIndex}`,
            side,
            tier: tier.id,
            cluster: 9 + i,
            isBig: true,
            mass: (length / 84) * (1.22 + branchDeadness * 1.4),
            splayAngle: clamp(rand(0.26, 0.72) - branchDeadness * 0.08, 0.16, 0.9),
            heightRatio: clamp(tier.anchor + spread + rand(-0.02, 0.02), 0.24, 0.95),
            length,
            thickness,
            deadness: branchDeadness,
            cut: false,
          };
          branch.maxHp = getBranchDurability(branch, true);
          branch.hp = branch.maxHp;
          branch.hitFlash = 0;
          tree.branches.push(branch);
          nextIndex += 1;
        }
      }
    }

    return tree;
  }

  function trunkHitsHazardAtAngle(baseX, baseY, height, radius, angle, hazard) {
    const tipX = baseX + Math.sin(angle) * height;
    const tipY = baseY - Math.cos(angle) * height;
    const rect = rectFromHazard(hazard);

    if (pointInRect(baseX, baseY, rect) || pointInRect(tipX, tipY, rect)) {
      return true;
    }

    const edges = [
      [rect.x, rect.y, rect.x + rect.w, rect.y],
      [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
      [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
      [rect.x, rect.y + rect.h, rect.x, rect.y],
    ];
    const trunkA = { x: baseX, y: baseY };
    const trunkB = { x: tipX, y: tipY };
    for (const edge of edges) {
      const edgeA = { x: edge[0], y: edge[1] };
      const edgeB = { x: edge[2], y: edge[3] };
      if (segmentsIntersect(trunkA, trunkB, edgeA, edgeB)) {
        return true;
      }
    }

    const centerX = hazard.x;
    const centerY = hazard.y - hazard.h * 0.55;
    const buffer = Math.max(hazard.w, hazard.h) * 0.36 + radius * 0.6;
    const distSq = pointToSegmentDistanceSq(
      centerX,
      centerY,
      baseX,
      baseY,
      tipX,
      tipY
    );
    return distSq <= buffer * buffer;
  }

  function directionHitsHazards(tree, hazards, direction) {
    const steps = 20;
    for (let i = 0; i <= steps; i += 1) {
      const angle = direction * (Math.PI / 2) * (i / steps);
      for (const hazard of hazards) {
        if (
          trunkHitsHazardAtAngle(
            tree.x,
            tree.baseY,
            tree.height,
            tree.radius,
            angle,
            hazard
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }

  function getSafeDirectionsForTree(tree, hazards) {
    const safe = [];
    if (!directionHitsHazards(tree, hazards, -1)) {
      safe.push(-1);
    }
    if (!directionHitsHazards(tree, hazards, 1)) {
      safe.push(1);
    }
    return safe;
  }

  function allTreesRemainSafe(trees, hazards) {
    for (const tree of trees) {
      if (getSafeDirectionsForTree(tree, hazards).length === 0) {
        return false;
      }
    }
    return true;
  }

  function applySafetyBiasToTrees(trees, hazards) {
    for (const tree of trees) {
      const safeDirections = getSafeDirectionsForTree(tree, hazards);
      tree.safeDirections = safeDirections;
      tree.safeDirectionHint = safeDirections.length === 1 ? safeDirections[0] : 0;
      if (safeDirections.length === 1) {
        const safe = safeDirections[0];
        tree.deadBias = safe * Math.max(0.2, Math.abs(tree.deadBias));
        tree.lean = safe * Math.max(0.012, Math.abs(tree.lean));
        tree.sway = tree.lean;
      }
    }
  }

  function createHazards(trees, level) {
    const count = clamp(3 + Math.floor(level / 2), 3, 5);
    const slots = [];
    const left = 120;
    const right = WORLD.width - 120;

    for (let i = 0; i < 12; i += 1) {
      const t = i / 11;
      slots.push(lerp(left, right, t));
    }

    const safeSlots = slots.filter((slotX) => {
      for (const tree of trees) {
        if (Math.abs(slotX - tree.x) < 80) {
          return false;
        }
      }
      return true;
    });

    let bestHazards = [];
    for (let attempt = 0; attempt < 36; attempt += 1) {
      const candidateSlots = shuffled(safeSlots);
      const hazards = [];

      for (const slot of candidateSlots) {
        if (hazards.length >= count) {
          break;
        }
        const x = slot + rand(-22, 22);
        const type = choose(["house", "car", "car", "house", "oldlady"]);
        const preset = HAZARD_TYPES[type];
        const hazard = {
          id: `hazard-${level}-${hazards.length}`,
          type,
          x,
          y: WORLD.groundY,
          w: preset.w,
          h: preset.h,
          damaged: false,
          impactFlash: 0,
        };

        const nextHazards = hazards.concat(hazard);
        if (allTreesRemainSafe(trees, nextHazards)) {
          hazards.push(hazard);
        }
      }

      if (hazards.length > bestHazards.length) {
        bestHazards = hazards;
      }
      if (hazards.length >= count) {
        break;
      }
    }

    if (
      bestHazards.length > 0 &&
      !bestHazards.some((hazard) => hazard.type === "oldlady")
    ) {
      const elderPreset = HAZARD_TYPES.oldlady;
      const replaceOrder = shuffled(bestHazards.map((_, idx) => idx));
      for (const idx of replaceOrder) {
        const converted = {
          ...bestHazards[idx],
          type: "oldlady",
          w: elderPreset.w,
          h: elderPreset.h,
          damaged: false,
          impactFlash: 0,
        };
        const testHazards = bestHazards.slice();
        testHazards[idx] = converted;
        if (allTreesRemainSafe(trees, testHazards)) {
          bestHazards = testHazards;
          break;
        }
      }
    }

    applySafetyBiasToTrees(trees, bestHazards);
    return bestHazards;
  }

  function addTrauma(amount) {
    state.camera.trauma = clamp(state.camera.trauma + amount, 0, 1);
  }

  function updateCameraShake(dt) {
    const power = state.camera.trauma * state.camera.trauma;
    const magnitude = power * 16;
    state.camera.x = (Math.random() * 2 - 1) * magnitude;
    state.camera.y = (Math.random() * 2 - 1) * magnitude * 0.7;
    state.camera.trauma = Math.max(0, state.camera.trauma - dt * 1.85);
  }

  function triggerAdrenaline(tree) {
    if (!tree) {
      return;
    }
    state.adrenaline.duration = 1;
    state.adrenaline.timer = 1;
    state.adrenaline.sourceTreeId = tree.id;
    addTrauma(0.34);
    addCallout(
      tree.isBoss ? "BOSS TIMBER MOMENT" : "Timber!",
      tree.isBoss ? "#ffd9a3" : "#f4efc3",
      1.1
    );
  }

  function seedBirds(trees, level) {
    state.birds = [];
    let birdIndex = 0;
    for (const tree of trees) {
      const branchPool = tree.branches.filter((b) => !b.cut && b.tier === "high");
      if (branchPool.length === 0) {
        continue;
      }
      const baseCount = tree.isBoss ? 4 : 1 + Math.floor(Math.random() * 2);
      const extra = level >= 4 ? 1 : 0;
      const count = Math.min(branchPool.length, baseCount + extra);
      const picks = shuffled(branchPool).slice(0, count);
      for (const branch of picks) {
        const seg = getBranchSegment(tree, branch);
        state.birds.push({
          id: `bird-${birdIndex}`,
          treeId: tree.id,
          branchId: branch.id,
          perched: true,
          x: seg.x2,
          y: seg.y2 - 2,
          vx: 0,
          vy: 0,
          wingPhase: rand(0, Math.PI * 2),
          size: rand(4.2, 7.8),
          tint: Math.random() < 0.4 ? "#2d2f38" : "#3c403f",
        });
        birdIndex += 1;
      }
    }
  }

  function launchBird(bird, x, y, biasDirection = 1) {
    bird.perched = false;
    bird.x = x;
    bird.y = y;
    const dir = Math.sign(biasDirection) || 1;
    bird.vx = dir * rand(90, 210) + state.wind * 80;
    bird.vy = -rand(130, 240);
  }

  function frightenBirdsNear(x, y, radius, preferredDirection = 1) {
    const radiusSq = radius * radius;
    for (const bird of state.birds) {
      if (!bird.perched) {
        continue;
      }
      const dx = bird.x - x;
      const dy = bird.y - y;
      if (dx * dx + dy * dy <= radiusSq) {
        launchBird(bird, bird.x, bird.y, dx === 0 ? preferredDirection : Math.sign(dx));
      }
    }
  }

  function frightenBirdsOnTree(tree) {
    for (const bird of state.birds) {
      if (bird.perched && bird.treeId === tree.id) {
        launchBird(bird, bird.x, bird.y, Math.sign(tree.imbalance || tree.wedge || 1));
      }
    }
  }

  function addCallout(text, color = "#f4f5d5", life = 2.2) {
    state.callouts.push({
      text,
      color,
      life,
      maxLife: life,
      drift: rand(8, 20),
    });
    if (state.callouts.length > 5) {
      state.callouts.splice(0, state.callouts.length - 5);
    }
  }

  function getShowtimeButtonRect() {
    return {
      x: 34,
      y: 224,
      w: 248,
      h: 44,
    };
  }

  function nextNickQuote() {
    const quote = NICK_QUOTES[state.nickQuoteIndex % NICK_QUOTES.length];
    state.nickQuoteIndex = (state.nickQuoteIndex + 1) % NICK_QUOTES.length;
    return quote;
  }

  function setNickSpeech(text, life = 3.1) {
    state.nickSpeech.text = text;
    state.nickSpeech.life = life;
    state.nickSpeech.maxLife = life;
  }

  function spawnNickNote() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const yBase = WORLD.groundY + state.nickY + (state.showtime.sway || 0);
    state.nickNotes.push({
      x: state.nickX + side * rand(20, 52),
      y: yBase - rand(86, 112),
      vx: side * rand(10, 24),
      vy: -rand(36, 62),
      size: rand(8, 12),
      life: rand(0.7, 1.2),
      maxLife: 0,
      kind: Math.random() < 0.58 ? 0 : 1,
      phase: rand(0, Math.PI * 2),
    });
    const newest = state.nickNotes[state.nickNotes.length - 1];
    newest.maxLife = newest.life;
    if (state.nickNotes.length > 24) {
      state.nickNotes.splice(0, state.nickNotes.length - 24);
    }
  }

  function toggleNickShowtime(forceActive) {
    const next =
      typeof forceActive === "boolean" ? forceActive : !state.showtime.active;
    if (next === state.showtime.active) {
      return;
    }
    state.showtime.active = next;
    if (next) {
      state.showtime.phase = 0;
      state.showtime.noteTimer = 0.08;
      state.showtime.quoteTimer = rand(4.2, 6.4);
      setNickSpeech(nextNickQuote(), 3.5);
      addCallout("Nick fires up fiddle dance mode.", "#ffe4b5", 1.5);
    } else {
      state.showtime.noteTimer = 0.35;
      state.showtime.quoteTimer = 3.8;
      setNickSpeech("Back to timber business.", 1.6);
      addCallout("Showtime off.", "#d2e7ff", 1.2);
    }
  }

  function spawnAmbientParticle(contract, fromTop = false) {
    const ambient = contract.ambient || "pollen";
    if (ambient === "rain") {
      state.ambientParticles.push({
        kind: "rain",
        x: rand(-40, WORLD.width + 40),
        y: fromTop ? rand(-220, -20) : rand(-120, WORLD.groundY),
        vx: state.wind * 90 + rand(-18, 24),
        vy: rand(360, 520),
        len: rand(10, 22),
        thickness: rand(0.8, 1.8),
        alpha: rand(0.22, 0.48),
      });
      return;
    }

    if (ambient === "firefly") {
      state.ambientParticles.push({
        kind: "firefly",
        x: rand(20, WORLD.width - 20),
        y: rand(120, WORLD.groundY - 24),
        vx: rand(-16, 16),
        vy: rand(-12, 12),
        phase: rand(0, Math.PI * 2),
        radius: rand(1.2, 2.8),
        life: rand(7, 12),
        maxLife: 0,
      });
      const newest = state.ambientParticles[state.ambientParticles.length - 1];
      newest.maxLife = newest.life;
      return;
    }

    state.ambientParticles.push({
      kind: "pollen",
      x: rand(-20, WORLD.width + 20),
      y: rand(20, WORLD.groundY - 20),
      vx: rand(8, 25),
      vy: rand(-7, 9),
      phase: rand(0, Math.PI * 2),
      radius: rand(1.2, 3.2),
      alpha: rand(0.14, 0.4),
    });
  }

  function seedAmbientParticles(contract) {
    state.ambientParticles = [];
    const ambient = contract.ambient || "pollen";
    const count = ambient === "rain" ? 120 : ambient === "firefly" ? 44 : 70;
    for (let i = 0; i < count; i += 1) {
      spawnAmbientParticle(contract);
    }
  }

  function updateAmbient(dt) {
    const contract = state.contract || CONTRACTS[0];
    const ambient = contract.ambient || "pollen";

    for (let i = state.ambientParticles.length - 1; i >= 0; i -= 1) {
      const p = state.ambientParticles[i];
      if (p.kind === "rain") {
        p.vx = lerp(p.vx, state.wind * 120, clamp(dt * 2.4, 0, 1));
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > WORLD.groundY + 26 || p.x < -120 || p.x > WORLD.width + 120) {
          p.x = rand(-40, WORLD.width + 40);
          p.y = rand(-220, -20);
        }
      } else if (p.kind === "firefly") {
        p.life -= dt;
        p.x += (p.vx + Math.sin(state.elapsed * 1.8 + p.phase) * 10) * dt;
        p.y += (p.vy + Math.cos(state.elapsed * 1.4 + p.phase) * 7) * dt;
        p.vx = clamp(p.vx + rand(-4, 4) * dt, -18, 18);
        p.vy = clamp(p.vy + rand(-3, 3) * dt, -13, 13);
        if (
          p.life <= 0 ||
          p.x < -40 ||
          p.x > WORLD.width + 40 ||
          p.y < 80 ||
          p.y > WORLD.groundY + 10
        ) {
          state.ambientParticles.splice(i, 1);
          spawnAmbientParticle(contract);
        }
      } else {
        p.x += (p.vx + state.wind * 36 + Math.sin(state.elapsed * 1.2 + p.phase) * 10) * dt;
        p.y += (p.vy + Math.cos(state.elapsed * 1.9 + p.phase) * 6) * dt;
        if (p.x > WORLD.width + 30) {
          p.x = -20;
        } else if (p.x < -30) {
          p.x = WORLD.width + 20;
        }
        if (p.y > WORLD.groundY - 10) {
          p.y = 16;
        } else if (p.y < 10) {
          p.y = WORLD.groundY - 20;
        }
      }
    }

    if (ambient === "rain" && Math.random() < dt * 18) {
      spawnAmbientParticle(contract, true);
    } else if (ambient === "firefly" && state.ambientParticles.length < 44) {
      spawnAmbientParticle(contract);
    }
  }

  function updateCallouts(dt) {
    for (let i = state.callouts.length - 1; i >= 0; i -= 1) {
      state.callouts[i].life -= dt;
      if (state.callouts[i].life <= 0) {
        state.callouts.splice(i, 1);
      }
    }
  }

  function updateBirds(dt) {
    for (let i = state.birds.length - 1; i >= 0; i -= 1) {
      const bird = state.birds[i];
      bird.wingPhase += dt * 12;
      if (bird.perched) {
        const tree = state.trees.find((t) => t.id === bird.treeId);
        const branch = tree ? tree.branches.find((b) => b.id === bird.branchId) : null;
        if (!tree || !branch || branch.cut || tree.fallen || tree.falling) {
          const dir = tree ? Math.sign(tree.imbalance || tree.wedge || 1) : 1;
          launchBird(bird, bird.x, bird.y, dir);
          continue;
        }
        const seg = getBranchSegment(tree, branch);
        bird.x = seg.x2 + Math.sin(state.elapsed * 1.6 + bird.wingPhase) * 2.4;
        bird.y = seg.y2 - 3 + Math.cos(state.elapsed * 1.9 + bird.wingPhase) * 1.9;
      } else {
        bird.vx = lerp(bird.vx, bird.vx + state.wind * 25, clamp(dt * 0.4, 0, 1));
        bird.vy += 220 * dt;
        bird.x += bird.vx * dt;
        bird.y += bird.vy * dt;
        if (
          bird.x < -140 ||
          bird.x > WORLD.width + 140 ||
          bird.y < -120 ||
          bird.y > WORLD.groundY + 80
        ) {
          state.birds.splice(i, 1);
        }
      }
    }
  }

  function getOldLadyCounts() {
    let total = 0;
    let hit = 0;
    for (const hazard of state.hazards) {
      if (hazard.type !== "oldlady") {
        continue;
      }
      total += 1;
      if (hazard.damaged) {
        hit += 1;
      }
    }
    return {
      total,
      hit,
      saved: Math.max(0, total - hit),
    };
  }

  function spawnCrashBurst(hazard, tree, fatal = false) {
    const cx = hazard.x;
    const cy = hazard.y - hazard.h * 0.42;
    const chunkCount = fatal ? 24 : 16;
    const chunks = [];
    for (let i = 0; i < chunkCount; i += 1) {
      const ang = rand(0, Math.PI * 2);
      const speed = rand(fatal ? 120 : 90, fatal ? 330 : 240);
      chunks.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * speed + Math.sign(tree.angle || tree.imbalance || 1) * 26,
        vy: Math.sin(ang) * speed - rand(30, 110),
        size: rand(2.4, fatal ? 7.6 : 5.6),
        life: rand(0.4, fatal ? 1.25 : 0.95),
        maxLife: 0,
      });
    }
    for (const chunk of chunks) {
      chunk.maxLife = chunk.life;
    }

    state.crashBursts.push({
      x: cx,
      y: cy,
      life: fatal ? 1.4 : 1.15,
      maxLife: fatal ? 1.4 : 1.15,
      radius: Math.max(hazard.w, hazard.h) * (fatal ? 0.5 : 0.42),
      fatal,
      chunks,
    });
    if (state.crashBursts.length > 18) {
      state.crashBursts.splice(0, state.crashBursts.length - 18);
    }
    hazard.impactFlash = 1;
  }

  function updateCrashBursts(dt) {
    for (const hazard of state.hazards) {
      if (hazard.impactFlash > 0) {
        hazard.impactFlash = Math.max(0, hazard.impactFlash - dt * 1.7);
      }
    }

    for (let i = state.crashBursts.length - 1; i >= 0; i -= 1) {
      const burst = state.crashBursts[i];
      burst.life -= dt;
      for (let j = burst.chunks.length - 1; j >= 0; j -= 1) {
        const chunk = burst.chunks[j];
        chunk.life -= dt;
        chunk.vy += 360 * dt;
        chunk.x += chunk.vx * dt;
        chunk.y += chunk.vy * dt;
        if (chunk.life <= 0 || chunk.y > WORLD.groundY + 70) {
          burst.chunks.splice(j, 1);
        }
      }
      if (burst.life <= 0 && burst.chunks.length === 0) {
        state.crashBursts.splice(i, 1);
      }
    }
  }

  function chooseTreeCatBranch(excludeTreeId = "", excludeBranchId = "") {
    const candidates = [];
    for (const tree of state.trees) {
      if (tree.fallen || tree.falling) {
        continue;
      }
      for (const branch of tree.branches) {
        if (branch.cut) {
          continue;
        }
        if (tree.id === excludeTreeId && branch.id === excludeBranchId) {
          continue;
        }
        const score =
          (branch.tier === "high" ? 1.35 : 0.8) +
          (branch.isBig ? 0.55 : 0) +
          rand(0, 0.4);
        candidates.push({ tree, branch, score });
      }
    }
    if (candidates.length === 0) {
      return null;
    }
    candidates.sort((a, b) => b.score - a.score);
    const topSlice = candidates.slice(0, Math.min(7, candidates.length));
    return choose(topSlice);
  }

  function placeTreeCatOnBranch(cat, tree, branch) {
    const seg = getBranchSegment(tree, branch);
    cat.treeId = tree.id;
    cat.branchId = branch.id;
    cat.x = seg.x2;
    cat.y = seg.y2 - 8;
    cat.facing = branch.side < 0 ? -1 : 1;
    cat.moving = false;
    cat.moveProgress = 0;
    cat.moveTimer = rand(1.6, 3.6);
    cat.targetTreeId = "";
    cat.targetBranchId = "";
  }

  function spawnTreeCat(level) {
    const chance = clamp(0.24 + level * 0.08, 0.24, 0.58);
    if (Math.random() > chance) {
      state.treeCat = null;
      return;
    }
    const pick = chooseTreeCatBranch();
    if (!pick) {
      state.treeCat = null;
      return;
    }
    const cat = {
      id: `cat-${level}`,
      treeId: pick.tree.id,
      branchId: pick.branch.id,
      x: 0,
      y: 0,
      facing: pick.branch.side < 0 ? -1 : 1,
      moving: false,
      moveProgress: 0,
      moveDuration: 0.58,
      moveTimer: rand(1.4, 3.1),
      sourceTreeId: "",
      sourceBranchId: "",
      targetTreeId: "",
      targetBranchId: "",
      sourceX: 0,
      sourceY: 0,
      targetX: 0,
      targetY: 0,
      dying: false,
      redness: 0,
      fade: 1,
      deathTimer: 0,
      wobblePhase: rand(0, Math.PI * 2),
    };
    placeTreeCatOnBranch(cat, pick.tree, pick.branch);
    state.treeCat = cat;
    addCallout("Cat in a tree: protect it.", "#ffd9ef", 2.2);
  }

  function beginTreeCatMove(cat, targetTree, targetBranch) {
    const targetSeg = getBranchSegment(targetTree, targetBranch);
    cat.moving = true;
    cat.moveProgress = 0;
    cat.moveDuration = rand(0.38, 0.74);
    cat.sourceTreeId = cat.treeId;
    cat.sourceBranchId = cat.branchId;
    cat.targetTreeId = targetTree.id;
    cat.targetBranchId = targetBranch.id;
    cat.sourceX = cat.x;
    cat.sourceY = cat.y;
    cat.targetX = targetSeg.x2;
    cat.targetY = targetSeg.y2 - 8;
    cat.facing = cat.targetX >= cat.sourceX ? 1 : -1;
  }

  function isTreeCatOnBranch(treeId, branchId) {
    const cat = state.treeCat;
    if (!cat || cat.dying) {
      return false;
    }
    if (cat.treeId === treeId && cat.branchId === branchId) {
      return true;
    }
    if (!cat.moving) {
      return false;
    }
    return (
      (cat.sourceTreeId === treeId && cat.sourceBranchId === branchId) ||
      (cat.targetTreeId === treeId && cat.targetBranchId === branchId)
    );
  }

  function shooTreeCatFromBranch(treeId, branchId) {
    const cat = state.treeCat;
    if (!cat || cat.dying || cat.moving) {
      return false;
    }
    if (cat.treeId !== treeId || cat.branchId !== branchId) {
      return false;
    }
    const fallback = chooseTreeCatBranch(treeId, branchId);
    if (!fallback) {
      return false;
    }
    beginTreeCatMove(cat, fallback.tree, fallback.branch);
    return true;
  }

  function shouldBlockCatBranchCut(tree, branch, fromPlayer = false) {
    if (!isTreeCatOnBranch(tree.id, branch.id)) {
      return false;
    }
    if (fromPlayer) {
      shooTreeCatFromBranch(tree.id, branch.id);
      if (state.elapsed - state.catGuardWarnAt > 0.5) {
        addCallout("Cat on that limb: pick another cut.", "#ffd7a7", 1.35);
        setNickSpeech("Easy now, kitty!", 1.2);
        state.catGuardWarnAt = state.elapsed;
      }
    }
    return true;
  }

  function updateTreeCat(dt) {
    const cat = state.treeCat;
    if (!cat) {
      return;
    }

    if (cat.dying) {
      cat.deathTimer -= dt;
      cat.fade = clamp(cat.deathTimer / 0.95, 0, 1);
      cat.redness = 1;
      cat.wobblePhase += dt * 8;
      cat.y += dt * 28;
      if (cat.deathTimer <= 0) {
        state.treeCat = null;
      }
      return;
    }

    if (state.mode !== "playing") {
      return;
    }

    cat.wobblePhase += dt * 3.4;
    if (cat.moving) {
      cat.moveProgress = clamp(cat.moveProgress + dt / cat.moveDuration, 0, 1);
      const t = cat.moveProgress;
      const arc = Math.sin(t * Math.PI) * 26;
      cat.x = lerp(cat.sourceX, cat.targetX, t);
      cat.y = lerp(cat.sourceY, cat.targetY, t) - arc;
      if (t >= 1) {
        const tree = state.trees.find((entry) => entry.id === cat.targetTreeId);
        const branch = tree
          ? tree.branches.find((entry) => entry.id === cat.targetBranchId)
          : null;
        if (tree && branch && !tree.fallen && !tree.falling && !branch.cut) {
          placeTreeCatOnBranch(cat, tree, branch);
        } else {
          const fallback = chooseTreeCatBranch(cat.treeId, cat.branchId);
          if (fallback) {
            placeTreeCatOnBranch(cat, fallback.tree, fallback.branch);
          } else {
            state.treeCat = null;
          }
        }
      }
      return;
    }

    const tree = state.trees.find((entry) => entry.id === cat.treeId);
    const branch = tree
      ? tree.branches.find((entry) => entry.id === cat.branchId)
      : null;

    if (!tree || !branch || branch.cut) {
      const fallback = chooseTreeCatBranch(cat.treeId, cat.branchId);
      if (fallback) {
        beginTreeCatMove(cat, fallback.tree, fallback.branch);
      } else {
        state.treeCat = null;
        addCallout("Cat escaped the site.", "#d8f0ff", 1.3);
      }
      return;
    }

    if (tree.fallen || tree.falling) {
      const emergency = chooseTreeCatBranch(cat.treeId, cat.branchId);
      if (emergency) {
        beginTreeCatMove(cat, emergency.tree, emergency.branch);
      } else {
        state.treeCat = null;
        addCallout("Cat escaped the site.", "#d8f0ff", 1.3);
      }
      return;
    }

    const seg = getBranchSegment(tree, branch);
    cat.x = seg.x2 + Math.sin(state.elapsed * 2.1 + cat.wobblePhase) * 2.4;
    cat.y = seg.y2 - 8 + Math.cos(state.elapsed * 2.5 + cat.wobblePhase) * 1.6;
    cat.moveTimer -= dt;
    if (cat.moveTimer <= 0) {
      const nextSpot = chooseTreeCatBranch(cat.treeId, cat.branchId);
      if (nextSpot) {
        beginTreeCatMove(cat, nextSpot.tree, nextSpot.branch);
      } else {
        cat.moveTimer = rand(1.4, 2.8);
      }
    }
  }

  function scheduleNextGust(contract) {
    state.gust.cooldown = rand(contract.gustInterval[0], contract.gustInterval[1]);
  }

  function spawnWindTrail(dir, strength) {
    const startX = dir > 0 ? -120 : WORLD.width + 120;
    state.windTrails.push({
      x: startX + rand(-22, 22),
      y: rand(86, WORLD.groundY - 120),
      vx: dir * rand(240, 420) * (0.62 + strength * 2.2),
      curve: rand(-26, 26),
      life: rand(0.85, 1.4),
      maxLife: 0,
      thickness: rand(0.6, 2.2),
      phase: rand(0, Math.PI * 2),
    });
    const newest = state.windTrails[state.windTrails.length - 1];
    newest.maxLife = newest.life;
    if (state.windTrails.length > 180) {
      state.windTrails.splice(0, state.windTrails.length - 180);
    }
  }

  function triggerGust(contract) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const strength = rand(contract.gustStrength[0], contract.gustStrength[1]);
    const duration = rand(contract.gustDuration[0], contract.gustDuration[1]);
    state.gust.active = true;
    state.gust.timer = duration;
    state.gust.duration = duration;
    state.gust.dir = dir;
    state.gust.strength = strength;

    const burst = 8 + Math.floor(strength * 20);
    for (let i = 0; i < burst; i += 1) {
      spawnWindTrail(dir, strength);
    }

    addCallout(
      `${dir > 0 ? "Crosswind right" : "Crosswind left"} ${strength.toFixed(2)}`,
      contract.accent || "#dcecff",
      1.8
    );
    addTrauma(0.12 + strength * 0.28);
  }

  function updateWindTrails(dt) {
    for (let i = state.windTrails.length - 1; i >= 0; i -= 1) {
      const trail = state.windTrails[i];
      trail.life -= dt;
      trail.x += trail.vx * dt;
      trail.y += Math.sin(state.elapsed * 2.6 + trail.phase) * 22 * dt;
      if (
        trail.life <= 0 ||
        trail.x < -180 ||
        trail.x > WORLD.width + 180 ||
        trail.y > WORLD.groundY + 60
      ) {
        state.windTrails.splice(i, 1);
      }
    }
  }

  function updateWind(dt) {
    const contract = state.contract || CONTRACTS[0];
    const baseOscillation =
      Math.sin(state.elapsed * contract.windTempo + state.windPhase) * contract.windAmp;
    let gustMoment = 0;

    if (state.gust.active) {
      state.gust.timer -= dt;
      const fade = clamp(state.gust.timer / Math.max(0.2, state.gust.duration), 0, 1);
      gustMoment = state.gust.dir * state.gust.strength * (0.45 + 0.55 * fade);
      if (Math.random() < dt * (5 + state.gust.strength * 18)) {
        spawnWindTrail(state.gust.dir, state.gust.strength);
      }
      if (
        contract.ambient === "rain" &&
        Math.random() < dt * 1.2 &&
        state.lightningFlash <= 0
      ) {
        state.lightningFlash = rand(0.08, 0.16);
      }
      if (state.gust.timer <= 0) {
        state.gust.active = false;
        state.gust.timer = 0;
        state.gust.duration = 0;
        scheduleNextGust(contract);
      }
    } else {
      state.gust.cooldown -= dt;
      if (state.gust.cooldown <= 0) {
        triggerGust(contract);
      }
    }

    state.wind = clamp(state.levelWind + baseOscillation + gustMoment, -0.85, 0.85);
  }

  function startLevel(level) {
    const contract = chooseContract(level);
    const district = chooseDistrict(level);
    state.level = level;
    state.failReason = "";
    state.activeTier = "low";
    state.trunkCrashesThisLevel = 0;
    state.elapsed = 0;
    state.contract = contract;
    state.district = district;
    state.bossTreeId = null;
    state.skyPreset = SKY_PRESETS[contract.skyPreset] || SKY_PRESETS.sunrise;
    state.flowStreak = 0;
    state.bestFlow = 0;
    state.flowTimer = 0;
    state.lastCutAt = -999;
    state.windTrails = [];
    state.crashBursts = [];
    state.birds = [];
    state.treeCat = null;
    state.catGuardWarnAt = -999;
    state.callouts = [];
    state.lightningFlash = 0;
    state.camera.x = 0;
    state.camera.y = 0;
    state.camera.trauma = 0;
    state.adrenaline.timer = 0;
    state.adrenaline.duration = 0;
    state.adrenaline.sourceTreeId = null;
    state.levelWind = rand(-0.22, 0.22) * contract.windBiasMul;
    state.windPhase = rand(0, Math.PI * 2);
    state.wind = state.levelWind;
    state.gust.active = false;
    state.gust.timer = 0;
    state.gust.duration = 0;
    state.gust.dir = 0;
    state.gust.strength = 0;
    scheduleNextGust(contract);
    state.levelReport = null;
    state.slashEchoes = [];
    state.chips = [];
    state.nickY = 0;
    state.nickVy = 0;
    state.nickNotes = [];
    if (state.showtime.active) {
      state.showtime.phase = 0;
      state.showtime.noteTimer = 0.14;
      state.showtime.quoteTimer = 0.8;
      setNickSpeech(nextNickQuote(), 2.8);
    } else {
      state.showtime.sway = 0;
      state.showtime.armSwing = 0;
      state.nickSpeech.text = "";
      state.nickSpeech.life = 0;
      state.nickSpeech.maxLife = 0;
    }

    const treeCount = clamp(
      2 + Math.floor(level * 0.8) + (contract.treeCountDelta || 0),
      2,
      6
    );
    const trees = [];
    const laneWidth = (WORLD.width - 280) / Math.max(1, treeCount - 1);

    for (let i = 0; i < treeCount; i += 1) {
      const x = 140 + laneWidth * i + rand(-35, 35);
      trees.push(createTree(`tree-${level}-${i}`, x, level, contract));
    }

    const hasBoss = level % 2 === 1 || level === MAX_LEVEL;
    if (hasBoss && trees.length > 0) {
      const bossIndex = Math.floor(trees.length * 0.5);
      const bossX = clamp(
        WORLD.width * 0.5 + rand(-85, 85),
        160,
        WORLD.width - 160
      );
      trees[bossIndex] = createBossTree(`boss-${level}`, bossX, level, contract);
      state.bossTreeId = trees[bossIndex].id;
    }

    state.trees = trees;
    state.hazards = createHazards(trees, level);
    state.selectedTreeId = trees.length > 0 ? trees[0].id : null;
    seedAmbientParticles(contract);
    seedBirds(trees, level);
    spawnTreeCat(level);
    addCallout(
      `${district.name}: ${district.tagline}`,
      contract.accent || "#f4f5d5",
      3.1
    );
    if (contract.introCallout) {
      addCallout(contract.introCallout, contract.accent || "#f4f5d5", 2.6);
    }
    if (state.bossTreeId) {
      addCallout("Boss tree on site: Heritage Giant", "#ffd9a6", 2.8);
    }
    const oldLady = getOldLadyCounts();
    if (oldLady.total > 0) {
      addCallout(
        `Protect old ladies: ${oldLady.total} on this block.`,
        "#ffd3dc",
        2.4
      );
    }
    state.mode = "playing";
  }

  function restartGame() {
    state.reputation = 100;
    state.totalCut = 0;
    state.totalSaved = 0;
    state.totalDamaged = 0;
    startLevel(1);
  }

  function getTreeDisplayAngle(tree) {
    return tree.falling || tree.fallen ? tree.angle : tree.sway;
  }

  function getTrunkUnit(tree) {
    const a = getTreeDisplayAngle(tree);
    return { x: Math.sin(a), y: -Math.cos(a) };
  }

  function getPerpUnit(tree) {
    const a = getTreeDisplayAngle(tree);
    return { x: Math.cos(a), y: Math.sin(a) };
  }

  function getBranchSegment(tree, branch) {
    const trunkUnit = getTrunkUnit(tree);
    const perp = getPerpUnit(tree);
    const anchorDistance = tree.height * branch.heightRatio;
    const sx = tree.x + trunkUnit.x * anchorDistance;
    const sy = tree.baseY + trunkUnit.y * anchorDistance;
    const splay = branch.splayAngle ?? 0;
    const outwardWeight = Math.cos(splay);
    const upwardWeight = Math.sin(splay);
    const dirX = perp.x * branch.side * outwardWeight + trunkUnit.x * upwardWeight;
    const dirY = perp.y * branch.side * outwardWeight + trunkUnit.y * upwardWeight;
    const ex = sx + dirX * branch.length;
    const ey = sy + dirY * branch.length;
    return {
      x1: sx,
      y1: sy,
      x2: ex,
      y2: ey,
    };
  }

  function getNickBodyPoint() {
    const danceOffset = state.showtime.sway || 0;
    return {
      x: state.nickX,
      y: WORLD.groundY + state.nickY + danceOffset - 28,
    };
  }

  function getTrunkTipForAngle(tree, angle) {
    return {
      x: tree.x + Math.sin(angle) * tree.height,
      y: tree.baseY - Math.cos(angle) * tree.height,
    };
  }

  function getNickTrunkClearance(tree, angle) {
    const nick = getNickBodyPoint();
    const tip = getTrunkTipForAngle(tree, angle);
    return Math.sqrt(
      pointToSegmentDistanceSq(nick.x, nick.y, tree.x, tree.baseY, tip.x, tip.y)
    );
  }

  function getNickFallClearance(tree, direction) {
    const dir = Math.sign(direction) || 1;
    const targetAngle = dir * (Math.PI / 2);
    const sampleA = lerp(tree.sway, targetAngle, 0.52);
    const sampleB = lerp(tree.sway, targetAngle, 0.78);
    const sampleC = targetAngle;
    return Math.min(
      getNickTrunkClearance(tree, sampleA),
      getNickTrunkClearance(tree, sampleB),
      getNickTrunkClearance(tree, sampleC)
    );
  }

  function chooseNickSafeFallDirection(tree, preferredDirection) {
    const leftClear = getNickFallClearance(tree, -1);
    const rightClear = getNickFallClearance(tree, 1);
    const required = tree.radius * 0.7 + NICK_BODY_RADIUS + 12;

    let chosen = Math.sign(preferredDirection);
    if (chosen === 0) {
      chosen = rightClear >= leftClear ? 1 : -1;
    }

    let chosenClear = chosen > 0 ? rightClear : leftClear;
    const altClear = chosen > 0 ? leftClear : rightClear;
    if (chosenClear < required && altClear > chosenClear + 3) {
      chosen *= -1;
      chosenClear = altClear;
    }
    if (chosenClear < required) {
      chosen = rightClear >= leftClear ? 1 : -1;
    }
    return chosen;
  }

  function computeTreeImbalance(tree) {
    let branchMoment = 0;
    let liveCount = 0;

    for (const branch of tree.branches) {
      if (branch.cut) {
        continue;
      }
      const massFactor =
        branch.mass ||
        (branch.length / 88) * (0.65 + branch.deadness * 1.2) * (branch.isBig ? 1.4 : 1);
      const tierBonus = branch.tier === "high" ? 0.18 : 0;
      const heightFactor = 0.45 + branch.heightRatio + tierBonus;
      branchMoment += branch.side * massFactor * heightFactor;
      liveCount += 1;
    }

    const deadMoment = tree.deadBias * (0.35 + tree.deadness * 1.7);
    const wedgeMoment = tree.wedge * 1.2;
    const windMoment = state.wind * (0.8 + tree.height / 320);
    const leanMoment = tree.lean * 2.6;
    const axeMoment = tree.axeBias || 0;

    const rawMoment =
      branchMoment + deadMoment + wedgeMoment + windMoment + leanMoment + axeMoment;
    const sizeResistance =
      1.1 + tree.height / 290 + tree.radius / 18 + liveCount * 0.05;

    tree.imbalance = rawMoment / sizeResistance;
    return tree.imbalance;
  }

  function autoFallThreshold(tree) {
    const base = 0.95;
    const deadBonus = tree.deadness * 0.22;
    const cutBonus = tree.cutCount * 0.03;
    const sizePenalty = tree.radius * 0.005;
    return clamp(base - deadBonus - cutBonus + sizePenalty, 0.4, 1.3);
  }

  function startFalling(tree, impetus = 0) {
    if (!tree || tree.falling || tree.fallen) {
      return;
    }

    const imbalance = computeTreeImbalance(tree);
    let direction = Math.sign(impetus);
    if (direction === 0) {
      direction = Math.sign(imbalance);
    }
    if (direction === 0) {
      direction = Math.sign(tree.wedge);
    }
    if (direction === 0) {
      direction = Math.sign(tree.deadBias);
    }
    if (direction === 0) {
      direction = Math.random() < 0.5 ? -1 : 1;
    }
    direction = chooseNickSafeFallDirection(tree, direction);

    tree.falling = true;
    tree.angle = tree.sway;
    tree.angularVelocity =
      direction *
      (0.28 + Math.min(1.4, Math.abs(imbalance)) * 0.22 + Math.abs(impetus) * 0.15);
    triggerAdrenaline(tree);
    frightenBirdsOnTree(tree);
    vibrate([20, 15, 30]);
  }

  function distanceSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  function pointToSegmentDistanceSq(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 1e-6) {
      return distanceSq(px, py, x1, y1);
    }
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
    const cx = x1 + dx * t;
    const cy = y1 + dy * t;
    return distanceSq(px, py, cx, cy);
  }

  function segmentsIntersect(a, b, c, d) {
    function orient(p, q, r) {
      return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    }

    function onSegment(p, q, r) {
      return (
        q.x >= Math.min(p.x, r.x) &&
        q.x <= Math.max(p.x, r.x) &&
        q.y >= Math.min(p.y, r.y) &&
        q.y <= Math.max(p.y, r.y)
      );
    }

    const o1 = orient(a, b, c);
    const o2 = orient(a, b, d);
    const o3 = orient(c, d, a);
    const o4 = orient(c, d, b);

    if (o1 * o2 < 0 && o3 * o4 < 0) {
      return true;
    }

    if (Math.abs(o1) < 1e-6 && onSegment(a, c, b)) {
      return true;
    }
    if (Math.abs(o2) < 1e-6 && onSegment(a, d, b)) {
      return true;
    }
    if (Math.abs(o3) < 1e-6 && onSegment(c, a, d)) {
      return true;
    }
    if (Math.abs(o4) < 1e-6 && onSegment(c, b, d)) {
      return true;
    }

    return false;
  }

  function spawnWoodChips(x, y, side, intensity = 1) {
    const scale = clamp(intensity, 0.25, 1.6);
    const count = Math.max(2, Math.round(7 * scale));
    for (let i = 0; i < count; i += 1) {
      const angle = rand(-0.9, 0.9) + (side > 0 ? 0.05 : Math.PI - 0.05);
      const speed = rand(80, 230) * (0.7 + scale * 0.35);
      state.chips.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: -Math.abs(Math.sin(angle) * speed) * rand(0.3, 1),
        life: rand(0.35, 0.75) * (0.78 + scale * 0.34),
        maxLife: 0,
      });
    }
    for (const chip of state.chips.slice(-count)) {
      chip.maxLife = chip.life;
    }
  }

  function getCandidateTree(x) {
    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const tree of state.trees) {
      if (tree.fallen) {
        continue;
      }
      const d = Math.abs(x - tree.x);
      if (d < bestDist) {
        bestDist = d;
        best = tree;
      }
    }
    return bestDist <= 240 ? best : null;
  }

  function updateSelectedTreeFromPointer() {
    const candidate = getCandidateTree(state.pointer.x);
    if (candidate) {
      state.selectedTreeId = candidate.id;
    }
  }

  function getSelectedTree() {
    return state.trees.find((tree) => tree.id === state.selectedTreeId) || null;
  }

  function cycleSelectedTree(step = 1) {
    const activeTrees = state.trees.filter((tree) => !tree.fallen);
    if (activeTrees.length === 0) {
      return;
    }
    const currentIndex = activeTrees.findIndex(
      (tree) => tree.id === state.selectedTreeId
    );
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + step + activeTrees.length) % activeTrees.length;
    state.selectedTreeId = activeTrees[nextIndex].id;
  }

  function getBranchCutCandidate(tree, side, tier) {
    const tierMatches = tree.branches.filter(
      (branch) => !branch.cut && branch.side === side && branch.tier === tier
    );
    if (tierMatches.length > 0) {
      return tierMatches.sort((a, b) => {
        const aScore = (a.mass || a.length) / Math.max(0.5, a.hp || a.maxHp || 1);
        const bScore = (b.mass || b.length) / Math.max(0.5, b.hp || b.maxHp || 1);
        return bScore - aScore;
      })[0];
    }

    const sideMatches = tree.branches.filter(
      (branch) => !branch.cut && branch.side === side
    );
    if (sideMatches.length === 0) {
      return null;
    }
    return sideMatches.sort((a, b) => {
      const aScore = (a.mass || a.length) / Math.max(0.5, a.hp || a.maxHp || 1);
      const bScore = (b.mass || b.length) / Math.max(0.5, b.hp || b.maxHp || 1);
      return bScore - aScore;
    })[0];
  }

  function getBranchDamageRatio(branch) {
    if (branch.cut) {
      return 1;
    }
    const maxHp = Math.max(0.01, branch.maxHp || 1);
    const hp = typeof branch.hp === "number" ? branch.hp : maxHp;
    return clamp((maxHp - hp) / maxHp, 0, 1);
  }

  function strikeBranch(tree, branch, seg, power) {
    if (branch.cut) {
      return { hit: false, severed: false };
    }
    if (shouldBlockCatBranchCut(tree, branch, true)) {
      branch.hitFlash = 0.16;
      return { hit: false, severed: false };
    }
    const maxHp = Math.max(0.01, branch.maxHp || 1);
    if (typeof branch.hp !== "number") {
      branch.hp = maxHp;
    }

    const damage = clamp(power, 0.22, 3.4);
    const nextHp = branch.hp - damage;
    if (nextHp <= 0) {
      branch.hp = 0;
      branch.hitFlash = 0.18;
      const severed = severBranch(tree, branch, seg);
      return { hit: true, severed };
    }

    branch.hp = nextHp;
    branch.hitFlash = 0.24;

    const impactX = lerp(seg.x1, seg.x2, 0.56);
    const impactY = lerp(seg.y1, seg.y2, 0.56);
    spawnWoodChips(impactX, impactY, branch.side, 0.36 + damage * 0.2);
    frightenBirdsNear(impactX, impactY, 112 + damage * 28, branch.side);
    addTrauma(branch.isBig ? 0.045 : 0.03);
    vibrate(branch.isBig ? 18 : 10);
    return { hit: true, severed: false };
  }

  function cutSelectedTreeBranch(side) {
    if (state.mode !== "playing") {
      return false;
    }
    const tree = getSelectedTree();
    if (!tree || tree.fallen) {
      return false;
    }

    const branch = getBranchCutCandidate(tree, side, state.activeTier);
    if (!branch) {
      return false;
    }

    const seg = getBranchSegment(tree, branch);
    const hit = strikeBranch(tree, branch, seg, 1.02 + (branch.isBig ? 0.22 : 0));
    if (!hit.hit) {
      return false;
    }

    state.slashEchoes.push({
      x1: seg.x1,
      y1: seg.y1,
      x2: seg.x2,
      y2: seg.y2,
      life: 0.14,
    });
    if (state.slashEchoes.length > 22) {
      state.slashEchoes.splice(0, state.slashEchoes.length - 22);
    }
    return true;
  }

  function axeChopSelectedTree(side) {
    if (state.mode !== "playing" || state.controlMode !== "axe") {
      return false;
    }
    const tree = getSelectedTree();
    if (!tree || tree.fallen || tree.falling) {
      return false;
    }

    if (!tree.axe) {
      tree.axe = createAxePlan(!!tree.isBoss, tree.height, tree.radius, tree.deadness);
    }
    const axe = tree.axe;
    if (axe.stage === "released") {
      return false;
    }

    if (axe.targetSide === 0) {
      axe.targetSide = side;
      axe.stage = "notch";
      if (tree.safeDirectionHint && tree.safeDirectionHint !== side) {
        addCallout(`Risky notch ${side < 0 ? "left" : "right"}`, "#ffbca7", 1.5);
      } else {
        addCallout(`Notch ${side < 0 ? "left" : "right"} side`, "#dff6cc", 1.35);
      }
    } else if (axe.notchHits === 0 && axe.backHits === 0 && side !== axe.targetSide) {
      axe.targetSide = side;
      axe.stage = "notch";
      addCallout(`Notch switched ${side < 0 ? "left" : "right"}`, "#d8f4ff", 1.1);
    }

    const notchSide = axe.targetSide;
    const backSide = -notchSide;
    const trunkUnit = getTrunkUnit(tree);
    const perp = getPerpUnit(tree);
    const cutOffset = Math.max(14, tree.radius * 0.9);
    const impactX =
      tree.x + trunkUnit.x * cutOffset + perp.x * side * tree.radius * 0.64;
    const impactY =
      tree.baseY + trunkUnit.y * cutOffset + perp.y * side * tree.radius * 0.64;
    const trunkPower = 0.35 + tree.radius / 34 + (tree.isBoss ? 0.15 : 0);

    let validHit = false;
    if (axe.notchHits < axe.notchNeed) {
      axe.stage = "notch";
      if (side === notchSide) {
        axe.notchHits += 1;
        tree.axeBias += notchSide * (0.11 + trunkPower * 0.05);
        validHit = true;
        if (axe.notchHits >= axe.notchNeed) {
          axe.stage = "backcut";
          addCallout("Notch set. Back cut opposite side.", "#ffe6ba", 1.5);
        }
      } else {
        axe.notchHits = Math.max(0, axe.notchHits - 1);
        axe.backHits = 0;
        tree.axeBias *= 0.84;
        addCallout("Wrong side for notch", "#ffc6b6", 1.1);
      }
    } else {
      axe.stage = "backcut";
      if (side === backSide) {
        axe.backHits += 1;
        tree.axeBias += notchSide * (0.17 + trunkPower * 0.07);
        validHit = true;
      } else {
        axe.backHits = Math.max(0, axe.backHits - 1);
        tree.axeBias += notchSide * 0.04;
        addCallout("Back cut from opposite side", "#ffd8b4", 1.1);
      }
    }

    tree.axeBias = clamp(tree.axeBias, -2.8, 2.8);

    if (validHit) {
      axe.flash = 0.24;
      axe.lastChopAt = state.elapsed;
      spawnWoodChips(impactX, impactY, side, 0.6 + trunkPower);
      state.slashEchoes.push({
        x1: impactX - trunkUnit.x * 10,
        y1: impactY - trunkUnit.y * 10,
        x2: impactX + trunkUnit.x * 10,
        y2: impactY + trunkUnit.y * 10,
        life: 0.1,
      });
      if (state.slashEchoes.length > 22) {
        state.slashEchoes.splice(0, state.slashEchoes.length - 22);
      }
      addTrauma(tree.isBoss ? 0.06 : 0.04);
    }

    if (
      !tree.falling &&
      !tree.fallen &&
      axe.notchHits >= axe.notchNeed &&
      axe.backHits >= axe.backNeed
    ) {
      axe.stage = "released";
      addCallout(
        notchSide < 0 ? "Hinge release: TIMBER LEFT" : "Hinge release: TIMBER RIGHT",
        "#ffd59a",
        1.8
      );
      startFalling(
        tree,
        notchSide * (1.05 + Math.abs(tree.axeBias) * 0.55 + tree.radius / 42)
      );
      return true;
    }

    return validHit;
  }

  function severBranch(tree, branch, seg) {
    if (branch.cut) {
      return false;
    }
    if (shouldBlockCatBranchCut(tree, branch, false)) {
      return false;
    }
    branch.cut = true;
    tree.cutCount += 1;
    state.totalCut += 1;
    state.selectedTreeId = tree.id;
    if (state.elapsed - state.lastCutAt <= 1.45) {
      state.flowStreak += 1;
    } else {
      state.flowStreak = 1;
    }
    state.lastCutAt = state.elapsed;
    state.flowTimer = 1.45;
    state.bestFlow = Math.max(state.bestFlow, state.flowStreak);
    if (state.flowStreak === 3) {
      addCallout("Smooth sequence x3", "#d8f8c4", 1.6);
    } else if (state.flowStreak === 5) {
      addCallout("Lumber legend x5", "#f5f1b8", 1.8);
    } else if (state.flowStreak === 7) {
      addCallout("Unreal flow x7", "#ffd09e", 2);
    }
    const impactX = (seg.x1 + seg.x2) * 0.5;
    const impactY = (seg.y1 + seg.y2) * 0.5;
    spawnWoodChips(impactX, impactY, branch.side);
    frightenBirdsNear(impactX, impactY, 150, branch.side);
    vibrate(branch.isBig ? 35 : 20);
    addTrauma(branch.isBig ? 0.08 : 0.05);

    const imbalance = computeTreeImbalance(tree);
    if (!tree.falling && Math.abs(imbalance) > autoFallThreshold(tree)) {
      startFalling(tree, imbalance);
    }

    return true;
  }

  function applySlashSegment(x1, y1, x2, y2, speed) {
    if (state.controlMode !== "saw") {
      return;
    }
    if (speed < MIN_SLASH_SPEED) {
      return;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    const segLen = Math.sqrt(lenSq);
    let slashPower = clamp(0.6 + speed / 650 + segLen / 380, 0.52, 2.75);
    const maxTargets = 1 + (speed > MIN_SLASH_SPEED * 2.15 ? 1 : 0);

    const hitCandidates = [];
    for (const tree of state.trees) {
      if (tree.fallen) {
        continue;
      }

      for (const branch of tree.branches) {
        if (branch.cut) {
          continue;
        }
        const seg = getBranchSegment(tree, branch);
        const slashA = { x: x1, y: y1 };
        const slashB = { x: x2, y: y2 };
        const branchA = { x: seg.x1, y: seg.y1 };
        const branchB = { x: seg.x2, y: seg.y2 };

        const intersects = segmentsIntersect(slashA, slashB, branchA, branchB);
        const closeEnough =
          pointToSegmentDistanceSq(x2, y2, seg.x1, seg.y1, seg.x2, seg.y2) <=
          (branch.thickness + 9) * (branch.thickness + 9);

        if (!intersects && !closeEnough) {
          continue;
        }

        const midX = (seg.x1 + seg.x2) * 0.5;
        const midY = (seg.y1 + seg.y2) * 0.5;
        const t = lenSq > 1
          ? clamp(((midX - x1) * dx + (midY - y1) * dy) / lenSq, 0, 1)
          : 0;
        const dist = pointToSegmentDistanceSq(midX, midY, x1, y1, x2, y2);

        hitCandidates.push({
          tree,
          branch,
          seg,
          t,
          dist,
        });
      }
    }

    hitCandidates.sort((a, b) => {
      if (Math.abs(a.t - b.t) > 0.015) {
        return a.t - b.t;
      }
      const aPriority = (a.branch.isBig ? 0.6 : 0) + (a.branch.tier === "high" ? 0.28 : 0);
      const bPriority = (b.branch.isBig ? 0.6 : 0) + (b.branch.tier === "high" ? 0.28 : 0);
      if (Math.abs(aPriority - bPriority) > 0.01) {
        return bPriority - aPriority;
      }
      return a.dist - b.dist;
    });

    let cutAny = false;
    let targetsHit = 0;
    const touchedTrees = new Set();

    for (const hit of hitCandidates) {
      if (targetsHit >= maxTargets || slashPower <= 0.3) {
        break;
      }
      if (touchedTrees.has(hit.tree.id)) {
        continue;
      }

      const effort = Math.max(0.5, (hit.branch.hp || hit.branch.maxHp || 1) * 0.78);
      const delivered = clamp(slashPower, 0.45, 2.5);
      const result = strikeBranch(hit.tree, hit.branch, hit.seg, delivered);
      if (!result.hit) {
        continue;
      }
      cutAny = true;
      targetsHit += 1;
      touchedTrees.add(hit.tree.id);
      slashPower -= effort;
    }

    if (cutAny) {
      state.slashEchoes.push({ x1, y1, x2, y2, life: 0.18 });
      if (state.slashEchoes.length > 22) {
        state.slashEchoes.splice(0, state.slashEchoes.length - 22);
      }
    }
  }

  function applyTapCut(x, y) {
    if (state.controlMode !== "saw") {
      return;
    }
    const tapRadius = 34;
    let best = null;
    let bestDistSq = Number.POSITIVE_INFINITY;

    for (const tree of state.trees) {
      if (tree.fallen) {
        continue;
      }

      for (const branch of tree.branches) {
        if (branch.cut) {
          continue;
        }
        const seg = getBranchSegment(tree, branch);
        const distSq = pointToSegmentDistanceSq(x, y, seg.x1, seg.y1, seg.x2, seg.y2);
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          best = { tree, branch, seg };
        }
      }
    }

    if (!best || bestDistSq > tapRadius * tapRadius) {
      return;
    }

    const hit = strikeBranch(best.tree, best.branch, best.seg, 1.16 + (best.branch.isBig ? 0.16 : 0));
    if (hit.hit) {
      state.slashEchoes.push({
        x1: x - 16,
        y1: y - 16,
        x2: x + 16,
        y2: y + 16,
        life: 0.1,
      });
      if (state.slashEchoes.length > 22) {
        state.slashEchoes.splice(0, state.slashEchoes.length - 22);
      }
    }
  }

  function rectFromHazard(hazard) {
    return {
      x: hazard.x - hazard.w * 0.5,
      y: hazard.y - hazard.h,
      w: hazard.w,
      h: hazard.h,
    };
  }

  function pointInRect(px, py, rect) {
    return (
      px >= rect.x &&
      px <= rect.x + rect.w &&
      py >= rect.y &&
      py <= rect.y + rect.h
    );
  }

  function trunkHitsHazard(tree, hazard) {
    const tipX = tree.x + Math.sin(tree.angle) * tree.height;
    const tipY = tree.baseY - Math.cos(tree.angle) * tree.height;

    const rect = rectFromHazard(hazard);
    if (pointInRect(tree.x, tree.baseY, rect) || pointInRect(tipX, tipY, rect)) {
      return true;
    }

    const edges = [
      [rect.x, rect.y, rect.x + rect.w, rect.y],
      [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
      [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
      [rect.x, rect.y + rect.h, rect.x, rect.y],
    ];

    const trunkA = { x: tree.x, y: tree.baseY };
    const trunkB = { x: tipX, y: tipY };
    for (const edge of edges) {
      const edgeA = { x: edge[0], y: edge[1] };
      const edgeB = { x: edge[2], y: edge[3] };
      if (segmentsIntersect(trunkA, trunkB, edgeA, edgeB)) {
        return true;
      }
    }

    const centerX = hazard.x;
    const centerY = hazard.y - hazard.h * 0.55;
    const buffer = Math.max(hazard.w, hazard.h) * 0.36 + tree.radius * 0.6;
    const distSq = pointToSegmentDistanceSq(
      centerX,
      centerY,
      tree.x,
      tree.baseY,
      tipX,
      tipY
    );
    return distSq <= buffer * buffer;
  }

  function settleTreeImpact(tree) {
    let collisions = 0;
    let oldLadyHits = 0;
    for (const hazard of state.hazards) {
      if (hazard.damaged) {
        continue;
      }
      if (trunkHitsHazard(tree, hazard)) {
        hazard.damaged = true;
        state.totalDamaged += 1;
        collisions += 1;
        if (hazard.type === "oldlady") {
          oldLadyHits += 1;
        }
        spawnCrashBurst(hazard, tree, hazard.type === "oldlady");
      }
    }
    if (collisions > 0) {
      state.trunkCrashesThisLevel += collisions;
      addTrauma(0.62 + collisions * 0.15 + oldLadyHits * 0.22);
      vibrate([40, 30, 60]);
      if (oldLadyHits > 0) {
        addCallout(
          oldLadyHits > 1 ? `Old ladies hit x${oldLadyHits}` : "Old lady hit!",
          "#ff9ca8",
          2.3
        );
        triggerImmediateFailure(
          "oldlady",
          oldLadyHits > 1
            ? `${oldLadyHits} old ladies were struck by falling trunks.`
            : "An old lady was struck by a falling trunk."
        );
        return;
      }
      addCallout(
        collisions > 1 ? `CRASH CHAIN x${collisions}` : "CRASH IMPACT",
        "#ffb0a4",
        1.8
      );
    } else if (tree.isBoss) {
      addCallout("Boss trunk landed clean", "#c7f7bf", 1.8);
    }
  }

  function getStyleRank(bestFlow, crashes) {
    if (crashes > 0) {
      return "Busted";
    }
    if (bestFlow >= 7) {
      return "Mythic";
    }
    if (bestFlow >= 5) {
      return "Legendary";
    }
    if (bestFlow >= 3) {
      return "Clean";
    }
    return "Steady";
  }

  function triggerImmediateFailure(reason, message) {
    if (state.mode === "gameover" || state.mode === "victory") {
      return;
    }
    state.failReason = reason;
    const damaged = state.hazards.filter((hazard) => hazard.damaged).length;
    const saved = Math.max(0, state.hazards.length - damaged);
    const oldLady = getOldLadyCounts();
    state.levelReport = {
      district: state.district ? state.district.name : "Unknown",
      saved,
      damaged,
      trunkCrashes: state.trunkCrashesThisLevel,
      penalty: 100,
      flowBonus: 0,
      bestFlow: state.bestFlow,
      styleRank: "Busted",
      reputation: state.reputation,
      oldLadiesSaved: oldLady.saved,
      oldLadiesHit: oldLady.hit,
      failureReason: reason,
      failureMessage: message,
    };
    state.mode = "gameover";
  }

  function evaluateLevelResult() {
    const damaged = state.hazards.filter((h) => h.damaged);
    const saved = state.hazards.length - damaged.length;
    const oldLady = getOldLadyCounts();
    const trunkCrashPenalty = state.trunkCrashesThisLevel > 0 ? 100 : 0;
    const penalty = trunkCrashPenalty;
    const flowBonus =
      state.trunkCrashesThisLevel === 0 ? clamp(Math.floor(state.bestFlow * 1.5), 0, 12) : 0;

    state.totalSaved += saved;
    state.reputation = clamp(state.reputation - penalty + flowBonus, 0, 100);

    state.levelReport = {
      district: state.district ? state.district.name : "Unknown",
      saved,
      damaged: damaged.length,
      trunkCrashes: state.trunkCrashesThisLevel,
      penalty,
      flowBonus,
      bestFlow: state.bestFlow,
      styleRank: getStyleRank(state.bestFlow, state.trunkCrashesThisLevel),
      reputation: state.reputation,
      oldLadiesSaved: oldLady.saved,
      oldLadiesHit: oldLady.hit,
      failureReason: "",
      failureMessage: "",
    };

    if (state.trunkCrashesThisLevel > 0) {
      state.failReason = "crash";
      state.levelReport.failureReason = "crash";
      state.levelReport.failureMessage = "A protected target was crushed.";
      state.mode = "gameover";
      return;
    }

    if (state.reputation <= 0) {
      state.failReason = "reputation";
      state.levelReport.failureReason = "reputation";
      state.levelReport.failureMessage = "Reputation collapsed under pressure.";
      state.mode = "gameover";
      return;
    }

    state.failReason = "";
    if (state.level >= MAX_LEVEL) {
      state.mode = "victory";
      return;
    }

    state.mode = "levelComplete";
  }

  function updateTrees(dt) {
    let allFallen = true;

    for (const tree of state.trees) {
      if (tree.axe && tree.axe.flash > 0) {
        tree.axe.flash = Math.max(0, tree.axe.flash - dt * 2.2);
      }
      for (const branch of tree.branches) {
        if (branch.hitFlash > 0) {
          branch.hitFlash = Math.max(0, branch.hitFlash - dt * 2.6);
        }
      }
      const imbalance = computeTreeImbalance(tree);

      if (!tree.falling && !tree.fallen) {
        const swayTarget = tree.lean * 0.6 + state.wind * 0.035 + imbalance * 0.045;
        tree.sway = lerp(tree.sway, swayTarget, clamp(dt * 2.7, 0, 1));

        const canAutoFall =
          tree.cutCount > 0 ||
          Math.abs(tree.wedge) > 0 ||
          tree.deadness > 0.58 ||
          Math.abs(tree.axeBias || 0) > 0.2;
        if (canAutoFall && Math.abs(imbalance) > autoFallThreshold(tree)) {
          startFalling(tree, imbalance);
        }
      }

      if (tree.falling) {
        const gravityPush = Math.sin(tree.angle + Math.sign(tree.angularVelocity || 1) * 0.08);
        const sizeMomentum = 0.75 + tree.height / 250 + tree.radius / 18;
        tree.angularVelocity +=
          ((gravityPush * (1.15 + tree.height / 280) + imbalance * 0.85) *
            dt *
            sizeMomentum) /
          2.1;
        tree.angularVelocity *= Math.pow(0.992, dt * 60);

        const angularGain = 1.45 + tree.height / 390;
        tree.angle += tree.angularVelocity * dt * angularGain;

        if (Math.abs(tree.angle) >= Math.PI / 2) {
          tree.angle = Math.sign(tree.angle) * (Math.PI / 2);
          tree.falling = false;
          tree.fallen = true;
          settleTreeImpact(tree);
          if (tree.id === state.selectedTreeId) {
            cycleSelectedTree(1);
          }
        }
      }

      if (!tree.fallen) {
        allFallen = false;
      }
    }

    if (allFallen && state.mode === "playing") {
      evaluateLevelResult();
    }
  }

  function updateSlashEchoes(dt) {
    for (let i = state.slashEchoes.length - 1; i >= 0; i -= 1) {
      state.slashEchoes[i].life -= dt;
      if (state.slashEchoes[i].life <= 0) {
        state.slashEchoes.splice(i, 1);
      }
    }
  }

  function updateChips(dt) {
    for (let i = state.chips.length - 1; i >= 0; i -= 1) {
      const chip = state.chips[i];
      chip.vy += 540 * dt;
      chip.x += chip.vx * dt;
      chip.y += chip.vy * dt;
      chip.life -= dt;
      if (chip.y > WORLD.groundY + 4 || chip.life <= 0) {
        state.chips.splice(i, 1);
      }
    }
  }

  function jumpNick() {
    if (state.nickY < -0.1 || Math.abs(state.nickVy) > 12) {
      return false;
    }
    state.nickVy = -NICK_JUMP_VELOCITY;
    state.nickY = -1;
    return true;
  }

  function updateNickShowtime(dt) {
    if (state.nickSpeech.life > 0) {
      state.nickSpeech.life = Math.max(0, state.nickSpeech.life - dt);
      if (state.nickSpeech.life <= 0) {
        state.nickSpeech.text = "";
      }
    }

    for (let i = state.nickNotes.length - 1; i >= 0; i -= 1) {
      const note = state.nickNotes[i];
      note.life -= dt;
      note.x += (note.vx + Math.sin(state.elapsed * 4.5 + note.phase) * 8) * dt;
      note.y += note.vy * dt;
      note.vy -= 15 * dt;
      if (note.life <= 0 || note.y < 24) {
        state.nickNotes.splice(i, 1);
      }
    }

    if (state.showtime.active) {
      state.showtime.phase += dt * 8.3;
      const grounded = state.nickY >= -0.1 && Math.abs(state.nickVy) < 12;
      const targetSway = grounded
        ? Math.sin(state.showtime.phase * 1.7) * 6 +
          Math.sin(state.showtime.phase * 3.2) * 2.8
        : 0;
      state.showtime.sway = lerp(
        state.showtime.sway,
        targetSway,
        clamp(dt * 8.4, 0, 1)
      );
      state.showtime.armSwing = Math.sin(state.showtime.phase * 5.7) * 6;

      state.showtime.noteTimer -= dt;
      if (state.showtime.noteTimer <= 0) {
        spawnNickNote();
        state.showtime.noteTimer = rand(0.19, 0.44);
      }

      state.showtime.quoteTimer -= dt;
      if (state.showtime.quoteTimer <= 0) {
        setNickSpeech(nextNickQuote(), 3.4);
        state.showtime.quoteTimer = rand(4.2, 6.8);
      }
    } else {
      state.showtime.sway = lerp(
        state.showtime.sway,
        0,
        clamp(dt * 6.6, 0, 1)
      );
      state.showtime.armSwing = lerp(
        state.showtime.armSwing,
        0,
        clamp(dt * 7.2, 0, 1)
      );
    }
  }

  function updateNick(dt) {
    let targetX = clamp(state.pointer.x, 80, WORLD.width - 80);

    if (state.mode === "playing") {
      for (const tree of state.trees) {
        if (!tree.falling || tree.fallen) {
          continue;
        }
        const fallDir = Math.sign(tree.angle || tree.angularVelocity || tree.imbalance || 1) || 1;
        const safetySide = -fallDir;
        const safetyX = clamp(
          tree.x + safetySide * (tree.height * 0.32 + 132),
          80,
          WORLD.width - 80
        );
        const projectedClear = getNickFallClearance(tree, fallDir);
        const protectDist = tree.radius * 0.7 + NICK_BODY_RADIUS + 14;
        if (projectedClear < protectDist + 28) {
          const urgency = clamp(1 - projectedClear / (protectDist + 28), 0, 1);
          targetX = lerp(targetX, safetyX, 0.22 + urgency * 0.66);
        }
      }
    }

    state.nickX = lerp(state.nickX, targetX, clamp(dt * 6, 0, 1));
    state.nickVy += NICK_GRAVITY * dt;
    state.nickY += state.nickVy * dt;
    if (state.nickY > 0) {
      state.nickY = 0;
      state.nickVy = 0;
    }

    if (state.mode === "playing") {
      const nickPoint = getNickBodyPoint();
      for (const tree of state.trees) {
        if (!tree.falling || tree.fallen) {
          continue;
        }
        const tip = getTrunkTipForAngle(tree, tree.angle);
        const protectDist = tree.radius * 0.75 + NICK_BODY_RADIUS + 10;
        const distSq = pointToSegmentDistanceSq(
          nickPoint.x,
          nickPoint.y,
          tree.x,
          tree.baseY,
          tip.x,
          tip.y
        );
        if (distSq <= protectDist * protectDist) {
          const fallDir = Math.sign(tree.angle || tree.angularVelocity || tree.imbalance || 1) || 1;
          const safeSide = -fallDir;
          state.nickX = clamp(
            tree.x + safeSide * (protectDist + tree.height * 0.18 + 38),
            80,
            WORLD.width - 80
          );
          nickPoint.x = state.nickX;
        }
      }
    }

    updateNickShowtime(dt);
  }

  function update(dt) {
    updateSlashEchoes(dt);
    updateChips(dt);
    updateCrashBursts(dt);
    updateWindTrails(dt);
    updateAmbient(dt);
    updateBirds(dt);
    updateTreeCat(dt);
    updateCallouts(dt);
    if (state.lightningFlash > 0) {
      state.lightningFlash = Math.max(0, state.lightningFlash - dt);
    }
    if (state.adrenaline.timer > 0) {
      state.adrenaline.timer = Math.max(0, state.adrenaline.timer - dt);
      if (state.adrenaline.timer <= 0) {
        state.adrenaline.sourceTreeId = null;
      }
    }
    updateCameraShake(dt);

    if (state.mode !== "playing") {
      updateNick(dt);
      return;
    }

    state.elapsed += dt;
    state.flowTimer -= dt;
    if (state.flowTimer <= 0) {
      state.flowStreak = 0;
      state.flowTimer = 0;
    }
    updateWind(dt);

    updateTrees(dt);
    updateNick(dt);
  }

  function drawPanel(x, y, w, h, opts = {}) {
    const top = opts.top || "rgba(24, 40, 44, 0.82)";
    const bottom = opts.bottom || "rgba(13, 25, 29, 0.7)";
    const radius = opts.radius ?? 14;
    const border = opts.border || "rgba(255, 255, 255, 0.16)";

    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();

    ctx.strokeStyle = border;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, radius);
    ctx.stroke();
  }

  function drawMeter(x, y, w, h, value, colorA, colorB, label, valueLabel) {
    const pct = clamp(value, 0, 1);
    ctx.fillStyle = "rgba(6, 11, 14, 0.5)";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();

    const gw = Math.max(5, (w - 4) * pct);
    const g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, gw, h - 4, 6);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.stroke();

    ctx.fillStyle = "#f2f8f6";
    ctx.font = "600 13px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(label, x, y - 4);
    ctx.font = "700 12px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(valueLabel, x + w - ctx.measureText(valueLabel).width, y - 4);
  }

  function drawBackground() {
    const skyPreset = state.skyPreset || SKY_PRESETS.sunrise;
    const district = state.district || DISTRICTS[0];
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD.groundY);
    sky.addColorStop(0, skyPreset.top);
    sky.addColorStop(0.62, skyPreset.mid);
    sky.addColorStop(1, skyPreset.bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    const sunX = 170 + Math.sin(state.elapsed * 0.06) * 10;
    const sunY = 128;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 160);
    sunGlow.addColorStop(0, "rgba(255, 236, 178, 0.7)");
    sunGlow.addColorStop(1, "rgba(255, 236, 178, 0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, WORLD.width, WORLD.groundY);

    ctx.fillStyle = skyPreset.sun;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 64, 0, Math.PI * 2);
    ctx.fill();

    const farMountain = ctx.createLinearGradient(0, WORLD.groundY - 240, 0, WORLD.groundY - 80);
    farMountain.addColorStop(0, "rgba(66, 98, 115, 0.32)");
    farMountain.addColorStop(1, "rgba(88, 124, 140, 0.2)");
    ctx.fillStyle = farMountain;
    ctx.beginPath();
    ctx.moveTo(0, WORLD.groundY - 86);
    ctx.quadraticCurveTo(WORLD.width * 0.18, WORLD.groundY - 210, WORLD.width * 0.36, WORLD.groundY - 102);
    ctx.quadraticCurveTo(WORLD.width * 0.55, WORLD.groundY - 240, WORLD.width * 0.78, WORLD.groundY - 112);
    ctx.quadraticCurveTo(WORLD.width * 0.88, WORLD.groundY - 180, WORLD.width, WORLD.groundY - 98);
    ctx.lineTo(WORLD.width, WORLD.groundY);
    ctx.lineTo(0, WORLD.groundY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = skyPreset.cloud;
    for (let i = 0; i < 6; i += 1) {
      const x = 130 + i * 210 + Math.sin(state.elapsed * 0.11 + i * 1.4) * 30;
      const y = 96 + (i % 3) * 34;
      ctx.globalAlpha = 0.78 - (i % 2) * 0.16;
      ctx.beginPath();
      ctx.ellipse(x, y, 56, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 30, y + 7, 43, 17, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 32, y + 9, 36, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const hill = ctx.createLinearGradient(0, WORLD.groundY - 120, 0, WORLD.groundY + 12);
    hill.addColorStop(0, district.hillTop);
    hill.addColorStop(1, district.hillBottom);
    ctx.fillStyle = hill;
    ctx.beginPath();
    ctx.moveTo(0, WORLD.groundY + 8);
    ctx.quadraticCurveTo(WORLD.width * 0.2, WORLD.groundY - 78, WORLD.width * 0.46, WORLD.groundY + 3);
    ctx.quadraticCurveTo(WORLD.width * 0.7, WORLD.groundY - 108, WORLD.width, WORLD.groundY + 5);
    ctx.lineTo(WORLD.width, WORLD.height);
    ctx.lineTo(0, WORLD.height);
    ctx.closePath();
    ctx.fill();

    const grass = ctx.createLinearGradient(0, WORLD.groundY, 0, WORLD.height);
    grass.addColorStop(0, district.grassTop);
    grass.addColorStop(1, district.grassBottom);
    ctx.fillStyle = grass;
    ctx.fillRect(0, WORLD.groundY, WORLD.width, WORLD.height - WORLD.groundY);

    ctx.fillStyle = district.road;
    ctx.beginPath();
    ctx.moveTo(0, WORLD.groundY + 24);
    ctx.bezierCurveTo(
      WORLD.width * 0.2,
      WORLD.groundY + 2,
      WORLD.width * 0.42,
      WORLD.groundY + 36,
      WORLD.width * 0.58,
      WORLD.groundY + 18
    );
    ctx.bezierCurveTo(
      WORLD.width * 0.76,
      WORLD.groundY + 4,
      WORLD.width * 0.9,
      WORLD.groundY + 28,
      WORLD.width,
      WORLD.groundY + 20
    );
    ctx.lineTo(WORLD.width, WORLD.groundY + 55);
    ctx.lineTo(0, WORLD.groundY + 60);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = district.roadEdge;
    ctx.setLineDash([16, 12]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, WORLD.groundY + 29);
    ctx.bezierCurveTo(
      WORLD.width * 0.24,
      WORLD.groundY + 14,
      WORLD.width * 0.52,
      WORLD.groundY + 34,
      WORLD.width,
      WORLD.groundY + 23
    );
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(60, 90, 40, 0.2)";
    ctx.lineWidth = 2;
    for (let x = 0; x < WORLD.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, WORLD.groundY);
      ctx.lineTo(x + 10, WORLD.height);
      ctx.stroke();
    }

    ctx.strokeStyle = district.fence;
    ctx.lineWidth = 2;
    for (let x = 18; x < WORLD.width; x += 44) {
      const postY = WORLD.groundY - 8 + Math.sin(x * 0.02) * 3;
      ctx.beginPath();
      ctx.moveTo(x, postY);
      ctx.lineTo(x, postY + 18);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, WORLD.groundY + 2);
    ctx.lineTo(WORLD.width, WORLD.groundY + 4);
    ctx.stroke();
  }

  function drawWindTrails() {
    for (const trail of state.windTrails) {
      const lifeT = trail.maxLife > 0 ? clamp(trail.life / trail.maxLife, 0, 1) : 0;
      const alpha = 0.14 + lifeT * 0.26;
      ctx.strokeStyle = `rgba(240, 249, 255, ${alpha})`;
      ctx.lineWidth = 1.6 + trail.thickness;
      ctx.beginPath();
      ctx.moveTo(trail.x, trail.y);
      ctx.bezierCurveTo(
        trail.x + trail.vx * 0.08,
        trail.y + trail.curve,
        trail.x + trail.vx * 0.18,
        trail.y - trail.curve * 0.65,
        trail.x + trail.vx * 0.26,
        trail.y
      );
      ctx.stroke();
    }
  }

  function drawAmbientParticles() {
    for (const p of state.ambientParticles) {
      if (p.kind === "rain") {
        ctx.strokeStyle = `rgba(225, 240, 255, ${p.alpha})`;
        ctx.lineWidth = p.thickness;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 0.03, p.y + p.len);
        ctx.stroke();
      } else if (p.kind === "firefly") {
        const glow =
          0.28 +
          Math.sin(state.elapsed * 3.4 + p.phase) * 0.2 +
          clamp((p.life / Math.max(0.4, p.maxLife)) * 0.3, 0, 0.3);
        ctx.fillStyle = `rgba(255, 239, 171, ${clamp(glow, 0.08, 0.84)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(255, 247, 201, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function getProjectedFall(tree) {
    let direction = Math.sign(tree.imbalance);
    if (direction === 0) {
      direction = Math.sign(tree.wedge);
    }
    if (direction === 0) {
      direction = Math.sign(tree.deadBias);
    }
    if (direction === 0) {
      direction = 1;
    }
    const threshold = Math.max(0.22, autoFallThreshold(tree));
    const certainty = clamp(Math.abs(tree.imbalance) / threshold, 0.2, 1);
    return { direction, certainty };
  }

  function drawHazard(hazard) {
    const style = HAZARD_TYPES[hazard.type];
    const district = state.district || DISTRICTS[0];
    const left = hazard.x - hazard.w * 0.5;
    const top = hazard.y - hazard.h;
    const impactFlash = hazard.impactFlash || 0;

    ctx.save();
    if (hazard.damaged) {
      const jitter = (0.9 + impactFlash * 6) * (hazard.type === "oldlady" ? 0.55 : 1);
      ctx.translate(rand(-jitter, jitter), rand(-jitter, jitter));
      ctx.globalAlpha = 0.88 + impactFlash * 0.12;
    }

    ctx.fillStyle = "rgba(14, 18, 13, 0.2)";
    ctx.beginPath();
    ctx.ellipse(
      hazard.x,
      WORLD.groundY + 6,
      hazard.type === "oldlady" ? hazard.w * 0.34 : hazard.w * 0.48,
      hazard.type === "oldlady" ? 7 : 12,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    if (hazard.type === "house") {
      ctx.fillStyle = district.houseBody || style.body;
      ctx.fillRect(left + 10, top + 26, hazard.w - 20, hazard.h - 26);
      ctx.fillStyle = district.houseRoof || style.roof;
      ctx.beginPath();
      ctx.moveTo(left, top + 30);
      ctx.lineTo(hazard.x, top);
      ctx.lineTo(left + hazard.w, top + 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#7e552f";
      ctx.fillRect(hazard.x - 10, top + 56, 20, hazard.h - 56);
      ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
      ctx.fillRect(left + 22, top + 40, 16, 14);
      ctx.fillRect(left + hazard.w - 38, top + 40, 16, 14);
      ctx.strokeStyle = "rgba(95, 74, 46, 0.34)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i += 1) {
        const y = top + 35 + i * 14;
        ctx.beginPath();
        ctx.moveTo(left + 12, y);
        ctx.lineTo(left + hazard.w - 12, y);
        ctx.stroke();
      }
    } else if (hazard.type === "car") {
      ctx.fillStyle = district.carBody || style.body;
      ctx.beginPath();
      ctx.roundRect(left, top + 18, hazard.w, hazard.h - 18, 10);
      ctx.fill();
      ctx.fillStyle = district.carRoof || style.roof;
      ctx.beginPath();
      ctx.roundRect(left + 18, top + 2, hazard.w - 36, 24, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
      ctx.beginPath();
      ctx.roundRect(left + 22, top + 7, hazard.w - 44, 7, 5);
      ctx.fill();
      ctx.fillStyle = "#2a2a2a";
      ctx.beginPath();
      ctx.arc(left + 18, top + hazard.h - 2, 10, 0, Math.PI * 2);
      ctx.arc(left + hazard.w - 18, top + hazard.h - 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(180, 188, 198, 0.7)";
      ctx.beginPath();
      ctx.arc(left + 18, top + hazard.h - 2, 4, 0, Math.PI * 2);
      ctx.arc(left + hazard.w - 18, top + hazard.h - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (hazard.type === "oldlady") {
      ctx.fillStyle = "#3a2d2d";
      ctx.fillRect(hazard.x - 11, top + hazard.h - 12, 8, 8);
      ctx.fillRect(hazard.x + 3, top + hazard.h - 12, 8, 8);

      ctx.fillStyle = style.body;
      ctx.beginPath();
      ctx.roundRect(hazard.x - 14, top + 26, 28, 34, 10);
      ctx.fill();

      ctx.fillStyle = "#dfcfba";
      ctx.beginPath();
      ctx.arc(hazard.x, top + 16, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(245, 238, 223, 0.96)";
      ctx.beginPath();
      ctx.arc(hazard.x - 4, top + 14, 2, 0, Math.PI * 2);
      ctx.arc(hazard.x + 4, top + 14, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#9f8f7a";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(hazard.x + 12, top + 28);
      ctx.lineTo(hazard.x + 17, top + 62);
      ctx.stroke();
      ctx.fillStyle = "#84745f";
      ctx.beginPath();
      ctx.arc(hazard.x + 17, top + 63, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#2d1f3f";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(hazard.x - 8, top + 36);
      ctx.quadraticCurveTo(hazard.x, top + 48, hazard.x + 8, top + 36);
      ctx.stroke();
    }

    if (hazard.damaged) {
      if (hazard.type !== "oldlady") {
        const flameAlpha = 0.24 + impactFlash * 0.46;
        ctx.fillStyle = `rgba(255, 122, 72, ${flameAlpha})`;
        for (let i = 0; i < 3; i += 1) {
          const fx = left + hazard.w * (0.22 + i * 0.27);
          const fy = top + hazard.h - 8;
          const fh = 10 + Math.sin(state.elapsed * 10 + i) * 4;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx - 7, fy + 6);
          ctx.lineTo(fx + 7, fy + 6);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.arc(fx, fy - fh, 4 + i, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(65, 52, 49, ${0.18 + impactFlash * 0.18})`;
        for (let i = 0; i < 4; i += 1) {
          const sx = hazard.x + (i - 1.5) * 10;
          const sy = top + 10 - Math.sin(state.elapsed * 1.8 + i) * 3;
          ctx.beginPath();
          ctx.arc(sx, sy, 8 + i * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = `rgba(255, 85, 95, ${0.24 + impactFlash * 0.46})`;
        ctx.beginPath();
        ctx.arc(hazard.x, top + 34, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(120, 30, 20, 0.9)";
      ctx.lineWidth = hazard.type === "oldlady" ? 3 : 4;
      ctx.beginPath();
      const pad = hazard.type === "oldlady" ? 6 : 8;
      ctx.moveTo(left + pad, top + 8);
      ctx.lineTo(left + hazard.w - pad, top + hazard.h - 6);
      ctx.moveTo(left + hazard.w - pad, top + 8);
      ctx.lineTo(left + pad, top + hazard.h - 6);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawCrashBursts() {
    for (const burst of state.crashBursts) {
      const t = burst.maxLife > 0 ? clamp(burst.life / burst.maxLife, 0, 1) : 0;
      const alpha = (burst.fatal ? 0.65 : 0.52) * t;
      const pulse = 1 - t;
      const radius = burst.radius + pulse * (burst.fatal ? 90 : 70);

      ctx.strokeStyle = `rgba(255, 188, 116, ${alpha})`;
      ctx.lineWidth = 4 + pulse * 5;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 90, 70, ${alpha * 0.86})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, Math.max(8, radius * 0.62), 0, Math.PI * 2);
      ctx.stroke();

      for (const chunk of burst.chunks) {
        const lifeT = chunk.maxLife > 0 ? clamp(chunk.life / chunk.maxLife, 0, 1) : 0;
        ctx.fillStyle = burst.fatal
          ? `rgba(255, 95, 95, ${lifeT * 0.88})`
          : `rgba(250, 196, 128, ${lifeT * 0.82})`;
        ctx.beginPath();
        ctx.arc(chunk.x, chunk.y, chunk.size * (0.45 + lifeT * 0.55), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawTree(tree) {
    const species = tree.species || TREE_SPECIES[0];
    const trunkUnit = getTrunkUnit(tree);
    const perp = getPerpUnit(tree);
    const topX = tree.x + trunkUnit.x * tree.height;
    const topY = tree.baseY + trunkUnit.y * tree.height;
    const curveAmount = tree.trunkCurve * tree.height * 0.18;
    const midX = tree.x + trunkUnit.x * tree.height * 0.52 + perp.x * curveAmount;
    const midY = tree.baseY + trunkUnit.y * tree.height * 0.52 + perp.y * curveAmount;
    const selected = tree.id === state.selectedTreeId && state.mode === "playing";

    const leanAbs = Math.abs(getTreeDisplayAngle(tree));
    const shadowLen = tree.height * (0.16 + leanAbs * 0.46);
    const shadowDir = Math.sign(getTreeDisplayAngle(tree)) || Math.sign(state.wind) || 1;
    ctx.fillStyle = "rgba(12, 16, 10, 0.2)";
    ctx.beginPath();
    ctx.ellipse(
      tree.x + shadowDir * shadowLen * 0.5,
      tree.baseY + 7,
      tree.radius * 0.95 + shadowLen * 0.55,
      9 + tree.radius * 0.08,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    if (tree.isBoss && !tree.fallen) {
      const auraPulse = 0.12 + (Math.sin(state.elapsed * 4.2) * 0.04 + 0.04);
      ctx.fillStyle = `rgba(255, 198, 116, ${auraPulse})`;
      ctx.beginPath();
      ctx.ellipse(tree.x, tree.baseY - tree.height * 0.56, tree.radius * 2.8, tree.height * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 210, 138, 0.68)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tree.x, tree.baseY, tree.radius + 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (selected && !tree.fallen && !tree.falling) {
      const projected = getProjectedFall(tree);
      const angle = projected.direction * (Math.PI / 2) * (0.28 + projected.certainty * 0.66);
      const tipX = tree.x + Math.sin(angle) * tree.height;
      const tipY = tree.baseY - Math.cos(angle) * tree.height;
      const safeSide = tree.safeDirectionHint;
      const safe =
        (safeSide === 0 && (!tree.safeDirections || tree.safeDirections.length > 1)) ||
        safeSide === projected.direction;
      ctx.strokeStyle = safe ? "rgba(171, 242, 155, 0.55)" : "rgba(248, 170, 132, 0.58)";
      ctx.lineWidth = 6;
      ctx.setLineDash([11, 9]);
      ctx.beginPath();
      ctx.moveTo(tree.x, tree.baseY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (selected && !tree.fallen) {
      const pulse = 1 + Math.sin(state.elapsed * 6) * 0.08;
      ctx.strokeStyle = "rgba(255, 240, 150, 0.85)";
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.arc(tree.x, tree.baseY, (tree.radius + 12) * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = species.trunkColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = tree.radius * 2;
    ctx.beginPath();
    ctx.moveTo(tree.x, tree.baseY);
    ctx.quadraticCurveTo(midX, midY, topX, topY);
    ctx.stroke();

    ctx.strokeStyle = species.trunkHighlight;
    ctx.lineWidth = tree.radius * 1.2;
    ctx.beginPath();
    ctx.moveTo(tree.x, tree.baseY);
    ctx.quadraticCurveTo(midX, midY, topX, topY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(42, 27, 16, 0.26)";
    ctx.lineWidth = Math.max(1, tree.radius * 0.14);
    const barkCount = clamp(Math.round(tree.height / 36), 5, 14);
    for (let i = 0; i < barkCount; i += 1) {
      const t = (i + 0.7) / (barkCount + 1);
      const bx = tree.x + trunkUnit.x * tree.height * t + perp.x * Math.sin(i * 2.1) * tree.radius * 0.24;
      const by = tree.baseY + trunkUnit.y * tree.height * t + perp.y * Math.sin(i * 2.1) * tree.radius * 0.24;
      ctx.beginPath();
      ctx.moveTo(bx - perp.x * tree.radius * 0.36, by - perp.y * tree.radius * 0.36);
      ctx.lineTo(bx + perp.x * tree.radius * 0.36, by + perp.y * tree.radius * 0.36);
      ctx.stroke();
    }

    const deadPatchCount = Math.ceil(tree.deadness * 5);
    ctx.strokeStyle = "rgba(45, 34, 24, 0.52)";
    ctx.lineWidth = Math.max(3, tree.radius * 0.35);
    for (let i = 0; i < deadPatchCount; i += 1) {
      const t = (i + 1) / (deadPatchCount + 1);
      const px = tree.x + trunkUnit.x * tree.height * t;
      const py = tree.baseY + trunkUnit.y * tree.height * t;
      const spread = tree.radius * (0.35 + (i % 2) * 0.35);
      ctx.beginPath();
      ctx.moveTo(px - spread, py - spread * 0.2);
      ctx.lineTo(px + spread, py + spread * 0.2);
      ctx.stroke();
    }

    if (!tree.fallen && tree.axe && tree.axe.targetSide !== 0) {
      const axe = tree.axe;
      const notchPct = clamp(axe.notchHits / Math.max(1, axe.notchNeed), 0, 1);
      const backPct = clamp(axe.backHits / Math.max(1, axe.backNeed), 0, 1);
      const flash = clamp((axe.flash || 0) * 4, 0, 1);
      const cutBaseDist = Math.max(12, tree.radius * 0.85);
      const cutBaseX = tree.x + trunkUnit.x * cutBaseDist;
      const cutBaseY = tree.baseY + trunkUnit.y * cutBaseDist;

      const notchCenterX =
        cutBaseX + perp.x * axe.targetSide * tree.radius * 0.58;
      const notchCenterY =
        cutBaseY + perp.y * axe.targetSide * tree.radius * 0.58;
      const notchDepth = tree.radius * (0.2 + notchPct * 0.72);
      const notchHalf = tree.radius * (0.26 + notchPct * 0.3);
      const tipX = notchCenterX + perp.x * axe.targetSide * notchDepth;
      const tipY = notchCenterY + perp.y * axe.targetSide * notchDepth;
      const shoulderAX = notchCenterX + trunkUnit.x * notchHalf;
      const shoulderAY = notchCenterY + trunkUnit.y * notchHalf;
      const shoulderBX = notchCenterX - trunkUnit.x * notchHalf;
      const shoulderBY = notchCenterY - trunkUnit.y * notchHalf;

      ctx.fillStyle = `rgba(248, 208, 150, ${0.3 + notchPct * 0.45 + flash * 0.18})`;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(shoulderAX, shoulderAY);
      ctx.lineTo(shoulderBX, shoulderBY);
      ctx.closePath();
      ctx.fill();

      const backCenterX =
        cutBaseX - perp.x * axe.targetSide * tree.radius * 0.5;
      const backCenterY =
        cutBaseY - perp.y * axe.targetSide * tree.radius * 0.5;
      const backSpan = tree.radius * (0.28 + backPct * 1.24);
      ctx.strokeStyle = `rgba(255, 228, 188, ${0.18 + backPct * 0.7 + flash * 0.2})`;
      ctx.lineWidth = Math.max(2, tree.radius * (0.12 + backPct * 0.14));
      ctx.beginPath();
      ctx.moveTo(
        backCenterX - trunkUnit.x * backSpan,
        backCenterY - trunkUnit.y * backSpan
      );
      ctx.lineTo(
        backCenterX + trunkUnit.x * backSpan,
        backCenterY + trunkUnit.y * backSpan
      );
      ctx.stroke();
    }

    for (const branch of tree.branches) {
      const seg = getBranchSegment(tree, branch);
      if (!branch.cut) {
        const damageRatio = getBranchDamageRatio(branch);
        const woodShade = Math.floor(105 - branch.deadness * 34);
        const warm = Math.floor(136 + damageRatio * 90);
        ctx.strokeStyle =
          damageRatio > 0.02
            ? `rgb(${Math.min(255, warm)}, ${80 - branch.deadness * 10}, 36)`
            : `rgb(${woodShade}, ${66 - branch.deadness * 11}, 34)`;
        ctx.lineWidth = branch.thickness * (1 - damageRatio * 0.14);
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        if (damageRatio > 0.02) {
          const notchT = 0.18 + damageRatio * 0.18;
          const nx = lerp(seg.x1, seg.x2, notchT);
          const ny = lerp(seg.y1, seg.y2, notchT);
          const flash = clamp((branch.hitFlash || 0) * 4.2, 0, 1);
          ctx.strokeStyle = `rgba(255, 225, 182, ${0.28 + damageRatio * 0.5 + flash * 0.3})`;
          ctx.lineWidth = Math.max(1.6, branch.thickness * (0.22 + damageRatio * 0.22));
          ctx.beginPath();
          ctx.moveTo(nx - perp.x * branch.side * branch.thickness * 0.35, ny - perp.y * branch.side * branch.thickness * 0.35);
          ctx.lineTo(nx + perp.x * branch.side * branch.thickness * 0.35, ny + perp.y * branch.side * branch.thickness * 0.35);
          ctx.stroke();
        }

        ctx.fillStyle = branch.deadness > 0.45 ? "#5d6a4e" : species.leafColor;
        ctx.beginPath();
        ctx.arc(
          seg.x2,
          seg.y2,
          7 + branch.deadness * 4 + (branch.isBig ? 3 : 0) + (branch.tier === "high" ? 1 : 0),
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = branch.deadness > 0.45 ? "#6d7b5a" : species.leafAlt;
        ctx.beginPath();
        ctx.arc(
          seg.x2 + perp.x * branch.side * 7,
          seg.y2 + perp.y * branch.side * 7 - 2,
          4 + (branch.isBig ? 2 : 0),
          0,
          Math.PI * 2
        );
        ctx.arc(
          seg.x2 - perp.x * branch.side * 5,
          seg.y2 - perp.y * branch.side * 5 + 1,
          3.5 + (branch.tier === "high" ? 1.5 : 0),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    if (!tree.fallen) {
      ctx.fillStyle = tree.deadness > 0.45 ? "rgba(74, 96, 62, 0.42)" : "rgba(62, 121, 56, 0.36)";
      ctx.beginPath();
      ctx.ellipse(
        topX + perp.x * tree.radius * 0.8,
        topY + perp.y * tree.radius * 0.8,
        tree.radius * 2.4,
        tree.radius * 1.5,
        getTreeDisplayAngle(tree),
        0,
        Math.PI * 2
      );
      ctx.ellipse(
        topX - perp.x * tree.radius * 0.7,
        topY - perp.y * tree.radius * 0.4,
        tree.radius * 2,
        tree.radius * 1.25,
        getTreeDisplayAngle(tree),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    if (!tree.fallen) {
      const wedgeY = tree.baseY - 8;
      if (tree.wedge !== 0) {
        ctx.fillStyle = tree.wedge > 0 ? "#f05f4f" : "#4f7de8";
        ctx.beginPath();
        ctx.moveTo(tree.x, wedgeY);
        ctx.lineTo(tree.x + tree.wedge * 28, wedgeY - 12);
        ctx.lineTo(tree.x + tree.wedge * 28, wedgeY + 12);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawBirds() {
    for (const bird of state.birds) {
      const flap = Math.sin(state.elapsed * 20 + bird.wingPhase);
      const wing = bird.perched ? 1.2 : 2.2 + Math.abs(flap) * 2.4;
      ctx.strokeStyle = bird.tint;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bird.x - wing, bird.y);
      ctx.lineTo(bird.x, bird.y - wing * 0.65);
      ctx.lineTo(bird.x + wing, bird.y);
      ctx.stroke();

      if (!bird.perched) {
        ctx.fillStyle = "rgba(230, 236, 248, 0.42)";
        ctx.beginPath();
        ctx.arc(bird.x, bird.y + 1.2, bird.size * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawTreeCat() {
    const cat = state.treeCat;
    if (!cat) {
      return;
    }
    const fade = cat.dying ? clamp(cat.fade, 0, 1) : 1;
    const red = cat.dying ? 1 : 0;
    const bodyColor = red > 0 ? "#d44b4b" : "#c09b6b";
    const bodyShade = red > 0 ? "#9d2f2f" : "#8f6f4a";
    const wobble = cat.dying ? Math.sin(cat.wobblePhase) * 0.16 : 0;

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(cat.x, cat.y);
    ctx.rotate(wobble);
    ctx.scale(cat.facing || 1, 1);

    ctx.fillStyle = bodyShade;
    ctx.beginPath();
    ctx.ellipse(-9, 1, 8, 4, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyShade;
    ctx.beginPath();
    ctx.arc(9, -3, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = red > 0 ? "#ffbec6" : "#f4e9d2";
    ctx.beginPath();
    ctx.moveTo(11, -8);
    ctx.lineTo(8, -12);
    ctx.lineTo(6, -7);
    ctx.closePath();
    ctx.moveTo(4, -8);
    ctx.lineTo(1, -12);
    ctx.lineTo(-1, -7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#1f1f1f";
    ctx.beginPath();
    ctx.arc(10, -3, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = red > 0 ? "#ffdbdb" : "#f7d1b4";
    ctx.beginPath();
    ctx.arc(13, 0, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawNick() {
    const x = state.nickX;
    const danceOffset = state.showtime.sway || 0;
    const y = WORLD.groundY + state.nickY + danceOffset;
    const jumpT = clamp(-state.nickY / 150, 0, 1);
    const pointerSwing = state.pointer.down ? Math.sin(performance.now() * 0.03) * 6 : 0;
    const armOffset = pointerSwing + (state.showtime.armSwing || 0);
    const danceTilt = state.showtime.active
      ? Math.sin(state.showtime.phase * 2.4) * 0.065
      : 0;
    const bowSweep = state.showtime.active
      ? Math.sin(state.showtime.phase * 8.6) * 8
      : 0;

    ctx.save();
    ctx.translate(x, WORLD.groundY);
    ctx.fillStyle = `rgba(12, 16, 12, ${0.24 - jumpT * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(0, 5, 28 - jumpT * 8, 9 - jumpT * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    if (Math.abs(danceTilt) > 0.001) {
      ctx.rotate(danceTilt);
    }

    ctx.fillStyle = "#2f3d68";
    ctx.beginPath();
    ctx.roundRect(-20, -60, 40, 44, 7);
    ctx.fill();

    ctx.fillStyle = "#4d315f";
    ctx.beginPath();
    ctx.roundRect(-16, -16, 12, 18, 3);
    ctx.roundRect(4, -16, 12, 18, 3);
    ctx.fill();

    ctx.fillStyle = "#f2d2ac";
    ctx.beginPath();
    ctx.arc(0, -72, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#121212";
    ctx.beginPath();
    ctx.moveTo(-10, -70);
    ctx.quadraticCurveTo(0, -48, 10, -70);
    ctx.quadraticCurveTo(0, -58, -10, -70);
    ctx.fill();

    ctx.fillStyle = "#111";
    ctx.fillRect(-7, -77, 14, 3);

    ctx.strokeStyle = "#f2d2ac";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-11, -47);
    ctx.lineTo(-29, -38 + armOffset * 0.6);
    ctx.moveTo(12, -46);
    ctx.lineTo(30, -34 - armOffset);
    ctx.stroke();

    ctx.fillStyle = "#2b2a26";
    ctx.beginPath();
    ctx.roundRect(-17, -88, 34, 12, 3);
    ctx.fill();
    ctx.fillStyle = "#f3c44e";
    ctx.fillRect(-13, -84, 26, 4);

    // Fiddle in left hand
    ctx.fillStyle = "#6f3b1f";
    ctx.beginPath();
    ctx.ellipse(-33, -38 + armOffset * 0.45, 8, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(-33, -55 + armOffset * 0.45, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4f2a16";
    ctx.fillRect(-36, -50 + armOffset * 0.45, 6, 8);
    ctx.strokeStyle = "#deb17d";
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 3; i += 1) {
      const sx = -37 + i * 2.3;
      ctx.beginPath();
      ctx.moveTo(sx, -63 + armOffset * 0.45);
      ctx.lineTo(sx, -30 + armOffset * 0.45);
      ctx.stroke();
    }
    ctx.strokeStyle = "#d7c09f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-45, -30 + armOffset * 0.2 + bowSweep * 0.42);
    ctx.lineTo(-18, -61 + armOffset * 0.2 - bowSweep * 0.58);
    ctx.stroke();

    if (state.controlMode === "axe") {
      // Axe in right hand
      const handX = 30;
      const handY = -35 - armOffset * 0.35;
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(-0.62 + armOffset * 0.015);

      ctx.fillStyle = "#835936";
      ctx.beginPath();
      ctx.roundRect(-2.4, -3, 4.8, 30, 2);
      ctx.fill();

      ctx.fillStyle = "#ccd4dc";
      ctx.beginPath();
      ctx.moveTo(-2, -2);
      ctx.lineTo(14, -6);
      ctx.lineTo(19, 0);
      ctx.lineTo(10, 8);
      ctx.lineTo(2, 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#9fa8b0";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(11, -3);
      ctx.lineTo(14, 0.8);
      ctx.lineTo(8, 5.5);
      ctx.lineTo(0, 4.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      // Chainsaw in right hand
      ctx.fillStyle = "#c74a2f";
      ctx.beginPath();
      ctx.roundRect(24, -43 - armOffset * 0.35, 22, 12, 4);
      ctx.fill();
      ctx.fillStyle = "#f2c15d";
      ctx.fillRect(30, -46 - armOffset * 0.35, 8, 4);
      ctx.fillStyle = "#2d2a2a";
      ctx.fillRect(34, -38 - armOffset * 0.35, 5, 5);
      ctx.fillStyle = "#c6d0d8";
      ctx.beginPath();
      ctx.roundRect(45, -40 - armOffset * 0.35, 18, 6, 2);
      ctx.fill();
      ctx.strokeStyle = "#8a939c";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(48 + i * 4, -40 - armOffset * 0.35);
        ctx.lineTo(48 + i * 4, -34 - armOffset * 0.35);
        ctx.stroke();
      }
    }

    ctx.fillStyle = "#f2d2ac";
    ctx.beginPath();
    ctx.arc(30, -35 - armOffset * 0.35, 3, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawNickNotes() {
    for (const note of state.nickNotes) {
      const t = note.maxLife > 0 ? clamp(note.life / note.maxLife, 0, 1) : 0;
      const alpha = 0.14 + t * 0.76;
      const fill = `rgba(255, 238, 174, ${alpha})`;
      const stroke = `rgba(86, 62, 32, ${alpha * 0.9})`;
      const size = note.size;

      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.ellipse(note.x, note.y, size * 0.33, size * 0.23, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(note.x + size * 0.2, note.y - size * 0.06);
      ctx.lineTo(note.x + size * 0.2, note.y - size * 1.05);
      ctx.stroke();

      if (note.kind === 1) {
        ctx.beginPath();
        ctx.moveTo(note.x + size * 0.2, note.y - size * 0.98);
        ctx.quadraticCurveTo(
          note.x + size * 0.95,
          note.y - size * 0.92,
          note.x + size * 0.74,
          note.y - size * 0.45
        );
        ctx.stroke();
      }
    }
  }

  function drawNickSpeechBubble() {
    if (!state.nickSpeech.text || state.nickSpeech.life <= 0) {
      return;
    }

    const lifePct = clamp(
      state.nickSpeech.life / Math.max(0.25, state.nickSpeech.maxLife),
      0,
      1
    );
    const text = state.nickSpeech.text;
    const maxLineWidth = WORLD.width - 130;
    const lines = [];

    ctx.save();
    ctx.font = "700 18px Avenir Next, Trebuchet MS, sans-serif";
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || ctx.measureText(candidate).width <= maxLineWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) {
      lines.push(line);
    }

    let widest = 120;
    for (const l of lines) {
      widest = Math.max(widest, ctx.measureText(l).width);
    }

    const padX = 14;
    const padY = 12;
    const lineHeight = 22;
    const bubbleW = widest + padX * 2;
    const bubbleH = padY * 2 + lineHeight * lines.length;
    const anchorY = WORLD.groundY + state.nickY + (state.showtime.sway || 0) - 88;
    const tipX = state.nickX + 2;
    const tipY = anchorY;
    const bx = clamp(state.nickX + 36 - bubbleW * 0.3, 18, WORLD.width - bubbleW - 18);
    const by = clamp(anchorY - bubbleH - 34, 18, WORLD.groundY - 240);
    const tailX = clamp(tipX, bx + 18, bx + bubbleW - 18);

    ctx.globalAlpha = lifePct;
    ctx.fillStyle = "rgba(255, 252, 242, 0.96)";
    ctx.strokeStyle = "rgba(90, 74, 40, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleW, bubbleH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tailX - 11, by + bubbleH - 1);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(tailX + 11, by + bubbleH - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(33, 29, 22, 0.95)";
    let textY = by + padY + 17;
    for (const l of lines) {
      ctx.fillText(l, bx + padX, textY);
      textY += lineHeight;
    }
    ctx.restore();
  }

  function drawSlashTrails() {
    for (const trail of state.slashEchoes) {
      const alpha = clamp(trail.life / 0.18, 0, 1);
      ctx.strokeStyle = `rgba(255, 252, 238, ${0.24 + alpha * 0.64})`;
      ctx.lineWidth = 3.5 + alpha * 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(trail.x1, trail.y1);
      ctx.lineTo(trail.x2, trail.y2);
      ctx.stroke();
    }

    if (state.pointer.path.length > 1) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(state.pointer.path[0].x, state.pointer.path[0].y);
      for (let i = 1; i < state.pointer.path.length; i += 1) {
        ctx.lineTo(state.pointer.path[i].x, state.pointer.path[i].y);
      }
      ctx.stroke();
    }
  }

  function drawWoodChips() {
    for (const chip of state.chips) {
      const lifeT = chip.maxLife > 0 ? chip.life / chip.maxLife : 0;
      ctx.fillStyle = `rgba(234, 203, 147, ${clamp(lifeT, 0, 1)})`;
      ctx.beginPath();
      ctx.arc(chip.x, chip.y, 1.7 + lifeT * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHud() {
    if (isMobile) {
      drawHudMobile();
      return;
    }
    drawPanel(18, 16, 512, 200, {
      top: "rgba(22, 38, 44, 0.84)",
      bottom: "rgba(12, 21, 27, 0.72)",
    });

    ctx.fillStyle = "#f4faf6";
    ctx.font = "700 27px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(`Nick the Tree Man`, 32, 50);
    ctx.font = "600 16px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillStyle = "rgba(218, 234, 239, 0.92)";
    ctx.fillText(`Level ${state.level}/${MAX_LEVEL}  |  Cut ${state.totalCut}`, 34, 72);

    drawMeter(
      34,
      96,
      228,
      15,
      state.reputation / 100,
      "#72d97f",
      "#4dbf64",
      "Reputation",
      `${Math.round(state.reputation)}%`
    );
    drawMeter(
      34,
      132,
      228,
      15,
      (state.wind + 0.85) / 1.7,
      "#8ec8ff",
      "#4f9ff5",
      "Wind Pressure",
      `${state.wind >= 0 ? "+" : ""}${state.wind.toFixed(2)}`
    );
    drawMeter(
      34,
      168,
      228,
      15,
      clamp(state.bestFlow / 8, 0, 1),
      "#f8d67a",
      "#f2a93b",
      "Flow Streak",
      state.flowStreak > 0 ? `x${state.flowStreak}` : `best x${state.bestFlow}`
    );

    const districtName = state.district ? state.district.name : "District";
    const adrenalineText =
      state.adrenaline.timer > 0
        ? `Adrenaline ${Math.ceil(state.adrenaline.timer * 10) / 10}s`
        : "Adrenaline calm";
    const modeLabel = state.controlMode === "axe" ? "Axe mode" : "Saw mode";
    const showtimeLabel = state.showtime.active
      ? "Fiddle+dance: ON"
      : "Fiddle+dance: OFF";
    ctx.fillStyle = "#d8eaf0";
    ctx.font = "600 15px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(districtName, 286, 111);
    ctx.fillText(adrenalineText, 286, 136);
    if (state.bossTreeId) {
      const bossTree = state.trees.find((tree) => tree.id === state.bossTreeId);
      const remaining = bossTree ? bossTree.branches.filter((b) => !b.cut).length : 0;
      ctx.fillText(
        `Boss: ${bossTree && !bossTree.fallen ? `active (${remaining} limbs)` : "down"}`,
        286,
        161
      );
    } else {
      ctx.fillText("Boss: none", 286, 161);
    }
    ctx.fillText(modeLabel, 286, 186);
    ctx.fillText(showtimeLabel, 286, 211);

    const showtimeButton = getShowtimeButtonRect();
    drawPanel(showtimeButton.x, showtimeButton.y, showtimeButton.w, showtimeButton.h, {
      top: state.showtime.active ? "rgba(77, 58, 28, 0.88)" : "rgba(27, 45, 53, 0.84)",
      bottom: state.showtime.active ? "rgba(56, 39, 20, 0.76)" : "rgba(16, 30, 38, 0.72)",
      border: state.showtime.active
        ? "rgba(255, 216, 153, 0.44)"
        : "rgba(178, 211, 234, 0.3)",
      radius: 12,
    });
    ctx.fillStyle = state.showtime.active ? "#ffe8bf" : "#d8edf8";
    ctx.font = "700 15px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(
      state.showtime.active ? "Stop Fiddle Dance (V)" : "Play Fiddle + Dance (V)",
      showtimeButton.x + 14,
      showtimeButton.y + 27
    );

    if (state.contract) {
      drawPanel(WORLD.width * 0.5 - 270, 16, 540, 70, {
        top: "rgba(30, 42, 62, 0.84)",
        bottom: "rgba(20, 30, 48, 0.7)",
        border: "rgba(172, 203, 255, 0.28)",
      });
      const gustLabel = state.gust.active
        ? `${state.gust.dir > 0 ? "Gust ->" : "<- Gust"} ${state.gust.strength.toFixed(2)}`
        : `Next gust ${Math.max(0, state.gust.cooldown).toFixed(1)}s`;
      ctx.fillStyle = "#edf4ff";
      ctx.font = "700 22px Avenir Next, Trebuchet MS, sans-serif";
      ctx.fillText(state.contract.title, WORLD.width * 0.5 - 252, 44);
      ctx.font = "600 15px Avenir Next, Trebuchet MS, sans-serif";
      const districtLabel = state.district ? state.district.name : "District";
      ctx.fillText(
        `${districtLabel}  |  ${state.contract.blurb}  |  ${gustLabel}`,
        WORLD.width * 0.5 - 252,
        67
      );
    }

    const selected = getSelectedTree();
    if (selected && state.mode === "playing") {
      const direction = selected.wedge > 0 ? "Right" : selected.wedge < 0 ? "Left" : "None";
      const tierLabel = state.activeTier === "high" ? "Upper" : "Lower";
      const leftTierCount = selected.branches.filter(
        (branch) => !branch.cut && branch.side < 0 && branch.tier === state.activeTier
      ).length;
      const rightTierCount = selected.branches.filter(
        (branch) => !branch.cut && branch.side > 0 && branch.tier === state.activeTier
      ).length;
      const oldLady = getOldLadyCounts();
      const catStatus = state.treeCat
        ? state.treeCat.dying
          ? "injured"
          : state.treeCat.moving
            ? "moving"
            : "perched"
        : "none";
      const axe = selected.axe;
      const axeTargetLabel =
        axe && axe.targetSide !== 0 ? (axe.targetSide < 0 ? "Left" : "Right") : "Unset";
      const axeStageLabel = axe ? axe.stage : "idle";
      const safeLabel =
        selected.safeDirections && selected.safeDirections.length === 2
          ? "Both"
          : selected.safeDirectionHint < 0
            ? "Left"
            : selected.safeDirectionHint > 0
              ? "Right"
              : "Unknown";

      drawPanel(WORLD.width - 398, 16, 380, 344, {
        top: "rgba(28, 37, 33, 0.82)",
        bottom: "rgba(16, 26, 22, 0.72)",
      });

      ctx.fillStyle = "#f8f5dd";
      ctx.font = "700 20px Avenir Next, Trebuchet MS, sans-serif";
      ctx.fillText(`Selected: ${selected.id}`, WORLD.width - 380, 46);
      ctx.font = "600 16px Avenir Next, Trebuchet MS, sans-serif";
      const speciesLabel = `${selected.species ? selected.species.name : "Mixed"}${selected.isBoss ? " (Boss)" : ""}`;
      ctx.fillText(`Species: ${speciesLabel}`, WORLD.width - 380, 72);
      ctx.fillText(
        `Imbalance: ${selected.imbalance >= 0 ? "+" : ""}${selected.imbalance.toFixed(2)}`,
        WORLD.width - 380,
        96
      );
      ctx.fillText(
        `Mode: ${state.controlMode === "axe" ? "Axe" : "Saw"}  |  Wedge: ${direction}`,
        WORLD.width - 380,
        120
      );
      if (state.controlMode === "axe") {
        ctx.fillText(
          `Axe Target: ${axeTargetLabel}  Stage: ${axeStageLabel}`,
          WORLD.width - 380,
          144
        );
        ctx.fillText(
          `Notch ${axe ? axe.notchHits : 0}/${axe ? axe.notchNeed : 0}  Back ${axe ? axe.backHits : 0}/${axe ? axe.backNeed : 0}`,
          WORLD.width - 380,
          168
        );
      } else {
        ctx.fillText(`Tier: ${tierLabel}  |  Cut L ${leftTierCount}  R ${rightTierCount}`, WORLD.width - 380, 144);
        ctx.fillText(`Damaged Limbs: ${selected.branches.filter((branch) => !branch.cut && getBranchDamageRatio(branch) > 0.01).length}`, WORLD.width - 380, 168);
      }
      ctx.fillText(`Safe Fall Direction: ${safeLabel}`, WORLD.width - 380, 192);
      const proj = getProjectedFall(selected);
      const projSide = proj.direction < 0 ? "Left" : "Right";
      ctx.fillText(`Projected Drift: ${projSide} ${Math.round(proj.certainty * 100)}%`, WORLD.width - 380, 216);
      const damagedBranchCount = selected.branches.filter(
        (branch) => !branch.cut && getBranchDamageRatio(branch) > 0.01
      ).length;
      if (state.controlMode === "axe") {
        ctx.fillText(`Damaged Limbs: ${damagedBranchCount}`, WORLD.width - 380, 240);
      }
      ctx.fillText(
        `Old Ladies Safe: ${oldLady.saved}/${oldLady.total}`,
        WORLD.width - 380,
        264
      );
      ctx.fillText(`Tree Cat: ${catStatus}`, WORLD.width - 380, 288);

      drawMeter(
        WORLD.width - 380,
        312,
        344,
        14,
        clamp(Math.abs(selected.imbalance) / Math.max(0.22, autoFallThreshold(selected)), 0, 1),
        "#ffd87b",
        "#f2994f",
        "Tip Risk",
        `${Math.round(clamp(Math.abs(selected.imbalance) / Math.max(0.22, autoFallThreshold(selected)), 0, 1) * 100)}%`
      );
    }
  }

  function drawHudMobile() {
    const selected = getSelectedTree();
    const modeLabel = state.controlMode === "axe" ? "AXE" : "SAW";
    const tierLabel = state.activeTier === "high" ? "HI" : "LO";
    const gustLabel = state.gust.active
      ? `${state.gust.dir > 0 ? "GUST\u25B6" : "\u25C0GUST"}`
      : `Gust ${Math.max(0, state.gust.cooldown).toFixed(0)}s`;

    drawPanel(10, 8, 420, 52, {
      top: "rgba(22, 38, 44, 0.88)",
      bottom: "rgba(12, 21, 27, 0.78)",
      radius: 10,
    });

    ctx.fillStyle = "#f4faf6";
    ctx.font = "700 20px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(`L${state.level}`, 20, 32);

    drawMeter(52, 16, 120, 12, state.reputation / 100, "#72d97f", "#4dbf64", "Rep", `${Math.round(state.reputation)}%`);
    drawMeter(52, 40, 120, 12, (state.wind + 0.85) / 1.7, "#8ec8ff", "#4f9ff5", "Wind", `${state.wind >= 0 ? "+" : ""}${state.wind.toFixed(1)}`);

    ctx.fillStyle = "#d8eaf0";
    ctx.font = "600 14px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(`${modeLabel} | ${tierLabel} | Cut ${state.totalCut}`, 190, 26);
    ctx.fillText(`${gustLabel} | Flow x${state.flowStreak}`, 190, 48);

    if (selected && state.mode === "playing") {
      const safeLabel =
        selected.safeDirections && selected.safeDirections.length === 2
          ? "Both"
          : selected.safeDirectionHint < 0
            ? "\u25C0Safe"
            : selected.safeDirectionHint > 0
              ? "Safe\u25B6"
              : "?";
      const proj = getProjectedFall(selected);
      const projPct = Math.round(proj.certainty * 100);
      const tipRisk = clamp(Math.abs(selected.imbalance) / Math.max(0.22, autoFallThreshold(selected)), 0, 1);

      drawPanel(WORLD.width - 310, 8, 300, 52, {
        top: "rgba(28, 37, 33, 0.86)",
        bottom: "rgba(16, 26, 22, 0.76)",
        radius: 10,
      });

      ctx.fillStyle = "#f8f5dd";
      ctx.font = "700 14px Avenir Next, Trebuchet MS, sans-serif";
      const speciesName = selected.species ? selected.species.name : "Tree";
      ctx.fillText(`${speciesName}${selected.isBoss ? " BOSS" : ""} | ${safeLabel}`, WORLD.width - 296, 26);
      ctx.font = "600 13px Avenir Next, Trebuchet MS, sans-serif";
      ctx.fillStyle = "#d8eaf0";
      const wedgeLabel = selected.wedge > 0 ? "Wdg\u25B6" : selected.wedge < 0 ? "\u25C0Wdg" : "NoWdg";
      ctx.fillText(`Drift ${projPct}% | Tip ${Math.round(tipRisk * 100)}% | ${wedgeLabel}`, WORLD.width - 296, 48);

      drawMeter(WORLD.width - 296, 53, 120, 4, tipRisk, "#ffd87b", "#f2994f", "", "");
    }

    if (state.contract) {
      const contractW = 280;
      drawPanel(WORLD.width * 0.5 - contractW * 0.5, 8, contractW, 32, {
        top: "rgba(30, 42, 62, 0.84)",
        bottom: "rgba(20, 30, 48, 0.7)",
        border: "rgba(172, 203, 255, 0.28)",
        radius: 8,
      });
      ctx.fillStyle = "#edf4ff";
      ctx.font = "700 15px Avenir Next, Trebuchet MS, sans-serif";
      ctx.fillText(state.contract.title, WORLD.width * 0.5 - contractW * 0.5 + 12, 30);
    }
  }

  function drawCallouts() {
    if (state.callouts.length === 0) {
      return;
    }
    const visible = state.callouts.slice(-2).reverse();
    let y = WORLD.groundY - 82;
    for (const callout of visible) {
      const alpha = clamp(callout.life / Math.max(0.2, callout.maxLife), 0, 1);
      const rise = (1 - alpha) * callout.drift;
      const textY = y - rise;
      drawPanel(30, textY - 26, 470, 34, {
        top: `rgba(31, 45, 52, ${0.86 * alpha})`,
        bottom: `rgba(16, 24, 31, ${0.78 * alpha})`,
        border: `rgba(167, 201, 223, ${0.34 * alpha})`,
        radius: 10,
      });
      ctx.fillStyle = callout.color;
      ctx.font = "700 18px Avenir Next, Trebuchet MS, sans-serif";
      ctx.fillText(callout.text, 44, textY - 2);
      y -= 42;
    }
  }

  function drawOverlayPanel(title, lines) {
    ctx.fillStyle = "rgba(9, 18, 12, 0.72)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    const panelW = 780;
    const panelH = clamp(190 + lines.length * 38, 320, WORLD.height - 70);
    const x = (WORLD.width - panelW) * 0.5;
    const y = (WORLD.height - panelH) * 0.5;

    drawPanel(x, y, panelW, panelH, {
      top: "rgba(240, 248, 235, 0.97)",
      bottom: "rgba(219, 235, 215, 0.95)",
      border: "rgba(75, 108, 68, 0.45)",
      radius: 18,
    });

    ctx.fillStyle = "rgba(28, 55, 31, 0.96)";
    ctx.font = "800 56px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(title, x + 44, y + 84);

    ctx.fillStyle = "rgba(26, 50, 29, 0.9)";
    ctx.font = "600 24px Avenir Next, Trebuchet MS, sans-serif";
    let lineY = y + 136;
    for (const line of lines) {
      ctx.fillText(line, x + 44, lineY);
      lineY += 37;
    }
  }

  function drawMenuTutorialCard(x, y, w, h, title, lines, accent) {
    drawPanel(x, y, w, h, {
      top: "rgba(245, 250, 244, 0.95)",
      bottom: "rgba(225, 238, 221, 0.94)",
      border: "rgba(83, 112, 76, 0.38)",
      radius: 14,
    });
    ctx.fillStyle = accent;
    ctx.font = "800 24px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(title, x + 18, y + 34);
    ctx.fillStyle = "rgba(28, 47, 30, 0.9)";
    ctx.font = "600 17px Avenir Next, Trebuchet MS, sans-serif";
    let yy = y + 62;
    for (const line of lines) {
      ctx.fillText(line, x + 18, yy);
      yy += 29;
    }
  }

  function drawMenuKeyHint(x, y, key, detail, accent = false) {
    const w = accent ? 170 : 152;
    drawPanel(x, y, w, 54, {
      top: accent ? "rgba(67, 84, 124, 0.92)" : "rgba(25, 38, 52, 0.88)",
      bottom: accent ? "rgba(51, 67, 102, 0.88)" : "rgba(16, 25, 35, 0.82)",
      border: accent ? "rgba(205, 225, 255, 0.4)" : "rgba(167, 189, 220, 0.28)",
      radius: 10,
    });
    ctx.fillStyle = "#f2f6ff";
    ctx.font = "800 16px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(key, x + 12, y + 22);
    ctx.font = "600 14px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillStyle = "rgba(215, 229, 247, 0.92)";
    ctx.fillText(detail, x + 12, y + 42);
  }

  function drawMenuTutorialOverlay() {
    const now = performance.now() * 0.001;
    const pulse = 0.25 + Math.sin(now * 3.2) * 0.13;

    ctx.fillStyle = "rgba(8, 16, 18, 0.72)";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    if (isMobile) {
      drawMenuMobile(now, pulse);
      return;
    }

    const panelW = 1120;
    const panelH = 630;
    const x = (WORLD.width - panelW) * 0.5;
    const y = (WORLD.height - panelH) * 0.5;

    drawPanel(x, y, panelW, panelH, {
      top: "rgba(231, 244, 232, 0.98)",
      bottom: "rgba(208, 227, 207, 0.95)",
      border: "rgba(74, 102, 68, 0.48)",
      radius: 22,
    });

    ctx.fillStyle = "rgba(24, 50, 30, 0.98)";
    ctx.font = "900 60px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText("NICK THE TREE MAN", x + 42, y + 78);
    ctx.fillStyle = "rgba(46, 76, 52, 0.95)";
    ctx.font = "700 27px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText("Town Tree Crew Bootcamp", x + 44, y + 112);
    ctx.fillStyle = "rgba(42, 67, 43, 0.9)";
    ctx.font = "600 20px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText(
      "Tutorial mission: keep every trunk off homes, cars, and old ladies.",
      x + 44,
      y + 142
    );

    ctx.strokeStyle = `rgba(255, 230, 162, ${0.34 + pulse})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 44, y + 160);
    ctx.lineTo(x + panelW - 44, y + 160);
    ctx.stroke();

    const cardY = y + 184;
    const cardGap = 18;
    const cardW = (panelW - 88 - cardGap * 2) / 3;
    drawMenuTutorialCard(
      x + 28,
      cardY,
      cardW,
      194,
      "Step 1: Read The Lean",
      [
        "Pick trees with cursor or Tab.",
        "Watch Safe Fall + Drift lines.",
        "1/2 choose lower or upper tier.",
        "Cats move branch-to-branch.",
      ],
      "#3d6d47"
    );
    drawMenuTutorialCard(
      x + 28 + cardW + cardGap,
      cardY,
      cardW,
      194,
      "Step 2: Cut With Intent",
      [
        "Saw: A left, B/D right, or swipe.",
        "Thick limbs take repeated hits.",
        "X toggles Saw/Axe mode.",
        "Axe appears in hand in Axe mode.",
      ],
      "#49609b"
    );
    drawMenuTutorialCard(
      x + 28 + (cardW + cardGap) * 2,
      cardY,
      cardW,
      194,
      "Step 3: Drop It Safe",
      [
        "Axe mode: notch one side first.",
        "Then back-cut opposite side.",
        "Q/E bias wedge, W clears wedge.",
        "Space jumps Nick out of danger.",
      ],
      "#8a5733"
    );

    const hintY = y + 398;
    const hints = [
      ["A / B / D", "Saw cuts by side", false],
      ["1 / 2", "Select branch tier", false],
      ["X", "Switch saw/axe", true],
      ["Q / E / W", "Set or clear wedge", false],
      ["TAB", "Cycle target tree", false],
      ["SPACE", "Jump", false],
    ];
    let hx = x + 28;
    for (const hint of hints) {
      drawMenuKeyHint(hx, hintY, hint[0], hint[1], hint[2]);
      hx += (hint[2] ? 170 : 152) + 12;
    }

    drawPanel(x + 28, y + 468, panelW - 56, 134, {
      top: "rgba(30, 45, 60, 0.88)",
      bottom: "rgba(17, 27, 38, 0.83)",
      border: "rgba(182, 212, 244, 0.35)",
      radius: 14,
    });
    ctx.fillStyle = "#eaf4ff";
    ctx.font = "700 29px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText("Training Contract: Main Street Shift", x + 52, y + 509);
    ctx.font = "600 19px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillStyle = "rgba(208, 225, 244, 0.95)";
    ctx.fillText(
      "Goal: balance each tree and force clean falls without collateral damage.",
      x + 52,
      y + 538
    );
    ctx.fillStyle = "#ffdca8";
    ctx.font = "800 34px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText("PRESS ENTER OR CLICK TO START SHIFT", x + 52, y + 580);
    ctx.font = "600 17px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillStyle = "rgba(201, 219, 235, 0.94)";
    ctx.fillText("F toggles fullscreen • V starts fiddle dance mode", x + 52, y + 602);
  }

  function drawMenuMobile(now, pulse) {
    const panelW = WORLD.width - 40;
    const panelH = WORLD.height - 40;
    const x = 20;
    const y = 20;

    drawPanel(x, y, panelW, panelH, {
      top: "rgba(231, 244, 232, 0.98)",
      bottom: "rgba(208, 227, 207, 0.95)",
      border: "rgba(74, 102, 68, 0.48)",
      radius: 18,
    });

    ctx.fillStyle = "rgba(24, 50, 30, 0.98)";
    ctx.font = "900 42px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText("NICK THE TREE MAN", x + 30, y + 58);
    ctx.fillStyle = "rgba(46, 76, 52, 0.95)";
    ctx.font = "700 20px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText("Town Tree Crew Bootcamp", x + 32, y + 86);

    ctx.strokeStyle = `rgba(255, 230, 162, ${0.34 + pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 100);
    ctx.lineTo(x + panelW - 30, y + 100);
    ctx.stroke();

    const cardW = (panelW - 80) / 3;
    const cardY = y + 114;
    drawMenuTutorialCard(
      x + 20,
      cardY,
      cardW,
      160,
      "1: Read The Lean",
      [
        "Tap trees to select them.",
        "Watch fall direction lines.",
        "Use LOW/HIGH tier buttons.",
      ],
      "#3d6d47"
    );
    drawMenuTutorialCard(
      x + 30 + cardW,
      cardY,
      cardW,
      160,
      "2: Cut With Intent",
      [
        "Swipe across branches to cut.",
        "Use L/R buttons for key cuts.",
        "Toggle SAW/AXE mode below.",
      ],
      "#49609b"
    );
    drawMenuTutorialCard(
      x + 40 + cardW * 2,
      cardY,
      cardW,
      160,
      "3: Drop It Safe",
      [
        "Set wedge direction with buttons.",
        "Axe: notch, then back-cut.",
        "JUMP dodges falling trunks.",
      ],
      "#8a5733"
    );

    drawPanel(x + 20, y + 290, panelW - 40, 66, {
      top: "rgba(30, 45, 60, 0.88)",
      bottom: "rgba(17, 27, 38, 0.83)",
      border: "rgba(182, 212, 244, 0.35)",
      radius: 12,
    });
    ctx.fillStyle = "#eaf4ff";
    ctx.font = "700 22px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillText("Training Contract: Main Street Shift", x + 40, y + 320);
    ctx.font = "600 16px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillStyle = "rgba(208, 225, 244, 0.95)";
    ctx.fillText(
      "Balance trees and force clean falls without collateral damage.",
      x + 40,
      y + 345
    );

    const tapAlpha = 0.7 + Math.sin(now * 4) * 0.3;
    ctx.fillStyle = `rgba(255, 220, 168, ${tapAlpha})`;
    ctx.font = "800 38px Avenir Next, Trebuchet MS, sans-serif";
    const tapText = "TAP ANYWHERE TO START";
    const tapW = ctx.measureText(tapText).width;
    ctx.fillText(tapText, (WORLD.width - tapW) * 0.5, y + panelH - 42);

    ctx.font = "600 15px Avenir Next, Trebuchet MS, sans-serif";
    ctx.fillStyle = "rgba(90, 120, 80, 0.85)";
    const tipText = "Turn your phone sideways for the best experience";
    const tipW = ctx.measureText(tipText).width;
    ctx.fillText(tipText, (WORLD.width - tipW) * 0.5, y + panelH - 16);
  }

  function drawTouchControls() {
    const buttons = getTouchButtons();
    if (buttons.length === 0) return;

    for (const id in touchBtnFlash) {
      if (touchBtnFlash[id] > 0) {
        touchBtnFlash[id] = Math.max(0, touchBtnFlash[id] - 0.016);
      }
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.roundRect(6, TOUCH_BAR_TOP, WORLD.width - 12, 84, 14);
    ctx.fill();

    for (const btn of buttons) {
      const flash = touchBtnFlash[btn.id] || 0;
      const isActive = btn.active;
      const brightness = flash > 0 ? 0.4 + flash * 2.5 : 0;

      const topColor = isActive
        ? `rgba(${62 + brightness * 80}, ${92 + brightness * 60}, ${52 + brightness * 60}, 0.92)`
        : `rgba(${28 + brightness * 100}, ${42 + brightness * 100}, ${52 + brightness * 100}, 0.88)`;
      const bottomColor = isActive
        ? `rgba(${38 + brightness * 60}, ${62 + brightness * 40}, ${32 + brightness * 40}, 0.82)`
        : `rgba(${16 + brightness * 80}, ${26 + brightness * 80}, ${34 + brightness * 80}, 0.78)`;
      const borderColor = isActive
        ? `rgba(${144 + brightness * 80}, ${218 + brightness * 30}, ${148 + brightness * 60}, 0.5)`
        : `rgba(${160 + brightness * 80}, ${200 + brightness * 40}, ${230 + brightness * 20}, 0.32)`;

      drawPanel(btn.x, btn.y, btn.w, btn.h, {
        top: topColor,
        bottom: bottomColor,
        border: borderColor,
        radius: 11,
      });

      ctx.fillStyle = isActive ? "#d4ffd8" : "#e4f0f8";
      ctx.font = "800 18px Avenir Next, Trebuchet MS, sans-serif";
      const textW = ctx.measureText(btn.label).width;
      const tx = btn.x + (btn.w - textW) * 0.5;
      const ty = btn.sublabel ? btn.y + 26 : btn.y + 36;
      ctx.fillText(btn.label, tx, ty);

      if (btn.sublabel) {
        ctx.font = "600 12px Avenir Next, Trebuchet MS, sans-serif";
        ctx.fillStyle = isActive ? "rgba(180, 240, 185, 0.8)" : "rgba(190, 210, 230, 0.7)";
        const subW = ctx.measureText(btn.sublabel).width;
        ctx.fillText(btn.sublabel, btn.x + (btn.w - subW) * 0.5, btn.y + 50);
      }
    }
  }

  function drawScreenFx() {
    const vig = ctx.createRadialGradient(
      WORLD.width * 0.5,
      WORLD.height * 0.48,
      WORLD.height * 0.18,
      WORLD.width * 0.5,
      WORLD.height * 0.5,
      WORLD.width * 0.65
    );
    vig.addColorStop(0, "rgba(0, 0, 0, 0)");
    vig.addColorStop(1, "rgba(9, 14, 11, 0.2)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i += 1) {
      const y = 24 + i * 58 + Math.sin(state.elapsed * 0.6 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD.width, y);
      ctx.stroke();
    }
  }

  function drawScene() {
    drawBackground();
    drawAmbientParticles();
    if (state.lightningFlash > 0) {
      ctx.fillStyle = `rgba(238, 247, 255, ${state.lightningFlash * 1.9})`;
      ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    }

    ctx.save();
    ctx.translate(state.camera.x, state.camera.y);

    drawWindTrails();
    for (const hazard of state.hazards) {
      drawHazard(hazard);
    }
    drawCrashBursts();

    for (const tree of state.trees) {
      drawTree(tree);
    }

    drawBirds();
    drawTreeCat();
    drawWoodChips();
    drawSlashTrails();
    drawNick();
    drawNickNotes();
    drawNickSpeechBubble();
    ctx.restore();

    drawScreenFx();
    drawHud();
    drawCallouts();
    drawTouchControls();

    if (state.mode === "menu") {
      drawMenuTutorialOverlay();
    } else if (state.mode === "levelComplete" && state.levelReport) {
      drawOverlayPanel(`Level ${state.level} Cleared`, [
        `District: ${state.levelReport.district || (state.district ? state.district.name : "Unknown")}`,
        `Style rank: ${state.levelReport.styleRank || "Steady"}`,
        `Saved valuables: ${state.levelReport.saved}`,
        `Old ladies safe: ${state.levelReport.oldLadiesSaved || 0}`,
        `Damaged targets: ${state.levelReport.damaged}`,
        `Old ladies hit: ${state.levelReport.oldLadiesHit || 0}`,
        `Trunk crashes: ${state.levelReport.trunkCrashes || 0}`,
        `Reputation penalty: -${state.levelReport.penalty}`,
        `Flow bonus: +${state.levelReport.flowBonus || 0} (best x${state.levelReport.bestFlow || 0})`,
        `Current reputation: ${state.levelReport.reputation}`,
        isMobile ? "Tap to continue." : "Press Enter for next level.",
      ]);
    } else if (state.mode === "gameover" && state.levelReport) {
      const failTitle =
        state.failReason === "cat"
          ? "Cat Rescue Failed"
          : state.failReason === "oldlady"
            ? "Civic Disaster"
            : "Reputation Lost";
      drawOverlayPanel(failTitle, [
        state.levelReport.failureMessage || "A critical failure occurred.",
        `Damaged this round: ${state.levelReport.damaged}`,
        `Old ladies hit: ${state.levelReport.oldLadiesHit || 0}`,
        `Trunk crashes: ${state.levelReport.trunkCrashes || 0}`,
        `Total limbs cut: ${state.totalCut}`,
        `Total valuables saved: ${state.totalSaved}`,
        isMobile ? "Tap to restart." : "Press Enter to restart from level 1.",
      ]);
    } else if (state.mode === "victory" && state.levelReport) {
      drawOverlayPanel("Town Saved", [
        `Final district: ${state.district ? state.district.name : "Unknown"}`,
        `Total valuables saved: ${state.totalSaved}`,
        `Total damage events: ${state.totalDamaged}`,
        `Final style rank: ${state.levelReport.styleRank || "Steady"}`,
        `Best flow streak: x${state.bestFlow}`,
        `Final reputation: ${state.reputation}`,
        isMobile ? "Tap to play again." : "Press Enter to play again.",
      ]);
    }
  }

  function toWorld(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * canvas.width,
      y: ((ev.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function resetPointerTrail() {
    state.pointer.path.length = 0;
    state.pointer.lastSpeed = 0;
  }

  function startPointer(ev) {
    const pos = toWorld(ev);
    const now = performance.now();

    if (isMobile && state.mode === "playing") {
      const buttons = getTouchButtons();
      for (const btn of buttons) {
        if (pointInRect(pos.x, pos.y, btn)) {
          btn.action();
          flashTouchBtn(btn.id);
          state.pointer.down = false;
          resetPointerTrail();
          state.pointer.lastTap = null;
          return;
        }
      }
    }

    if (!isMobile && state.mode === "playing") {
      const showtimeButton = getShowtimeButtonRect();
      if (pointInRect(pos.x, pos.y, showtimeButton)) {
        toggleNickShowtime();
        state.pointer.down = false;
        resetPointerTrail();
        state.pointer.lastTap = null;
        return;
      }
    }

    if (state.mode === "levelComplete") {
      startLevel(state.level + 1);
      vibrate(20);
      return;
    }
    if (state.mode === "gameover" || state.mode === "victory") {
      restartGame();
      vibrate(20);
      return;
    }

    state.pointer.down = true;
    state.pointer.x = pos.x;
    state.pointer.y = pos.y;
    state.pointer.path = [{ x: pos.x, y: pos.y, t: now }];
    updateSelectedTreeFromPointer();

    if (state.mode === "menu") {
      restartGame();
      vibrate(30);
      state.pointer.down = false;
      resetPointerTrail();
      state.pointer.lastTap = null;
    } else if (state.mode === "playing") {
      updateSelectedTreeFromPointer();
      if (state.pointer.lastTap) {
        const prev = state.pointer.lastTap;
        const d = Math.sqrt(distanceSq(prev.x, prev.y, pos.x, pos.y));
        const dtMs = now - prev.t;
        if (dtMs > 0 && dtMs < 420 && d > 10) {
          const inferredSpeed = (d / dtMs) * 1000;
          state.pointer.lastSpeed = inferredSpeed;
          applySlashSegment(
            prev.x,
            prev.y,
            pos.x,
            pos.y,
            Math.max(inferredSpeed, MIN_SLASH_SPEED + 25)
          );
        }
      }
      state.pointer.lastTap = { x: pos.x, y: pos.y, t: now };
    }
  }

  function movePointer(ev) {
    const pos = toWorld(ev);
    state.pointer.x = pos.x;
    state.pointer.y = pos.y;

    if (isMobile && pos.y > TOUCH_BAR_TOP) {
      return;
    }

    if (state.pointer.down && state.mode === "playing") {
      const path = state.pointer.path;
      const prev = path[path.length - 1];
      if (!prev) {
        path.push({ x: pos.x, y: pos.y, t: performance.now() });
        return;
      }
      const d = Math.sqrt(distanceSq(prev.x, prev.y, pos.x, pos.y));
      if (d > 2) {
        const now = performance.now();
        const dtMs = Math.max(1, now - prev.t);
        const speed = (d / dtMs) * 1000;
        state.pointer.lastSpeed = speed;
        path.push({ x: pos.x, y: pos.y, t: now });
        if (path.length > 10) {
          path.splice(0, path.length - 10);
        }
        applySlashSegment(prev.x, prev.y, pos.x, pos.y, speed);
      }
      updateSelectedTreeFromPointer();
    }
  }

  function endPointer() {
    state.pointer.down = false;
    resetPointerTrail();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement === canvas) {
      document.exitFullscreen();
      return;
    }
    canvas.requestFullscreen().catch(() => {
      // Ignore; fullscreen can fail if blocked by browser policy.
    });
  }

  function syncCanvasPresentation() {
    if (document.fullscreenElement === canvas) {
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
    } else if (isMobile) {
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
    } else {
      canvas.style.width = "min(96vw, 1280px)";
      canvas.style.height = "min(92vh, 720px)";
    }
  }

  function handleKeyDown(ev) {
    const rawKey = ev.key;
    const key = rawKey.toLowerCase();
    const isSpace = rawKey === " " || key === "spacebar" || key === "space";

    if (key === "enter") {
      if (state.mode === "menu") {
        restartGame();
        return;
      }

      if (state.mode === "levelComplete") {
        startLevel(state.level + 1);
        return;
      }

      if (state.mode === "gameover" || state.mode === "victory") {
        restartGame();
      }
      return;
    }

    if (key === "f") {
      toggleFullscreen();
      return;
    }

    if (key === "r") {
      restartGame();
      return;
    }

    if (isSpace) {
      ev.preventDefault();
      if (state.mode === "menu") {
        restartGame();
        jumpNick();
        return;
      }
      if (state.mode === "playing") {
        jumpNick();
      }
      return;
    }

    if (key === "tab" && state.mode === "playing") {
      ev.preventDefault();
      cycleSelectedTree(ev.shiftKey ? -1 : 1);
      return;
    }

    if (state.mode !== "playing") {
      return;
    }

    if (key === "v") {
      toggleNickShowtime();
      return;
    }

    if (key === "x") {
      state.controlMode = state.controlMode === "saw" ? "axe" : "saw";
      addCallout(
        state.controlMode === "axe"
          ? "Axe mode: notch + back-cut the trunk."
          : "Saw mode: cut limbs by side/tier.",
        state.controlMode === "axe" ? "#ffe0ad" : "#d3f4de",
        1.6
      );
      return;
    }

    const selected = getSelectedTree();
    if (!selected || selected.fallen) {
      return;
    }

    if (key === "1" || key === "arrowdown") {
      state.activeTier = "low";
    } else if (key === "2" || key === "arrowup") {
      state.activeTier = "high";
    } else if (key === "a") {
      if (state.controlMode === "axe") {
        axeChopSelectedTree(-1);
      } else {
        cutSelectedTreeBranch(-1);
      }
    } else if (key === "d" || key === "b") {
      if (state.controlMode === "axe") {
        axeChopSelectedTree(1);
      } else {
        cutSelectedTreeBranch(1);
      }
    } else if (key === "q" || key === "arrowleft") {
      selected.wedge = -1;
    } else if (key === "e" || key === "arrowright") {
      selected.wedge = 1;
    } else if (key === "w") {
      selected.wedge = 0;
    }
  }

  function getTimeScale() {
    if (state.adrenaline.timer <= 0 || state.adrenaline.duration <= 0) {
      return 1;
    }
    const t = clamp(state.adrenaline.timer / state.adrenaline.duration, 0, 1);
    return lerp(1, 0.58, t);
  }

  function step(dt) {
    update(dt * getTimeScale());
    drawScene();
  }

  let lastTs = performance.now();
  function frame(ts) {
    const dt = clamp((ts - lastTs) / 1000, 0, 0.05);
    lastTs = ts;
    step(dt);
    requestAnimationFrame(frame);
  }

  function renderGameToText() {
    const payload = {
      mode: state.mode,
      coordinateSystem: "origin at top-left; +x right; +y down; groundY=620",
      level: state.level,
      failReason: state.failReason,
      reputation: Math.round(state.reputation),
      wind: Number(state.wind.toFixed(3)),
      contract: state.contract
        ? {
            id: state.contract.id,
            title: state.contract.title,
            blurb: state.contract.blurb,
            ambient: state.contract.ambient || "pollen",
          }
        : null,
      district: state.district
        ? {
            id: state.district.id,
            name: state.district.name,
            tagline: state.district.tagline,
          }
        : null,
      bossTreeId: state.bossTreeId,
      gust: {
        active: state.gust.active,
        direction: state.gust.dir,
        strength: Number(state.gust.strength.toFixed(3)),
        timeLeft: Number(state.gust.timer.toFixed(3)),
        cooldown: Number(state.gust.cooldown.toFixed(3)),
      },
      flow: {
        streak: state.flowStreak,
        best: state.bestFlow,
        timer: Number(state.flowTimer.toFixed(3)),
      },
      callouts: state.callouts.map((c) => c.text).slice(0, 3),
      lightningFlash: Number(state.lightningFlash.toFixed(3)),
      camera: {
        x: Number(state.camera.x.toFixed(2)),
        y: Number(state.camera.y.toFixed(2)),
        trauma: Number(state.camera.trauma.toFixed(3)),
      },
      adrenaline: {
        active: state.adrenaline.timer > 0,
        timer: Number(state.adrenaline.timer.toFixed(3)),
        sourceTreeId: state.adrenaline.sourceTreeId,
      },
      birds: {
        total: state.birds.length,
        perched: state.birds.filter((b) => b.perched).length,
        flying: state.birds.filter((b) => !b.perched).length,
      },
      cat: state.treeCat
        ? {
            treeId: state.treeCat.treeId,
            branchId: state.treeCat.branchId,
            x: Number(state.treeCat.x.toFixed(1)),
            y: Number(state.treeCat.y.toFixed(1)),
            moving: !!state.treeCat.moving,
            dying: !!state.treeCat.dying,
            fade: Number((state.treeCat.fade || 0).toFixed(2)),
          }
        : null,
      oldLadies: getOldLadyCounts(),
      crashBursts: state.crashBursts.length,
      selectedTreeId: state.selectedTreeId,
      activeTier: state.activeTier,
      controlMode: state.controlMode,
      nick: {
        x: Number(state.nickX.toFixed(1)),
        yOffset: Number(state.nickY.toFixed(1)),
        danceOffset: Number((state.showtime.sway || 0).toFixed(1)),
        vy: Number(state.nickVy.toFixed(1)),
        airborne: state.nickY < -0.1 || Math.abs(state.nickVy) > 10,
        showtime: state.showtime.active,
        speech: state.nickSpeech.life > 0 ? state.nickSpeech.text : "",
        notes: state.nickNotes.length,
      },
      trunkCrashesThisLevel: state.trunkCrashesThisLevel,
      slash: {
        active: state.pointer.down,
        x: Number(state.pointer.x.toFixed(1)),
        y: Number(state.pointer.y.toFixed(1)),
        lastSpeed: Number(state.pointer.lastSpeed.toFixed(1)),
      },
      trees: state.trees.map((tree) => ({
        id: tree.id,
        x: Number(tree.x.toFixed(1)),
        baseY: tree.baseY,
        height: Number(tree.height.toFixed(1)),
        radius: Number(tree.radius.toFixed(1)),
        species: tree.species ? tree.species.name : "Mixed",
        isBoss: !!tree.isBoss,
        angle: Number(getTreeDisplayAngle(tree).toFixed(3)),
        falling: tree.falling,
        fallen: tree.fallen,
        wedge: tree.wedge,
        deadness: Number(tree.deadness.toFixed(2)),
        imbalance: Number(tree.imbalance.toFixed(3)),
        safeDirections: (tree.safeDirections || []).slice(),
        safeDirectionHint: tree.safeDirectionHint || 0,
        axe: tree.axe
          ? {
              targetSide: tree.axe.targetSide,
              notchHits: tree.axe.notchHits,
              notchNeed: tree.axe.notchNeed,
              backHits: tree.axe.backHits,
              backNeed: tree.axe.backNeed,
              stage: tree.axe.stage,
              bias: Number((tree.axeBias || 0).toFixed(3)),
            }
          : null,
        projectedFall: getProjectedFall(tree),
        damagedBranches: tree.branches.filter(
          (b) => !b.cut && getBranchDamageRatio(b) > 0.01
        ).length,
        avgBranchIntegrity: Number(
          (
            tree.branches
              .filter((b) => !b.cut)
              .reduce((sum, b) => {
                const maxHp = Math.max(0.01, b.maxHp || 1);
                const hp = typeof b.hp === "number" ? b.hp : maxHp;
                return sum + hp / maxHp;
              }, 0) /
            Math.max(1, tree.branches.filter((b) => !b.cut).length)
          ).toFixed(2)
        ),
        remainingBranches: tree.branches.filter((b) => !b.cut).length,
        remainingLowTier: tree.branches.filter(
          (b) => !b.cut && b.tier === "low"
        ).length,
        remainingHighTier: tree.branches.filter(
          (b) => !b.cut && b.tier === "high"
        ).length,
        cutBranches: tree.cutCount,
      })),
      hazards: state.hazards.map((hazard) => ({
        id: hazard.id,
        type: hazard.type,
        x: Number(hazard.x.toFixed(1)),
        y: hazard.y,
        w: hazard.w,
        h: hazard.h,
        damaged: hazard.damaged,
        impactFlash: Number((hazard.impactFlash || 0).toFixed(2)),
      })),
      totals: {
        limbsCut: state.totalCut,
        valuablesSaved: state.totalSaved,
        damagedCount: state.totalDamaged,
      },
      levelReport: state.levelReport
        ? {
            district: state.levelReport.district || (state.district ? state.district.name : "Unknown"),
            styleRank: state.levelReport.styleRank || "Steady",
            flowBonus: state.levelReport.flowBonus || 0,
            trunkCrashes: state.levelReport.trunkCrashes || 0,
            oldLadiesSaved: state.levelReport.oldLadiesSaved || 0,
            oldLadiesHit: state.levelReport.oldLadiesHit || 0,
            failureReason: state.levelReport.failureReason || "",
            failureMessage: state.levelReport.failureMessage || "",
          }
        : null,
    };

    return JSON.stringify(payload);
  }

  window.render_game_to_text = renderGameToText;

  window.advanceTime = (ms) => {
    const frames = Math.max(1, Math.round(ms / (1000 / 60)));
    const dt = ms / 1000 / frames;
    for (let i = 0; i < frames; i += 1) {
      update(dt * getTimeScale());
    }
    drawScene();
  };

  canvas.addEventListener("pointerdown", (ev) => {
    startPointer(ev);
  });

  canvas.addEventListener("pointermove", (ev) => {
    movePointer(ev);
  });

  canvas.addEventListener("pointerup", () => {
    endPointer();
  });

  canvas.addEventListener("pointercancel", () => {
    endPointer();
  });

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", syncCanvasPresentation);
  document.addEventListener("fullscreenchange", syncCanvasPresentation);

  syncCanvasPresentation();
  drawScene();
  requestAnimationFrame(frame);
})();
