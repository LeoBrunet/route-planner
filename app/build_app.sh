#!/bin/zsh
# Builds "Route Planner.app" next to this script.
set -e
cd "$(dirname "$0")"
ROOT=..
APP="Route Planner.app"
BUILD=build
rm -rf "$BUILD" "$APP"
mkdir -p "$BUILD" "$APP/Contents/MacOS" "$APP/Contents/Resources/web"

# 1. page (map data + cycle-path profiles embedded)
(cd $ROOT && python3 -I scripts/build_page.py)
cp "$ROOT/route-planner.html" "$APP/Contents/Resources/web/index.html"

# 2. icon
swiftc -O tools/make_icon.swift -o "$BUILD/make_icon"
"$BUILD/make_icon" "$BUILD/AppIcon.iconset"
iconutil -c icns "$BUILD/AppIcon.iconset" -o "$APP/Contents/Resources/AppIcon.icns"

# 3. binary
swiftc -O Sources/main.swift -o "$APP/Contents/MacOS/RoutePlanner" \
  -target arm64-apple-macos13.0 -framework Cocoa -framework WebKit -framework CoreLocation

# 4. Info.plist
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Route Planner</string>
  <key>CFBundleDisplayName</key><string>Route Planner</string>
  <key>CFBundleIdentifier</key><string>com.leobrunet.routeplanner</string>
  <key>CFBundleExecutable</key><string>RoutePlanner</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.healthcare-fitness</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSLocationUsageDescription</key><string>Shows your position on the map and lets you start a route where you are.</string>
  <key>NSLocationWhenInUseUsageDescription</key><string>Shows your position on the map and lets you start a route where you are.</string>
</dict></plist>
PLIST

# 5. ad-hoc signature (needed on Apple Silicon, and for the location permission)
codesign --force --deep --sign - "$APP"
echo "Built: $(pwd)/$APP"
