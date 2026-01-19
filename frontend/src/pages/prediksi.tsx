import { useEffect, useMemo, useState } from "react";

import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { METRICS } from "../lib/constants";
import { KabkotaRow } from "../lib/useDashboardData";
import { apiGet } from "../services/api";

type PredictionRow = {
  tahun: number;
  kode_kabupaten_kota: number;
  nama_kabupaten_kota: string;
  value: number;
};

type PredictionResponse = {
  status: string;
  metric: string;
  horizon: number;
  start_year: number;
  end_year: number;
  method: string;
  export_path?: string | null;
  data: PredictionRow[] | { [key: string]: PredictionRow[] };
};

type MethodScore = {
  method: string;
  rmse: number;
  mae: number;
  mape: number;
  score: number;
  label: string;
  series_count: number;
};

type CompareDetailsRow = {
  kode_kabupaten_kota: number;
  nama_kabupaten_kota: string;
  best_method: string;
  scores: Array<{
    method: string;
    rmse: number;
    mae: number;
    mape: number;
  }>;
};

type CompareResponse = {
  status: string;
  metric: string;
  test_years: number;
  start_year: number;
  end_year: number;
  best_method?: string | null;
  export_paths?: Record<string, string>;
  data?: {
    methods: MethodScore[];
    series_count: number;
    details?: CompareDetailsRow[] | null;
  };
};

const METHOD_OPTIONS = [
  { value: "auto", label: "Otomatis (direkomendasikan)" },
  { value: "holt", label: "Holt-Winters" },
  { value: "arima", label: "ARIMA(1,1,1)" },
  { value: "linear", label: "Linear Trend" },
];

const HORIZON_OPTIONS = [1, 2, 3, 4, 5];
const TEST_YEAR_OPTIONS = [1, 2, 3, 4, 5];

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatFloat(value: number, digits = 2) {
  return value.toFixed(digits);
}

function getMetricUnit(metric: string) {
  if (metric === "kemiskinan") return "poin persen";
  if (metric === "kemiskinan_abs") return "ribu orang";
  return "penerima";
}

function formatMetricValue(metric: string, value: number) {
  if (metric === "kemiskinan") return formatFloat(value, 2);
  return formatNumber(Math.round(value));
}

