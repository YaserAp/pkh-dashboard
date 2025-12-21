Data Dictionary (Draft)

Dimensional
- dim_kabupaten: kode_kabupaten_kota, nama_kabupaten_kota, tipe, kode_provinsi, nama_provinsi

Facts
- fact_pkh: tahun, kode_kabupaten_kota, jumlah_penerima_manfaat
- fact_kemiskinan_persen: tahun, kode_kabupaten_kota, persentase_penduduk_miskin
- fact_kemiskinan_abs: tahun, kode_kabupaten_kota, jumlah_penduduk_miskin
- fact_kemiskinan_kategori: tahun, periode_bulan, kategori_daerah, jumlah_penduduk
