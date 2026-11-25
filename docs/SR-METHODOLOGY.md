# SR Sunlight Readability — measurement protocol (v0.1 draft)

## Purpose and status

SR is intended to be an independent, reproducible assessment of how readable a phone display remains in bright environments. This document is a **draft laboratory protocol**, not evidence that any device has been tested or that the scoring model has been externally validated. Do not market an SR score as an accredited certification until the method has been calibrated, inter-laboratory reproducibility has been demonstrated, and governance and appeals procedures are published.

## Measurement principles

A device's peak-nits claim alone is not a sunlight-readability result. The assessment must account for emitted luminance, ambient illumination, reflected light, usable contrast, viewing angle, automatic-brightness behavior, thermal limits, and repeatability.

## Required equipment

- Calibrated luminance meter or spectroradiometer suitable for the display's emission characteristics.
- Calibrated lux meter positioned at the display plane.
- Controlled, documented ambient-light source or a repeatable outdoor test location.
- Fixture that fixes viewing distance, angle, and device orientation.
- Temperature sensors and synchronized video/data logging.
- Calibration certificates with dates and instrument identifiers.

Record instrument make/model, serial number, calibration date, measurement uncertainty, firmware, OS version, display settings, battery state, and room/outdoor conditions.

## Device preparation

1. Record exact manufacturer, commercial model, regional model number, storage/RAM variant where relevant, firmware build, and test date.
2. Update to the publicly available stable firmware and record the build; do not silently change firmware between runs.
3. Disable adaptive color modes unless they are part of the explicitly tested normal-use profile. Test automatic brightness separately from manually selected maximum brightness.
4. Record adaptive brightness, extra-brightness/sunlight modes, HDR mode, refresh rate, power-saving state, and screen timeout settings.
5. Stabilize the device at the documented starting temperature. Record ambient and device temperatures.

## Test matrix

At minimum, test 500, 10,000, 25,000, 50,000, and 100,000 lux where the laboratory can safely and reliably achieve those conditions. Record actual measured lux rather than nominal source settings. If a level cannot be achieved, mark it unavailable; do not extrapolate it as measured data.

For each illumination level:
- Measure screen-off/background ambient reflection at the display plane using a documented geometry.
- Measure white, mid-gray, and dark test patches at fixed screen locations.
- Measure black level and white level, then calculate contrast using the same declared method for every device.
- Capture measurements at normal incidence and at declared off-axis angles (at least ±15° and ±30°).
- Run both manual maximum-brightness and automatic-brightness profiles.
- Repeat each condition at least three times after a defined stabilization interval.

Use identical test patterns, patch sizes, geometry, timing, and source spectrum across devices. Keep raw readings, not only averages.

## Thermal and sustained-brightness test

At a documented high-illumination condition, run a fixed workload and display pattern for 30 minutes. Record luminance and device temperature at 0, 1, 5, 10, 20, and 30 minutes. Note brightness throttling, warnings, shutdowns, and any automatic changes. Report peak and sustained values separately.

## Reporting and quality control

A report must include:
- Complete device identity and firmware.
- Test operator, date, location/lab, equipment, calibration and uncertainty.
- Ambient lux and temperature for every run.
- Raw and summarized luminance/contrast readings.
- Viewing angles, brightness mode, thermal time series, and repeatability.
- Deviations, missing conditions, and measurement limitations.
- Original test video and unedited evidence files, with cryptographic hashes.

A second operator should repeat a subset of tests. Before publishing a score, SR must publish acceptance criteria for repeatability and uncertainty. Conflicting results trigger retesting, not selective reporting.

## Score governance — not yet activated

The public 1–100 score must not be calculated from a manufacturer's claimed nits or submitted video alone. A defensible scoring model requires a representative reference-device dataset, pre-registered normalization rules, weighting rationale, uncertainty treatment, and independent validation. Until that work is complete, applications may be marked **evidence received / method validation pending**; no numerical SR score or certificate should be issued.

When activated, the published methodology must specify:
- Exact component metrics and weights.
- Normalization anchors and handling of missing measurements.
- Whether scores are rounded and how uncertainty is shown.
- Minimum repeatability and retest thresholds.
- Version number and effective date; older certificates retain their method version.

## Certificate integrity

Every issued certificate must resolve to a public verification record containing exact model identity, score, status, issue/expiry dates, method version, and a concise evidence summary. Suspended, revoked, expired, or superseded certificates must never appear as active. Brand permission to use the SR mark is limited to the exact tested model and certificate status.

## Consumer-facing limitation

SR measures display readability under the stated protocol. It does not certify overall phone quality, eye safety, camera performance, battery life, or readability in every real-world environment.
