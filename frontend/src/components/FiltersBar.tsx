import type { ReactNode } from "react";

import { METRICS, YEARS } from "../lib/constants";
import { KabkotaRow } from "../lib/useDashboardData";

type FiltersBarProps = {
  year: number;
  setYear: (value: number) => void;
  metric: string;
  setMetric: (value: string) => void;
  tipe: string;
  setTipe: (value: string) => void;
  kabkotaCode: string | null;
  setKabkotaCode: (value: string | null) => void;
  kabkotaOptions: KabkotaRow[];
  showMetric?: boolean;
  showExport?: boolean;
  exportUrl?: string;
  extraControls?: ReactNode;
};

export default function FiltersBar({
  year,
  setYear,
  metric,
  setMetric,
  tipe,
  setTipe,
  kabkotaCode,
  setKabkotaCode,
  kabkotaOptions,
  showMetric = true,
  showExport = false,
  exportUrl,
  extraControls,
}: FiltersBarProps) {
  return (
    <div className="controls">
      <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      {showMetric && (
        <select value={metric} onChange={(e) => setMetric(e.target.value)}>
          {METRICS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      )}
      <select value={tipe} onChange={(e) => setTipe(e.target.value)}>
        <option value="all">Semua Wilayah</option>
        <option value="kota">Kota</option>
        <option value="kabupaten">Kabupaten</option>
      </select>
      <select value={kabkotaCode || ""} onChange={(e) => setKabkotaCode(e.target.value || null)}>
        <option value="">Semua Kab/Kota</option>
        {kabkotaOptions.map((row) => (
          <option key={row.kode_kabupaten_kota} value={row.kode_kabupaten_kota}>
            {row.nama_kabupaten_kota}
          </option>
        ))}
      </select>
      {extraControls}
      {showExport && exportUrl && (
        <button className="primary" onClick={() => window.open(exportUrl)}>
          Export Summary CSV
        </button>
      )}
    </div>
  );
}
