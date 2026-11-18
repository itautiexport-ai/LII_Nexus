import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ALL_COMMON_WOOD_PARTS_AND_FRAMES,
  costingApi,
  CostEstimationItem,
  CostRateMaster,
  FURNITURE_PRODUCT_TYPES,
  getAssociatedWoodPartsForProduct,
} from "../api/costingApi";
import {
  AdditionalCostRecord,
  HardwareAccessory,
  masterDataApi,
  MdfPriceRecord,
  WoodPartNameRecord,
  WoodType,
} from "../../admin/masterdata/api/masterDataApi";
import {
  WoodThicknessPrice,
  findMatchingWoodThicknessRate,
  getLocalWoodThicknessPrices,
  loadSyncedWoodThicknessPrices,
} from "../../admin/masterdata/pages/WoodThicknessPricesPage";
import {
  getLocalWoodPartNames,
  loadSyncedWoodPartNames,
} from "../../admin/masterdata/pages/WoodPartNamesPage";
import {
  getLocalHardwareAccessories,
  loadSyncedHardwareAccessories,
} from "../../admin/masterdata/pages/HardwareAccessoriesPage";
import {
  getCachedUomOptions,
  getLocalAdditionalCosts,
  loadMergedUomOptions,
  loadSyncedAdditionalCosts,
  mergeUomNames,
} from "../../admin/masterdata/pages/AdditionalCostsPage";
import {
  findMatchingMdfPrice,
  getLocalMdfPrices,
  getMdfRecordsForType,
  isMdfType,
  loadSyncedMdfPrices,
} from "../../admin/masterdata/pages/MdfPricesPage";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import {
  MetalPrice,
  findMatchingMetalPrice,
  formatDimension,
  getLocalMetalPrices,
  getMetalSizeOptions,
} from "../../admin/masterdata/pages/MetalPricesPage";
import {
  getLocalCurrencyMap,
  getLocalUsdRate,
} from "../../admin/masterdata/pages/CurrencyRatesMasterPage";

export interface MetalSsItem {
  type: "Metal" | "SS";
  size: string;
  thickness: string;
  length: string;
  qty?: number | "";
  weight: number | "";
  rate: number | "";
  base_length?: string;
  base_weight?: number;
}

export interface WoodCostingItem {
  wood_part_name: string;
  wood_type: string;
  length_ft: number | "";
  width_in: number | "";
  thick_in: number | "";
  pcs: number | "";
  rate: number | "";
  auto_rate?: boolean;
  backend_cft?: number;
  mdf_sheet_size?: string;
  mdf_uom?: string;
}

export interface AdditionalCostItem {
  additional: string;
  size: string;
  calculation: string;
  uom: string;
  converted_value: string;
  price: number | "";
}

export interface HardwareCostItem {
  name: string;
  uom?: string;
  quantity: number | "";
  price: number | "";
}

export interface UpholsteryCostItem {
  item_name: string;
  specification?: string;
  uom?: string;
  quantity: number | "";
  rate: number | "";
}

export interface LabourCostItem {
  item_name: string;
  amount: number | "";
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  SAR: "SAR ",
  JPY: "¥",
};

export interface PackagingCostItem {
  item_name: string;
  specification?: string;
  quantity: number | "";
  rate: number | "";
}

export interface ForwardingCostItem {
  item_name: string;
  description?: string;
  amount: number | "";
}

export interface ExpenseCostItem {
  item_name: string;
  amount: number | "";
}

export interface CncCostItem {
  item_name: string;
  timing: string;
  cost: number | "";
}

export interface CartonSizeItem {
  length: number | "";
  width: number | "";
  height: number | "";
  unit: "cm" | "in";
}

function evaluateSizeEquation(raw: string): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";

  const normalized = trimmed
    .replace(/^=/, "")
    .replace(/,/g, "")
    .replace(/[×xX]/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "");

  if (!normalized) return "";
  if (!/^[0-9.+\-*/^%()]+$/.test(normalized)) {
    return null;
  }

  let pos = 0;

  const parseExpression = (): number => {
    let val = parseTerm();
    while (pos < normalized.length && (normalized[pos] === "+" || normalized[pos] === "-")) {
      const op = normalized[pos++];
      const right = parseTerm();
      val = op === "+" ? val + right : val - right;
    }
    return val;
  };

  const parseTerm = (): number => {
    let val = parsePower();
    while (
      pos < normalized.length &&
      (normalized[pos] === "*" || normalized[pos] === "/" || normalized[pos] === "%")
    ) {
      const op = normalized[pos++];
      const right = parsePower();
      if (op === "*") val *= right;
      else if (op === "/") val = right === 0 ? NaN : val / right;
      else val = right === 0 ? NaN : val % right;
    }
    return val;
  };

  const parsePower = (): number => {
    let base = parseUnary();
    if (pos < normalized.length && normalized[pos] === "^") {
      pos++;
      const exp = parsePower();
      base = Math.pow(base, exp);
    }
    return base;
  };

  const parseUnary = (): number => {
    if (normalized[pos] === "+") {
      pos++;
      return parseUnary();
    }
    if (normalized[pos] === "-") {
      pos++;
      return -parseUnary();
    }
    return parsePrimary();
  };

  const parsePrimary = (): number => {
    if (normalized[pos] === "(") {
      pos++;
      const inner = parseExpression();
      if (normalized[pos] !== ")") return NaN;
      pos++;
      return inner;
    }
    const start = pos;
    let dotCount = 0;
    while (
      pos < normalized.length &&
      ((normalized[pos] >= "0" && normalized[pos] <= "9") || normalized[pos] === ".")
    ) {
      if (normalized[pos] === ".") dotCount++;
      pos++;
    }
    if (start === pos || dotCount > 1) return NaN;
    const slice = normalized.slice(start, pos);
    if (slice === ".") return NaN;
    return Number(slice);
  };

  const result = parseExpression();
  if (pos !== normalized.length || !Number.isFinite(result)) {
    return null;
  }

  return Number(result.toFixed(4)).toString();
}

function convertCalculationByUom(calculationRaw: string, uomRaw: string): string {
  const calcTrimmed = String(calculationRaw ?? "").trim();
  const uomTrimmed = String(uomRaw ?? "").trim();
  if (!calcTrimmed || !uomTrimmed) return "";

  const calcNum = Number(calcTrimmed.replace(/,/g, ""));
  if (!Number.isFinite(calcNum)) return "";

  const u = uomTrimmed.toLowerCase().replace(/[\s.\-_]/g, "");

  let converted = calcNum;

  if (
    u === "sqin" ||
    u === "sqinch" ||
    u === "sqinches" ||
    u === "squareinch" ||
    u === "squareinches" ||
    u === "in2" ||
    u === "in²"
  ) {
    // Sq Inch: divide Calculation by 6.45
    converted = calcNum / 6.45;
  } else if (
    u === "sqft" ||
    u === "sqfeet" ||
    u === "sft" ||
    u === "squarefeet" ||
    u === "squarefoot" ||
    u === "ft2" ||
    u === "ft²"
  ) {
    // Sq Ft: divide Calculation by 929
    converted = calcNum / 929;
  } else if (
    u === "sqmtr" ||
    u === "sqmtrs" ||
    u === "sqmt" ||
    u === "sqmts" ||
    u === "sqm" ||
    u === "squaremeter" ||
    u === "squaremeters" ||
    u === "squaremetre" ||
    u === "squaremetres" ||
    u === "m2" ||
    u === "m²"
  ) {
    // Sq Mt: divide Calculation by 10000
    converted = calcNum / 10000;
  } else if (
    u === "sqcm" ||
    u === "squarecm" ||
    u === "squarecentimeter" ||
    u === "squarecentimeters" ||
    u === "cm2" ||
    u === "cm²"
  ) {
    converted = calcNum;
  } else if (
    u === "sqmm" ||
    u === "squaremm" ||
    u === "squaremillimeter" ||
    u === "squaremillimeters" ||
    u === "mm2" ||
    u === "mm²"
  ) {
    converted = calcNum * 100;
  } else if (
    u === "sqyd" ||
    u === "sqyard" ||
    u === "sqyards" ||
    u === "squareyard" ||
    u === "squareyards" ||
    u === "gaj"
  ) {
    converted = calcNum / 8361.27;
  } else if (
    u === "cft" ||
    u === "cuft" ||
    u === "cubicfeet" ||
    u === "cubicfoot" ||
    u === "ft3" ||
    u === "ft³"
  ) {
    converted = calcNum / 28316.85;
  } else if (
    u === "cbm" ||
    u === "cum" ||
    u === "cubicmeter" ||
    u === "cubicmeters" ||
    u === "cubicmetre" ||
    u === "cubicmetres" ||
    u === "m3" ||
    u === "m³"
  ) {
    converted = calcNum / 1000000;
  } else if (
    u === "ft" ||
    u === "feet" ||
    u === "foot" ||
    u === "rft" ||
    u === "runningfeet" ||
    u === "runningfoot"
  ) {
    converted = calcNum / 30.48;
  } else if (u === "inch" || u === "inches" || u === "in" || u === "rin" || u === "runninginch") {
    converted = calcNum / 2.54;
  } else if (
    u === "meter" ||
    u === "meters" ||
    u === "mtr" ||
    u === "mtrs" ||
    u === "m" ||
    u === "metre" ||
    u === "metres" ||
    u === "rmt" ||
    u === "rmtr" ||
    u === "runningmeter"
  ) {
    converted = calcNum / 100;
  } else if (u === "cm" || u === "cms" || u === "centimeter" || u === "centimeters") {
    converted = calcNum;
  } else if (u === "mm" || u === "mms" || u === "millimeter" || u === "millimeters") {
    converted = calcNum * 10;
  } else if (u === "yard" || u === "yards" || u === "yd" || u === "yds") {
    converted = calcNum / 91.44;
  } else if (u === "dozen" || u === "doz" || u === "dz") {
    converted = calcNum / 12;
  } else if (u === "pair" || u === "pairs") {
    converted = calcNum / 2;
  } else if (u === "ton" || u === "tons" || u === "metricton") {
    converted = calcNum / 1000;
  } else {
    converted = calcNum;
  }

  return Number(converted.toFixed(4)).toString();
}

function parseLengthToMm(lengthStr?: string | number): number {
  if (lengthStr === undefined || lengthStr === null || lengthStr === "") return 0;
  if (typeof lengthStr === "number") return lengthStr > 0 ? lengthStr : 0;
  const str = String(lengthStr).trim().toLowerCase();
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (!Number.isFinite(num) || num <= 0) return 0;

  if (str.includes("ft") || str.includes("feet") || str.includes("'")) {
    return num * 304.8;
  }
  if (str.includes("cm")) {
    return num * 10;
  }
  if (str.includes("inch") || str.includes("in") || str.includes('"')) {
    return num * 25.4;
  }
  // Check for meters (e.g. "6m", "6 meter", "6 mtr", but not "mm")
  if (
    (str.includes("meter") || str.includes("mtr") || str.endsWith("m") || str.includes("m ")) &&
    !str.includes("mm")
  ) {
    return num * 1000;
  }
  // Default is mm or plain numeric
  return num;
}

function computeMetalRowTotalWeight(item: MetalSsItem): number {
  const currentLenMm = parseLengthToMm(item.length);
  const baseLenMm = parseLengthToMm(item.base_length) || 6000;
  const baseWeight =
    typeof item.base_weight === "number" && item.base_weight > 0
      ? item.base_weight
      : Number(item.weight) || 0;

  if (currentLenMm > 0 && baseLenMm > 0 && baseWeight > 0) {
    const calculated = (currentLenMm / baseLenMm) * baseWeight;
    return Number(calculated.toFixed(4));
  }
  return baseWeight;
}

function computeMetalRowTotalAmount(item: MetalSsItem): number {
  const tw = computeMetalRowTotalWeight(item);
  const r = Number(item.rate) || 0;
  return Number((tw * r).toFixed(2));
}

function computeAdditionalRowAmount(item: AdditionalCostItem): number {
  const p = Number(item.price) || 0;
  const convStr = String(item.converted_value ?? "").trim();
  if (convStr !== "") {
    const convNum = Number(convStr.replace(/,/g, ""));
    if (Number.isFinite(convNum)) {
      return convNum * p;
    }
  }
  const calcStr = String(item.calculation ?? "").trim();
  if (calcStr !== "") {
    const calcNum = Number(calcStr.replace(/,/g, ""));
    if (Number.isFinite(calcNum)) {
      return calcNum * p;
    }
  }
  return 0;
}

