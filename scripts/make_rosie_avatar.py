import cv2
import numpy as np
from pathlib import Path

source = Path('/Users/rahulviswanath/Library/Application Support/Hermes/composer-images/composer_2026-08-28_18-10-34-946_f5beb3.png')
target = Path('/Users/rahulviswanath/AskRosie/ask-rosie-experience/public/rosie-avatar.png')
target.parent.mkdir(parents=True, exist_ok=True)

image = cv2.imread(str(source), cv2.IMREAD_COLOR)
if image is None:
    raise SystemExit(f'Could not read {source}')

hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
h, s, v = cv2.split(hsv)
# The supplied illustration has a pale, low-saturation paper backdrop; retain its richly colored subject.
mask = (((s > 32) & (v < 252)) | ((v < 170) & (s > 12))).astype(np.uint8) * 255
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))

count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
if count > 1:
    largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    mask = np.where(labels == largest, 255, 0).astype(np.uint8)

# Preserve light skin highlights and fabric details inside the recovered silhouette.
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
mask = cv2.GaussianBlur(mask, (0, 0), 1.15)
rgba = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
rgba[:, :, 3] = mask
cv2.imwrite(str(target), rgba)
print(target)
