import os
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_LOGO = os.path.join(ROOT_DIR, '..', 'public', 'logo.png')
ASSETS_DIR = os.path.join(ROOT_DIR, 'assets')
os.makedirs(ASSETS_DIR, exist_ok=True)

# 1. Generate 512x512 App Icon
icon_path = os.path.join(ASSETS_DIR, 'icon-512.png')
print(f"Creating 512x512 app icon at {icon_path}...")
logo = Image.open(SRC_LOGO).convert("RGBA")

# Create a 512x512 canvas with brand background (clean white / subtle rounded squircle)
icon_canvas = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
draw = ImageDraw.Draw(icon_canvas)

# Resize logo to fit nicely within padding (e.g. 420x420)
target_size = 440
ratio = min(target_size / logo.width, target_size / logo.height)
new_w = int(logo.width * ratio)
new_h = int(logo.height * ratio)
resized_logo = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)

offset_x = (512 - new_w) // 2
offset_y = (512 - new_h) // 2
icon_canvas.paste(resized_logo, (offset_x, offset_y), resized_logo)
icon_canvas.save(icon_path, "PNG")
print(f"[OK] 512x512 icon saved ({os.path.getsize(icon_path)} bytes)")

# 2. Generate 1024x500 Feature Graphic
feature_path = os.path.join(ASSETS_DIR, 'feature-graphic.png')
print(f"Creating 1024x500 feature graphic at {feature_path}...")

# Deep rich indigo/navy gradient: (15, 23, 42) to (30, 58, 138)
feat_canvas = Image.new("RGBA", (1024, 500), (15, 23, 42, 255))
feat_draw = ImageDraw.Draw(feat_canvas)

# Draw horizontal linear gradient
for x in range(1024):
    r = int(15 + (45 - 15) * (x / 1024))
    g = int(23 + (85 - 23) * (x / 1024))
    b = int(42 + (170 - 42) * (x / 1024))
    feat_draw.line([(x, 0), (x, 500)], fill=(r, g, b, 255))

# Draw decorative subtle background circles
feat_draw.ellipse([800, -100, 1150, 250], fill=(59, 130, 246, 35))
feat_draw.ellipse([700, 250, 1050, 600], fill=(99, 102, 241, 40))
feat_draw.ellipse([-100, 200, 250, 550], fill=(37, 99, 235, 30))

# Place logo on the left/center
logo_size = 280
ratio_f = min(logo_size / logo.width, logo_size / logo.height)
new_wf = int(logo.width * ratio_f)
new_hf = int(logo.height * ratio_f)
resized_feat_logo = logo.resize((new_wf, new_hf), Image.Resampling.LANCZOS)

# Create a clean white card for the logo
card_w = new_wf + 40
card_h = new_hf + 40
card_x = 100
card_y = (500 - card_h) // 2

# Draw rounded card
feat_draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=24, fill=(255, 255, 255, 255))
feat_canvas.paste(resized_feat_logo, (card_x + 20, card_y + 20), resized_feat_logo)

# Load font or draw title
try:
    font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
    font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
    font_badge = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
except Exception:
    font_large = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_badge = ImageFont.load_default()

# Text layout
text_x = card_x + card_w + 50
title_y = 140

# Badge: "Interactive Learning"
badge_text = "INTERACTIVE LEARNING PLATFORM"
feat_draw.rounded_rectangle([text_x, 110, text_x + 400, 145], radius=8, fill=(37, 99, 235, 200))
feat_draw.text((text_x + 16, 118), badge_text, fill=(255, 255, 255, 255), font=font_badge)

# Title: Engy Up
feat_draw.text((text_x, 160), "Engy Up", fill=(255, 255, 255, 255), font=font_large)

# Subtitle
feat_draw.text((text_x, 255), "Master English with 21 Smart Activities", fill=(226, 232, 240, 255), font=font_sub)
feat_draw.text((text_x, 305), "Gamified Progress • XP • Daily Streaks • Safe", fill=(148, 163, 184, 255), font=font_sub)

feat_canvas.save(feature_path, "PNG")
print(f"[OK] 1024x500 feature graphic saved ({os.path.getsize(feature_path)} bytes)")
