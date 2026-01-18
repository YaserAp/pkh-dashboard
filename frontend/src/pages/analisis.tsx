import { useState } from "react";

import Layout from "../components/Layout";
import FiltersBar from "../components/FiltersBar";
import PageHeader from "../components/PageHeader";
import { useDashboardData } from "../lib/useDashboardData";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatFloat(value: number, digits = 2) {
  return value.toFixed(digits);
}

export default function Analisis() {
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
    scatter,
    insights,
    correlation,
    regression,
  } = useDashboardData();

  const [scatterHover, setScatterHover] = useState<typeof scatter[number] | null>(null);

  const scatterX = scatter.map((row) => row.jumlah_penerima_manfaat);
  const scatterY = scatter.map((row) => row.persentase_penduduk_miskin);
  const scatterMinX = scatterX.length ? Math.min(...scatterX) : 0;
  const scatterMaxX = scatterX.length ? Math.max(...scatterX) : 1;
  const scatterMinY = scatterY.length ? Math.min(...scatterY) : 0;
  const scatterMaxY = scatterY.length ? Math.max(...scatterY) : 1;

  return (
    <Layout>
      <PageHeader
        title="Analisis Statistik"
        subtitle="Scatter, korelasi, regresi, dan insight otomatis untuk hubungan PKH dan kemiskinan."
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

      <section className="section grid-2">
        <div className="card">
          <div className="section-title">
            <h3>Scatter PKH vs Kemiskinan</h3>
          </div>
          {scatter.length > 0 ? (
            <>
              <svg width="100%" height="240" viewBox="0 0 600 240">
                {scatter.map((row, idx) => {
                  const x =
                    40 +
                    ((row.jumlah_penerima_manfaat - scatterMinX) / (scatterMaxX - scatterMinX || 1)) * 520;
                  const y =
                    200 -
                    ((row.persentase_penduduk_miskin - scatterMinY) / (scatterMaxY - scatterMinY || 1)) * 150;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={5}
                      fill="#d46b2c"
                      opacity={0.85}
                      onMouseEnter={() => setScatterHover(row)}
                      onMouseLeave={() => setScatterHover(null)}
                    />
                  );
                })}
              </svg>
              <div className="legend">
                <span>PKH (X)</span>
                <span>Kemiskinan % (Y)</span>
              </div>
            </>
          ) : (
            <p>Data scatter belum tersedia.</p>
          )}
          {scatterHover && (
            <div className="tooltip">
              {scatterHover.nama_kabupaten_kota} | PKH: {formatNumber(Math.round(scatterHover.jumlah_penerima_manfaat))} |
              Kemiskinan: {formatFloat(scatterHover.persentase_penduduk_miskin, 2)}%
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title">
            <h3>Insight Otomatis (2017-2024)</h3>
          </div>
          {insights ? (
            <>
              <div className="grid-2">
                <div>
                  <strong>Top Perbaikan</strong>
                  <ul>
                    {(insights.top_improve || []).map((row) => (
                      <li key={row.kode_kabupaten_kota}>
                        {row.nama_kabupaten_kota} ({formatFloat(row.delta_kemiskinan, 2)}%)
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Top Memburuk</strong>
                  <ul>
                    {(insights.top_worsen || []).map((row) => (
                      <li key={row.kode_kabupaten_kota}>
                        {row.nama_kabupaten_kota} (+{formatFloat(row.delta_kemiskinan, 2)}%)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <strong>PKH Paling Naik</strong>
                <ul>
                  {(insights.top_pkh_increase || []).map((row) => (
                    <li key={row.kode_kabupaten_kota}>
                      {row.nama_kabupaten_kota} (+{formatNumber(Math.round(row.delta_pkh))})
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p>Insight belum tersedia.</p>
          )}
        </div>
      </section>

      <section className="section grid-2">
        <div className="card">
          <div className="section-title">
            <h3>Korelasi (PKH vs Kemiskinan)</h3>
          </div>
          <p>
            N = {correlation?.n ?? "-"} | r =
            {correlation?.r !== null && correlation?.r !== undefined ? formatFloat(correlation.r, 3) : "-"}
          </p>
        </div>
        <div className="card">
          <div className="section-title">
            <h3>Regresi Linier</h3>
          </div>
          <p>
            slope =
            {regression?.slope !== null && regression?.slope !== undefined ? formatFloat(regression.slope, 6) : "-"} |
            r2 = {regression?.r2 !== null && regression?.r2 !== undefined ? formatFloat(regression.r2, 4) : "-"}
          </p>
          <p>
            p-value =
            {regression?.p_value !== null && regression?.p_value !== undefined
              ? formatFloat(regression.p_value, 6)
              : "-"}
          </p>
        </div>
      </section>
    </Layout>
  );
}
