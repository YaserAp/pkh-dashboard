import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import FiltersBar from "../components/FiltersBar";
import PageHeader from "../components/PageHeader";
import { useDashboardData } from "../lib/useDashboardData";
import { apiGet } from "../services/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatFloat(value: number, digits = 2) {
  return value.toFixed(digits);
}

export default function Home() {
  const {
    year,
    setYear,
    metric,
    setMetric,
    tipe,
    setTipe,
    kabkotaCode,
    setKabkotaCode,
    kabkotaOptions,
    summary,
    trend,
  } = useDashboardData();
  const [prediction, setPrediction] = useState<any>(null);

  const exportParams = useMemo(() => {
    const params = [];
    if (tipe !== "all") params.push(`tipe=${tipe}`);
    if (kabkotaCode) params.push(`kabkota=${kabkotaCode}`);
    return params.length ? `&${params.join("&")}` : "";
  }, [tipe, kabkotaCode]);

  const summaryRows = useMemo(() => (summary ? [summary] : []), [summary]);

  useEffect(() => {
    apiGet(`/api/predict?metric=all&horizon=5&method=auto`)
      .then((res) => setPrediction(res))
      .catch(() => setPrediction(null));
  }, []);

  const predictionRows = useMemo(() => {
    if (!prediction?.data) return { pkh: [], kemiskinan_abs: [], kemiskinan: [] };
    return prediction.data;
  }, [prediction]);

  const predictionSummary = useMemo(() => {
    const agg = (rows: Array<{ tahun: number; value: number }>) => {
      const map = new Map<number, number[]>();
      rows.forEach((row) => {
        if (!map.has(row.tahun)) map.set(row.tahun, []);
        map.get(row.tahun)?.push(row.value);
      });
      return Array.from(map.entries())
        .map(([tahun, values]) => ({
          tahun,
          value: values.reduce((a, b) => a + b, 0) / values.length,
        }))
        .sort((a, b) => a.tahun - b.tahun);
    };

    return {
      pkh: agg(predictionRows.pkh || []),
      kemiskinan_abs: agg(predictionRows.kemiskinan_abs || []),
      kemiskinan: agg(predictionRows.kemiskinan || []),
    };
  }, [predictionRows]);

  const trendInfo = useMemo(() => {
    if (!trend.length) return null;
    const first = trend[0];
    const last = trend[trend.length - 1];
    const delta = last.value - first.value;
    return {
      startYear: first.tahun,
      endYear: last.tahun,
      startValue: first.value,
      endValue: last.value,
      delta,
    };
  }, [trend]);

  const trendRows = useMemo(() => {
    if (!trend.length) return [];
    return trend.map((row, idx) => {
      const prev = idx > 0 ? trend[idx - 1].value : null;
      const change = prev !== null ? row.value - prev : null;
      return {
        tahun: row.tahun,
        value: row.value,
        change,
      };
    });
  }, [trend]);

  const compareNextYear = useMemo(() => {
    if (!summary) return null;
    const nextYear = summary.year + 1;
    const predPKH = predictionSummary.pkh.find((row) => row.tahun === nextYear)?.value ?? null;
    const predKemiskinan = predictionSummary.kemiskinan.find((row) => row.tahun === nextYear)?.value ?? null;
    const predAbs = predictionSummary.kemiskinan_abs.find((row) => row.tahun === nextYear)?.value ?? null;

    return {
      year: summary.year,
      nextYear,
      actualPKH: summary.total_penerima_pkh,
      actualKemiskinan: summary.rata_persen_kemiskinan,
      actualAbs: summary.total_penduduk_miskin_ribu,
      predPKH,
      predKemiskinan,
      predAbs,
    };
  }, [summary, predictionSummary]);

  return (
    <Layout>
      <PageHeader
        title="Ringkasan Program PKH"
        subtitle="Gambaran umum kemiskinan dan penerima PKH di Jawa Barat pada periode 2017-2024."
      />
      <FiltersBar
        year={year}
        setYear={setYear}
        metric={metric}
        setMetric={setMetric}
        tipe={tipe}
        setTipe={setTipe}
        kabkotaCode={kabkotaCode}
        setKabkotaCode={setKabkotaCode}
        kabkotaOptions={kabkotaOptions}
        showMetric={false}
        showExport
        exportUrl={`${API_BASE}/api/report/summary?start=2017&end=2024${exportParams}`}
      />

      <section className="hero">
        <div className="hero-card">
          <div className="kpi">
            <span className="badge">Total Penerima PKH</span>
            <div className="kpi-value">{summary ? formatNumber(summary.total_penerima_pkh) : "-"}</div>
          </div>
        </div>
        <div className="hero-card">
          <div className="kpi">
            <span className="badge">Rata Kemiskinan (%)</span>
            <div className="kpi-value">{summary ? formatFloat(summary.rata_persen_kemiskinan, 2) : "-"}</div>
          </div>
        </div>
        <div className="hero-card">
          <div className="kpi">
            <span className="badge">Total Miskin (ribu)</span>
            <div className="kpi-value">{summary ? formatFloat(summary.total_penduduk_miskin_ribu, 2) : "-"}</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h3>Tren Kemiskinan (Rata-rata)</h3>
        </div>
        <div className="card">
          <svg width="100%" height="160" viewBox="0 0 600 160">
            {trend.length > 1 && (
              <polyline
                fill="none"
                stroke="#2b6a5b"
                strokeWidth="3"
                points={trend
                  .map((p, i) => {
                    const x = (i / (trend.length - 1)) * 560 + 20;
                    const min = Math.min(...trend.map((t) => t.value));
                    const max = Math.max(...trend.map((t) => t.value));
                    const y = 130 - ((p.value - min) / (max - min || 1)) * 100;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            )}
            {trend.map((p, i) => {
              if (trend.length > 8 && i % 2 !== 0) return null;
              const x = (i / (trend.length - 1 || 1)) * 560 + 20;
              return (
                <text key={p.tahun} x={x} y={150} textAnchor="middle" fontSize="10" fill="#6f665c">
                  {p.tahun}
                </text>
              );
            })}
          </svg>
          {trendInfo ? (
            <div className="legend">
              <span>
                {trendInfo.startYear} → {trendInfo.endYear}: {formatFloat(trendInfo.startValue, 2)}% →{" "}
                {formatFloat(trendInfo.endValue, 2)}% (
                {trendInfo.delta >= 0 ? "+" : ""}
                {formatFloat(trendInfo.delta, 2)} poin)
              </span>
              <span>Garis menunjukkan rata-rata % kemiskinan per tahun.</span>
            </div>
          ) : (
            <div className="legend">
              <span>Garis menunjukkan rata-rata % kemiskinan per tahun.</span>
            </div>
          )}
          {trendRows.length > 0 && (
            <div className="table-wrap">
              <table className="table table-small">
                <thead>
                  <tr>
                    <th>Tahun</th>
                    <th>Nilai (%)</th>
                    <th>Perubahan</th>
                  </tr>
                </thead>
                <tbody>
                  {trendRows.map((row) => (
                    <tr key={row.tahun}>
                      <td>{row.tahun}</td>
                      <td>{formatFloat(row.value, 2)}%</td>
                      <td>
                        {row.change === null
                          ? "-"
                          : `${row.change >= 0 ? "Naik" : "Turun"} ${formatFloat(Math.abs(row.change), 2)} poin`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h3>Ringkasan per Tahun</h3>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tahun</th>
                  <th>PKH</th>
                  <th>Kemiskinan %</th>
                  <th>Miskin (ribu)</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Data belum tersedia.</td>
                  </tr>
                ) : (
                  summaryRows.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{formatNumber(row.total_penerima_pkh)}</td>
                      <td>{formatFloat(row.rata_persen_kemiskinan, 2)}</td>
                      <td>{formatFloat(row.total_penduduk_miskin_ribu, 2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h3>Perbandingan Aktual vs Prediksi (Tahun Berikutnya)</h3>
        </div>
        <div className="card">
          {compareNextYear && compareNextYear.predPKH !== null ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Indikator</th>
                    <th>{compareNextYear.year} (Aktual)</th>
                    <th>{compareNextYear.nextYear} (Prediksi)</th>
                    <th>Perubahan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>PKH (penerima)</td>
                    <td>{formatNumber(compareNextYear.actualPKH)}</td>
                    <td>{formatNumber(Math.round(compareNextYear.predPKH))}</td>
                    <td>{formatNumber(Math.round(compareNextYear.predPKH - compareNextYear.actualPKH))}</td>
                  </tr>
                  <tr>
                    <td>Kemiskinan (%)</td>
                    <td>{formatFloat(compareNextYear.actualKemiskinan, 2)}%</td>
                    <td>{formatFloat(compareNextYear.predKemiskinan ?? 0, 2)}%</td>
                    <td>{formatFloat((compareNextYear.predKemiskinan ?? 0) - compareNextYear.actualKemiskinan, 2)}</td>
                  </tr>
                  <tr>
                    <td>Miskin (ribu)</td>
                    <td>{formatFloat(compareNextYear.actualAbs, 2)}</td>
                    <td>{formatFloat(compareNextYear.predAbs ?? 0, 2)}</td>
                    <td>{formatFloat((compareNextYear.predAbs ?? 0) - compareNextYear.actualAbs, 2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p>Data perbandingan belum tersedia.</p>
          )}
          <div className="note">
            Prediksi menggunakan metode otomatis dari data historis. Detail metode tersedia di halaman Prediksi.
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h3>Prediksi 5 Tahun (Rata-rata)</h3>
          <a href="/prediksi" className="badge">
            Lihat detail prediksi
          </a>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tahun</th>
                  <th>PKH</th>
                  <th>Kemiskinan %</th>
                  <th>Miskin (ribu)</th>
                </tr>
              </thead>
              <tbody>
                {predictionSummary.pkh.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Prediksi belum tersedia.</td>
                  </tr>
                ) : (
                  predictionSummary.pkh.map((row, idx) => (
                    <tr key={row.tahun}>
                      <td>{row.tahun}</td>
                      <td>{formatNumber(Math.round(row.value))}</td>
                      <td>{formatFloat(predictionSummary.kemiskinan[idx]?.value ?? 0, 2)}</td>
                      <td>{formatFloat(predictionSummary.kemiskinan_abs[idx]?.value ?? 0, 2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="note">Metode: auto (holt → linear → naive). Rata-rata seluruh kab/kota.</div>
        </div>
      </section>
    </Layout>
  );
}
