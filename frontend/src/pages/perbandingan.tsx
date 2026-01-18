import Layout from "../components/Layout";
import FiltersBar from "../components/FiltersBar";
import PageHeader from "../components/PageHeader";
import { METRICS, YEARS } from "../lib/constants";
import { useDashboardData } from "../lib/useDashboardData";

function formatFloat(value: number, digits = 2) {
  return value.toFixed(digits);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function Perbandingan() {
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
    compareYearA,
    setCompareYearA,
    compareYearB,
    setCompareYearB,
    compareMetric,
    setCompareMetric,
    compareYears,
    compare,
  } = useDashboardData();

  return (
    <Layout>
      <PageHeader
        title="Perbandingan"
        subtitle="Bandingkan perubahan antar tahun serta perbandingan PKH dan kemiskinan di kab/kota."
        tag="Lanjutan"
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
        extraControls={
          <>
            <select value={compareYearA} onChange={(e) => setCompareYearA(Number(e.target.value))}>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select value={compareYearB} onChange={(e) => setCompareYearB(Number(e.target.value))}>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select value={compareMetric} onChange={(e) => setCompareMetric(e.target.value)}>
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      <section className="section">
        <div className="section-title">
          <h3>Perbandingan Antar Tahun</h3>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Kab/Kota</th>
                  <th>{compareYearA}</th>
                  <th>{compareYearB}</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                {compareYears.slice(0, 12).map((row) => (
                  <tr key={row.kode_kabupaten_kota}>
                    <td>{row.nama_kabupaten_kota}</td>
                    <td>{formatFloat(row.value_a, 2)}</td>
                    <td>{formatFloat(row.value_b, 2)}</td>
                    <td>{formatFloat(row.delta, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="section-title">
            <h3>Delta Bar (Top 10)</h3>
          </div>
          <div className="bar-list">
            {compareYears.slice(0, 10).map((row) => {
              const width = Math.min(100, Math.abs(row.delta) * 6);
              return (
                <div key={row.kode_kabupaten_kota} className="bar-row">
                  <span>{row.nama_kabupaten_kota}</span>
                  <div className="bar-track">
                    <div className={`bar-fill ${row.delta >= 0 ? "pos" : "neg"}`} style={{ width: `${width}%` }} />
                  </div>
                  <span>{formatFloat(row.delta, 2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h3>Perbandingan PKH & Kemiskinan</h3>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Kab/Kota</th>
                  <th>PKH</th>
                  <th>Kemiskinan %</th>
                  <th>Miskin (ribu)</th>
                </tr>
              </thead>
              <tbody>
                {compare.slice(0, 12).map((row) => (
                  <tr key={row.kode_kabupaten_kota}>
                    <td>{row.nama_kabupaten_kota}</td>
                    <td>{formatNumber(Math.round(row.jumlah_penerima_manfaat))}</td>
                    <td>{row.persentase_penduduk_miskin ? row.persentase_penduduk_miskin.toFixed(2) : "-"}</td>
                    <td>{row.jumlah_penduduk_miskin ? row.jumlah_penduduk_miskin.toFixed(2) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
}
