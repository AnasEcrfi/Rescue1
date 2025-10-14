#!/bin/bash

# Backup
cp "src/App.tsx" "src/App.tsx.backup"

# Add mapZoom state after mapCenter
sed -i '' 's/const \[mapCenter, setMapCenter\] = useState<\[number, number\]>(\[50.1109, 8.6821\]);/const [mapCenter, setMapCenter] = useState<[number, number]>([50.1109, 8.6821]);\n  const [mapZoom, setMapZoom] = useState<number>(13);/' "src/App.tsx"

# Update MapCenterUpdater usage to include zoom prop
sed -i '' 's/<MapCenterUpdater center={mapCenter} \/>/<MapCenterUpdater center={mapCenter} zoom={mapZoom} \/>/' "src/App.tsx"

# Update vehicle click to set zoom to 17
sed -i '' 's/setMapCenter(vehicle.position);/setMapCenter(vehicle.position);\n                        setMapZoom(17);/' "src/App.tsx"

# Update incident map-center-btn to set zoom to 16
sed -i '' 's/onClick={() => setMapCenter(incident.position)}/onClick={() => { setMapCenter(incident.position); setMapZoom(16); }}/' "src/App.tsx"

echo "Zoom functionality added successfully!"