export default function Prediksi() {
  const [metric, setMetric] = useState(METRICS[0].value);
  const [method, setMethod] = useState("auto");
  const [horizon, setHorizon] = useState(5);
  const [testYears, setTestYears] = useState(2);
  const [tipe, setTipe] = useState("all");
  const [kabkotaCode, setKabkotaCode] = useState<string | null>(null);
  const [kabkotaOptions, setKabkotaOptions] = useState<KabkotaRow[]>([]);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTech, setShowTech] = useState(false);
  const [exportingPrediction, setExportingPrediction] = useState(false);
  const [exportingCompare, setExportingCompare] = useState(false);
  const unitLabel = getMetricUnit(metric);
  const metricLabel = useMemo(() => METRICS.find((item) => item.value === metric)?.label ?? "-", [metric]);

  useEffect(() => {
    apiGet(`/api/kabkota?year=2024&metric=kemiskinan`).then((res) => {
      const list = (res.data || []).sort((a: KabkotaRow, b: KabkotaRow) =>
        a.nama_kabupaten_kota.localeCompare(b.nama_kabupaten_kota)
      );
      setKabkotaOptions(list);
    });
  }, []);

  const filterParams = useMemo(() => {
    const params = [];
    if (tipe !== "all") params.push(`tipe=${tipe}`);
    if (kabkotaCode) params.push(`kabkota=${kabkotaCode}`);
    return params.length ? `&${params.join("&")}` : "";
  }, [tipe, kabkotaCode]);

  useEffect(() => {
    setLoadingPrediction(true);
    apiGet(`/api/predict?metric=${metric}&horizon=${horizon}&method=${method}${filterParams}`)
      .then((res) => setPrediction(res))
      .catch(() => setPrediction(null))
      .finally(() => setLoadingPrediction(false));
  }, [metric, horizon, method, filterParams]);

  const handleCompare = () => {
    setLoadingCompare(true);
    apiGet(`/api/predict/compare?metric=${metric}&test_years=${testYears}&details=${showDetails}${filterParams}`)
      .then((res) => setComparison(res))
      .catch(() => setComparison(null))
      .finally(() => setLoadingCompare(false));
  };

  const handleExportPrediction = () => {
    setExportingPrediction(true);
    apiGet(`/api/predict?metric=${metric}&horizon=${horizon}&method=${method}${filterParams}&export=true`)
      .then((res) => setPrediction(res))
      .catch(() => setPrediction(null))
      .finally(() => setExportingPrediction(false));
  };

  const handleExportCompare = () => {
    setExportingCompare(true);
    apiGet(`/api/predict/compare?metric=${metric}&test_years=${testYears}&details=${showDetails}${filterParams}&export=true`)
      .then((res) => setComparison(res))
      .catch(() => setComparison(null))
      .finally(() => setExportingCompare(false));
  };

  useEffect(() => {
    if (!comparison) return;
    handleCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetails]);

  const predictionRows = useMemo(() => {
    if (!prediction) return [];
    if (Array.isArray(prediction.data)) {
      return prediction.data;
    }
    return prediction.data?.[metric] || [];
  }, [prediction, metric]);

  const perYear = useMemo(() => {
    const map = new Map<number, number[]>();
    predictionRows.forEach((row) => {
      if (!map.has(row.tahun)) map.set(row.tahun, []);
      map.get(row.tahun)?.push(row.value);
    });
    return Array.from(map.entries())
      .map(([tahun, values]) => ({
        tahun,
        value: values.reduce((a, b) => a + b, 0) / values.length,
      }))
      .sort((a, b) => a.tahun - b.tahun);
  }, [predictionRows]);

  const topLatest = useMemo(() => {
    if (!predictionRows.length) return [];
    const lastYear = Math.max(...predictionRows.map((row) => row.tahun));
    return predictionRows
      .filter((row) => row.tahun === lastYear)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [predictionRows]);

  const chartPoints = useMemo(() => {
    if (perYear.length < 2) return "";
    const min = Math.min(...perYear.map((p) => p.value));
    const max = Math.max(...perYear.map((p) => p.value));
    return perYear
      .map((p, i) => {
        const x = (i / (perYear.length - 1)) * 560 + 20;
        const y = 140 - ((p.value - min) / (max - min || 1)) * 100;
        return `${x},${y}`;
      })
      .join(" ");
  }, [perYear]);

  const chartStats = useMemo(() => {
    if (perYear.length < 2) return null;
    const min = Math.min(...perYear.map((p) => p.value));
    const max = Math.max(...perYear.map((p) => p.value));
    return { min, max };
  }, [perYear]);

  const trendSummary = useMemo(() => {
    if (perYear.length < 2) return null;
    const first = perYear[0];
    const last = perYear[perYear.length - 1];
    const delta = last.value - first.value;
    const direction = delta > 0 ? "naik" : delta < 0 ? "turun" : "stabil";
    const change = Math.abs(delta);
    const formattedChange = formatMetricValue(metric, change);
    return {
      startYear: first.tahun,
      endYear: last.tahun,
      direction,
      change: formattedChange,
      startValue: formatMetricValue(metric, first.value),
      endValue: formatMetricValue(metric, last.value),
    };
  }, [perYear, metric]);

  const methodLabel = useMemo(
    () => METHOD_OPTIONS.find((item) => item.value === prediction?.method)?.label ?? prediction?.method ?? "-",
    [prediction?.method]
  );

  return (
    <Layout>
      <PageHeader
        title="Prediksi 5 Tahun"
        subtitle="Bandingkan 3 metode dan lihat proyeksi PKH serta kemiskinan per kabupaten/kota."
      />

      <section className="section">
        <div className="panel">
          <div className="panel-header">
            <h3>Pengaturan Prediksi</h3>
            <div className="chip-group">
              <span className="chip">Dataset 2017-2024</span>
              <span className="chip">Forecast {horizon} tahun</span>
            </div>
          </div>
          <div className="note">
            Pilih indikator dan wilayah. Metode otomatis direkomendasikan untuk pengguna umum.
          </div>
          <div className="controls">
            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
              {HORIZON_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  Horizon {h} Tahun
                </option>
              ))}
            </select>
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
          </div>
        </div>
      </section>

      <section className="section grid-2">
        <div className="card chart-card">
          <div className="section-title">
            <h3>Rata-rata Prediksi</h3>
            <span className="pill">{prediction?.start_year ?? "-"} - {prediction?.end_year ?? "-"}</span>
          </div>
          {loadingPrediction ? (
            <p>Memuat prediksi...</p>
          ) : predictionRows.length > 0 ? (
            <>
              {trendSummary && (
                <div className="chart-summary">
                  Rata-rata {metricLabel} diprediksi {trendSummary.direction} {trendSummary.change} {unitLabel}
                  dari {trendSummary.startYear} ke {trendSummary.endYear}.
                </div>
              )}
              <svg className="chart-svg" width="100%" height="200" viewBox="0 0 600 200">
                <line x1="20" y1="30" x2="20" y2="170" stroke="rgba(29, 26, 22, 0.12)" strokeWidth="2" />
                <line x1="20" y1="170" x2="580" y2="170" stroke="rgba(29, 26, 22, 0.12)" strokeWidth="2" />
                <polyline fill="none" stroke="#2b6a5b" strokeWidth="3" points={chartPoints} />
                {perYear[0] && (
                  <circle
                    cx="20"
                    cy={
                      140 -
                      ((perYear[0].value - (chartStats?.min ?? 0)) /
                        ((chartStats?.max ?? 1) - (chartStats?.min ?? 0) || 1)) *
                        100
                    }
                    r="5"
                    fill="#2b6a5b"
                  />
                )}
                {perYear[perYear.length - 1] && (
                  <circle
                    cx="580"
                    cy={
                      140 -
                      ((perYear[perYear.length - 1].value - (chartStats?.min ?? 0)) /
                        ((chartStats?.max ?? 1) - (chartStats?.min ?? 0) || 1)) *
                        100
                    }
                    r="5"
                    fill="#2b6a5b"
                  />
                )}
                {trendSummary && (
                  <>
                    <text x="20" y="188" fontSize="12" fill="#6f665c">
                      {trendSummary.startYear}
                    </text>
                    <text x="540" y="188" fontSize="12" fill="#6f665c">
                      {trendSummary.endYear}
                    </text>
                    <text x="20" y="20" fontSize="12" fill="#6f665c">
                      {chartStats ? formatMetricValue(metric, chartStats.max) : "-"} {unitLabel}
                    </text>
                    <text x="20" y="160" fontSize="12" fill="#6f665c">
                      {chartStats ? formatMetricValue(metric, chartStats.min) : "-"} {unitLabel}
                    </text>
                  </>
                )}
              </svg>
              <div className="legend">
                <span>Rata-rata nilai prediksi per tahun</span>
                <span>Metode: {methodLabel}</span>
              </div>
            </>
          ) : (
            <p>Belum ada data prediksi.</p>
          )}
          <div className="controls tight">
            <button onClick={handleExportPrediction} disabled={exportingPrediction}>
              {exportingPrediction ? "Menyimpan..." : "Simpan CSV Prediksi"}
            </button>
          </div>
          {prediction?.export_path && (
            <div className="note">CSV tersimpan di: {prediction.export_path}</div>
          )}
        </div>

        <div className="card">
          <div className="section-title">
            <h3>Top 8 Kab/Kota (Tahun Terakhir)</h3>
          </div>
          <div className="note">Urutan berdasarkan nilai tahun terakhir. Satuan: {unitLabel}.</div>
          {topLatest.length > 0 ? (
            <div className="bar-list">
              {topLatest.map((row) => (
                <div className="bar-row" key={row.kode_kabupaten_kota}>
                  <span>{row.nama_kabupaten_kota}</span>
                  <div className="bar-track">
                    <div className="bar-fill pos" style={{ width: `${(row.value / topLatest[0].value) * 100}%` }} />
                  </div>
                  <span className="bar-value">{formatMetricValue(metric, row.value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>Belum ada data top kab/kota.</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="panel">
          <div className="panel-header">
            <h3>Perbandingan Metode</h3>
            <div className="controls tight">
              <select value={testYears} onChange={(e) => setTestYears(Number(e.target.value))}>
                {TEST_YEAR_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    Test {t} Tahun
                  </option>
                ))}
              </select>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showDetails}
                  onChange={(e) => setShowDetails(e.target.checked)}
                />
                <span>Detail kab/kota</span>
              </label>
              <label className="toggle">
                <input type="checkbox" checked={showTech} onChange={(e) => setShowTech(e.target.checked)} />
                <span>Lihat teknis</span>
              </label>
              <button className="primary" onClick={handleCompare} disabled={loadingCompare}>
                {loadingCompare ? "Menghitung..." : "Bandingkan Metode"}
              </button>
              <button onClick={handleExportCompare} disabled={exportingCompare}>
                {exportingCompare ? "Menyimpan..." : "Simpan CSV Komparasi"}
              </button>
            </div>
          </div>
          {comparison && (
            <div className="chip-group">
              <span className="chip">
                Uji {comparison.start_year}-{comparison.end_year} ({comparison.test_years} tahun)
              </span>
              {comparison.best_method && <span className="chip">Best: {comparison.best_method}</span>}
              {comparison.data?.series_count ? <span className="chip">Series: {comparison.data.series_count}</span> : null}
              <span className="chip">Skor = 100 - MAPE</span>
            </div>
          )}

          <div className="method-grid">
            {(comparison?.data?.methods || []).map((row) => (
              <div key={row.method} className={`method-card ${comparison?.best_method === row.method ? "best" : ""}`}>
                <div className="method-title">{row.method.toUpperCase()}</div>
                <div className="score-row">
                  <div className="score-value">{formatFloat(row.score, 1)}</div>
                  <div>
                    <span className="pill">{row.label}</span>
                    <div className="note">Semakin tinggi = semakin akurat</div>
                  </div>
                </div>
                {showTech && (
                  <div className="stat-grid">
                    <div>
                      <span className="label">RMSE</span>
                      <strong>{formatFloat(row.rmse, 3)}</strong>
                    </div>
                    <div>
                      <span className="label">MAE</span>
                      <strong>{formatFloat(row.mae, 3)}</strong>
                    </div>
                    <div>
                      <span className="label">MAPE</span>
                      <strong>{formatFloat(row.mape, 2)}%</strong>
                    </div>
                  </div>
                )}
                <div className="note">N series: {row.series_count}</div>
                <div className="note">
                  RMSE/MAE menunjukkan rata-rata selisih prediksi vs data aktual dalam satuan {unitLabel}. MAPE adalah
                  selisih dalam persen.
                </div>
              </div>
            ))}
            {!comparison && <p>Tekan "Bandingkan Metode" untuk melihat akurasi.</p>}
          </div>

          {comparison?.export_paths?.summary && (
            <div className="note">CSV ringkasan disimpan di: {comparison.export_paths.summary}</div>
          )}
          {comparison?.export_paths?.details && (
            <div className="note">CSV detail disimpan di: {comparison.export_paths.details}</div>
          )}

          {showDetails && comparison?.data?.details && (
            <div className="table-wrap">
              <table className="table table-small">
                <thead>
                  <tr>
                    <th>Kab/Kota</th>
                    <th>Best</th>
                    <th>RMSE (holt)</th>
                    <th>RMSE (arima)</th>
                    <th>RMSE (linear)</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.data.details.map((row) => {
                    const score = (method: string) =>
                      row.scores.find((s) => s.method === method)?.rmse ?? null;
                    const holt = score("holt");
                    const arima = score("arima");
                    const linear = score("linear");
                    return (
                      <tr key={row.kode_kabupaten_kota}>
                        <td>{row.nama_kabupaten_kota}</td>
                        <td>{row.best_method}</td>
                        <td>{holt !== null ? formatFloat(holt, 3) : "-"}</td>
                        <td>{arima !== null ? formatFloat(arima, 3) : "-"}</td>
                        <td>{linear !== null ? formatFloat(linear, 3) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
