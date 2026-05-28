const fs = require('fs');

async function fetchNominatim(query) {
    const url = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(query)}&polygon_geojson=1&format=json`;
    console.log("Fetching: " + query);
    const res = await fetch(url, {
        headers: { 'User-Agent': 'MSC_Desamparados_App/1.0 (Contact: admin@msc.local)' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
        // Encontrar la mejor coincidencia que tenga un polígono (geojson)
        const bestMatch = data.find(d =>
            d.geojson &&
            (d.geojson.type === 'Polygon' || d.geojson.type === 'MultiPolygon') &&
            (d.osm_type === 'relation' || d.type === 'administrative')
        ) || data.find(d => d.geojson && (d.geojson.type === 'Polygon' || d.geojson.type === 'MultiPolygon'));

        if (bestMatch) return bestMatch.geojson;
    }
    console.log(`No se encontró polígono para: ${query}`);
    return null;
}

async function main() {
    console.log("Iniciando obtención de GeoJSON de Costa Rica, Desamparados...");

    const canton = await fetchNominatim("Desamparados, provincia de San José, Costa Rica");

    const distritos = [
        "Desamparados", "San Miguel", "San Juan de Dios", "San Rafael Arriba",
        "San Antonio", "Frailes", "Patarrá", "San Cristóbal", "Rosario",
        "Damas", "San Rafael Abajo", "Gravilias", "Los Guido"
    ];

    let distritosFeatures = [];

    for (const d of distritos) {
        // Distritos en Nominatim usualmente se buscan como "[Nombre], Desamparados, San José"
        const geo = await fetchNominatim(`${d}, Desamparados, San José, Costa Rica`);
        if (geo) {
            distritosFeatures.push({
                type: "Feature",
                properties: { name: d },
                geometry: geo
            });
        }
        // Nominatim exige maximo 1 peticion por segundo, esperamos 1.5s
        await new Promise(r => setTimeout(r, 1500));
    }

    const dir = './msc/src/data';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (canton) {
        fs.writeFileSync(dir + '/desamparados.json', JSON.stringify({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: { name: "Desamparados" },
                    geometry: canton
                }
            ]
        }, null, 2));
        console.log("Cantón guardado.");
    }

    if (distritosFeatures.length > 0) {
        fs.writeFileSync(dir + '/distritos.json', JSON.stringify({
            type: "FeatureCollection",
            features: distritosFeatures
        }, null, 2));
        console.log(`Guardados ${distritosFeatures.length} distritos.`);
    }

    console.log("Proceso finalizado con éxito.");
}

main().catch(console.error);
