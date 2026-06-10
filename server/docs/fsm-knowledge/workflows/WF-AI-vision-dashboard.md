# WF-AI-vision-dashboard — Vision AI Dashboard (Work Verification, Equipment Detection, Before/After Compare)

## Module
Vision AI — `VisionDashboardPage` (`/vision`)

## Prerequisites
- User must be authenticated (the `/vision` route is nested under the `PrivateRoute`-guarded app layout).
- Image files are required for every action (uploads are restricted to `accept="image/*"`).

---

## Steps — Open the Vision AI Dashboard

1. Navigate to `/vision`. The page title reads from `vision.title`.
2. A **Tabs** control is shown with three tabs (default active tab is **Work Verification**):
   - **Work Verification** (key `verify`, CheckCircleOutlined icon)
   - **Equipment Detection** (key `detect`, EyeOutlined icon)
   - **Before/After** (key `compare`, SwapOutlined icon)

---

## Steps — Verify Work (Work Verification tab)

1. Open the **Work Verification** tab.
2. In the **Upload Work Photo** card, click the **Upload Photo for Verification** button (CameraOutlined icon, primary, large).
3. Select an image file. Selecting the file immediately triggers verification (the upload returns `false` so nothing is queued; the file is sent right away). The button shows a loading state while `useVerifyWork` is pending.
4. The upload calls `useVerifyWork` → `visionApi.verifyWork(file)` → `POST /vision/verify-work` (multipart/form-data, field `file`).
5. On success a notification appears: **"Work verification passed"** if `verified` is true, otherwise **"Work verification: issues found"**. On error: **"Work verification failed"** (or the server message).
6. The **Verification Result** card renders the returned `WorkVerificationResult`:
   - A **Result** banner: `success` status with **Work Verified** title when `verified` is true, otherwise `warning` status with **Issues Found** title.
   - Subtitle shows **Confidence** as `(confidence * 100).toFixed(1)%`.
   - If `issues` is non-empty, an **Issues** list renders each issue as a red Tag (CloseCircleOutlined).
   - If `findings` is non-empty, a **Findings** list renders each finding's `class` (blue Tag) and `confidence` percentage.

---

## Steps — Detect Equipment (Equipment Detection tab)

1. Open the **Equipment Detection** tab.
2. In the **Upload Equipment Photo** card, click the **Upload Photo for Detection** button (CameraOutlined icon, primary, large).
3. Select an image file; detection triggers immediately on selection. The button shows a loading state while `useIdentifyEquipment` is pending.
4. The upload calls `useIdentifyEquipment` → `visionApi.identifyEquipment(file)` → `POST /vision/identify-equipment` (multipart/form-data, field `file`).
5. On success a notification appears: **"{equipment_count} equipment detected"**. On error: **"Equipment identification failed"** (or the server message).
6. The result card (titled with `equipment_count`) renders the returned `EquipmentDetectionResult`:
   - If `labels` is non-empty, each label is shown as a green Tag.
   - If `detections` is non-empty, a list renders each detection's `label` (blue Tag), `confidence` percentage, and `category` (Tag, when present).
   - If there are no detections, **No equipment detected** text is shown.

---

## Steps — Compare Before/After Photos (Before/After tab)

1. Open the **Before/After** tab.
2. In the **Before Photo** card, click **Select Before** (UploadOutlined icon) and choose one image (`maxCount={1}`); the file is held in state (not yet uploaded).
3. In the **After Photo** card, click **Select After** (UploadOutlined icon) and choose one image; the file is held in state.
4. Click the **Compare** button (SwapOutlined icon, primary, block, large). The button is **disabled** until both a before file and an after file are selected, and shows a loading state while `useCompareBeforeAfter` is pending.
5. Compare calls `useCompareBeforeAfter` → `visionApi.compareBeforeAfter(beforeFile, afterFile)` → `POST /vision/compare-before-after` (multipart/form-data, fields `before` and `after`). On error: **"Comparison failed"** (or the server message).
6. The **Comparison Result** card renders the returned `BeforeAfterResult`:
   - **Change Detected** — a Tag showing **Yes** (green) or **No** (orange) based on `significant_change`.
   - **Change Percentage** — a Progress bar of `change_percentage` (capped at 100).
   - **Similarity** — `(similarity_score * 100).toFixed(1)%`.
   - The `analysis` text is shown in a paragraph below a divider.
   - If `changed_regions` is non-empty, a **Changed Regions** list shows each region's index, `change_percentage`, and `significance` (red Tag for `high`, otherwise orange).

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| Open dashboard | Navigate to `/vision` | Authenticated | — |
| Switch section | **Tabs** (Work Verification / Equipment Detection / Before/After) | Authenticated | — |
| Verify work photo | **Upload Photo for Verification** (image upload) | Authenticated | `useVerifyWork` → `POST /vision/verify-work` |
| Detect equipment | **Upload Photo for Detection** (image upload) | Authenticated | `useIdentifyEquipment` → `POST /vision/identify-equipment` |
| Select before image | **Select Before** (image upload, maxCount 1) | Authenticated | — (held in state) |
| Select after image | **Select After** (image upload, maxCount 1) | Authenticated | — (held in state) |
| Compare before/after | **Compare** button (enabled only when both files chosen) | Authenticated | `useCompareBeforeAfter` → `POST /vision/compare-before-after` |
