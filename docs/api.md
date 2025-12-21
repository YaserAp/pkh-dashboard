API Overview

Base URL: /api

Endpoints
- GET /api/summary?year=2024&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/trend?metric=kemiskinan|pkh&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/kabkota?year=2024&metric=kemiskinan|pkh|kemiskinan_abs&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/map?year=2024&metric=kemiskinan|pkh|kemiskinan_abs&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/map/geojson
- GET /api/compare?year=2024&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/compare-years?year_a=2017&year_b=2024&metric=kemiskinan|pkh|kemiskinan_abs&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/insights?start=2017&end=2024&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/scatter?year=2024&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/correlation?year=2024&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/regression?start=2017&end=2024&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/effectiveness?start=2017&end=2024&tipe=all|kota|kabupaten&kabkota=3201,3273
- GET /api/report/summary?start=2017&end=2024
- POST /api/admin/upload?reprocess=true
