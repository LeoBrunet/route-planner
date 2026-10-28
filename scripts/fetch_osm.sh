#!/bin/zsh
# Re-downloads the raw OpenStreetMap extracts around Göteborg used by build_map.py / classify.py.
set -e
cd "$(dirname "$0")/../data"
UA="route-planner/1.0"
OP=https://overpass-api.de/api/interpreter
Q1='[out:json][timeout:170];(way(around:40000,57.7089,11.9746)["highway"~"^(track|unclassified|residential|tertiary|cycleway|path|bridleway|service)$"]["surface"~"^(gravel|fine_gravel|compacted|unpaved|dirt|ground|pebblestone|grass|sand|earth|mud|rock)$"]["access"!~"private|no"]; way(around:40000,57.7089,11.9746)["highway"="track"][!"surface"]["access"!~"private|no"];);out tags geom;'
Q2='[out:json][timeout:170];(way(57.35,11.45,58.07,12.65)["highway"~"^(motorway|trunk|primary|secondary)$"];way(57.35,11.45,58.07,12.65)["natural"="coastline"];way(57.35,11.45,58.07,12.65)["natural"="water"]["name"];way(57.35,11.45,58.07,12.65)["railway"="rail"]["usage"="main"];);out tags geom;'
Q3='[out:json][timeout:60];node(57.35,11.45,58.07,12.65)["place"~"^(city|town|village|suburb)$"];out;node(57.35,11.45,58.07,12.65)["railway"="station"]["train"="yes"];out;'
curl -s -m 200 -A "$UA" --data-urlencode "data=$Q1" $OP -o unpaved.json
curl -s -m 200 -A "$UA" --data-urlencode "data=$Q2" $OP -o context.json
curl -s -m 100 -A "$UA" --data-urlencode "data=$Q3" $OP -o places.json
ls -la unpaved.json context.json places.json
