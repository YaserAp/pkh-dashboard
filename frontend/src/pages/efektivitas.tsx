import Layout from "../components/Layout";
import FiltersBar from "../components/FiltersBar";
import PageHeader from "../components/PageHeader";
import { useDashboardData } from "../lib/useDashboardData";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatFloat(value: number, digits = 3) {
  return value.toFixed(digits);
}

export default function Efektivitas() {
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
    effectiveness,
  } = useDashboardData();

  return (
    <Layout>
      <PageHeader
        title="Efektivitas"
        subtitle="Rasio perubahan kemiskinan terhadap perubahan penerima PKH per tahun."
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
      />

      <section className="section">
        <div className="section-title">
          <h3>Efektivitas (Delta Kemiskinan / Delta PKH)</h3>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tahun</th>
                  <th>Delta PKH</th>
                  <th>Delta Kemiskinan</th>
                  <th>Rasio</th>
                </tr>
              </thead>
              <tbody>
                {effectiveness.map((row) => (
                  <tr key={row.tahun}>
                    <td>{row.tahun}</td>
                    <td>{row.delta_pkh !== null && row.delta_pkh !== undefined ? formatNumber(Math.round(row.delta_pkh)) : "-"}</td>
                    <td>{row.delta_kemiskinan !== null && row.delta_kemiskinan !== undefined ? formatFloat(row.delta_kemiskinan) : "-"}</td>
                    <td>{row.ratio !== null && row.ratio !== undefined ? formatFloat(row.ratio, 6) : "-"}</td>
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
