# CivicLens Vision — model card

## Current status

The repository does not include trained weights. The web product and FastAPI service default to deterministic demo adapters so the complete reporting workflow can be evaluated without pretending that synthetic outputs are measured ML results.

## Intended task

Object detection for road-scene hazards:

- pothole
- plastic waste
- waterlogging
- open manhole

## Recommended training protocol

- Split data by road corridor or capture session, not random neighboring frames.
- Report mAP@50, mAP@50–95, per-class precision/recall, confusion matrix, latency, and model size.
- Evaluate separate slices for rain, night, glare, occlusion, low-resolution cameras, and road material.
- Keep a locked test set and record all dataset versions.

## Severity

Severity should be calibrated separately from class confidence. A starting rule may combine road coverage, box area, count, repeat reports, and road context, but it requires validation against expert labels.

## Known risks

- Domain shift outside Dhaka or outside the training cameras
- Water/shadow confusion
- Small distant waste missed by the detector
- Duplicate nearby reports treated as independent incidents
- Sensitive people or vehicle information in evidence

## Human oversight

The model should prioritize and explain reports. A trained authority operator should verify high-impact decisions and resolution status.
