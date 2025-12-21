import { useEffect, useMemo, useState } from "react";

import { apiGet } from "../services/api";
import { YEARS, METRICS } from "./constants";

export type Summary = {
  year: number;
  total_penerima_pkh: number;
  rata_persen_kemiskinan: number;
  total_penduduk_miskin_ribu: number;
};

export type TrendPoint = { tahun: number; value: number };

export type KabkotaRow = {
  kode_kabupaten_kota: number;
  nama_kabupaten_kota: string;
  value: number;
};

export type Correlation = { n: number; r: number | null };

export type Regression = {
  n: number;
  intercept: number | null;
  slope: number | null;
  r2: number | null;
  p_value: number | null;
};

export type ScatterRow = {
  kode_kabupaten_kota: number;
  nama_kabupaten_kota: string;
  jumlah_penerima_manfaat: number;
  persentase_penduduk_miskin: number;
};

export type CompareRow = {
  kode_kabupaten_kota: number;
  nama_kabupaten_kota: string;
  jumlah_penerima_manfaat: number;
  persentase_penduduk_miskin: number;
  jumlah_penduduk_miskin: number;
};

export type EffectRow = {
  tahun: number;
  total_pkh: number;
  avg_kemiskinan: number;
  delta_pkh: number | null;
  delta_kemiskinan: number | null;
  ratio: number | null;
};

export type InsightRow = {
  kode_kabupaten_kota: number;
  nama_kabupaten_kota: string;
  delta_kemiskinan: number;
  delta_pkh: number;
};

export type InsightBlock = {
  top_improve: InsightRow[];
  top_worsen: InsightRow[];
  top_pkh_increase: InsightRow[];
};

export type CompareYearsRow = {
  kode_kabupaten_kota: number;
  nama_kabupaten_kota: string;
  value_a: number;
  value_b: number;
  delta: number;
};

export type MapFeature = {
  type: string;
  properties: {
    kode_kabupaten_kota: number;
    nama_kabupaten_kota: string;
  };
  geometry: any;
};

export type MapGeo = {
  type: "FeatureCollection";
  features: MapFeature[];
};

export function useDashboardData() {
  const [mounted, setMounted] = useState(false);
  const [year, setYear] = useState(2024);
  const [metric, setMetric] = useState(METRICS[0].value);
  const [tipe, setTipe] = useState("all");
  const [kabkotaCode, setKabkotaCode] = useState<string | null>(null);
  const [kabkotaOptions, setKabkotaOptions] = useState<KabkotaRow[]>([]);
  const [compareYearA, setCompareYearA] = useState(YEARS[0]);
  const [compareYearB, setCompareYearB] = useState(YEARS[YEARS.length - 1]);
  const [compareMetric, setCompareMetric] = useState(METRICS[0].value);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [kabkotaData, setKabkotaData] = useState<KabkotaRow[]>([]);
  const [geojson, setGeojson] = useState<MapGeo | null>(null);
  const [mapData, setMapData] = useState<KabkotaRow[]>([]);
  const [scatter, setScatter] = useState<ScatterRow[]>([]);
  const [insights, setInsights] = useState<InsightBlock | null>(null);
  const [compareYears, setCompareYears] = useState<CompareYearsRow[]>([]);
  const [correlation, setCorrelation] = useState<Correlation | null>(null);
  const [regression, setRegression] = useState<Regression | null>(null);
  const [compare, setCompare] = useState<CompareRow[]>([]);
  const [effectiveness, setEffectiveness] = useState<EffectRow[]>([]);

  const filterParams = useMemo(() => {
    const params = [];
    if (tipe !== "all") params.push(`tipe=${tipe}`);
    if (kabkotaCode) params.push(`kabkota=${kabkotaCode}`);
    return params.length ? `&${params.join("&")}` : "";
  }, [tipe, kabkotaCode]);

  useEffect(() => {
    apiGet(`/api/kabkota?year=2024&metric=kemiskinan`).then((res) => {
      const list = (res.data || []).sort((a: KabkotaRow, b: KabkotaRow) =>
        a.nama_kabupaten_kota.localeCompare(b.nama_kabupaten_kota)
      );
      setKabkotaOptions(list);
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const safeGet = async (path: string) => {
      try {
        return await apiGet(path);
      } catch {
        return null;
      }
    };

    safeGet(`/api/summary?year=${year}${filterParams}`).then((res) => setSummary(res?.data || null));
    safeGet(`/api/trend?metric=kemiskinan${filterParams}`).then((res) => setTrend(res?.data || []));
    safeGet(`/api/kabkota?year=${year}&metric=${metric}${filterParams}`).then((res) => setKabkotaData(res?.data || []));
    safeGet(`/api/map?year=${year}&metric=${metric}${filterParams}`).then((res) => setMapData(res?.data || []));
    safeGet(`/api/map/geojson`).then((res) => setGeojson(res));
    safeGet(`/api/scatter?year=${year}${filterParams}`).then((res) => setScatter(res?.data || []));
    safeGet(`/api/insights?start=2017&end=2024${filterParams}`).then((res) => setInsights(res?.data || null));
    safeGet(`/api/compare-years?year_a=${compareYearA}&year_b=${compareYearB}&metric=${compareMetric}${filterParams}`).then(
      (res) => setCompareYears(res?.data || [])
    );
    safeGet(`/api/correlation?year=${year}${filterParams}`).then((res) => setCorrelation(res?.data || null));
    safeGet(`/api/regression?start=2017&end=2024${filterParams}`).then((res) => setRegression(res?.data || null));
    safeGet(`/api/compare?year=${year}${filterParams}`).then((res) => setCompare(res?.data || []));
    safeGet(`/api/effectiveness?start=2017&end=2024${filterParams}`).then((res) => setEffectiveness(res?.data || []));
  }, [year, metric, filterParams, compareYearA, compareYearB, compareMetric]);

  return {
    mounted,
    year,
    setYear,
    metric,
    setMetric,
    tipe,
    setTipe,
    kabkotaCode,
    setKabkotaCode,
    kabkotaOptions,
    compareYearA,
    setCompareYearA,
    compareYearB,
    setCompareYearB,
    compareMetric,
    setCompareMetric,
    summary,
    trend,
    kabkotaData,
    geojson,
    mapData,
    scatter,
    insights,
    compareYears,
    correlation,
    regression,
    compare,
    effectiveness,
  };
}
