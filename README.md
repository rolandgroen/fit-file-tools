# FIT File Tools

Dive deep into your Garmin activity data — right in your browser.

FIT File Tools lets you open, explore, and compare `.fit` files from your Garmin device without uploading anything to a server. Your data stays on your machine, always.

**Try it now:** https://rolandgroen.github.io/fit-file-tools/

## What You Can Do

### Analyze Your Rides, Runs, and Workouts
Drop a `.fit` file and instantly see your full session breakdown: duration, distance, heart rate, power, cadence, speed, and more. Lap splits, device details, VO2 max estimates, training effect — it's all there.

### Explore Interactive Charts
Scroll through heart rate, power, cadence, speed, and altitude on interactive charts. Brush a time range to zoom in and get stats for just that segment — perfect for analyzing intervals or climbs.

### See Your Route on a Map
Your GPS track is displayed on a full map, color-coded by any metric. See exactly where you pushed hardest, climbed the most, or hit peak speed.

### Compare Two Activities Side by Side
Load two files and sync them up — either manually or automatically using GPS. Overlay metrics to see how one effort stacks up against another. Great for tracking progress or comparing routes.

### Dig Into Raw Data
Every message type in the FIT file is available for inspection. Battery status, developer fields, zone targets — searchable and sortable, nothing hidden.

### Works Offline, Keeps Your Files
Once loaded, your files are stored locally in your browser. Come back later and they're still there. No account needed, no cloud sync, no tracking.

## Privacy

All parsing and analysis happens entirely in your browser. No data is sent to any server. Your activity files never leave your device.

## Development

```bash
npm install          # install dependencies
npm run dev          # start dev server at http://localhost:5173
npm run build        # production build
npm test             # run tests
npm run test:coverage  # tests with coverage
```

## License

[MIT](LICENSE)
