import { useMemo } from "react";
import Layout from "../components/Layout";
import FiltersBar from "../components/FiltersBar";
import PageHeader from "../components/PageHeader";
import { useDashboardData } from "../lib/useDashboardData";

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

  const exportParams = useMemo(() => {
    const params = [];
    if (tipe !== "all") params.push(`tipe=${tipe}`);
    if (kabkotaCode) params.push(`kabkota=${kabkotaCode}`);
    return params.length ? `&${params.join("&")}` : "";
  }, [tipe, kabkotaCode]);

  const summaryRows = useMemo(() => (summary ? [summary] : []), [summary]);

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
          </svg>
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
    </Layout>
  );
}
