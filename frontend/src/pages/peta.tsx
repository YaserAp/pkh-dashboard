import { useMemo, useState } from "react";
import { geoEquirectangular, geoMercator, geoPath } from "d3-geo";

import Layout from "../components/Layout";
import FiltersBar from "../components/FiltersBar";
import PageHeader from "../components/PageHeader";
import { METRICS } from "../lib/constants";
import { useDashboardData } from "../lib/useDashboardData";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function Peta() {
  const {
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
    geojson,
    mapData,
    kabkotaData,
  } = useDashboardData();

  const [mapZoom, setMapZoom] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const filteredFeatures = useMemo(() => {
    if (!geojson) return [];
    let features = geojson.features;
    if (tipe === "kota") {
      features = features.filter((f) => f.properties.nama_kabupaten_kota.startsWith("KOTA "));
    } else if (tipe === "kabupaten") {
      features = features.filter((f) => f.properties.nama_kabupaten_kota.startsWith("KABUPATEN "));
    }
    if (kabkotaCode) {
      const code = Number(kabkotaCode);
      features = features.filter((f) => f.properties.kode_kabupaten_kota === code);
    }
    return features;
  }, [geojson, tipe, kabkotaCode]);

  const projection = useMemo(() => {
    if (!filteredFeatures.length) return null;
    const featureCollection = { type: "FeatureCollection", features: filteredFeatures } as any;
    try {
      return geoMercator().fitSize([600, 360], featureCollection);
    } catch {
      return geoEquirectangular().fitSize([600, 360], featureCollection);
    }
  }, [filteredFeatures]);

  const mapPaths = useMemo(() => {
    if (!projection || !filteredFeatures.length) return [];
    const pathGen = geoPath(projection);
    return filteredFeatures
      .map((feature) => {
        const d = pathGen(feature as any) || "";
        const centroid = pathGen.centroid(feature as any);
        return {
          d,
          code: feature.properties.kode_kabupaten_kota,
          name: feature.properties.nama_kabupaten_kota,
          cx: centroid[0],
          cy: centroid[1],
        };
      })
      .filter((item) => item.d);
  }, [projection, filteredFeatures]);

  const mapLookup = useMemo(() => {
    const map = new Map<number, number>();
    mapData.forEach((row) => map.set(row.kode_kabupaten_kota, row.value));
    return map;
  }, [mapData]);

  const mapValues = mapData.map((row) => row.value).filter((value) => Number.isFinite(value));
  const quantileStops = useMemo(() => {
    if (!mapValues.length) return [];
    const sorted = [...mapValues].sort((a, b) => a - b);
    const q = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
    return [q(0.2), q(0.4), q(0.6), q(0.8)];
  }, [mapValues]);

  const heatColors = ["#f6e6c9", "#f0cf9e", "#e6a869", "#d67c3d", "#b4511f"];

  const mapFill = (value: number | undefined) => {
    if (value === undefined || !quantileStops.length) return "#efe6db";
    if (value <= quantileStops[0]) return heatColors[0];
    if (value <= quantileStops[1]) return heatColors[1];
    if (value <= quantileStops[2]) return heatColors[2];
    if (value <= quantileStops[3]) return heatColors[3];
    return heatColors[4];
  };

  return (
    <Layout>
      <PageHeader
        title="Peta Sebaran"
        subtitle="Peta kabupaten/kota dengan heatmap berdasarkan metrik yang dipilih."
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
      />

      <section className="section grid-2">
        <div className="card">
          <div className="section-title">
            <h3>Peta Kab/Kota</h3>
            <span className="badge">{METRICS.find((m) => m.value === metric)?.label}</span>
          </div>
          <div className="map-controls">
            <button type="button" onClick={() => setMapZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}>+</button>
            <button type="button" onClick={() => setMapZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))}>-</button>
            <button type="button" onClick={() => { setMapZoom(1); setMapOffset({ x: 0, y: 0 }); }}>Reset</button>
          </div>
          <div className="map-wrap">
            {mounted && mapPaths.length > 0 ? (
              <svg
                width="100%"
                height="360"
                viewBox="0 0 600 360"
                preserveAspectRatio="xMidYMid meet"
                style={{ background: "#9ec5e6", borderRadius: 12, cursor: dragging ? "grabbing" : "grab" }}
                onMouseDown={(event) => {
                  setDragging(true);
                  setDragStart({ x: event.clientX - mapOffset.x, y: event.clientY - mapOffset.y });
                }}
                onMouseMove={(event) => {
                  if (!dragging) return;
                  setMapOffset({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
                }}
                onMouseUp={() => setDragging(false)}
                onMouseLeave={() => setDragging(false)}
              >
                <g transform={`translate(300 180) translate(${mapOffset.x} ${mapOffset.y}) scale(${mapZoom}) translate(-300 -180)`}>
                  {mapPaths.map((feature, i) => {
                    const value = mapLookup.get(feature.code);
                    return (
                      <path
                        key={i}
                        d={feature.d}
                        fill={mapFill(value)}
                        stroke="#9b6a4a"
                        strokeWidth={1.2}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                  {mapPaths.map((feature) => (
                    <text
                      key={`label-${feature.code}`}
                      x={feature.cx}
                      y={feature.cy}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#2d2925"
                      style={{
                        pointerEvents: "none",
                        paintOrder: "stroke",
                        stroke: "#fff8ef",
                        strokeWidth: 3,
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                      }}
                    >
                      {feature.name.replace("KABUPATEN ", "Kab. ").replace("KOTA ", "Kota ").replace(/\s+/g, " ")}
                    </text>
                  ))}
                </g>
              </svg>
            ) : (
              <div className="map-fallback">Peta belum tersedia. Pastikan data geojson tersedia.</div>
            )}
          </div>
          <div className="legend">
            <span>Low</span>
            <div className="legend-bar" style={{ background: `linear-gradient(90deg, ${heatColors.join(",")})` }} />
            <span>High</span>
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <h3>Top Kab/Kota ({year})</h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {kabkotaData.length > 0 ? (
                  kabkotaData.slice(0, 10).map((row) => (
                    <tr key={row.kode_kabupaten_kota}>
                      <td>{row.nama_kabupaten_kota}</td>
                      <td>{formatNumber(Math.round(row.value))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2}>Data belum tersedia.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="section-title" style={{ marginTop: 16 }}>
            <h4>Bottom Kab/Kota</h4>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {kabkotaData.length > 0 ? (
                  kabkotaData.slice(-10).map((row) => (
                    <tr key={row.kode_kabupaten_kota}>
                      <td>{row.nama_kabupaten_kota}</td>
                      <td>{formatNumber(Math.round(row.value))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2}>Data belum tersedia.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
}