export default function CostEstimationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<CostRateMaster[]>([]);
  const [woodTypesList, setWoodTypesList] = useState<WoodType[]>([]);
  const [woodPartNamesList, setWoodPartNamesList] = useState<WoodPartNameRecord[]>(() =>
    getLocalWoodPartNames()
  );

  const combinedWoodPartSuggestions = React.useMemo(() => {
    const seenLower = new Set<string>();
    const list: { value: string; label: string }[] = [];

    woodPartNamesList.forEach((wpn) => {
      const name = (wpn.partName || "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (seenLower.has(key)) return;
      seenLower.add(key);
      list.push({
        value: name,
        label: wpn.partCode ? `${name} (${wpn.partCode})` : name,
      });
    });

    ALL_COMMON_WOOD_PARTS_AND_FRAMES.forEach((pName) => {
      const name = pName.trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (seenLower.has(key)) return;
      seenLower.add(key);
      list.push({
        value: name,
        label: name,
      });
    });

    return list;
  }, [woodPartNamesList]);
  const [hardwareMasterList, setHardwareMasterList] = useState<HardwareAccessory[]>(() =>
    getLocalHardwareAccessories()
  );
  const [additionalMasterList, setAdditionalMasterList] = useState<AdditionalCostRecord[]>(() =>
    getLocalAdditionalCosts()
  );
  const [woodThicknessPrices, setWoodThicknessPrices] = useState<WoodThicknessPrice[]>(() =>
    getLocalWoodThicknessPrices()
  );
  const [mdfPricesList, setMdfPricesList] = useState<MdfPriceRecord[]>(() =>
    getLocalMdfPrices()
  );
  const [uomOptions, setUomOptions] = useState<string[]>(() =>
    getCachedUomOptions()
  );
  const [metalPricesList, setMetalPricesList] = useState<MetalPrice[]>(() =>
    getLocalMetalPrices()
  );

  // Form State
  const [title, setTitle] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [typeOfCosting, setTypeOfCosting] = useState<"Client Based" | "Showroom Based" | "">("");
  const [overallSize, setOverallSize] = useState("");
  const [woodType, setWoodType] = useState("");
  const [clientName, setClientName] = useState("");
  const [status, setStatus] = useState<'Draft' | 'In Review' | 'Approved' | 'Rejected'>("Draft");
  const [currency, setCurrency] = useState("INR");
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [marginPercentage, setMarginPercentage] = useState(26);
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [expensesPct, setExpensesPct] = useState(15);
  const [summaryExpensesPct, setSummaryExpensesPct] = useState(20);
  const [usdExchangeRate, setUsdExchangeRate] = useState<number | "">(() => getLocalUsdRate());
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [currencyExchangeRates, setCurrencyExchangeRates] = useState<Record<string, number>>(() =>
    getLocalCurrencyMap()
  );
  const [notes, setNotes] = useState("");
  const [woodWastagePct, setWoodWastagePct] = useState(20);
  const [imageUrl, setImageUrl] = useState("");

  // Send for Approval Modal State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAuthorities, setApprovalAuthorities] = useState<EmployeeRecord[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState<EmployeeRecord | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [savedEstimationId, setSavedEstimationId] = useState("");

  const loadApprovalAuthorities = async () => {
    try {
      const allEmps = await employeesApi.list();
      const matchedRavi = (allEmps || []).find((emp) => {
        const name = (emp.fullName || "").toLowerCase();
        return name.includes("ravi") && name.includes("utmani");
      });
      const matchedRaj = (allEmps || []).find((emp) => {
        const name = (emp.fullName || "").toLowerCase();
        return name.includes("raj") && name.includes("utmani");
      });

      const list: EmployeeRecord[] = [
        matchedRavi || {
          id: "auth-ravi-utmani",
          employeeCode: "DIR-01",
          fullName: "Ravi Utmani",
          email: null,
          phone: null,
          departmentId: null,
          designationId: null,
          managerId: null,
          userId: null,
          departmentName: "Management",
          designationTitle: "Director",
          managerName: null,
          dateOfJoining: null,
          birthday: null,
          anniversary: null,
          status: "active",
          salary: 0,
        },
        matchedRaj || {
          id: "auth-raj-utmani",
          employeeCode: "DIR-02",
          fullName: "Raj Utmani",
          email: null,
          phone: null,
          departmentId: null,
          designationId: null,
          managerId: null,
          userId: null,
          departmentName: "Management",
          designationTitle: "Director",
          managerName: null,
          dateOfJoining: null,
          birthday: null,
          anniversary: null,
          status: "active",
          salary: 0,
        },
      ];

      setApprovalAuthorities(list);
      setSelectedAuthority(list[0]);
    } catch (err) {
      console.error("Failed to load approval authorities", err);
      const fallbackList: EmployeeRecord[] = [
        {
          id: "auth-ravi-utmani",
          employeeCode: "DIR-01",
          fullName: "Ravi Utmani",
          email: null,
          phone: null,
          departmentId: null,
          designationId: null,
          managerId: null,
          userId: null,
          departmentName: "Management",
          designationTitle: "Director",
          managerName: null,
          dateOfJoining: null,
          birthday: null,
          anniversary: null,
          status: "active",
          salary: 0,
        },
        {
          id: "auth-raj-utmani",
          employeeCode: "DIR-02",
          fullName: "Raj Utmani",
          email: null,
          phone: null,
          departmentId: null,
          designationId: null,
          managerId: null,
          userId: null,
          departmentName: "Management",
          designationTitle: "Director",
          managerName: null,
          dateOfJoining: null,
          birthday: null,
          anniversary: null,
          status: "active",
          salary: 0,
        },
      ];
      setApprovalAuthorities(fallbackList);
      setSelectedAuthority(fallbackList[0]);
    }
  };

  // Section 7: CBM & Packaging State (Dynamic Cartons 1, 2, 3...)
  const [cartons, setCartons] = useState<CartonSizeItem[]>([
    { length: "", width: "", height: "", unit: "cm" },
  ]);

  const handleAddCarton = () => {
    setCartons((prev) => [...prev, { length: "", width: "", height: "", unit: "cm" }]);
  };

  const handleRemoveCarton = (index: number) => {
    setCartons((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleCartonChange = (index: number, field: keyof CartonSizeItem, value: any) => {
    setCartons((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const [items, setItems] = useState<CostEstimationItem[]>([]);

  const [woodItems, setWoodItems] = useState<WoodCostingItem[]>([
    { wood_part_name: "", wood_type: "", length_ft: "", width_in: "", thick_in: "", pcs: 1, rate: 0 },
  ]);

  const handleProductTypeChange = (selectedType: string) => {
    setProductType(selectedType);
    if (!selectedType) return;

    const associatedParts = getAssociatedWoodPartsForProduct(selectedType);
    if (associatedParts.length === 0) return;

    const currentWoodType = woodType || "";
    const newRows: WoodCostingItem[] = associatedParts.map((p) => ({
      wood_part_name: p.name,
      wood_type: currentWoodType,
      length_ft: "",
      width_in: "",
      thick_in: "",
      pcs: p.defaultPcs || 1,
      rate: 0,
    }));

    setWoodItems(newRows);
  };

  const handleAddWoodItem = () => {
    setWoodItems([
      ...woodItems,
      { wood_part_name: "", wood_type: woodType || "", length_ft: "", width_in: "", thick_in: "", pcs: 1, rate: 0 },
    ]);
  };

  const handleRemoveWoodItem = (index: number) => {
    if (woodItems.length === 1) return;
    setWoodItems(woodItems.filter((_, i) => i !== index));
  };

  const computeWoodRowCft = (item: WoodCostingItem): number => {
    const l = Number(item.length_ft) || 0;
    const w = Number(item.width_in) || 0;
    const rawT = Number(item.thick_in) || 0;
    const rowIsMdf = isMdfType(item.wood_type, mdfPricesList);
    const effectiveThickIn = rowIsMdf ? rawT / 25.4 : rawT;
    const pcs = Number(item.pcs) || 0;
    return item.backend_cft ?? (l * w * effectiveThickIn * pcs) / 144;
  };

  const handleWoodItemChange = (index: number, field: keyof WoodCostingItem, value: any) => {
    const updated = [...woodItems];
    const nextItem: WoodCostingItem = { ...updated[index], [field]: value };

    const latestMdf = mdfPricesList.length > 0 ? mdfPricesList : getLocalMdfPrices();
    const rowIsMdf = isMdfType(nextItem.wood_type, latestMdf);

    if (field === "rate") {
      nextItem.auto_rate = false;
    } else if (rowIsMdf) {
      if (field === "wood_type") {
        const mdfCandidates = getMdfRecordsForType(nextItem.wood_type, latestMdf);
        if (mdfCandidates.length === 1 && (nextItem.thick_in === "" || nextItem.auto_rate)) {
          const parsedThick = parseFloat(
            String(mdfCandidates[0].thickness || "")
              .replace(/mm|inch|in|"/gi, "")
              .trim()
          );
          if (!Number.isNaN(parsedThick) && parsedThick > 0) {
            nextItem.thick_in = parsedThick;
          }
        }
      }

      if (
        field === "wood_type" ||
        field === "thick_in" ||
        field === "length_ft" ||
        field === "width_in"
      ) {
        const matchedMdf = findMatchingMdfPrice(
          nextItem.wood_type,
          nextItem.thick_in,
          nextItem.length_ft,
          nextItem.width_in,
          latestMdf
        );
        if (matchedMdf) {
          nextItem.rate = Number(matchedMdf.price) || 0;
          nextItem.auto_rate = true;
          nextItem.mdf_sheet_size = matchedMdf.sheetSize || "";
          nextItem.mdf_uom = matchedMdf.uom || "";
        } else if (nextItem.auto_rate || field === "wood_type") {
          nextItem.rate = 0;
          nextItem.auto_rate = false;
          nextItem.mdf_sheet_size = "";
          nextItem.mdf_uom = "";
        }
      }
    } else if (field === "wood_type" || field === "thick_in" || field === "length_ft") {
      nextItem.mdf_sheet_size = "";
      nextItem.mdf_uom = "";
      const latestPrices =
        woodThicknessPrices.length > 0 ? woodThicknessPrices : getLocalWoodThicknessPrices();
      const matchedRate = findMatchingWoodThicknessRate(
        nextItem.wood_type,
        nextItem.thick_in,
        nextItem.length_ft,
        latestPrices
      );
      if (matchedRate !== null) {
        nextItem.rate = matchedRate;
        nextItem.auto_rate = true;
      } else if (nextItem.auto_rate || field === "wood_type") {
        nextItem.rate = 0;
        nextItem.auto_rate = false;
      }
    }

    const l = Number(nextItem.length_ft) || 0;
    const w = Number(nextItem.width_in) || 0;
    const rawT = Number(nextItem.thick_in) || 0;
    const effectiveThickIn = rowIsMdf ? rawT / 25.4 : rawT;
    const p = Number(nextItem.pcs) || 0;
    const r = Number(nextItem.rate) || 0;
    nextItem.backend_cft = (l * w * effectiveThickIn * p) / 144;

    updated[index] = nextItem;
    setWoodItems(updated);

    if (
      field === "length_ft" ||
      field === "width_in" ||
      field === "thick_in" ||
      field === "pcs" ||
      field === "rate" ||
      field === "wood_type"
    ) {
      costingApi
        .calculateCft({ length: l, width: w, thickness: effectiveThickIn, pcs: p, rate: r })
        .then((res) => {
          setWoodItems((prev) => {
            if (!prev[index]) return prev;
            const cur = prev[index];
            const curIsMdf = isMdfType(cur.wood_type, latestMdf);
            const curRawT = Number(cur.thick_in) || 0;
            const curEffT = curIsMdf ? curRawT / 25.4 : curRawT;
            if (
              (Number(cur.length_ft) || 0) === l &&
              (Number(cur.width_in) || 0) === w &&
              Math.abs(curEffT - effectiveThickIn) < 0.0001 &&
              (Number(cur.pcs) || 0) === p
            ) {
              const copy = [...prev];
              copy[index] = { ...cur, backend_cft: res.cft };
              return copy;
            }
            return prev;
          });
        })
        .catch(() => { });
    }
  };

  const [metalSsItems, setMetalSsItems] = useState<MetalSsItem[]>([
    { type: "Metal", size: "", thickness: "", length: "", qty: 1, weight: 0, rate: 0, base_length: "6000mm", base_weight: 0 },
  ]);

  const handleAddMetalSsItem = () => {
    setMetalSsItems([
      ...metalSsItems,
      { type: "Metal", size: "", thickness: "", length: "", qty: 1, weight: 0, rate: 0, base_length: "6000mm", base_weight: 0 },
    ]);
  };

  const handleRemoveMetalSsItem = (index: number) => {
    if (metalSsItems.length === 1) return;
    setMetalSsItems(metalSsItems.filter((_, i) => i !== index));
  };

  const handleMetalSsItemChange = (index: number, field: keyof MetalSsItem, value: any) => {
    const updated = [...metalSsItems];
    const nextItem: MetalSsItem = { ...updated[index], [field]: value };

    if (field === "weight") {
      const numW = Number(value);
      if (!isNaN(numW)) {
        nextItem.base_weight = numW;
      }
    }

    if (field === "size" || field === "thickness" || field === "type") {
      const currentType = field === "type" ? (value as "Metal" | "SS") : nextItem.type;
      const currentSize = field === "size" ? String(value || "") : nextItem.size;
      const currentThickness = field === "thickness" ? String(value || "") : nextItem.thickness;

      if (currentSize) {
        const latestPrices = metalPricesList.length > 0 ? metalPricesList : getLocalMetalPrices();
        const matched = findMatchingMetalPrice(
          latestPrices,
          currentType,
          currentSize,
          currentThickness
        );

        if (matched) {
          // If thickness is not selected yet, auto-select thickness from matched entry
          if (!currentThickness && matched.metalThickness) {
            const rawT = String(matched.metalThickness).trim();
            const numT = parseFloat(rawT);
            if (numT === 1.6) {
              nextItem.thickness = "1.6";
            } else if (numT === 1.2) {
              nextItem.thickness = "1.2";
            } else {
              nextItem.thickness = formatDimension(matched.metalThickness, matched.metalThicknessUom);
            }
          }

          // Length from master (standard pipe length is 6000mm)
          const masterLength = matched.pipeLength
            ? formatDimension(matched.pipeLength, matched.pipeLengthUom)
            : "6000mm";
          nextItem.base_length = masterLength;
          if (!nextItem.length || field === "size") {
            nextItem.length = masterLength;
          }

          // Weight from master: default directly into weight column
          if (matched.weight !== undefined && matched.weight !== "") {
            const numW = Number(matched.weight);
            if (!isNaN(numW)) {
              const stdWeight = matched.weightUom === "gm" ? Number((numW / 1000).toFixed(4)) : numW;
              nextItem.weight = stdWeight;
              nextItem.base_weight = stdWeight;
            }
          }

          // Rate from master
          if (matched.rate !== undefined && matched.rate !== 0) {
            nextItem.rate = Number(matched.rate) || nextItem.rate;
          }
        }
      }
    }

    updated[index] = nextItem;
    setMetalSsItems(updated);
  };

  const [hardwareItems, setHardwareItems] = useState<HardwareCostItem[]>([
    { name: "", uom: "Per Piece", quantity: 1, price: 0 },
  ]);

  const handleAddHardwareItem = () => {
    setHardwareItems([
      ...hardwareItems,
      { name: "", uom: "Per Piece", quantity: 1, price: 0 },
    ]);
  };

  const handleRemoveHardwareItem = (index: number) => {
    if (hardwareItems.length === 1) return;
    setHardwareItems(hardwareItems.filter((_, i) => i !== index));
  };

  const handleHardwareItemChange = (index: number, field: keyof HardwareCostItem, value: any) => {
    const updated = [...hardwareItems];
    const nextItem: HardwareCostItem = { ...updated[index], [field]: value };

    if (field === "name") {
      const selectedName = String(value || "").trim().toLowerCase();
      if (!selectedName) {
        nextItem.price = 0;
        nextItem.uom = "Per Piece";
      } else {
        const latestHw =
          hardwareMasterList.length > 0 ? hardwareMasterList : getLocalHardwareAccessories();
        const matched = latestHw.find(
          (hw) => (hw.itemName || "").trim().toLowerCase() === selectedName
        );
        if (matched) {
          nextItem.price = Number(matched.rate) || 0;
          nextItem.uom = matched.uom || "Per Piece";
        }
      }
    }

    updated[index] = nextItem;
    setHardwareItems(updated);
  };

  const [additionalItems, setAdditionalItems] = useState<AdditionalCostItem[]>([
    { additional: "", size: "", calculation: "", uom: "", converted_value: "", price: 0 },
  ]);

  const handleAddAdditionalItem = () => {
    setAdditionalItems([
      ...additionalItems,
      { additional: "", size: "", calculation: "", uom: "", converted_value: "", price: 0 },
    ]);
  };

  const handleRemoveAdditionalItem = (index: number) => {
    if (additionalItems.length === 1) return;
    setAdditionalItems(additionalItems.filter((_, i) => i !== index));
  };

  const handleAdditionalItemChange = (index: number, field: keyof AdditionalCostItem, value: any) => {
    const updated = [...additionalItems];
    const nextItem: AdditionalCostItem = { ...updated[index], [field]: value };

    if (field === "additional") {
      const selectedName = String(value || "").trim().toLowerCase();
      if (!selectedName) {
        nextItem.price = 0;
        nextItem.uom = "";
      } else {
        const localAc = getLocalAdditionalCosts();
        const combinedAc = [...additionalMasterList, ...localAc];
        const matched = combinedAc.find(
          (ac) => (ac.itemName || "").trim().toLowerCase() === selectedName
        );
        if (matched) {
          nextItem.price = Number(matched.price) || 0;
          const rawUom = (matched.uom || "").trim();
          const matchedOption = uomOptions.find(
            (u) => u.toLowerCase() === rawUom.toLowerCase()
          );
          nextItem.uom = matchedOption || rawUom;
        }
      }
    }

    if (field === "size") {
      const solved = evaluateSizeEquation(String(value ?? ""));
      nextItem.calculation = solved !== null ? solved : "";
    }

    if (field === "size" || field === "calculation" || field === "uom" || field === "additional") {
      nextItem.converted_value = convertCalculationByUom(nextItem.calculation, nextItem.uom);
    }

    updated[index] = nextItem;
    setAdditionalItems(updated);
  };

  const [upholsteryItems, setUpholsteryItems] = useState<UpholsteryCostItem[]>([
    { item_name: "Fabric", specification: "", uom: "Meter", quantity: "", rate: "" },
    { item_name: "Leather", specification: "", uom: "Sq. Ft.", quantity: "", rate: "" },
    { item_name: "Foam", specification: "", uom: "Sheet", quantity: "", rate: "" },
    { item_name: "Webbing", specification: "", uom: "Meter", quantity: "", rate: "" },
    { item_name: "Lining", specification: "", uom: "Meter", quantity: "", rate: "" },
    { item_name: "Upholstery Materials", specification: "", uom: "Pcs", quantity: "", rate: "" },
  ]);

  const handleAddUpholsteryItem = () => {
    setUpholsteryItems([
      ...upholsteryItems,
      { item_name: "", specification: "", uom: "Meter", quantity: "", rate: "" },
    ]);
  };

  const handleRemoveUpholsteryItem = (index: number) => {
    if (upholsteryItems.length === 1) return;
    setUpholsteryItems(upholsteryItems.filter((_, i) => i !== index));
  };

  const handleUpholsteryItemChange = (index: number, field: keyof UpholsteryCostItem, value: any) => {
    const updated = [...upholsteryItems];
    updated[index] = { ...updated[index], [field]: value };
    setUpholsteryItems(updated);
  };

  const computeUpholsteryTotalAmount = (): number => {
    return upholsteryItems.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const r = Number(item.rate) || 0;
      return sum + (q * r);
    }, 0);
  };

  const [labourItems, setLabourItems] = useState<LabourCostItem[]>([
    { item_name: "Carpentry / Assembly Labour", amount: 0 },
    { item_name: "Upholstery Labour", amount: 0 },
  ]);

  const handleAddLabourItem = () => {
    setLabourItems([
      ...labourItems,
      { item_name: "", amount: 0 },
    ]);
  };

  const handleRemoveLabourItem = (index: number) => {
    if (labourItems.length === 1) return;
    setLabourItems(labourItems.filter((_, i) => i !== index));
  };

  const handleLabourItemChange = (index: number, field: keyof LabourCostItem, value: any) => {
    const updated = [...labourItems];
    updated[index] = { ...updated[index], [field]: value };
    setLabourItems(updated);
  };

  // 9. Polish & Finishing Cost Items
  const [polishItems, setPolishItems] = useState<LabourCostItem[]>([
    { item_name: "Polish / Finishing Labour", amount: 0 },
    { item_name: "Polish Material", amount: 0 },
  ]);

  const handleAddPolishItem = () => {
    setPolishItems([
      ...polishItems,
      { item_name: "", amount: 0 },
    ]);
  };

  const handleRemovePolishItem = (index: number) => {
    if (polishItems.length === 1) return;
    setPolishItems(polishItems.filter((_, i) => i !== index));
  };

  const handlePolishItemChange = (index: number, field: keyof LabourCostItem, value: any) => {
    const updated = [...polishItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate Polish Material = 2 * Polish Labour
    if (field === "amount") {
      const currentItemName = (updated[index].item_name || "").toLowerCase();
      if (currentItemName.includes("polish") && (currentItemName.includes("labour") || currentItemName.includes("finishing"))) {
        const polishMatIndex = updated.findIndex((item) => {
          const n = (item.item_name || "").toLowerCase();
          return n.includes("polish") && n.includes("material");
        });
        if (polishMatIndex !== -1) {
          const labourAmt = Number(value) || 0;
          updated[polishMatIndex] = {
            ...updated[polishMatIndex],
            amount: value === "" ? "" : Math.round(labourAmt * 2 * 100) / 100,
          };
        }
      }
    }

    setPolishItems(updated);
  };

  const computePolishTotalAmount = (): number => {
    return polishItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const [otherExpenseItems, setOtherExpenseItems] = useState<ExpenseCostItem[]>([]);

  const handleAddOtherExpenseItem = () => {
    setOtherExpenseItems([
      ...otherExpenseItems,
      { item_name: "", amount: 0 },
    ]);
  };

  const handleRemoveOtherExpenseItem = (index: number) => {
    setOtherExpenseItems(otherExpenseItems.filter((_, i) => i !== index));
  };

  const handleOtherExpenseItemChange = (index: number, field: keyof ExpenseCostItem, value: any) => {
    const updated = [...otherExpenseItems];
    updated[index] = { ...updated[index], [field]: value };
    setOtherExpenseItems(updated);
  };

  const [packagingContainerTotal, setPackagingContainerTotal] = useState<number | "">(150000);
  const [packagingCustomAmount, setPackagingCustomAmount] = useState<number | null>(null);

  const [forwardingContainerTotal, setForwardingContainerTotal] = useState<number | "">(100000);
  const [forwardingCustomAmount, setForwardingCustomAmount] = useState<number | null>(null);

  const computeTotalCbm = (): number => {
    return cartons.reduce((sum, c) => {
      const l = Number(c.length) || 0;
      const w = Number(c.width) || 0;
      const h = Number(c.height) || 0;
      const cbm = c.unit === "cm" ? (l * w * h) / 1000000 : (l * w * h) / 61023.74;
      return sum + cbm;
    }, 0);
  };

  const computePcsIn40Hq = (): number => {
    const totalCbm = computeTotalCbm();
    return totalCbm > 0 ? Math.floor(65.0 / totalCbm) : 0;
  };

  const computePackagingTotalAmount = (): number => {
    if (packagingCustomAmount !== null) {
      return Number(packagingCustomAmount) || 0;
    }
    const pcs = computePcsIn40Hq();
    const base = Number(packagingContainerTotal) || 0;
    return pcs > 0 ? base / pcs : 0;
  };

  const computeForwardingTotalAmount = (): number => {
    if (forwardingCustomAmount !== null) {
      return Number(forwardingCustomAmount) || 0;
    }
    const pcs = computePcsIn40Hq();
    const base = Number(forwardingContainerTotal) || 0;
    return pcs > 0 ? base / pcs : 0;
  };

  const computeWoodTotalAmount = (): number => {
    return woodItems.reduce((sum, item) => {
      const r = Number(item.rate) || 0;
      const cft = computeWoodRowCft(item);
      return sum + (cft * r);
    }, 0) * (1 + (Number(woodWastagePct) || 0) / 100);
  };

  const computeMetalTotalAmount = (): number => {
    return metalSsItems.reduce((sum, item) => {
      return sum + computeMetalRowTotalAmount(item);
    }, 0);
  };

  const computeHardwareTotalAmount = (): number => {
    return hardwareItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0
    );
  };

  const computeAdditionalTotalAmount = (): number => {
    return additionalItems.reduce((sum, item) => sum + computeAdditionalRowAmount(item), 0);
  };

  const computeLabourTotalAmount = (): number => {
    return labourItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const computeOtherExpensesTotalAmount = (): number => {
    return otherExpenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  useEffect(() => {
    if (additionalMasterList.length === 0) return;
    setAdditionalItems((prev) => {
      let changed = false;
      const next = prev.map((row) => {
        if (!row.additional || row.uom) return row;
        const matched = additionalMasterList.find(
          (ac) => (ac.itemName || "").trim().toLowerCase() === row.additional.trim().toLowerCase()
        );
        if (matched && matched.uom) {
          changed = true;
          const rawUom = matched.uom.trim();
          const matchedOpt =
            uomOptions.find((u) => u.toLowerCase() === rawUom.toLowerCase()) || rawUom;
          return {
            ...row,
            uom: matchedOpt,
            converted_value: convertCalculationByUom(row.calculation, matchedOpt),
          };
        }
        return row;
      });
      return changed ? next : prev;
    });
  }, [additionalMasterList]);

  useEffect(() => {
    loadStandardRates();
    loadApprovalAuthorities();
    if (isEdit && id) {
      loadEstimation(id);
    }

    const handleRefreshPrices = () => {
      loadSyncedWoodThicknessPrices().then(setWoodThicknessPrices).catch(() => { });
      loadSyncedWoodPartNames().then(setWoodPartNamesList).catch(() => { });
      loadSyncedHardwareAccessories().then(setHardwareMasterList).catch(() => { });
      loadSyncedAdditionalCosts().then(setAdditionalMasterList).catch(() => { });
      loadSyncedMdfPrices().then(setMdfPricesList).catch(() => { });
      loadMergedUomOptions().then(setUomOptions).catch(() => { });
      setMetalPricesList(getLocalMetalPrices());
    };
    window.addEventListener("focus", handleRefreshPrices);
    window.addEventListener("storage", handleRefreshPrices);
    return () => {
      window.removeEventListener("focus", handleRefreshPrices);
      window.removeEventListener("storage", handleRefreshPrices);
    };
  }, [id]);

  const loadStandardRates = async () => {
    try {
      const [ratesData, woodData, wpnData, hwData, wtpData, acData, mdfData, uomsData] = await Promise.all([
        costingApi.getAllRates().catch(() => []),
        masterDataApi.getWoodTypes().catch(() => []),
        loadSyncedWoodPartNames(),
        loadSyncedHardwareAccessories(),
        loadSyncedWoodThicknessPrices(),
        loadSyncedAdditionalCosts(),
        loadSyncedMdfPrices(),
        loadMergedUomOptions(),
      ]);
      setRates(ratesData);
      setWoodTypesList(woodData || []);
      setWoodPartNamesList(wpnData || []);
      setHardwareMasterList(hwData || []);
      setWoodThicknessPrices(wtpData || []);
      setAdditionalMasterList(acData || []);
      setMdfPricesList(mdfData || []);
      setUomOptions(uomsData || getCachedUomOptions());
      setMetalPricesList(getLocalMetalPrices());
    } catch (err) {
      console.error("Failed to load rates or wood types", err);
    }
  };

  const loadEstimation = async (estId: string) => {
    setLoading(true);
    try {
      const est = await costingApi.getEstimationById(estId);
      setTitle(est.title || est.product_name || "");
      setProductCode(est.product_code || "");
      setProductName(est.product_name || est.title || "");
      setProductType(est.product_type || "");
      setCollectionName(est.collection_name || "");
      setTypeOfCosting((est.type_of_costing as any) || "");
      setOverallSize(est.overall_size || "");
      setWoodType(est.wood_type || "");
      setClientName(est.client_name || "");
      setStatus(est.status || "Draft");
      setCurrency(est.currency || "INR");
      setExchangeRate(est.exchange_rate || 1.0);
      setMarginPercentage(est.margin_percentage ?? 26);
      setTaxPercentage(est.tax_percentage ?? 18);

      const rawNotes = est.notes || "";
      const cleanedNotes = rawNotes
        .replace(/<!--\s*FORM_DATA_START[\s\S]*?<!--\s*FORM_DATA_END\s*-*>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<!--[\s\S]*?->/g, "")
        .trim();
      setNotes(cleanedNotes);

      let loadedFromFormData = false;

      // 1. Check direct form_data column from backend
      if (est.form_data) {
        try {
          const fd = typeof est.form_data === "string" ? JSON.parse(est.form_data) : est.form_data;
          if (fd && typeof fd === "object") {
            if (Array.isArray(fd.woodItems) && fd.woodItems.length > 0) setWoodItems(fd.woodItems);
            if (Array.isArray(fd.metalSsItems) && fd.metalSsItems.length > 0) setMetalSsItems(fd.metalSsItems);
            if (Array.isArray(fd.hardwareItems) && fd.hardwareItems.length > 0) setHardwareItems(fd.hardwareItems);
            if (Array.isArray(fd.upholsteryItems) && fd.upholsteryItems.length > 0) setUpholsteryItems(fd.upholsteryItems);
            if (Array.isArray(fd.additionalItems) && fd.additionalItems.length > 0) setAdditionalItems(fd.additionalItems);
            if (Array.isArray(fd.labourItems) && fd.labourItems.length > 0) setLabourItems(fd.labourItems);
            if (Array.isArray(fd.polishItems) && fd.polishItems.length > 0) setPolishItems(fd.polishItems);
            if (Array.isArray(fd.otherExpenseItems)) setOtherExpenseItems(fd.otherExpenseItems);
            if (Array.isArray(fd.cartons) && fd.cartons.length > 0) setCartons(fd.cartons);
            if (fd.packagingContainerTotal !== undefined && fd.packagingContainerTotal !== "") setPackagingContainerTotal(fd.packagingContainerTotal);
            if (fd.packagingCustomAmount !== undefined) setPackagingCustomAmount(fd.packagingCustomAmount);
            if (fd.forwardingContainerTotal !== undefined && fd.forwardingContainerTotal !== "") setForwardingContainerTotal(fd.forwardingContainerTotal);
            if (fd.forwardingCustomAmount !== undefined) setForwardingCustomAmount(fd.forwardingCustomAmount);
            if (fd.expensesPct !== undefined) setExpensesPct(Number(fd.expensesPct));
            if (fd.summaryExpensesPct !== undefined) setSummaryExpensesPct(Number(fd.summaryExpensesPct));
            if (fd.usdExchangeRate !== undefined && fd.usdExchangeRate !== "") setUsdExchangeRate(Number(fd.usdExchangeRate));
            if (fd.selectedCurrency !== undefined) setSelectedCurrency(fd.selectedCurrency);
            if (fd.woodWastagePct !== undefined) setWoodWastagePct(Number(fd.woodWastagePct));
            if (fd.imageUrl) setImageUrl(fd.imageUrl);
            loadedFromFormData = true;
          }
        } catch (e) {
          console.error("Failed to parse form_data JSON", e);
        }
      }

      // 2. Check embedded form_data inside raw notes
      if (!loadedFromFormData && (rawNotes.includes("FORM_DATA_START") || rawNotes.includes("woodItems"))) {
        try {
          const match = rawNotes.match(/<!--\s*FORM_DATA_START\s*-*?>([\s\S]*?)<!--\s*FORM_DATA_END\s*-*?>/i);
          if (match && match[1]) {
            const fd = JSON.parse(match[1]);
            if (Array.isArray(fd.woodItems) && fd.woodItems.length > 0) setWoodItems(fd.woodItems);
            if (Array.isArray(fd.metalSsItems) && fd.metalSsItems.length > 0) setMetalSsItems(fd.metalSsItems);
            if (Array.isArray(fd.hardwareItems) && fd.hardwareItems.length > 0) setHardwareItems(fd.hardwareItems);
            if (Array.isArray(fd.upholsteryItems) && fd.upholsteryItems.length > 0) setUpholsteryItems(fd.upholsteryItems);
            if (Array.isArray(fd.additionalItems) && fd.additionalItems.length > 0) setAdditionalItems(fd.additionalItems);
            if (Array.isArray(fd.labourItems) && fd.labourItems.length > 0) setLabourItems(fd.labourItems);
            if (Array.isArray(fd.polishItems) && fd.polishItems.length > 0) setPolishItems(fd.polishItems);
            if (Array.isArray(fd.otherExpenseItems)) setOtherExpenseItems(fd.otherExpenseItems);
            if (Array.isArray(fd.cartons) && fd.cartons.length > 0) setCartons(fd.cartons);
            if (fd.packagingContainerTotal !== undefined && fd.packagingContainerTotal !== "") setPackagingContainerTotal(fd.packagingContainerTotal);
            if (fd.packagingCustomAmount !== undefined) setPackagingCustomAmount(fd.packagingCustomAmount);
            if (fd.forwardingContainerTotal !== undefined && fd.forwardingContainerTotal !== "") setForwardingContainerTotal(fd.forwardingContainerTotal);
            if (fd.forwardingCustomAmount !== undefined) setForwardingCustomAmount(fd.forwardingCustomAmount);
            if (fd.expensesPct !== undefined) setExpensesPct(Number(fd.expensesPct));
            if (fd.summaryExpensesPct !== undefined) setSummaryExpensesPct(Number(fd.summaryExpensesPct));
            if (fd.usdExchangeRate !== undefined && fd.usdExchangeRate !== "") setUsdExchangeRate(Number(fd.usdExchangeRate));
            if (fd.selectedCurrency !== undefined) setSelectedCurrency(fd.selectedCurrency);
            if (fd.woodWastagePct !== undefined) setWoodWastagePct(Number(fd.woodWastagePct));
            if (fd.imageUrl) setImageUrl(fd.imageUrl);
            loadedFromFormData = true;
          }
        } catch (e) {
          console.error("Failed to parse embedded notes form_data", e);
        }
      }

      // 3. Fallback: Reconstruct all items from est.items array
      if (!loadedFromFormData && est.items && est.items.length > 0) {
        setItems(est.items);

        const restoredWood: WoodCostingItem[] = [];
        const restoredMetal: MetalSsItem[] = [];
        const restoredHardware: HardwareCostItem[] = [];
        const restoredUpholstery: UpholsteryCostItem[] = [];
        const restoredAdditional: AdditionalCostItem[] = [];
        const restoredLabour: LabourCostItem[] = [];
        const restoredPolish: LabourCostItem[] = [];
        const restoredOtherExpenses: ExpenseCostItem[] = [];

        est.items.forEach((it) => {
          const cat = it.category;
          const name = it.item_name || "";
          const spec = it.specification || "";
          const rem = it.remarks || "";
          const nameLower = name.toLowerCase();

          if (cat === "Finishing" || nameLower.includes("polish")) {
            restoredPolish.push({
              item_name: name,
              amount: it.unit_cost || 0,
            });
          } else if (cat === "Labor") {
            restoredLabour.push({
              item_name: name,
              amount: it.unit_cost || 0,
            });
          } else if (cat === "Hardware") {
            restoredHardware.push({
              name,
              uom: it.unit_of_measure || "Pcs",
              quantity: it.quantity || 1,
              price: it.unit_cost || 0,
            });
          } else if (cat === "Other" && !nameLower.includes("expense") && !rem.includes("Operational Expense")) {
            restoredAdditional.push({
              additional: name,
              size: "",
              calculation: "",
              uom: it.unit_of_measure || "Pcs",
              price: it.unit_cost || 0,
              converted_value: String(it.quantity || 1),
            });
          } else if (cat === "Packaging" && nameLower.includes("packaging cost")) {
            setPackagingCustomAmount(it.unit_cost || 0);
          } else if (cat === "Overhead" && nameLower.includes("forwarding cost")) {
            setForwardingCustomAmount(it.unit_cost || 0);
          } else if (cat === "Overhead" && (nameLower.includes("operational expense") || rem.includes("Operational Expense"))) {
            restoredOtherExpenses.push({
              item_name: name,
              amount: it.unit_cost || 0,
            });
          } else if (cat === "Raw Material") {
            if (rem.includes("Wood Amount:") || spec.includes("L:") || it.unit_of_measure === "Cft" || it.length_ft !== undefined) {
              let woodPart = name;
              let rowWoodType = est.wood_type || "";
              const matchWoodType = name.match(/\(([^)]+)\)$/);
              if (matchWoodType && matchWoodType[1]) {
                rowWoodType = matchWoodType[1];
                woodPart = name.replace(/\s*\([^)]+\)$/, "").trim();
              }
              const lMatch = spec.match(/L:\s*([0-9.]+)\s*ft/);
              const wMatch = spec.match(/W:\s*([0-9.]+)\s*in/);
              const tMatch = spec.match(/T:\s*([0-9.]+)\s*(?:in|mm)/);
              const pcsMatch = spec.match(/Pcs:\s*([0-9]+)/);

              restoredWood.push({
                wood_part_name: woodPart,
                wood_type: rowWoodType,
                length_ft: it.length_ft !== undefined ? it.length_ft : lMatch ? Number(lMatch[1]) : "",
                width_in: it.width_in !== undefined ? it.width_in : wMatch ? Number(wMatch[1]) : "",
                thick_in: it.thick_in !== undefined ? it.thick_in : tMatch ? Number(tMatch[1]) : "",
                pcs: it.pcs !== undefined ? it.pcs : pcsMatch ? Number(pcsMatch[1]) : 1,
                rate: it.unit_cost || 0,
              });
            } else if (spec.includes("Total Weight:") || spec.includes("Base Weight:") || nameLower.includes("ss") || nameLower.includes("metal")) {
              let mType = name;
              let mSize = "";
              const matchType = name.match(/^(.*?)\s*\((.*?)\)$/);
              if (matchType) {
                mType = matchType[1];
                mSize = matchType[2];
              }
              const wMatch = spec.match(/Base Weight:\s*([0-9.]+)\s*kg/);
              restoredMetal.push({
                type: (mType.toUpperCase().includes("SS") ? "SS" : "Metal") as "Metal" | "SS",
                size: mSize,
                thickness: "",
                length: "",
                weight: wMatch ? Number(wMatch[1]) : 0,
                rate: it.unit_cost || 0,
              });
            } else {
              restoredUpholstery.push({
                item_name: name,
                specification: spec,
                quantity: it.quantity || 1,
                uom: it.unit_of_measure || "Mtr",
                rate: it.unit_cost || 0,
              });
            }
          }
        });

        if (restoredWood.length > 0) setWoodItems(restoredWood);
        if (restoredMetal.length > 0) setMetalSsItems(restoredMetal);
        if (restoredHardware.length > 0) setHardwareItems(restoredHardware);
        if (restoredUpholstery.length > 0) setUpholsteryItems(restoredUpholstery);
        if (restoredAdditional.length > 0) setAdditionalItems(restoredAdditional);
        if (restoredLabour.length > 0) setLabourItems(restoredLabour);
        if (restoredPolish.length > 0) setPolishItems(restoredPolish);
        if (restoredOtherExpenses.length > 0) setOtherExpenseItems(restoredOtherExpenses);
      }
    } catch (err) {
      alert("Failed to load estimation detail");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { category: "Raw Material", item_name: "", quantity: 1, unit_of_measure: "Pcs", unit_cost: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CostEstimationItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRateSelect = (index: number, rateId: string) => {
    const selectedRate = rates.find((r) => r.id === rateId);
    if (!selectedRate) return;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      item_name: selectedRate.item_name,
      category: (selectedRate.category as any) || "Raw Material",
      unit_of_measure: selectedRate.unit_of_measure || "Pcs",
      unit_cost: selectedRate.rate || 0,
    };
    setItems(updated);
  };

  // Calculations
  const calculateTotals = () => {
    let materialCost = 0;
    let laborCost = 0;
    let finishingCost = 0;
    let packagingCost = 0;
    let overheadCost = 0;

    items.forEach((item) => {
      const q = Number(item.quantity) || 0;
      const uc = Number(item.unit_cost) || 0;
      const total = q * uc;

      switch (item.category) {
        case "Raw Material":
        case "Hardware":
          materialCost += total;
          break;
        case "Labor":
          laborCost += total;
          break;
        case "Finishing":
          finishingCost += total;
          break;
        case "Packaging":
          packagingCost += total;
          break;
        case "Overhead":
        case "Other":
          overheadCost += total;
          break;
        default:
          materialCost += total;
          break;
      }
    });

    const subtotal = materialCost + laborCost + finishingCost + packagingCost + overheadCost;
    const marginAmount = (subtotal * marginPercentage) / 100;
    const priceBeforeTax = subtotal + marginAmount;
    const taxAmount = (priceBeforeTax * taxPercentage) / 100;
    const finalPrice = priceBeforeTax + taxAmount;

    return {
      materialCost,
      laborCost,
      finishingCost,
      packagingCost,
      overheadCost,
      subtotal,
      marginAmount,
      taxAmount,
      finalPrice,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProdName = productName || title;
    if (!finalProdName.trim()) {
      alert("Please enter product name");
      return;
    }

    const formDataObj = {
      woodItems,
      metalSsItems,
      hardwareItems,
      upholsteryItems,
      additionalItems,
      labourItems,
      polishItems,
      otherExpenseItems,
      cartons,
      packagingContainerTotal,
      packagingCustomAmount,
      forwardingContainerTotal,
      forwardingCustomAmount,
      expensesPct,
      summaryExpensesPct,
      usdExchangeRate,
      selectedCurrency,
      woodWastagePct,
      imageUrl,
    };
    const formDataJson = JSON.stringify(formDataObj);
    const cleanNotesBeforeSave = (notes || "")
      .replace(/<!--\s*FORM_DATA_START[\s\S]*?<!--\s*FORM_DATA_END\s*-*>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<!--[\s\S]*?->/g, "")
      .trim();

    const payload = {
      title: finalProdName,
      product_code: productCode,
      product_name: productName,
      product_type: productType,
      collection_name: collectionName,
      type_of_costing: typeOfCosting,
      overall_size: overallSize,
      wood_type: woodType,
      client_name: clientName,
      status,
      currency,
      exchange_rate: Number(exchangeRate),
      margin_percentage: Number(marginPercentage),
      tax_percentage: Number(taxPercentage),
      notes: cleanNotesBeforeSave,
      form_data: formDataJson,
      items: [
        ...woodItems.map((w) => {
          const l = Number(w.length_ft) || 0;
          const wi = Number(w.width_in) || 0;
          const t = Number(w.thick_in) || 0;
          const rowIsMdf = isMdfType(w.wood_type, mdfPricesList);
          const effectiveThickIn = rowIsMdf ? t / 25.4 : t;
          const pcs = Number(w.pcs) || 0;
          const r = Number(w.rate) || 0;
          const cft = computeWoodRowCft(w);
          const amt = cft * r;
          const partLabel = w.wood_part_name || "Wood Part";
          const mdfSpecExtra =
            rowIsMdf && (w.mdf_sheet_size || w.mdf_uom)
              ? `, Sheet:${w.mdf_sheet_size || "-"}${w.mdf_uom ? ` (${w.mdf_uom})` : ""}`
              : "";
          return {
            category: "Raw Material" as const,
            item_name: w.wood_type ? `${partLabel} (${w.wood_type})` : partLabel,
            specification: `${w.wood_type ? `Wood: ${w.wood_type}, ` : ""}L:${l}ft, W:${wi}in, T:${rowIsMdf ? `${t}mm (${effectiveThickIn.toFixed(3)}in)` : `${t}in`}, Pcs:${pcs}, Cft:${cft.toFixed(3)}${mdfSpecExtra}`,
            quantity: Number(cft.toFixed(3)),
            unit_of_measure: "Cft",
            unit_cost: r,
            remarks: `Wood Amount: ₹${amt.toFixed(2)}`,
            length_ft: l,
            width_in: wi,
            thick_in: Number(effectiveThickIn.toFixed(4)),
            pcs,
          };
        }),
        ...metalSsItems.map((m) => {
          const tw = computeMetalRowTotalWeight(m);
          const totalAmt = computeMetalRowTotalAmount(m);
          const w = Number(m.weight) || 0;
          const r = Number(m.rate) || 0;
          return {
            category: "Raw Material" as const,
            item_name: `${m.type} (${m.size || "Standard"})`,
            specification: `Type: ${m.type}, Size: ${m.size}${m.thickness ? `, Thickness: ${m.thickness}` : ""}${m.length ? `, Length: ${m.length}` : ""}, Base Weight: ${w}kg, Total Weight: ${tw}kg`,
            quantity: 1,
            unit_of_measure: "Kg",
            unit_cost: r,
            remarks: `Total Weight: ${tw}kg @ ₹${r}/kg = ₹${totalAmt.toFixed(2)}`,
          };
        }),
        ...hardwareItems.map((h) => {
          const q = Number(h.quantity) || 0;
          const p = Number(h.price) || 0;
          const u = h.uom || "Pcs";
          const totalAmt = q * p;
          return {
            category: "Hardware" as const,
            item_name: h.name || "Hardware Item",
            specification: `Qty: ${q} ${u}, Rate: ₹${p.toFixed(2)} / ${u}`,
            quantity: q,
            unit_of_measure: u,
            unit_cost: p,
            remarks: `Total Amount: ₹${totalAmt.toFixed(2)} (${q} ${u} @ ₹${p.toFixed(2)}/${u})`,
          };
        }),
        ...upholsteryItems.map((u) => {
          const q = Number(u.quantity) || 0;
          const r = Number(u.rate) || 0;
          const totalAmt = q * r;
          return {
            category: "Raw Material" as const,
            item_name: u.item_name || "Upholstery Item",
            specification: `${u.specification ? `${u.specification}, ` : ""}Qty: ${q}${u.uom ? ` ${u.uom}` : ""}, Rate: ₹${r.toFixed(2)}`,
            quantity: q > 0 ? q : 1,
            unit_of_measure: u.uom || "Pcs",
            unit_cost: r,
            remarks: `Total Amount: ₹${totalAmt.toFixed(2)}`,
          };
        }),
        ...additionalItems.map((a) => {
          const p = Number(a.price) || 0;
          const convStr = String(a.converted_value ?? "").trim().replace(/,/g, "");
          const calcStr = String(a.calculation ?? "").trim().replace(/,/g, "");
          const qty =
            convStr !== "" && Number.isFinite(Number(convStr))
              ? Number(convStr)
              : calcStr !== "" && Number.isFinite(Number(calcStr))
                ? Number(calcStr)
                : 1;
          const rowAmt = computeAdditionalRowAmount(a);
          return {
            category: "Other" as const,
            item_name: a.additional || "Additional Item",
            specification: `Size: ${a.size || "-"}, Calc: ${a.calculation || "-"}${a.uom ? `, UOM: ${a.uom}` : ""}${a.converted_value ? `, Converted: ${a.converted_value}` : ""}`,
            quantity: qty,
            unit_of_measure: a.uom || "Pcs",
            unit_cost: p,
            remarks: `Amount: ₹${rowAmt.toFixed(2)}${a.uom ? ` (${a.uom})` : ""}`,
          };
        }),
        ...labourItems.map((l) => {
          const amt = Number(l.amount) || 0;
          const name = l.item_name || "Labour Item";
          return {
            category: "Labor" as const,
            item_name: name,
            specification: `Labour Expense`,
            quantity: 1,
            unit_of_measure: "Pcs",
            unit_cost: amt,
            remarks: `Amount: ₹${amt.toFixed(2)}`,
          };
        }),
        ...polishItems.map((p) => {
          const amt = Number(p.amount) || 0;
          const name = p.item_name || "Polish Expense";
          return {
            category: "Finishing" as const,
            item_name: name,
            specification: `Polish & Finishing Expense`,
            quantity: 1,
            unit_of_measure: "Pcs",
            unit_cost: amt,
            remarks: `Polish Amount: ₹${amt.toFixed(2)}`,
          };
        }),
        {
          category: "Overhead" as const,
          item_name: `Expenses (${expensesPct}%)`,
          specification: `${expensesPct}% on Direct Costs (Wood + Metal + Hardware + Upholstery + Additional + Labour: ₹${(
            computeWoodTotalAmount() +
            computeMetalTotalAmount() +
            computeHardwareTotalAmount() +
            computeUpholsteryTotalAmount() +
            computeAdditionalTotalAmount() +
            computeLabourTotalAmount()
          ).toFixed(2)})`,
          quantity: 1,
          unit_of_measure: "Pcs",
          unit_cost:
            ((computeWoodTotalAmount() +
              computeMetalTotalAmount() +
              computeHardwareTotalAmount() +
              computeUpholsteryTotalAmount() +
              computeAdditionalTotalAmount() +
              computeLabourTotalAmount()) *
              (Number(expensesPct) || 0)) /
            100,
          remarks: `Expenses (${expensesPct}%): ₹${(
            ((computeWoodTotalAmount() +
              computeMetalTotalAmount() +
              computeHardwareTotalAmount() +
              computeUpholsteryTotalAmount() +
              computeAdditionalTotalAmount() +
              computeLabourTotalAmount()) *
              (Number(expensesPct) || 0)) /
            100
          ).toFixed(2)}`,
        },
        ...otherExpenseItems.map((e) => {
          const amt = Number(e.amount) || 0;
          const name = e.item_name || "Operational Expense";
          return {
            category: (name.toLowerCase().includes("pack") ? "Packaging" : "Overhead") as any,
            item_name: name,
            specification: `Operational Expense`,
            quantity: 1,
            unit_of_measure: "Pcs",
            unit_cost: amt,
            remarks: `Amount: ₹${amt.toFixed(2)}`,
          };
        }),
        {
          category: "Packaging" as const,
          item_name: "Packaging Cost",
          specification: packagingCustomAmount !== null
            ? `Custom Amount: ₹${computePackagingTotalAmount().toFixed(2)} (Container Base: ₹${packagingContainerTotal})`
            : `Formula: ₹${packagingContainerTotal} / ${computePcsIn40Hq()} Pcs in 40HQ`,
          quantity: 1,
          unit_of_measure: "Pcs",
          unit_cost: computePackagingTotalAmount(),
          remarks: `Total Packaging Cost: ₹${computePackagingTotalAmount().toFixed(2)}`,
        },
        {
          category: "Overhead" as const,
          item_name: "Forwarding Cost",
          specification: forwardingCustomAmount !== null
            ? `Custom Amount: ₹${computeForwardingTotalAmount().toFixed(2)} (Container Base: ₹${forwardingContainerTotal})`
            : `Formula: ₹${forwardingContainerTotal} / ${computePcsIn40Hq()} Pcs in 40HQ`,
          quantity: 1,
          unit_of_measure: "Pcs",
          unit_cost: computeForwardingTotalAmount(),
          remarks: `Total Forwarding Cost: ₹${computeForwardingTotalAmount().toFixed(2)}`,
        },
      ],
    };

    setLoading(true);
    try {
      let savedId = id;
      if (isEdit && id) {
        await costingApi.updateEstimation(id, payload);
      } else {
        const res = await costingApi.createEstimation(payload);
        savedId = res.id;
      }
      setSavedEstimationId(savedId || "");
      setShowApprovalModal(true);
    } catch (err) {
      alert("Failed to save estimation");
    } finally {
      setLoading(false);
    }
  };

  const handleSendForApproval = async () => {
    if (!savedEstimationId) {
      navigate("/admin/costing/list");
      return;
    }
    setApprovalLoading(true);
    try {
      const authorityName = selectedAuthority
        ? `${selectedAuthority.fullName} (${selectedAuthority.designationTitle || "Director"})`
        : "Management";
      const timestamp = new Date().toLocaleString("en-IN", {
        dateStyle: "short",
        timeStyle: "short",
      });
      const noteEntry = `[${timestamp}] Sent for Approval to: ${authorityName}${approvalNote.trim() ? ` — Note: ${approvalNote.trim()}` : ""
        }`;

      const formDataObj = {
        woodItems,
        metalSsItems,
        hardwareItems,
        upholsteryItems,
        additionalItems,
        labourItems,
        polishItems,
        otherExpenseItems,
        cartons,
        packagingContainerTotal,
        packagingCustomAmount,
        forwardingContainerTotal,
        forwardingCustomAmount,
        expensesPct,
        summaryExpensesPct,
        usdExchangeRate,
        selectedCurrency,
        woodWastagePct,
        imageUrl,
      };
      const formDataJson = JSON.stringify(formDataObj);
      const cleanNotesBeforeSave = (notes || "")
      .replace(/<!--\s*FORM_DATA_START[\s\S]*?<!--\s*FORM_DATA_END\s*-*>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<!--[\s\S]*?->/g, "")
      .trim();
      const combinedNotes = cleanNotesBeforeSave ? `${cleanNotesBeforeSave}\n${noteEntry}` : noteEntry;

      await costingApi.updateEstimation(savedEstimationId, {
        status: "In Review",
        notes: combinedNotes,
        form_data: formDataJson,
      });

      alert(`Costing successfully submitted to ${authorityName} for approval!`);
      navigate("/admin/costing/list");
    } catch (err) {
      navigate("/admin/costing/list");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Do not intercept Enter inside textarea (allow newline) or on buttons
    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;

    if (e.key === "Enter") {
      // Prevent premature form submission while entering data
      e.preventDefault();

      const form = e.currentTarget;
      const selector =
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly])';
      const focusable = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(selector)).filter(
        (el) => el.offsetParent !== null && !el.disabled && el.tabIndex !== -1
      );

      const currentIndex = focusable.indexOf(target as any);
      if (currentIndex !== -1) {
        const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
        if (nextIndex >= 0 && nextIndex < focusable.length) {
          const nextEl = focusable[nextIndex];
          nextEl.focus();
          if (nextEl instanceof HTMLInputElement && (nextEl.type === "text" || nextEl.type === "number")) {
            nextEl.select?.();
          }
        }
      }
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      <style>{`
        /* Hide HTML number input spinners (up/down arrows) */
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }
        input[type=number] {
          -moz-appearance: textfield !important;
        }
      `}</style>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            {isEdit ? "Edit Costing" : "Create New Costing"}
          </h1>
        </div>
        <button
          onClick={() => navigate("/admin/costing/list")}
          style={{
            padding: "8px 16px",
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      <form data-no-enhance="true" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
        {/* Basic Details Card */}
        <div data-no-enhance="true" style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginTop: 0, marginBottom: 16 }}>
            1. Product Details
          </h3>

          {/* Product Image Upload Section */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Product Image
            </label>

            {imageUrl ? (
              <div style={{ position: "relative", width: "100%", maxHeight: "260px", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc", textAlign: "center", padding: 12 }}>
                <img
                  src={imageUrl}
                  alt="Product Preview"
                  style={{ maxHeight: "230px", maxWidth: "100%", objectFit: "contain", borderRadius: 6, display: "block", margin: "0 auto" }}
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  }}
                >
                  ✕ Remove Image
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "170px",
                  border: "2px dashed #cbd5e1",
                  borderRadius: 8,
                  background: "#f8fafc",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", marginBottom: 4 }}>
                  Click to Upload Product Image
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Upload image file (PNG, JPG, WEBP, GIF)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImageUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
          <div
            data-no-enhance="true"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "16px 20px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Product Code
              </label>
              <input
                type="text"
                placeholder="Enter Product Code"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: 42,
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter Product Name"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  setTitle(e.target.value);
                }}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: 42,
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Product Type
              </label>
              <select
                data-no-enhance="true"
                value={productType}
                onChange={(e) => handleProductTypeChange(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: 42,
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">Select Product Type</option>
                {FURNITURE_PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                {productType && !FURNITURE_PRODUCT_TYPES.includes(productType) && (
                  <option value={productType}>{productType}</option>
                )}
              </select>
            </div>

            <div style={{ minWidth: 0 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Collection Name
              </label>
              <input
                type="text"
                placeholder=""
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: 42,
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Type of Costing
              </label>
              <select
                data-no-enhance="true"
                value={typeOfCosting}
                onChange={(e) => setTypeOfCosting(e.target.value as any)}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: 42,
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">Select Costing Type</option>
                <option value="Client Based">Client Based</option>
                <option value="Showroom Based">Showroom Based</option>
              </select>
            </div>

            <div style={{ minWidth: 0 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Overall Size
              </label>
              <input
                type="text"
                placeholder=""
                value={overallSize}
                onChange={(e) => setOverallSize(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: 42,
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Wood Type
              </label>
              <select
                data-no-enhance="true"
                value={woodType}
                onChange={(e) => {
                  const newType = e.target.value;
                  setWoodType(newType);
                  if (newType) {
                    setWoodItems((prev) =>
                      prev.map((row) => {
                        const nextRow = { ...row, wood_type: newType };
                        if (nextRow.length_ft) {
                          const latestThickPrices =
                            woodThicknessPrices.length > 0
                              ? woodThicknessPrices
                              : getLocalWoodThicknessPrices();
                          const matchedRate = findMatchingWoodThicknessRate(
                            newType,
                            nextRow.thick_in,
                            nextRow.length_ft,
                            latestThickPrices
                          );
                          if (matchedRate !== null && matchedRate > 0) {
                            nextRow.rate = matchedRate;
                            nextRow.auto_rate = true;
                          }
                        }
                        return nextRow;
                      })
                    );
                  }
                }}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: 42,
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">Select Wood Type</option>
                {woodTypesList.map((wt) => (
                  <option key={wt.id} value={wt.name}>
                    {wt.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: 0 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Client / Customer Name
              </label>
              <input
                type="text"
                placeholder="Enter Client or Customer Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: 42,
                  boxSizing: "border-box",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              2. Wood Costing
            </h3>
            <button
              type="button"
              onClick={handleAddWoodItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <datalist id="wood-part-suggestions">
            {combinedWoodPartSuggestions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label !== opt.value ? opt.label : undefined}
              </option>
            ))}
          </datalist>

          <div style={{ overflowX: "auto" }}>
            <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Wood part name</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Type of Wood</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Length(ft)</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Width(in.)</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>thick.(in./mm)</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Pcs</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Cft</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Rate (₹/CFT)</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Amount</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {woodItems.map((item, idx) => {
                  const r = Number(item.rate) || 0;
                  const rowIsMdf = isMdfType(item.wood_type, mdfPricesList);
                  const mdfCandidates = rowIsMdf
                    ? getMdfRecordsForType(item.wood_type, mdfPricesList)
                    : [];
                  const matchedMdf = rowIsMdf
                    ? findMatchingMdfPrice(
                      item.wood_type,
                      item.thick_in,
                      item.length_ft,
                      item.width_in,
                      mdfPricesList
                    )
                    : null;
                  const uniqueMdfThicknesses = Array.from(
                    new Set(
                      mdfCandidates
                        .map((m) =>
                          String(m.thickness || "")
                            .replace(/mm|inch|in|"/gi, "")
                            .trim()
                        )
                        .filter(Boolean)
                    )
                  );
                  const cft = computeWoodRowCft(item);
                  const amount = cft * r;

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 12px", minWidth: "170px" }}>
                        <input
                          type="text"
                          list="wood-part-suggestions"
                          placeholder="Enter or select part name"
                          value={item.wood_part_name}
                          onFocus={() => loadSyncedWoodPartNames().then(setWoodPartNamesList).catch(() => { })}
                          onChange={(e) => handleWoodItemChange(idx, "wood_part_name", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 10px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            backgroundColor: "#ffffff",
                            color: "#111827",
                            outline: "none",
                          }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", minWidth: "170px" }}>
                        <select
                          value={item.wood_type}
                          onFocus={() => {
                            loadSyncedMdfPrices().then(setMdfPricesList).catch(() => { });
                            loadSyncedWoodThicknessPrices().then(setWoodThicknessPrices).catch(() => { });
                          }}
                          onChange={(e) => handleWoodItemChange(idx, "wood_type", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            backgroundColor: "#ffffff",
                            color: "#111827",
                            cursor: "pointer",
                          }}
                        >
                          <option value="">-- Select Wood --</option>
                          {(() => {
                            const seenLower = new Set<string>();
                            const options: string[] = [];
                            const addOption = (raw?: string) => {
                              if (!raw) return;
                              const key = raw.trim().toLowerCase();
                              if (!key || seenLower.has(key)) return;
                              seenLower.add(key);
                              options.push(raw.trim());
                            };
                            woodTypesList
                              .filter((wt) => wt.status !== "inactive" || wt.name === item.wood_type)
                              .forEach((wt) => addOption(wt.name));
                            woodThicknessPrices
                              .filter((p) => p.status !== "inactive")
                              .forEach((p) => addOption(p.woodType));
                            mdfPricesList
                              .filter((m) => m.status !== "inactive")
                              .forEach((m) => addOption(m.mdfType));
                            if (item.wood_type) addOption(item.wood_type);
                            return options.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ));
                          })()}
                        </select>
                        {rowIsMdf && matchedMdf && (
                          <div style={{ fontSize: 11, color: "#2563eb", marginTop: 4, fontWeight: 500 }}>
                            {matchedMdf.sheetSize ? `Sheet: ${matchedMdf.sheetSize} • ` : ""}
                            {matchedMdf.thickness}mm
                            {matchedMdf.uom ? ` • ${matchedMdf.uom}` : ""}
                          </div>
                        )}
                        {rowIsMdf && !matchedMdf && uniqueMdfThicknesses.length > 0 && (
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                            Thickness (mm): {uniqueMdfThicknesses.join(", ")}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "8px 12px", width: "100px" }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="ft"
                          value={item.length_ft}
                          onChange={(e) => handleWoodItemChange(idx, "length_ft", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", width: "100px" }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="in."
                          value={item.width_in}
                          onChange={(e) => handleWoodItemChange(idx, "width_in", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", width: "105px" }}>
                        {rowIsMdf && uniqueMdfThicknesses.length > 0 && (
                          <datalist id={`mdf-thick-list-${idx}`}>
                            {uniqueMdfThicknesses.map((th) => (
                              <option key={th} value={th} />
                            ))}
                          </datalist>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          list={rowIsMdf && uniqueMdfThicknesses.length > 0 ? `mdf-thick-list-${idx}` : undefined}
                          placeholder={rowIsMdf ? "mm" : "in."}
                          value={item.thick_in}
                          onChange={(e) => handleWoodItemChange(idx, "thick_in", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", width: "90px" }}>
                        <input
                          type="number"
                          step="1"
                          placeholder="Pcs"
                          value={item.pcs}
                          onChange={(e) => handleWoodItemChange(idx, "pcs", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "#374151", width: "100px" }}>
                        {cft.toFixed(3)}
                      </td>

                      <td style={{ padding: "8px 12px", width: "110px" }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Rate"
                          title={item.auto_rate ? `Auto-fetched from Master by Length (${item.length_ft} ft)` : "Rate per CFT"}
                          value={item.rate}
                          onChange={(e) => handleWoodItemChange(idx, "rate", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            background: item.auto_rate ? "#f0fdf4" : "#ffffff",
                            fontWeight: item.auto_rate ? 600 : 400,
                            color: item.auto_rate ? "#15803d" : "#111827",
                          }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827", width: "130px" }}>
                        ₹{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td style={{ padding: "8px 12px", width: "60px" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveWoodItem(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {(() => {
                  const subtotalCft = woodItems.reduce((sum, item) => sum + computeWoodRowCft(item), 0);
                  const wastageCft = (subtotalCft * (Number(woodWastagePct) || 0)) / 100;
                  const totalCftWithWastage = subtotalCft + wastageCft;

                  const rawWoodCost = woodItems.reduce((sum, item) => {
                    const r = Number(item.rate) || 0;
                    const cft = computeWoodRowCft(item);
                    return sum + (cft * r);
                  }, 0);

                  const wastageAmt = (rawWoodCost * (Number(woodWastagePct) || 0)) / 100;
                  const totalWithWastage = rawWoodCost + wastageAmt;

                  return (
                    <>
                      <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                        <td colSpan={6} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                          Subtotal Wood:
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                          {subtotalCft.toFixed(3)}
                        </td>
                        <td style={{ padding: "10px 12px" }}></td>
                        <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                          ₹{rawWoodCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                      <tr style={{ background: "#f8fafc" }}>
                        <td colSpan={6} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, fontSize: 13, color: "#475569" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                            <span>Wastage:</span>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={woodWastagePct}
                              onChange={(e) => setWoodWastagePct(Number(e.target.value))}
                              style={{ width: "55px", padding: "4px 6px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4, textAlign: "center", fontWeight: 600 }}
                            />
                            <span>%</span>
                          </div>
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 600, fontSize: 13, color: "#d97706" }}>
                          + {wastageCft.toFixed(3)}
                        </td>
                        <td style={{ padding: "8px 12px" }}></td>
                        <td style={{ padding: "8px 12px", fontWeight: 600, fontSize: 13, color: "#d97706" }}>
                          + ₹{wastageAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                      <tr style={{ background: "#eff6ff", borderTop: "2px solid #bfdbfe" }}>
                        <td colSpan={6} style={{ padding: "12px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "#1e3a8a" }}>
                          Total Wood (incl. Wastage):
                        </td>
                        <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                          {totalCftWithWastage.toFixed(3)}
                        </td>
                        <td style={{ padding: "12px" }}></td>
                        <td style={{ padding: "12px", fontWeight: 800, fontSize: 16, color: "#2563eb" }}>
                          ₹{totalWithWastage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>

        {/* Metal and SS Costing Section */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              3. Metal and SS Costing
            </h3>
            <button
              type="button"
              onClick={handleAddMetalSsItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Type</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Size</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Thickness</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Length</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Weight (kg)</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Total Weight</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Rate</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Total Amount</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {metalSsItems.map((item, idx) => {
                const totalWeight = computeMetalRowTotalWeight(item);
                const totalAmount = computeMetalRowTotalAmount(item);

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px", width: "140px" }}>
                      <select
                        value={item.type}
                        onChange={(e) => handleMetalSsItemChange(idx, "type", e.target.value as "Metal" | "SS")}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      >
                        <option value="Metal">Metal</option>
                        <option value="SS">SS</option>
                      </select>
                    </td>

                    <td style={{ padding: "8px 12px", minWidth: "140px" }}>
                      <select
                        value={item.size}
                        onFocus={() => setMetalPricesList(getLocalMetalPrices())}
                        onChange={(e) => handleMetalSsItemChange(idx, "size", e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, backgroundColor: "#ffffff", cursor: "pointer" }}
                      >
                        <option value="">-- Select Size --</option>
                        {(() => {
                          const opts = getMetalSizeOptions(metalPricesList, item.type);
                          if (item.size && !opts.some((o) => o.toLowerCase() === item.size.toLowerCase())) {
                            opts.push(item.size);
                          }
                          return opts.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ));
                        })()}
                      </select>
                    </td>

                    <td style={{ padding: "8px 12px", minWidth: "100px" }}>
                      <select
                        value={item.thickness}
                        onChange={(e) => handleMetalSsItemChange(idx, "thickness", e.target.value)}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "6px 8px",
                          fontSize: 13,
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          backgroundColor: "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">-- Select --</option>
                        <option value="1.6">1.6</option>
                        <option value="1.2">1.2</option>
                        {item.thickness && item.thickness !== "1.6" && item.thickness !== "1.2" && (
                          <option value={item.thickness}>{item.thickness}</option>
                        )}
                      </select>
                    </td>

                    <td style={{ padding: "8px 12px", minWidth: "95px" }}>
                      <input
                        type="text"
                        placeholder=""
                        value={item.length}
                        onChange={(e) => handleMetalSsItemChange(idx, "length", e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "110px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Weight"
                        value={item.weight}
                        onChange={(e) => handleMetalSsItemChange(idx, "weight", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#374151", width: "130px" }}>
                      {totalWeight > 0 ? `${totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} kg` : "-"}
                    </td>

                    <td style={{ padding: "8px 12px", width: "110px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleMetalSsItemChange(idx, "rate", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827", width: "130px" }}>
                      ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: "8px 12px", width: "60px" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveMetalSsItem(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                <td colSpan={5} style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  Total Weight:
                </td>
                <td style={{ padding: "12px", fontWeight: 800, fontSize: 14, color: "#1e293b" }}>
                  {metalSsItems.reduce((sum, item) => sum + computeMetalRowTotalWeight(item), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} kg
                </td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  Total Metal & SS Amount:
                </td>
                <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                  ₹{metalSsItems.reduce((sum, item) => sum + computeMetalRowTotalAmount(item), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Hardware Costing Section */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              4. Hardware Costing
            </h3>
            <button
              type="button"
              onClick={handleAddHardwareItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Name of Hardware</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "115px" }}>UOM</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "110px" }}>Quantity</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "130px" }}>Price (₹ / UOM)</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "130px" }}>Total Amount</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "60px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {hardwareItems.map((item, idx) => {
                  const qty = Number(item.quantity) || 0;
                  const price = Number(item.price) || 0;
                  const totalAmount = qty * price;

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 12px", minWidth: "180px" }}>
                        <select
                          value={item.name}
                          onFocus={() => loadSyncedHardwareAccessories().then(setHardwareMasterList).catch(() => { })}
                          onChange={(e) => handleHardwareItemChange(idx, "name", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            backgroundColor: "#ffffff",
                            color: "#111827",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          <option value="">-- Select Hardware --</option>
                          {(() => {
                            const seenLower = new Set<string>();
                            const options: { value: string; label: string }[] = [];
                            hardwareMasterList
                              .filter((hw) => hw.status !== "inactive" || hw.itemName === item.name)
                              .forEach((hw) => {
                                const name = (hw.itemName || "").trim();
                                if (!name) return;
                                const key = name.toLowerCase();
                                if (seenLower.has(key)) return;
                                seenLower.add(key);
                                options.push({
                                  value: name,
                                  label: `${name}${hw.itemCode ? ` (${hw.itemCode})` : ""} - ₹${Number(hw.rate || 0).toFixed(2)} / ${hw.uom || "Pcs"}`,
                                });
                              });
                            if (item.name && !seenLower.has(item.name.trim().toLowerCase())) {
                              options.push({
                                value: item.name.trim(),
                                label: item.name.trim(),
                              });
                            }
                            return options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ));
                          })()}
                        </select>
                      </td>

                      <td style={{ padding: "8px 12px", width: "135px" }}>
                        <select
                          value={item.uom || "Per Piece"}
                          onChange={(e) => handleHardwareItemChange(idx, "uom", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #bfdbfe",
                            borderRadius: 4,
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <option value="Per Piece">Per Piece</option>
                          <option value="Per Meter">Per Meter</option>
                          <option value="Per Pcs">Per Pcs</option>
                          <option value="Per Kg">Per Kg</option>
                          <option value="Per Set">Per Set</option>
                          <option value="Per Roll">Per Roll</option>
                          <option value="Per Feet">Per Feet</option>
                          <option value="Per Inch">Per Inch</option>
                          <option value="Per Pair">Per Pair</option>
                          <option value="Per Sheet">Per Sheet</option>
                          <option value="Per Packet">Per Packet</option>
                          {!["Per Piece", "Per Meter", "Per Pcs", "Per Kg", "Per Set", "Per Roll", "Per Feet", "Per Inch", "Per Pair", "Per Sheet", "Per Packet"].includes(item.uom || "") && item.uom && (
                            <option value={item.uom}>{item.uom}</option>
                          )}
                        </select>
                      </td>

                      <td style={{ padding: "8px 12px", width: "110px" }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleHardwareItemChange(idx, "quantity", e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", width: "130px" }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.price}
                          onChange={(e) => handleHardwareItemChange(idx, "price", e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 600, color: "#111827" }}
                        />
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          ₹ / {item.uom || "Pcs"}
                        </div>
                      </td>

                      <td style={{ padding: "8px 12px", fontWeight: 700, color: "#111827", width: "130px" }}>
                        ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td style={{ padding: "8px 12px", width: "50px" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveHardwareItem(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                  <td colSpan={4} style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                    Total Hardware Amount:
                  </td>
                  <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                    ₹{hardwareItems
                      .reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 5. Upholstery Costing Section */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              5. Upholstery Costing
            </h3>
            <button
              type="button"
              onClick={handleAddUpholsteryItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <datalist id="upholstery-item-suggestions">
            <option value="Fabric" />
            <option value="Leather" />
            <option value="Foam" />
            <option value="Webbing" />
            <option value="Lining" />
            <option value="Upholstery Materials" />
            <option value="Fabric / Velvet" />
            <option value="Linen Fabric" />
            <option value="Leatherette / Faux Leather" />
            <option value="Genuine Leather" />
            <option value="High Density Foam (32D)" />
            <option value="High Density Foam (40D)" />
            <option value="Memory Foam" />
            <option value="PU Foam" />
            <option value="Dacron / Polyfill" />
            <option value="Lining Fabric" />
            <option value="Webbing Tape / Elastic Belts" />
            <option value="Zig-Zag Springs" />
            <option value="Piping / Beading Cord" />
            <option value="Velcro / Fasteners" />
          </datalist>

          <datalist id="upholstery-uom-suggestions">
            <option value="Meter" />
            <option value="Mtr" />
            <option value="Sq. Ft." />
            <option value="Sheet" />
            <option value="Kg" />
            <option value="Roll" />
            <option value="Pcs" />
          </datalist>

          <div style={{ overflowX: "auto" }}>
            <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Item Name</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Specification</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "120px" }}>UOM</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "110px" }}>Quantity</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "120px" }}>Rate (₹)</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "130px" }}>Amount (₹)</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "50px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {upholsteryItems.map((item, idx) => {
                  const qty = Number(item.quantity) || 0;
                  const rate = Number(item.rate) || 0;
                  const rowAmount = qty * rate;

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 12px", minWidth: "180px" }}>
                        <input
                          type="text"
                          list="upholstery-item-suggestions"
                          placeholder=""
                          value={item.item_name}
                          onChange={(e) => handleUpholsteryItemChange(idx, "item_name", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                          }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", minWidth: "160px" }}>
                        <input
                          type="text"
                          placeholder=""
                          value={item.specification || ""}
                          onChange={(e) => handleUpholsteryItemChange(idx, "specification", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                          }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", width: "120px" }}>
                        <input
                          type="text"
                          list="upholstery-uom-suggestions"
                          placeholder=""
                          value={item.uom || ""}
                          onChange={(e) => handleUpholsteryItemChange(idx, "uom", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                          }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", width: "110px" }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleUpholsteryItemChange(idx, "quantity", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                          }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", width: "120px" }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => handleUpholsteryItemChange(idx, "rate", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827", width: "130px" }}>
                        ₹{rowAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td style={{ padding: "8px 12px", width: "50px" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveUpholsteryItem(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                  <td colSpan={5} style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                    Total Upholstery Amount:
                  </td>
                  <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                    ₹{computeUpholsteryTotalAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 6. Additional Costing Section */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              6. Additional Costing
            </h3>
            <button
              type="button"
              onClick={handleAddAdditionalItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Process Name</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Size</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Calculation</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>UOM</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Converted Value</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Price</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Amount</th>
                  <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "50px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {additionalItems.map((item, idx) => {
                  const rowAmount = computeAdditionalRowAmount(item);
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 12px", minWidth: "180px" }}>
                        <select
                          value={item.additional}
                          onFocus={() => loadSyncedAdditionalCosts().then(setAdditionalMasterList).catch(() => { })}
                          onChange={(e) => handleAdditionalItemChange(idx, "additional", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            backgroundColor: "#ffffff",
                            color: "#111827",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          <option value="">-- Select Process Name --</option>
                          {(() => {
                            const seenLower = new Set<string>();
                            const options: { value: string; label: string }[] = [];
                            additionalMasterList
                              .filter((ac) => ac.status !== "inactive" || ac.itemName === item.additional)
                              .forEach((ac) => {
                                const name = (ac.itemName || "").trim();
                                if (!name) return;
                                const key = name.toLowerCase();
                                if (seenLower.has(key)) return;
                                seenLower.add(key);
                                options.push({
                                  value: name,
                                  label: ac.itemCode ? `${name} (${ac.itemCode})` : name,
                                });
                              });
                            if (item.additional && !seenLower.has(item.additional.trim().toLowerCase())) {
                              options.push({
                                value: item.additional.trim(),
                                label: item.additional.trim(),
                              });
                            }
                            return options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ));
                          })()}
                        </select>
                      </td>

                      <td style={{ padding: "8px 12px", minWidth: "145px", width: "160px" }}>
                        <input
                          type="text"
                          placeholder=""
                          value={item.size}
                          onChange={(e) => handleAdditionalItemChange(idx, "size", e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", minWidth: "120px", width: "130px" }}>
                        <input
                          type="text"
                          placeholder="Calculation"
                          value={item.calculation}
                          onChange={(e) => handleAdditionalItemChange(idx, "calculation", e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 600, color: "#111827", backgroundColor: "#f8fafc" }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", minWidth: "125px", width: "135px" }}>
                        <select
                          value={item.uom || ""}
                          onFocus={() => loadMergedUomOptions().then(setUomOptions).catch(() => { })}
                          onChange={(e) => handleAdditionalItemChange(idx, "uom", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            backgroundColor: "#ffffff",
                            color: "#111827",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          <option value="">-- Select UOM --</option>
                          {mergeUomNames(item.uom ? [item.uom, ...uomOptions] : uomOptions).map((uom) => (
                            <option key={uom} value={uom}>
                              {uom}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={{ padding: "8px 12px", minWidth: "130px", width: "140px" }}>
                        <input
                          type="text"
                          placeholder="Converted Value"
                          value={item.converted_value || ""}
                          onChange={(e) => handleAdditionalItemChange(idx, "converted_value", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "6px 8px",
                            fontSize: 13,
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            fontWeight: 600,
                            color: "#111827",
                            backgroundColor: "#f8fafc",
                          }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", width: "120px" }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.price}
                          onChange={(e) => handleAdditionalItemChange(idx, "price", e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 600, color: "#111827" }}
                        />
                      </td>

                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827", minWidth: "120px", width: "130px" }}>
                        ₹{rowAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td style={{ padding: "8px 12px", width: "50px" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalItem(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                  <td colSpan={6} style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                    Total Additional Amount:
                  </td>
                  <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                    ₹{additionalItems.reduce((sum, item) => sum + computeAdditionalRowAmount(item), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 7. Labour Expenses Section */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              7. Labour Expenses
            </h3>
            <button
              type="button"
              onClick={handleAddLabourItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Labour Expense Item</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "220px" }}>Amount (₹)</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "60px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {labourItems.map((item, idx) => {
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        placeholder=""
                        value={item.item_name}
                        onChange={(e) => handleLabourItemChange(idx, "item_name", e.target.value)}
                        style={{ width: "100%", maxWidth: "360px", padding: "6px 10px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 500 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={item.amount}
                        onChange={(e) => handleLabourItemChange(idx, "amount", e.target.value)}
                        style={{ width: "100%", padding: "6px 10px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 600, color: "#111827" }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveLabourItem(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  Total Labour Cost:
                </td>
                <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                  ₹{computeLabourTotalAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 8. Expenses Section */}
        {(() => {
          const woodTotalCost = computeWoodTotalAmount();
          const metalTotalCost = computeMetalTotalAmount();
          const hardwareTotalCost = computeHardwareTotalAmount();
          const upholsteryTotalCost = computeUpholsteryTotalAmount();
          const additionalTotalCost = computeAdditionalTotalAmount();
          const labourTotalCost = computeLabourTotalAmount();

          const directSubtotalCost =
            woodTotalCost + metalTotalCost + hardwareTotalCost + upholsteryTotalCost + additionalTotalCost + labourTotalCost;

          const calculatedExpensesAmt = (directSubtotalCost * (Number(expensesPct) || 0)) / 100;
          const otherExpensesAmt = computeOtherExpensesTotalAmount();
          const totalExpensesCost = calculatedExpensesAmt + otherExpensesAmt;
          const costAfterExpenses = directSubtotalCost + totalExpensesCost;

          return (
            <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
                  8. Expenses
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#6b7280" }}>
                  Total direct production cost (Wood + Metal + Hardware + Upholstery + Additional + Labour) plus expenses percentage
                </p>
              </div>

              {/* Direct Cost Breakdown Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Wood Cost</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                    ₹{woodTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Metal & SS Cost</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                    ₹{metalTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Hardware Cost</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                    ₹{hardwareTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Upholstery Cost</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                    ₹{upholsteryTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Additional Cost</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                    ₹{additionalTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Labour Cost</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                    ₹{labourTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Direct Subtotal Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f1f5f9", padding: "12px 16px", borderRadius: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                  Direct Costs Subtotal (Wood + Metal + Hardware + Upholstery + Additional + Labour):
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                  ₹{directSubtotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Editable Expenses Percentage & Result */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 16, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6b21a8", marginBottom: 6 }}>
                    Expenses Rate (%)
                  </label>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={expensesPct}
                      onChange={(e) => setExpensesPct(Number(e.target.value))}
                      style={{
                        width: "80px",
                        padding: "6px 10px",
                        fontSize: 14,
                        border: "1px solid #c084fc",
                        borderRadius: 6,
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#581c87",
                        background: "#ffffff",
                        outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#6b21a8" }}>%</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#7e22ce", marginTop: 4 }}>
                    Default is 15% (editable)
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#6b21a8", marginBottom: 6 }}>
                    Calculated Expenses Amount ({expensesPct}%)
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#7e22ce" }}>
                    + ₹{calculatedExpensesAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b21a8", marginTop: 4 }}>
                    ({expensesPct}% of direct subtotal ₹{directSubtotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </div>
                </div>
              </div>

              {/* Optional Other Expense Items (Packing, Forwarding, etc.) */}
              {otherExpenseItems.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                    Additional Operational Expenses
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "8px 10px", fontSize: 12, color: "#64748b", textAlign: "left" }}>Item Name</th>
                        <th style={{ padding: "8px 10px", fontSize: 12, color: "#64748b", width: "180px", textAlign: "left" }}>Amount (₹)</th>
                        <th style={{ padding: "8px 10px", fontSize: 12, color: "#64748b", width: "50px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {otherExpenseItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "6px 10px" }}>
                            <input
                              type="text"
                              value={item.item_name}
                              onChange={(e) => handleOtherExpenseItemChange(idx, "item_name", e.target.value)}
                              placeholder=""
                              style={{ width: "100%", padding: "5px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                            />
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => handleOtherExpenseItemChange(idx, "amount", e.target.value)}
                              placeholder="0.00"
                              style={{ width: "100%", padding: "5px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 600 }}
                            />
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveOtherExpenseItem(idx)}
                              style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={handleAddOtherExpenseItem}
                  style={{
                    padding: "5px 12px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add Other Expense Line
                </button>
              </div>

              {/* Total Cost After Expenses Banner */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1.5px solid #86efac", padding: "14px 18px", borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#166534" }}>
                    Total Cost After Expenses
                  </div>
                  <div style={{ fontSize: 12, color: "#15803d", marginTop: 2 }}>
                    Direct Costs Subtotal + {expensesPct}% Expenses{otherExpensesAmt > 0 ? ` + ₹${otherExpensesAmt.toFixed(2)} Other Expenses` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#15803d" }}>
                  ₹{costAfterExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 9. Polish & Finishing Cost Section */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
                9. Polish & Finishing Cost
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddPolishItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Finishing Expense Item</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "220px" }}>Amount (₹)</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "60px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {polishItems.map((item, idx) => {
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        placeholder=""
                        value={item.item_name}
                        onChange={(e) => handlePolishItemChange(idx, "item_name", e.target.value)}
                        style={{ width: "100%", maxWidth: "360px", padding: "6px 10px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 500 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={item.amount}
                        onChange={(e) => handlePolishItemChange(idx, "amount", e.target.value)}
                        style={{ width: "100%", padding: "6px 10px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 600, color: "#111827" }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px" }}>
                      <button
                        type="button"
                        onClick={() => handleRemovePolishItem(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  Total Polish & Finishing Cost:
                </td>
                <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                  ₹{computePolishTotalAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 10. CBM & Container Load Calculation Section */}
        {(() => {
          const cartonCbms = cartons.map((c) => {
            const l = Number(c.length) || 0;
            const w = Number(c.width) || 0;
            const h = Number(c.height) || 0;
            return c.unit === "cm" ? (l * w * h) / 1000000 : (l * w * h) / 61023.74;
          });

          const totalCbm = cartonCbms.reduce((sum, val) => sum + val, 0);
          const pcsIn40Hq = totalCbm > 0 ? Math.floor(65.0 / totalCbm) : 0;

          return (
            <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
                  10. CBM Calculation
                </h3>
                <button
                  type="button"
                  onClick={handleAddCarton}
                  style={{
                    padding: "6px 14px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  + Add Carton
                </button>
              </div>

              {cartons.map((carton, idx) => {
                const cbm = cartonCbms[idx] || 0;
                return (
                  <div
                    key={idx}
                    style={{
                      marginBottom: 16,
                      padding: 16,
                      background: "#f8fafc",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "#1e293b",
                        marginBottom: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Carton Size {idx + 1}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>
                          CBM: {cbm.toFixed(3)} m³
                        </span>
                        {cartons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCarton(idx)}
                            title={`Remove Carton Size ${idx + 1}`}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#dc2626",
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: 14,
                              padding: "0 4px",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
                      <div style={{ flex: "1 1 120px" }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
                          Length (L)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="L"
                          value={carton.length}
                          onChange={(e) =>
                            handleCartonChange(idx, "length", e.target.value ? Number(e.target.value) : "")
                          }
                          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4 }}
                        />
                      </div>
                      <div style={{ flex: "1 1 120px" }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
                          Width (W)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="W"
                          value={carton.width}
                          onChange={(e) =>
                            handleCartonChange(idx, "width", e.target.value ? Number(e.target.value) : "")
                          }
                          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4 }}
                        />
                      </div>
                      <div style={{ flex: "1 1 120px" }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
                          Height (H)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="H"
                          value={carton.height}
                          onChange={(e) =>
                            handleCartonChange(idx, "height", e.target.value ? Number(e.target.value) : "")
                          }
                          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4 }}
                        />
                      </div>
                      <div style={{ width: "100px" }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>
                          Unit
                        </label>
                        <select
                          value={carton.unit}
                          onChange={(e) => handleCartonChange(idx, "unit", e.target.value as "cm" | "in")}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            fontSize: 13,
                            border: "1px solid #cbd5e1",
                            borderRadius: 4,
                            background: "#ffffff",
                          }}
                        >
                          <option value="cm">cm</option>
                          <option value="in">inches</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total CBM & No of Pcs in 40 HQ */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "14px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#1e40af", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
                    Total CBM
                  </div>
                  <div style={{ fontSize: 22, color: "#2563eb", fontWeight: 800 }}>
                    {totalCbm.toFixed(3)} m³
                  </div>
                </div>

                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 6, padding: "14px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#92400e", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
                    NO OF PCS IN 40 HQ (65 CBM)
                  </div>
                  <div style={{ fontSize: 22, color: "#d97706", fontWeight: 800 }}>
                    {totalCbm > 0 ? pcsIn40Hq : "-"}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 11. Packaging & Forwarding Cost Section */}
        {(() => {
          const pcsIn40Hq = computePcsIn40Hq();
          const packagingTotal = computePackagingTotalAmount();
          const forwardingTotal = computeForwardingTotalAmount();
          const combinedPackForwardTotal = packagingTotal + forwardingTotal;

          return (
            <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
                  11. Packaging & Forwarding Cost
                </h3>
              </div>

              {/* Single Line Packaging Cost */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 18px", marginBottom: 12, gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 20 }}>📦</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", minWidth: "120px" }}>Packaging Cost</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, padding: "3px 8px" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={packagingContainerTotal}
                      onChange={(e) => {
                        setPackagingContainerTotal(e.target.value === "" ? "" : Number(e.target.value));
                        setPackagingCustomAmount(null);
                      }}
                      title="Container Base Amount (Editable)"
                      placeholder="150000"
                      style={{ width: "85px", border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "#1e293b" }}
                    />
                  </div>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    / {pcsIn40Hq > 0 ? `${pcsIn40Hq} Pcs in 40HQ` : "Pcs in 40HQ"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#ffffff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "5px 10px" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2563eb" }}>₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={packagingCustomAmount !== null ? packagingCustomAmount : (packagingTotal > 0 ? Number(packagingTotal.toFixed(2)) : "")}
                      onChange={(e) => {
                        setPackagingCustomAmount(e.target.value === "" ? 0 : Number(e.target.value));
                      }}
                      placeholder="0.00"
                      title="Editable Amount per piece"
                      style={{ width: "110px", border: "none", outline: "none", fontSize: 16, fontWeight: 800, color: "#2563eb", textAlign: "right" }}
                    />
                  </div>
                  {packagingCustomAmount !== null && (
                    <button
                      type="button"
                      onClick={() => setPackagingCustomAmount(null)}
                      title="Reset to formula calculated amount"
                      style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "#2563eb", fontWeight: 600, cursor: "pointer" }}
                    >
                      ↺ Auto
                    </button>
                  )}
                </div>
              </div>

              {/* Single Line Forwarding Cost */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 18px", marginBottom: 16, gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 20 }}>🚚</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", minWidth: "120px" }}>Forwarding Cost</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, padding: "3px 8px" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={forwardingContainerTotal}
                      onChange={(e) => {
                        setForwardingContainerTotal(e.target.value === "" ? "" : Number(e.target.value));
                        setForwardingCustomAmount(null);
                      }}
                      title="Container Base Amount (Editable)"
                      placeholder="100000"
                      style={{ width: "85px", border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "#1e293b" }}
                    />
                  </div>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    / {pcsIn40Hq > 0 ? `${pcsIn40Hq} Pcs in 40HQ` : "Pcs in 40HQ"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#ffffff", border: "1px solid #99f6e4", borderRadius: 6, padding: "5px 10px" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0d9488" }}>₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={forwardingCustomAmount !== null ? forwardingCustomAmount : (forwardingTotal > 0 ? Number(forwardingTotal.toFixed(2)) : "")}
                      onChange={(e) => {
                        setForwardingCustomAmount(e.target.value === "" ? 0 : Number(e.target.value));
                      }}
                      placeholder="0.00"
                      title="Editable Amount per piece"
                      style={{ width: "110px", border: "none", outline: "none", fontSize: 16, fontWeight: 800, color: "#0d9488", textAlign: "right" }}
                    />
                  </div>
                  {forwardingCustomAmount !== null && (
                    <button
                      type="button"
                      onClick={() => setForwardingCustomAmount(null)}
                      title="Reset to formula calculated amount"
                      style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "#0d9488", fontWeight: 600, cursor: "pointer" }}
                    >
                      ↺ Auto
                    </button>
                  )}
                </div>
              </div>

              {/* Combined Total Packaging & Forwarding Banner */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#eff6ff", border: "1.5px solid #bfdbfe", padding: "14px 20px", borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                  Total Packaging & Forwarding Cost
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1d4ed8" }}>
                  ₹{combinedPackForwardTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Grand Total Summary Card */}
        {(() => {
          const woodTotal = computeWoodTotalAmount();
          const metalTotal = computeMetalTotalAmount();
          const hardwareTotal = computeHardwareTotalAmount();
          const upholsteryTotal = computeUpholsteryTotalAmount();
          const additionalTotal = computeAdditionalTotalAmount();
          const labourTotal = computeLabourTotalAmount();
          const polishTotal = computePolishTotalAmount();
          const packagingTotal = computePackagingTotalAmount();
          const forwardingTotal = computeForwardingTotalAmount();

          // Direct Costs Subtotal (Wood + Metal + Hardware + Upholstery + Additional + Labour)
          const rawDirectSubtotal =
            woodTotal + metalTotal + hardwareTotal + upholsteryTotal + additionalTotal + labourTotal;

          // Section 8 Expenses (default 15% via expensesPct)
          const section8ExpensesAmt = (rawDirectSubtotal * (Number(expensesPct) || 0)) / 100;
          const otherExpensesAmt = computeOtherExpensesTotalAmount();
          const totalSection8Expenses = section8ExpensesAmt + otherExpensesAmt;

          // Direct Costs Subtotal after adding Section 8 Expenses (reflecting Section 8 in Row 1)
          const costAfterExpenses = rawDirectSubtotal + totalSection8Expenses;

          // Polish & Finishing Cost Total (polishTotal)
          // Packaging & Forwarding Costs Total
          const totalPackagingAndForwarding = packagingTotal + forwardingTotal;

          // Total Production & Freight Cost (Direct with Section 8 Expenses + Polish + Packaging & Forwarding)
          const totalProductionAndFreightCost = costAfterExpenses + polishTotal + totalPackagingAndForwarding;

          // Blue Box Expenses (default 20% via summaryExpensesPct, calculated on Total Production & Freight Cost)
          const blueBoxExpensesAmt = (totalProductionAndFreightCost * (Number(summaryExpensesPct) || 0)) / 100;

          // Total Cost After 20% Expenses
          const totalCostAfterExpenses = totalProductionAndFreightCost + blueBoxExpensesAmt;

          // Profit Margin (default 26% calculated on Total Cost After Expenses)
          const profitAmt = (totalCostAfterExpenses * (Number(marginPercentage) || 0)) / 100;

          // Grand Total Estimated Cost (INR)
          const grandTotal = totalCostAfterExpenses + profitAmt;

          const activeUsdRate = typeof usdExchangeRate === "number" && usdExchangeRate > 0 ? usdExchangeRate : 86.5;
          const grandTotalInUsd = grandTotal / activeUsdRate;

          const activeSelectedRate =
            currencyExchangeRates[selectedCurrency] && currencyExchangeRates[selectedCurrency] > 0
              ? currencyExchangeRates[selectedCurrency]
              : (selectedCurrency === "USD" ? activeUsdRate : 1);
          const grandTotalInSelectedCurrency = activeSelectedRate > 0 ? grandTotal / activeSelectedRate : 0;
          const selectedSymbol = CURRENCY_SYMBOLS[selectedCurrency] || `${selectedCurrency} `;

          return (
            <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", borderRadius: 8, padding: 24, color: "#ffffff", marginBottom: 24, boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 10, marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  Cost Estimation Summary
                </h3>
              </div>

              {/* Cost Section Breakdown Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: 18 }}>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Total Wood Cost</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>₹{woodTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Total Metal & SS Cost</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>₹{metalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Total Hardware Cost</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>₹{hardwareTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Total Upholstery Cost</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>₹{upholsteryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Total Additional Cost</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>₹{additionalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Total Labour Cost</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>₹{labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Total Polish Cost</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>₹{polishTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Packaging Cost</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>₹{packagingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>Forwarding Cost</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>₹{forwardingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Direct Costs Subtotal Row: Reflects Section 8 Total Cost After Expenses */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.12)", borderRadius: 6, padding: "10px 16px", marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Direct Costs Subtotal (Wood + Metal + Hardware + Upholstery + Additional + Labour + {expensesPct}% Expenses):</span>
                  <span style={{ fontSize: 11, opacity: 0.8, display: "block", marginTop: 2 }}>
                    Direct Costs: ₹{rawDirectSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + {expensesPct}% Expenses: ₹{totalSection8Expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#ffffff" }}>₹{costAfterExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Polish & Finishing Summary Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "10px 16px", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Polish & Finishing Cost Total:</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fed7aa" }}>+ ₹{polishTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Packaging & Forwarding Summary Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "10px 16px", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Packaging & Forwarding Costs Total:</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#67e8f9" }}>+ ₹{totalPackagingAndForwarding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Total Production & Freight Cost */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 6, padding: "12px 16px", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>Total Production & Freight Cost:</span>
                  <span style={{ fontSize: 11, opacity: 0.85, display: "block", marginTop: 2, color: "#cbd5e1" }}>
                    Direct with Expenses (₹{costAfterExpenses.toFixed(2)}) + Polish (₹{polishTotal.toFixed(2)}) + Packaging & Forwarding (₹{totalPackagingAndForwarding.toFixed(2)})
                  </span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>₹{totalProductionAndFreightCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Expenses Rate (%) Control - Calculated on Total Production & Freight Cost */}
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: "block" }}>Expenses Rate (%)</label>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>({summaryExpensesPct}% calculated on Total Production & Freight Cost: ₹{totalProductionAndFreightCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={summaryExpensesPct}
                      onChange={(e) => setSummaryExpensesPct(Number(e.target.value))}
                      style={{ width: "65px", padding: "4px 6px", fontSize: 13, border: "none", borderRadius: 4, textAlign: "center", fontWeight: 700, color: "#1e3a8a", background: "#ffffff" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>%</span>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, textAlign: "right", color: "#fef08a" }}>
                  + ₹{blueBoxExpensesAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Total Cost After Expenses Banner */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(254, 240, 138, 0.4)", borderRadius: 6, padding: "12px 16px", marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>Total Cost After Expenses:</span>
                  <span style={{ fontSize: 11, opacity: 0.85, display: "block", marginTop: 2, color: "#fef08a" }}>
                    Total Production & Freight (₹{totalProductionAndFreightCost.toFixed(2)}) + {summaryExpensesPct}% Expenses (₹{blueBoxExpensesAmt.toFixed(2)})
                  </span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fef08a" }}>₹{totalCostAfterExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Profit Margin Control - Calculated on Total Cost After Expenses */}
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: "block" }}>Profit Margin (%)</label>
                    <span style={{ fontSize: 11, opacity: 0.8 }}>({marginPercentage}% calculated on Total Cost After Expenses: ₹{totalCostAfterExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={marginPercentage}
                      onChange={(e) => setMarginPercentage(Number(e.target.value))}
                      style={{ width: "65px", padding: "4px 6px", fontSize: 13, border: "none", borderRadius: 4, textAlign: "center", fontWeight: 700, color: "#1e3a8a", background: "#ffffff" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>%</span>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, textAlign: "right", color: "#86efac" }}>
                  + ₹{profitAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Grand Total Row (INR) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "14px 20px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.15)" }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 700, display: "block" }}>Grand Total Estimated Cost (INR):</span>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>Total Cost After Expenses (₹{totalCostAfterExpenses.toFixed(2)}) + Profit {marginPercentage}% (₹{profitAmt.toFixed(2)})</span>
                </div>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#ffffff" }}>₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* USD ($) Conversion Row directly below Grand Total */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", background: "rgba(16, 185, 129, 0.2)", border: "1.5px solid rgba(52, 211, 153, 0.4)", borderRadius: 8, padding: "12px 20px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 22 }}>💵</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#ecfdf5" }}>
                      Grand Total in USD ($)
                    </div>
                    <div style={{ fontSize: 12, color: "#a7f3d0" }}>
                      Conversion Rate: $1 USD = ₹{activeUsdRate.toFixed(2)} (from Costing Master)
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#34d399", letterSpacing: "0.5px" }}>
                  ${grandTotalInUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Any Currency Conversion Row at the bottom */}
              <div style={{ background: "rgba(0, 0, 0, 0.25)", border: "1px dashed rgba(255,255,255,0.3)", borderRadius: 8, padding: "12px 18px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 18 }}>🌐</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Convert to Any Currency:</span>

                    {/* Currency Selector Dropdown */}
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      style={{
                        padding: "6px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#1e3a8a",
                        background: "#ffffff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        outline: "none"
                      }}
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="AED">AED (د.إ) - UAE Dirham</option>
                      <option value="AUD">AUD (A$) - Australian Dollar</option>
                      <option value="CAD">CAD (C$) - Canadian Dollar</option>
                      <option value="SGD">SGD (S$) - Singapore Dollar</option>
                      <option value="SAR">SAR (﷼) - Saudi Riyal</option>
                      <option value="JPY">JPY (¥) - Japanese Yen</option>
                    </select>

                    {/* Rate Display from Master for Selected Currency */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.15)", padding: "5px 12px", borderRadius: 6 }}>
                      <span style={{ fontSize: 12, color: "#cbd5e1" }}>1 {selectedCurrency} =</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                        ₹{(currencyExchangeRates[selectedCurrency] ?? activeSelectedRate).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Converted Total in Selected Currency */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 12, opacity: 0.85 }}>Total in {selectedCurrency}:</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#fef08a" }}>
                      {selectedSymbol}{grandTotalInSelectedCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}



        {/* Submit Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate("/admin/costing/list")}
            style={{
              padding: "10px 20px",
              background: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 24px",
              background: "#2563eb",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            {loading ? "Saving..." : isEdit ? "Update Estimation" : "Save Estimation"}
          </button>
        </div>
      </form>

      {/* Send for Approval Modal */}
      {showApprovalModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 540,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 26 }}>📤</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                    Send for Approval
                  </h3>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                    Costing saved! Select approval authority (Ravi Utmani or Raj Utmani):
                  </div>
                </div>
              </div>
            </div>

            {/* Authority List */}
            <div style={{ padding: "20px 24px", maxHeight: "320px", overflowY: "auto" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>
                Approval Authorities (Ravi Utmani / Raj Utmani)
              </label>

              {approvalAuthorities.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 8 }}>
                  Loading authorities...
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {approvalAuthorities.map((emp) => {
                    const isSelected = selectedAuthority?.id === emp.id;
                    return (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedAuthority(emp)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          borderRadius: 8,
                          border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          background: isSelected ? "#eff6ff" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <input
                            type="radio"
                            name="approvalAuthority"
                            checked={isSelected}
                            onChange={() => setSelectedAuthority(emp)}
                            style={{ cursor: "pointer", accentColor: "#2563eb", width: 16, height: 16 }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                              {emp.fullName}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
                              {emp.designationTitle || "Management / Admin"} {emp.departmentName ? `• ${emp.departmentName}` : ""}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: isSelected ? "#dbeafe" : "#f1f5f9",
                            color: isSelected ? "#1d4ed8" : "#475569",
                            fontWeight: 700,
                          }}
                        >
                          {emp.designationTitle?.toLowerCase().includes("admin") ? "Admin" : "Management"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Optional Note */}
              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Approval Note / Message (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder=""
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 12px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => navigate("/admin/costing/list")}
                style={{
                  padding: "9px 16px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Skip & View List
              </button>

              <button
                type="button"
                disabled={approvalLoading || !selectedAuthority}
                onClick={handleSendForApproval}
                style={{
                  padding: "9px 20px",
                  background: "#2563eb",
                  border: "none",
                  borderRadius: 6,
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: approvalLoading || !selectedAuthority ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                {approvalLoading ? "Sending..." : "Send for Approval ➔"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
